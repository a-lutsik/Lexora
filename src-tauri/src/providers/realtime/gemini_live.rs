// ============================================================
// LEXORA — Gemini Live API (BidiGenerateContent over WebSocket)
// Contract verified 2026-10-04 against ai.google.dev raw examples:
//   dialogue    → setup{model, generationConfig{responseModalities,
//                 speechConfig}, systemInstruction, input/output
//                 AudioTranscription, contextWindowCompression}
//   interpreter → setup{model, generationConfig{responseModalities,
//                 translationConfig}, input/outputAudioTranscription}
//                 (the server rejects the transcription fields inside
//                 generationConfig: «Unknown name inputAudioTranscription
//                 at setup.generation_config»)
// Audio in: PCM16 LE mono 16 kHz; audio out: PCM16 LE mono 24 kHz.
// ============================================================

use super::RealtimeEvent;
use serde_json::{json, Value};

pub const LIVE_WS_URL: &str =
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
pub const INPUT_SAMPLE_RATE: u32 = 16_000;
pub const OUTPUT_SAMPLE_RATE: u32 = 24_000;

pub fn endpoint_with_key(api_key: &str) -> String {
    format!("{LIVE_WS_URL}?key={api_key}")
}

fn model_path(model: &str) -> String {
    if model.starts_with("models/") {
        model.to_string()
    } else {
        format!("models/{model}")
    }
}

/// Setup for a spoken role-play with the tutor.
pub fn dialogue_setup(model: &str, system_instruction: &str, voice: &str) -> Value {
    json!({
        "setup": {
            "model": model_path(model),
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": { "prebuiltVoiceConfig": { "voiceName": voice } }
                }
            },
            "systemInstruction": { "parts": [{ "text": system_instruction }] },
            "inputAudioTranscription": {},
            "outputAudioTranscription": {},
            "contextWindowCompression": { "slidingWindow": {} }
        }
    })
}

/// Setup for live speech→speech interpretation into `target_language` (BCP-47).
pub fn interpreter_setup(model: &str, target_language: &str, echo_target_language: bool) -> Value {
    json!({
        "setup": {
            "model": model_path(model),
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "translationConfig": {
                    "targetLanguageCode": target_language,
                    "echoTargetLanguage": echo_target_language
                }
            },
            "inputAudioTranscription": {},
            "outputAudioTranscription": {}
        }
    })
}

/// 100 ms PCM16 chunk (already base64) as realtime input.
pub fn audio_message(pcm16_b64: &str) -> Value {
    json!({
        "realtimeInput": {
            "audio": {
                "data": pcm16_b64,
                "mimeType": format!("audio/pcm;rate={INPUT_SAMPLE_RATE}")
            }
        }
    })
}

pub fn text_message(text: &str) -> Value {
    json!({ "realtimeInput": { "text": text } })
}

pub fn audio_stream_end_message() -> Value {
    json!({ "realtimeInput": { "audioStreamEnd": true } })
}

pub fn is_setup_complete(message: &Value) -> bool {
    message.get("setupComplete").is_some()
}

fn sample_rate_from_mime(mime: &str) -> u32 {
    mime.split(';')
        .filter_map(|part| part.trim().strip_prefix("rate="))
        .find_map(|rate| rate.trim().parse::<u32>().ok())
        .unwrap_or(OUTPUT_SAMPLE_RATE)
}

fn transcript(value: &Value) -> Option<(String, Option<String>)> {
    let text = value.get("text")?.as_str()?;
    if text.is_empty() {
        return None;
    }
    let language = value
        .get("languageCode")
        .and_then(Value::as_str)
        .map(str::to_string);
    Some((text.to_string(), language))
}

