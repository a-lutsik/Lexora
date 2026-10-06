// ============================================================
// LEXORA — Realtime voice sessions (speech ↔ speech)
// The WebSocket to the model lives in Rust so the API key never
// reaches the webview. The frontend streams base64 PCM16 chunks
// in and receives events (audio, transcripts, barge-in) through
// a Tauri channel.
// ============================================================

pub mod gemini_live;

use crate::error::AppError;
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::protocol::CloseFrame;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};

pub type LiveSocket = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

const SETUP_TIMEOUT: Duration = Duration::from_secs(12);
/// Back-pressure: ~10 s of 100 ms audio chunks before the UI is told to slow down.
const COMMAND_BUFFER: usize = 100;

/// Event pushed to the webview. Serialized as `{ "type": "...", ... }`.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum RealtimeEvent {
    Ready { model: String },
    /// Base64 PCM16 LE mono audio from the model.
    Audio { data: String, sample_rate: u32 },
    /// What the learner/speaker said (streamed in pieces).
    InputTranscript { text: String, language: Option<String> },
    /// What the model said / the interpretation (streamed in pieces).
    OutputTranscript { text: String, language: Option<String> },
    /// The learner typed instead of speaking (sent to the model as text).
    LearnerText { text: String },
    /// The user started talking over the model: drop queued playback.
    Interrupted,
    TurnComplete,
    /// The server will close the connection soon.
    GoAway { time_left: Option<String> },
    /// A finished exchange was saved to the dialogue session.
    TurnSaved { session: serde_json::Value },
    Error { message: String },
    Closed { reason: Option<String> },
}

/// Commands from the UI to a running session.
#[derive(Debug, Clone, PartialEq)]
pub enum ClientCommand {
    /// Base64 PCM16 LE mono 16 kHz chunk.
    Audio(String),
    /// Instruction from Lexora (e.g. the opening prompt) — not part of the transcript.
    Text(String),
    /// Text typed by the learner: sent like `Text`, echoed as `LearnerText`.
    LearnerText(String),
    AudioStreamEnd,
    Close,
}

/// Running sessions by id (Tauri managed state).
#[derive(Default)]
pub struct RealtimeSessions {
    senders: Mutex<HashMap<u64, mpsc::Sender<ClientCommand>>>,
    next_id: AtomicU64,
}

impl RealtimeSessions {
    pub fn register(&self, sender: mpsc::Sender<ClientCommand>) -> u64 {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed) + 1;
        if let Ok(mut map) = self.senders.lock() {
            map.insert(id, sender);
        }
        id
    }

    pub fn sender(&self, id: u64) -> Option<mpsc::Sender<ClientCommand>> {
        self.senders.lock().ok().and_then(|map| map.get(&id).cloned())
    }

    pub fn remove(&self, id: u64) -> Option<mpsc::Sender<ClientCommand>> {
        self.senders.lock().ok().and_then(|mut map| map.remove(&id))
    }

    pub fn active_count(&self) -> usize {
        self.senders.lock().map(|map| map.len()).unwrap_or(0)
    }
}

pub fn command_channel() -> (mpsc::Sender<ClientCommand>, mpsc::Receiver<ClientCommand>) {
    mpsc::channel(COMMAND_BUFFER)
}

/// TLS with an explicit `ring` provider: rustls cannot pick a process
/// default when several providers are compiled in, and a panic aborts the app.
fn tls_connector() -> Result<tokio_tungstenite::Connector, AppError> {
    let mut roots = rustls::RootCertStore::empty();
    roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
    let config = rustls::ClientConfig::builder_with_provider(Arc::new(
        rustls::crypto::ring::default_provider(),
    ))
    .with_safe_default_protocol_versions()
    .map_err(|e| AppError::Http(format!("TLS setup failed: {e}")))?
    .with_root_certificates(roots)
    .with_no_client_auth();
    Ok(tokio_tungstenite::Connector::Rustls(Arc::new(config)))
}

/// Remove secrets (the key travels in the URL query) from any message.
fn redact(message: &str, secret: &str) -> String {
    if secret.is_empty() {
        message.to_string()
    } else {
        message.replace(secret, "***")
    }
}

