// ============================================================
// LEXORA — Realtime voice commands
// Live dialogue (role RealtimeVoice) and live interpretation
// (role LiveInterpreter) over Gemini Live. Audio in: base64
// PCM16 16 kHz chunks via `realtime_send_audio`; events out via
// a Tauri channel. Dialogue exchanges are saved after each turn
// and scored asynchronously so the conversation never waits.
// ============================================================

use crate::commands::settings::AppSettings;
use crate::commands::translate::TestConnectionResult;
use crate::db::repos::dialogue::{DialogueRepo, DialogueSessionDto, InsertTurnInput, TurnScores};
use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::translation_hub::TranslationHubRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{DialogueHistoryMessage, DialogueTurnRequest};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::packages::RouteTarget;
use crate::providers::models::router::{primary_target, registry_for_role};
use crate::providers::models::usage::UsageSink;
use crate::providers::realtime::gemini_live;
use crate::providers::realtime::{
    command_channel, connect_and_setup, run_session, ClientCommand, RealtimeEvent,
    RealtimeSessions,
};
use crate::providers::tts::gemini_tts::gemini_voice_for;
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RealtimeMode {
    Dialogue,
    Interpreter,
}

impl RealtimeMode {
    fn role(self) -> ModelRole {
        match self {
            RealtimeMode::Dialogue => ModelRole::RealtimeVoice,
            RealtimeMode::Interpreter => ModelRole::LiveInterpreter,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RealtimeStartInput {
    pub mode: RealtimeMode,
    /// Dialogue: session whose turns receive the live transcripts.
    #[serde(default)]
    pub dialogue_session_id: Option<i64>,
    /// Interpreter: BCP-47 target language (e.g. "ru").
    #[serde(default)]
    pub target_language: Option<String>,
    /// Interpreter: spoken language hint, used to label history.
    #[serde(default)]
    pub source_language: Option<String>,
    /// Interpreter: repeat speech that is already in the target language.
    #[serde(default)]
    pub echo_target_language: bool,
    #[serde(default)]
    pub voice: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RealtimeStarted {
    pub session_id: u64,
    pub model: String,
    pub input_sample_rate: u32,
    pub output_sample_rate: u32,
}

/// Live transcripts accumulated between turn boundaries.
#[derive(Default)]
struct LiveTranscript {
    user: String,
    model: String,
    user_language: Option<String>,
    all_user: Vec<String>,
    all_model: Vec<String>,
}

impl LiveTranscript {
    fn take_turn(&mut self) -> (String, String) {
        let user = std::mem::take(&mut self.user).trim().to_string();
        let model = std::mem::take(&mut self.model).trim().to_string();
        if !user.is_empty() {
            self.all_user.push(user.clone());
        }
        if !model.is_empty() {
            self.all_model.push(model.clone());
        }
        (user, model)
    }
}

pub(crate) fn language_name(conn: &rusqlite::Connection, code: &str) -> String {
    conn.query_row(
        "SELECT name FROM language WHERE code = ?1",
        [code],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .ok()
    .flatten()
    .unwrap_or_else(|| code.to_string())
}

/// System instruction for the spoken tutor (pure — testable).
pub(crate) fn tutor_instruction(
    title: &str,
    level: &str,
    tutor_role: &str,
    language_name: &str,
    history: &[(String, String)],
) -> String {
    let mut text = format!(
        "You are a friendly spoken-language tutor in a role-play.\n\
         Scenario: {title} (CEFR {level}).\n\
         Your role: {tutor_role}\n\
         Speak only {language_name}, at {level} level: one to three short sentences per turn, natural pace.\n\
         When the learner makes a mistake, naturally repeat the correct phrase and keep the conversation going; do not lecture.\n\
         If the learner is stuck or silent, offer a simple hint or two options to choose from.\n\
         Stay in character and never mention being an AI."
    );
    if !history.is_empty() {
        text.push_str("\n\nConversation so far:");
        for (role, line) in history {
            let speaker = if role == "user" { "Learner" } else { "Tutor" };
            text.push_str(&format!("\n{speaker}: {line}"));
        }
    }
    text
}

fn gemini_key(app: &AppHandle) -> Result<String, AppError> {
    crate::api_keys::get_api_key(app, "gemini").ok_or_else(|| {
        AppError::Validation(
            "Live voice needs a Google Gemini API key. Open Settings → AI and add the key.".to_string(),
        )
    })
}

fn live_model(pool: &DbPool, settings: &AppSettings, role: ModelRole) -> Result<String, AppError> {
    if settings.offline_mode {
        return Err(AppError::ai_not_connected(role.label_en()));
    }
    let target = primary_target(pool, settings, role)?
        .ok_or_else(|| AppError::ai_not_connected(role.label_en()))?;
    if target.provider != "gemini" {
        return Err(AppError::Validation(format!(
            "{} live voice is not supported yet. Choose the Gemini package for live voice.",
            target.provider
        )));
    }
    Ok(target.model)
}

fn unscored(role: &str, text: String) -> InsertTurnInput {
    InsertTurnInput {
        role: role.to_string(),
        text,
        audio_path: None,
        turn_score: None,
        fluency_score: None,
        clarity_score: None,
        grammar_score: None,
        suggestions: Vec::new(),
    }
}

/// Save a finished live exchange, then score the learner turn in the background.
fn persist_live_exchange(
    app: AppHandle,
    pool: Arc<DbPool>,
    channel: Channel<RealtimeEvent>,
    session_id: i64,
    user_text: String,
    tutor_text: String,
) {
    tauri::async_runtime::spawn(async move {
        let saved = pool
            .get()
            .map_err(AppError::from)
            .and_then(|mut conn| {
                DialogueRepo::append_exchange(
                    &mut conn,
                    session_id,
                    unscored("user", user_text.clone()),
                    unscored("tutor", tutor_text),
                )
            });
        let session = match saved {
            Ok(session) => session,
            Err(e) => {
                log::warn!("Live dialogue: failed to save exchange: {e}");
                return;
            }
        };
        let _ = channel.send(RealtimeEvent::TurnSaved {
            session: serde_json::to_value(&session).unwrap_or_default(),
        });
        if let Err(e) = score_live_turn(&app, &pool, &channel, &session, &user_text).await {
            log::warn!("Live dialogue: scoring skipped: {e}");
        }
    });
}

async fn score_live_turn(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    channel: &Channel<RealtimeEvent>,
    session: &DialogueSessionDto,
    user_text: &str,
) -> Result<(), AppError> {
    let Some(user_turn) = session.turns.iter().rev().find(|t| t.role == "user") else {
        return Ok(());
    };
    let (settings, scenario) = {
        let conn = pool.get()?;
        (
            SettingsRepo::get(&conn)?,
            DialogueRepo::get_scenario_by_id(&conn, session.scenario_id)?,
        )
    };
    let registry = registry_for_role(app, pool, &settings, ModelRole::TextFast)?;
    let history: Vec<DialogueHistoryMessage> = session
        .turns
        .iter()
        .filter(|t| t.sort_order < user_turn.sort_order)
        .map(|t| DialogueHistoryMessage {
            role: t.role.clone(),
            text: t.text.clone(),
        })
        .collect();
    let ai = registry
        .dialogue_turn(DialogueTurnRequest {
            scenario_title: scenario.title.clone(),
            tutor_role: scenario.tutor_role.clone(),
            level: scenario.level.clone(),
            language: session.language.clone(),
            history,
            user_text: user_text.to_string(),
        })
        .await?;
    let scored = {
        let mut conn = pool.get()?;
        DialogueRepo::update_turn_scores(
            &mut conn,
            user_turn.id,
            TurnScores {
                turn: i64::from(ai.turn_score),
                fluency: i64::from(ai.fluency_score),
                clarity: i64::from(ai.clarity_score),
                grammar: i64::from(ai.grammar_score),
            },
            &ai.vocabulary_suggestions,
        )?
    };
    let _ = channel.send(RealtimeEvent::TurnSaved {
        session: serde_json::to_value(&scored).unwrap_or_default(),
    });
    Ok(())
}

#[tauri::command]
pub async fn realtime_start(
    input: RealtimeStartInput,
    on_event: Channel<RealtimeEvent>,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
    sessions: State<'_, RealtimeSessions>,
) -> Result<RealtimeStarted, AppError> {
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let role = input.mode.role();
    let model = live_model(&pool, &settings, role)?;
    let key = gemini_key(&app)?;

    let mut opening: Option<String> = None;
    let mut dialogue_session_id: Option<i64> = None;
    let setup = match input.mode {
        RealtimeMode::Dialogue => {
            let session_id = input.dialogue_session_id.ok_or_else(|| {
                AppError::Validation("Start a dialogue session first".to_string())
            })?;
            let conn = pool.get()?;
            let session = DialogueRepo::get_session(&conn, session_id)?;
            if session.status != "active" {
                return Err(AppError::Validation("Dialogue session is not active".to_string()));
            }
            let scenario = DialogueRepo::get_scenario_by_id(&conn, session.scenario_id)?;
            let history: Vec<(String, String)> = session
                .turns
                .iter()
                .map(|t| (t.role.clone(), t.text.clone()))
                .collect();
            if session.turns.len() <= 1 {
                opening = Some(format!(
                    "Start the role-play now. Say exactly this opening line and then wait for the learner: \"{}\"",
                    scenario.opening_line
                ));
            }
            dialogue_session_id = Some(session_id);
            let voice = gemini_voice_for(input.voice.as_deref().unwrap_or(&settings.tts_voice));
            gemini_live::dialogue_setup(
                &model,
                &tutor_instruction(
                    &scenario.title,
                    &scenario.level,
                    &scenario.tutor_role,
                    &language_name(&conn, &session.language),
                    &history,
                ),
                voice,
            )
        }
        RealtimeMode::Interpreter => {
            let target = input
                .target_language
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .unwrap_or(&settings.interface_language)
                .to_string();
            gemini_live::interpreter_setup(&model, &target, input.echo_target_language)
        }
    };

    let socket = connect_and_setup(&gemini_live::endpoint_with_key(&key), &key, &setup).await?;
    let (tx, rx) = command_channel();
    let session_id = sessions.register(tx.clone());
    if let Some(prompt) = opening {
        let _ = tx.send(ClientCommand::Text(prompt)).await;
    }
    let _ = on_event.send(RealtimeEvent::Ready { model: model.clone() });

    let transcript = Arc::new(Mutex::new(LiveTranscript::default()));
    let mode = input.mode;
    let target_language = input
        .target_language
        .clone()
        .unwrap_or_else(|| settings.interface_language.clone());
    let source_hint = input.source_language.clone();
    let task_app = app.clone();
    let task_pool = pool.clone();
    let usage_model = model.clone();
    tauri::async_runtime::spawn(async move {
        let emit = {
            let channel = on_event.clone();
            let transcript = transcript.clone();
            let app = task_app.clone();
            let pool = task_pool.clone();
            move |event: RealtimeEvent| {
                if let Ok(mut buf) = transcript.lock() {
                    match &event {
                        RealtimeEvent::InputTranscript { text, language } => {
                            buf.user.push_str(text);
                            if language.is_some() {
                                buf.user_language = language.clone();
                            }
                        }
                        RealtimeEvent::OutputTranscript { text, .. } => buf.model.push_str(text),
                        RealtimeEvent::LearnerText { text } => {
                            if !buf.user.is_empty() {
                                buf.user.push(' ');
                            }
                            buf.user.push_str(text);
                        }
                        RealtimeEvent::TurnComplete => {
                            let (user, model_text) = buf.take_turn();
                            if let (RealtimeMode::Dialogue, Some(dialogue_id)) = (mode, dialogue_session_id) {
                                if !user.is_empty() && !model_text.is_empty() {
                                    persist_live_exchange(
                                        app.clone(),
                                        pool.clone(),
                                        channel.clone(),
                                        dialogue_id,
                                        user,
                                        model_text,
                                    );
                                }
                            }
                        }
                        _ => {}
                    }
                }
                let _ = channel.send(event);
            }
        };
        let session_started = Instant::now();
        run_session(socket, rx, key, emit).await;
        // Live audio is billed per minute of session (input streams the whole time).
        UsageSink::new(task_pool.as_ref().clone(), role).record_amount(
            &RouteTarget::new("gemini", &usage_model),
            true,
            session_started.elapsed().as_secs_f64(),
            0,
        );

        if let Some(sessions) = task_app.try_state::<RealtimeSessions>() {
            sessions.remove(session_id);
        }
        if mode == RealtimeMode::Interpreter {
            let (original, translated, language) = match transcript.lock() {
                Ok(mut buf) => {
                    let _ = buf.take_turn();
                    (
                        buf.all_user.join(" "),
                        buf.all_model.join(" "),
                        buf.user_language.clone(),
                    )
                }
                Err(_) => (String::new(), String::new(), None),
            };
            if !original.trim().is_empty() && !translated.trim().is_empty() {
                let source = language.or(source_hint).unwrap_or_else(|| "auto".to_string());
                let saved = task_pool.get().map_err(AppError::from).and_then(|conn| {
                    TranslationHubRepo::create_entry(
                        &conn,
                        "audio",
                        &source,
                        &target_language,
                        &original,
                        &translated,
                        Some(r#"{"live":true}"#),
                    )
                });
                if let Err(e) = saved {
                    log::warn!("Live interpretation: history not saved: {e}");
                }
            }
        }
    });

    Ok(RealtimeStarted {
        session_id,
        model,
        input_sample_rate: gemini_live::INPUT_SAMPLE_RATE,
        output_sample_rate: gemini_live::OUTPUT_SAMPLE_RATE,
    })
}

#[tauri::command]
pub async fn realtime_send_audio(
    session_id: u64,
    chunk: String,
    sessions: State<'_, RealtimeSessions>,
) -> Result<(), AppError> {
    let sender = sessions
        .sender(session_id)
        .ok_or_else(|| AppError::NotFound("Live session has ended".to_string()))?;
    sender
        .try_send(ClientCommand::Audio(chunk))
        .map_err(|e| match e {
            tokio::sync::mpsc::error::TrySendError::Full(_) => {
                AppError::Provider("Live session is falling behind; audio chunk dropped".to_string())
            }
            tokio::sync::mpsc::error::TrySendError::Closed(_) => {
                AppError::NotFound("Live session has ended".to_string())
            }
        })
}

#[tauri::command]
pub async fn realtime_send_text(
    session_id: u64,
    text: String,
    sessions: State<'_, RealtimeSessions>,
) -> Result<(), AppError> {
    let text = text.trim();
    if text.is_empty() {
        return Err(AppError::Validation("Text is empty".to_string()));
    }
    let sender = sessions
        .sender(session_id)
        .ok_or_else(|| AppError::NotFound("Live session has ended".to_string()))?;
    sender
        .send(ClientCommand::LearnerText(text.to_string()))
        .await
        .map_err(|_| AppError::NotFound("Live session has ended".to_string()))
}

#[tauri::command]
pub async fn realtime_stop(
    session_id: u64,
    sessions: State<'_, RealtimeSessions>,
) -> Result<(), AppError> {
    if let Some(sender) = sessions.remove(session_id) {
        let _ = sender.send(ClientCommand::AudioStreamEnd).await;
        let _ = sender.send(ClientCommand::Close).await;
    }
    Ok(())
}

/// Settings «Проверить» for live roles: open a session and wait for setupComplete.
pub(crate) async fn test_realtime_role(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    settings: &AppSettings,
    role: ModelRole,
) -> Result<TestConnectionResult, AppError> {
    let started = Instant::now();
    let done = |ok: bool, message: String| TestConnectionResult {
        ok,
        latency_ms: started.elapsed().as_millis() as u64,
        message,
        sample_translation: None,
    };
    let model = match live_model(pool, settings, role) {
        Ok(model) => model,
        Err(e) => return Ok(done(false, e.to_string())),
    };
    let key = match gemini_key(app) {
        Ok(key) => key,
        Err(e) => return Ok(done(false, e.to_string())),
    };
    let setup = match role {
        ModelRole::LiveInterpreter => gemini_live::interpreter_setup(&model, "en", false),
        _ => gemini_live::dialogue_setup(&model, "Reply in one short sentence.", "Kore"),
    };
    match connect_and_setup(&gemini_live::endpoint_with_key(&key), &key, &setup).await {
        Ok(mut socket) => {
            let _ = socket.close(None).await;
            Ok(done(true, format!("{model}: живая сессия открывается")))
        }
        Err(e) => Ok(done(false, e.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tutor_instruction_includes_scenario_level_language_and_history() {
        let text = tutor_instruction(
            "Coffee Shop in London",
            "B2",
            "You are a barista.",
            "English",
            &[
                ("tutor".into(), "What roast would you like?".into()),
                ("user".into(), "Medium, please".into()),
            ],
        );
        assert!(text.contains("Coffee Shop in London (CEFR B2)"));
        assert!(text.contains("Speak only English"));
        assert!(text.contains("Tutor: What roast would you like?"));
        assert!(text.contains("Learner: Medium, please"));
    }

    #[test]
    fn transcript_turns_accumulate_and_reset() {
        let mut buf = LiveTranscript::default();
        buf.user.push_str("Hello ");
        buf.user.push_str("there");
        buf.model.push_str("Hi!");
        assert_eq!(buf.take_turn(), ("Hello there".to_string(), "Hi!".to_string()));
        assert_eq!(buf.take_turn(), (String::new(), String::new()));
        assert_eq!(buf.all_user, vec!["Hello there".to_string()]);
    }

    #[test]
    fn modes_map_to_roles() {
        assert_eq!(RealtimeMode::Dialogue.role(), ModelRole::RealtimeVoice);
        assert_eq!(RealtimeMode::Interpreter.role(), ModelRole::LiveInterpreter);
    }
}