/// Translate one server message into UI events (order preserved).
pub fn parse_server_message(message: &Value) -> Vec<RealtimeEvent> {
    let mut events = Vec::new();
    if let Some(content) = message.get("serverContent") {
        if content.get("interrupted").and_then(Value::as_bool) == Some(true) {
            events.push(RealtimeEvent::Interrupted);
        }
        if let Some((text, language)) = content.get("inputTranscription").and_then(transcript) {
            events.push(RealtimeEvent::InputTranscript { text, language });
        }
        if let Some(parts) = content
            .get("modelTurn")
            .and_then(|turn| turn.get("parts"))
            .and_then(Value::as_array)
        {
            for part in parts {
                let inline = part.get("inlineData").or_else(|| part.get("inline_data"));
                if let Some(inline) = inline {
                    let mime = inline
                        .get("mimeType")
                        .or_else(|| inline.get("mime_type"))
                        .and_then(Value::as_str)
                        .unwrap_or("audio/pcm;rate=24000");
                    if let Some(data) = inline.get("data").and_then(Value::as_str) {
                        if mime.starts_with("audio/") {
                            events.push(RealtimeEvent::Audio {
                                data: data.to_string(),
                                sample_rate: sample_rate_from_mime(mime),
                            });
                        }
                    }
                }
            }
        }
        if let Some((text, language)) = content.get("outputTranscription").and_then(transcript) {
            events.push(RealtimeEvent::OutputTranscript { text, language });
        }
        if content.get("turnComplete").and_then(Value::as_bool) == Some(true) {
            events.push(RealtimeEvent::TurnComplete);
        }
    }
    if let Some(go_away) = message.get("goAway") {
        events.push(RealtimeEvent::GoAway {
            time_left: go_away
                .get("timeLeft")
                .and_then(Value::as_str)
                .map(str::to_string),
        });
    }
    events
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dialogue_setup_matches_live_contract() {
        let setup = dialogue_setup("gemini-3.8-live", "Be a barista.", "Kore");
        let s = &setup["setup"];
        assert_eq!(s["model"], "models/gemini-3.8-live");
        assert_eq!(s["generationConfig"]["responseModalities"][0], "AUDIO");
        assert_eq!(
            s["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"],
            "Kore"
        );
        assert_eq!(s["systemInstruction"]["parts"][0]["text"], "Be a barista.");
        assert!(s["inputAudioTranscription"].is_object());
        assert!(s["outputAudioTranscription"].is_object());
    }

    #[test]
    fn interpreter_setup_puts_translation_config_in_generation_config() {
        let setup = interpreter_setup("gemini-3.5-live-translate-preview", "ru", false);
        let g = &setup["setup"]["generationConfig"];
        assert_eq!(setup["setup"]["model"], "models/gemini-3.5-live-translate-preview");
        assert_eq!(g["translationConfig"]["targetLanguageCode"], "ru");
        assert_eq!(g["translationConfig"]["echoTargetLanguage"], false);
        assert!(g.get("inputAudioTranscription").is_none());
        assert!(setup["setup"]["inputAudioTranscription"].is_object());
        assert!(setup["setup"]["outputAudioTranscription"].is_object());
        assert!(setup["setup"].get("systemInstruction").is_none(), "translate model takes no instructions");
    }

    #[test]
    fn audio_message_declares_16k_pcm() {
        let msg = audio_message("AAAA");
        assert_eq!(msg["realtimeInput"]["audio"]["mimeType"], "audio/pcm;rate=16000");
        assert_eq!(msg["realtimeInput"]["audio"]["data"], "AAAA");
    }

    #[test]
    fn parses_audio_transcripts_and_turn_end_in_order() {
        let msg: Value = serde_json::json!({
            "serverContent": {
                "inputTranscription": { "text": "Hello", "languageCode": "en" },
                "modelTurn": { "parts": [{ "inlineData": { "mimeType": "audio/pcm;rate=24000", "data": "UklGRg==" } }] },
                "outputTranscription": { "text": "Hi there" },
                "turnComplete": true
            }
        });
        let events = parse_server_message(&msg);
        assert_eq!(
            events,
            vec![
                RealtimeEvent::InputTranscript { text: "Hello".into(), language: Some("en".into()) },
                RealtimeEvent::Audio { data: "UklGRg==".into(), sample_rate: 24_000 },
                RealtimeEvent::OutputTranscript { text: "Hi there".into(), language: None },
                RealtimeEvent::TurnComplete,
            ]
        );
    }

    #[test]
    fn parses_barge_in_and_go_away() {
        let interrupted: Value = serde_json::json!({ "serverContent": { "interrupted": true } });
        assert_eq!(parse_server_message(&interrupted), vec![RealtimeEvent::Interrupted]);

        let go_away: Value = serde_json::json!({ "goAway": { "timeLeft": "10s" } });
        assert_eq!(
            parse_server_message(&go_away),
            vec![RealtimeEvent::GoAway { time_left: Some("10s".into()) }]
        );
        assert!(parse_server_message(&serde_json::json!({ "usageMetadata": {} })).is_empty());
    }
}