fn close_reason(frame: Option<CloseFrame>) -> Option<String> {
    frame
        .map(|f| f.reason.to_string())
        .filter(|reason| !reason.trim().is_empty())
}

/// Connect, send the setup message and wait for `setupComplete`.
/// A rejected setup surfaces the server's close reason (e.g. unknown field).
pub async fn connect_and_setup(
    url: &str,
    secret: &str,
    setup: &serde_json::Value,
) -> Result<LiveSocket, AppError> {
    let connector = if url.starts_with("wss://") {
        Some(tls_connector()?)
    } else {
        None
    };
    let (mut socket, _) =
        tokio_tungstenite::connect_async_tls_with_config(url, None, false, connector)
            .await
            .map_err(|e| match e {
                tokio_tungstenite::tungstenite::Error::Http(response) => {
                    let body = response
                        .body()
                        .as_ref()
                        .map(|b| String::from_utf8_lossy(b).chars().take(300).collect::<String>())
                        .unwrap_or_default();
                    AppError::Provider(redact(
                        &format!("Live session rejected ({}): {body}", response.status()),
                        secret,
                    ))
                }
                other => AppError::Http(redact(&format!("Live connection failed: {other}"), secret)),
            })?;

    socket
        .send(Message::Text(setup.to_string().into()))
        .await
        .map_err(|e| AppError::Http(redact(&format!("Live setup failed: {e}"), secret)))?;

    let wait = async {
        while let Some(message) = socket.next().await {
            match message {
                Ok(Message::Text(text)) => {
                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                        if gemini_live::is_setup_complete(&value) {
                            return Ok(());
                        }
                    }
                }
                Ok(Message::Binary(bytes)) => {
                    if let Ok(value) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                        if gemini_live::is_setup_complete(&value) {
                            return Ok(());
                        }
                    }
                }
                Ok(Message::Close(frame)) => {
                    let reason = close_reason(frame).unwrap_or_else(|| "connection closed".to_string());
                    return Err(AppError::Provider(redact(
                        &format!("Live session rejected: {reason}"),
                        secret,
                    )));
                }
                Ok(_) => {}
                Err(e) => {
                    return Err(AppError::Http(redact(&format!("Live connection error: {e}"), secret)))
                }
            }
        }
        Err(AppError::Provider("Live session closed during setup".to_string()))
    };
    match tokio::time::timeout(SETUP_TIMEOUT, wait).await {
        Ok(Ok(())) => Ok(socket),
        Ok(Err(e)) => Err(e),
        Err(_) => Err(AppError::Provider(format!(
            "Live session did not start within {} s",
            SETUP_TIMEOUT.as_secs()
        ))),
    }
}

fn client_message(command: &ClientCommand) -> Option<serde_json::Value> {
    match command {
        ClientCommand::Audio(b64) => Some(gemini_live::audio_message(b64)),
        ClientCommand::Text(text) | ClientCommand::LearnerText(text) => {
            Some(gemini_live::text_message(text))
        }
        ClientCommand::AudioStreamEnd => Some(gemini_live::audio_stream_end_message()),
        ClientCommand::Close => None,
    }
}

/// Pump UI commands to the socket and server messages to `emit` until either side closes.
pub async fn run_session<F>(
    socket: LiveSocket,
    mut commands: mpsc::Receiver<ClientCommand>,
    secret: String,
    emit: F,
) where
    F: Fn(RealtimeEvent) + Send,
{
    let (mut sink, mut stream) = socket.split();
    loop {
        tokio::select! {
            command = commands.recv() => {
                match command {
                    Some(ClientCommand::Close) | None => {
                        let _ = sink.send(Message::Close(None)).await;
                        emit(RealtimeEvent::Closed { reason: None });
                        break;
                    }
                    Some(command) => {
                        if let Some(message) = client_message(&command) {
                            if let Err(e) = sink.send(Message::Text(message.to_string().into())).await {
                                emit(RealtimeEvent::Error { message: redact(&format!("Live send failed: {e}"), &secret) });
                                emit(RealtimeEvent::Closed { reason: None });
                                break;
                            }
                        }
                        if let ClientCommand::LearnerText(text) = command {
                            emit(RealtimeEvent::LearnerText { text });
                        }
                    }
                }
            }
            incoming = stream.next() => {
                let value = match incoming {
                    Some(Ok(Message::Text(text))) => serde_json::from_str::<serde_json::Value>(&text).ok(),
                    Some(Ok(Message::Binary(bytes))) => serde_json::from_slice::<serde_json::Value>(&bytes).ok(),
                    Some(Ok(Message::Close(frame))) => {
                        emit(RealtimeEvent::Closed { reason: close_reason(frame).map(|r| redact(&r, &secret)) });
                        break;
                    }
                    Some(Ok(_)) => None,
                    Some(Err(e)) => {
                        emit(RealtimeEvent::Error { message: redact(&format!("Live connection error: {e}"), &secret) });
                        emit(RealtimeEvent::Closed { reason: None });
                        break;
                    }
                    None => {
                        emit(RealtimeEvent::Closed { reason: None });
                        break;
                    }
                };
                if let Some(value) = value {
                    for event in gemini_live::parse_server_message(&value) {
                        emit(event);
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::net::TcpListener;

    /// Minimal Live API stand-in: setupComplete, echo one audio chunk as a model turn.
    async fn mock_live_server(reject_setup: bool) -> (String, tokio::task::JoinHandle<Vec<serde_json::Value>>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let addr = listener.local_addr().expect("addr");
        let handle = tokio::spawn(async move {
            let (tcp, _) = listener.accept().await.expect("accept");
            let mut ws = tokio_tungstenite::accept_async(tcp).await.expect("handshake");
            let mut received = Vec::new();
            let setup = ws.next().await.expect("setup").expect("setup frame");
            received.push(serde_json::from_str(setup.to_text().expect("text")).expect("json"));
            if reject_setup {
                let _ = ws
                    .send(Message::Close(Some(CloseFrame {
                        code: tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode::Policy,
                        reason: "Invalid JSON payload: unknown field".into(),
                    })))
                    .await;
                return received;
            }
            ws.send(Message::Text(r#"{"setupComplete":{}}"#.into())).await.expect("ack");
            let audio = ws.next().await.expect("audio").expect("audio frame");
            received.push(serde_json::from_str(audio.to_text().expect("text")).expect("json"));
            let reply = serde_json::json!({
                "serverContent": {
                    "inputTranscription": { "text": "Hi" },
                    "modelTurn": { "parts": [{ "inlineData": { "mimeType": "audio/pcm;rate=24000", "data": "AAAA" } }] },
                    "outputTranscription": { "text": "Hello!" },
                    "turnComplete": true
                }
            });
            // Real servers may send JSON as binary frames.
            ws.send(Message::Binary(reply.to_string().into_bytes().into())).await.expect("reply");
            let _ = ws.next().await; // client close
            received
        });
        (format!("ws://{addr}"), handle)
    }

    #[tokio::test]
    async fn session_streams_audio_and_transcripts_from_the_server() {
        let (url, server) = mock_live_server(false).await;
        let setup = gemini_live::dialogue_setup("gemini-3.8-live", "Tutor", "Kore");
        let socket = connect_and_setup(&url, "secret-key", &setup).await.expect("setup ok");

        let (tx, rx) = command_channel();
        let events = Arc::new(Mutex::new(Vec::new()));
        let sink = events.clone();
        let session = tokio::spawn(run_session(socket, rx, "secret-key".into(), move |event| {
            sink.lock().expect("lock").push(event);
        }));

        tx.send(ClientCommand::Audio("UENN".into())).await.expect("send audio");
        // Wait for the turn, then close.
        for _ in 0..50 {
            if events.lock().expect("lock").contains(&RealtimeEvent::TurnComplete) {
                break;
            }
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
        tx.send(ClientCommand::Close).await.expect("close");
        session.await.expect("session task");

        let received = server.await.expect("server");
        assert_eq!(received[0]["setup"]["model"], "models/gemini-3.8-live");
        assert_eq!(received[1]["realtimeInput"]["audio"]["data"], "UENN");

        let events = events.lock().expect("lock").clone();
        assert!(events.contains(&RealtimeEvent::InputTranscript { text: "Hi".into(), language: None }));
        assert!(events.contains(&RealtimeEvent::Audio { data: "AAAA".into(), sample_rate: 24_000 }));
        assert!(events.contains(&RealtimeEvent::OutputTranscript { text: "Hello!".into(), language: None }));
        assert_eq!(events.last(), Some(&RealtimeEvent::Closed { reason: None }));
    }

    #[tokio::test]
    async fn learner_text_is_sent_and_echoed_for_the_transcript() {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let addr = listener.local_addr().expect("addr");
        let server = tokio::spawn(async move {
            let (tcp, _) = listener.accept().await.expect("accept");
            let mut ws = tokio_tungstenite::accept_async(tcp).await.expect("handshake");
            let _setup = ws.next().await.expect("setup").expect("setup frame");
            ws.send(Message::Text(r#"{"setupComplete":{}}"#.into())).await.expect("ack");
            let text = ws.next().await.expect("text").expect("text frame");
            let _ = ws.next().await; // client close
            serde_json::from_str::<serde_json::Value>(text.to_text().expect("text")).expect("json")
        });
        let setup = gemini_live::dialogue_setup("gemini-3.8-live", "Tutor", "Kore");
        let socket = connect_and_setup(&format!("ws://{addr}"), "k", &setup).await.expect("setup ok");

        let (tx, rx) = command_channel();
        let events = Arc::new(Mutex::new(Vec::new()));
        let sink = events.clone();
        let session = tokio::spawn(run_session(socket, rx, "k".into(), move |event| {
            sink.lock().expect("lock").push(event);
        }));
        tx.send(ClientCommand::LearnerText("Two coffees, please".into())).await.expect("send");
        tx.send(ClientCommand::Close).await.expect("close");
        session.await.expect("session task");

        assert_eq!(server.await.expect("server"), gemini_live::text_message("Two coffees, please"));
        let events = events.lock().expect("lock").clone();
        assert_eq!(
            events.first(),
            Some(&RealtimeEvent::LearnerText { text: "Two coffees, please".into() }),
            "typed text must reach the transcript like speech"
        );
    }

    #[tokio::test]
    async fn rejected_setup_reports_the_server_reason() {
        let (url, server) = mock_live_server(true).await;
        let setup = gemini_live::interpreter_setup("gemini-3.5-live-translate-preview", "ru", false);
        let err = match connect_and_setup(&url, "secret-key", &setup).await {
            Ok(_) => panic!("setup must fail"),
            Err(e) => e,
        };
        assert!(err.to_string().contains("unknown field"), "{err}");
        server.await.expect("server");
    }

    #[test]
    fn redact_hides_the_api_key() {
        assert_eq!(redact("url?key=AIza123 failed", "AIza123"), "url?key=*** failed");
    }

    #[test]
    fn events_serialize_with_type_tag_and_camel_case_fields() {
        let json = serde_json::to_value(RealtimeEvent::Audio { data: "AA".into(), sample_rate: 24_000 })
            .expect("serialize");
        assert_eq!(json["type"], "audio");
        assert_eq!(json["sampleRate"], 24_000);
        let json = serde_json::to_value(RealtimeEvent::InputTranscript { text: "x".into(), language: None })
            .expect("serialize");
        assert_eq!(json["type"], "inputTranscript");
    }

    #[test]
    fn session_registry_assigns_unique_ids() {
        let sessions = RealtimeSessions::default();
        let (a, _ra) = command_channel();
        let (b, _rb) = command_channel();
        let first = sessions.register(a);
        let second = sessions.register(b);
        assert_ne!(first, second);
        assert!(sessions.sender(first).is_some());
        assert!(sessions.remove(first).is_some());
        assert!(sessions.sender(first).is_none());
        assert_eq!(sessions.active_count(), 1);
    }
}
