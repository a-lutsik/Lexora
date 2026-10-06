// ============================================================
// LEXORA — AI Dialogue Commands
// Scenario sessions, voice/text turns, scoring.
// ============================================================

use crate::db::repos::dialogue::{
    DialogueRepo, DialogueScenarioDto, DialogueSessionDto, InsertTurnInput,
};
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::pronunciation::audio_cache;
use crate::providers::ai::{DialogueHistoryMessage, DialogueTurnRequest, TranscribeAudioRequest};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::registry_for_role;
use serde::Deserialize;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

const MAX_USER_CHARS: usize = 2_000;
const DEFAULT_SCENARIO_SLUG: &str = "coffee-shop-london-b2";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartDialogueSessionInput {
    pub scenario_id: Option<i64>,
    pub scenario_slug: Option<String>,
    pub language: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendDialogueTurnInput {
    pub session_id: i64,
    pub text: Option<String>,
    pub audio_base64: Option<String>,
    pub mime_type: Option<String>,
}

fn normalize_language(raw: Option<&str>, fallback: &str) -> String {
    raw.map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(fallback)
        .to_string()
}

fn validate_user_text(text: &str) -> Result<&str, AppError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Reply text is empty".to_string()));
    }
    if trimmed.chars().count() > MAX_USER_CHARS {
        return Err(AppError::Validation(format!(
            "Reply is too long (max {MAX_USER_CHARS} characters)"
        )));
    }
    Ok(trimmed)
}

#[tauri::command]
pub async fn list_dialogue_scenarios(
    language: Option<String>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<DialogueScenarioDto>, AppError> {
    let conn = db.get()?;
    let lang = language.as_deref().map(str::trim).filter(|s| !s.is_empty());
    DialogueRepo::list_scenarios(&conn, lang)
}

#[tauri::command]
pub async fn start_dialogue_session(
    input: StartDialogueSessionInput,
    db: State<'_, Arc<DbPool>>,
) -> Result<DialogueSessionDto, AppError> {
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let language = normalize_language(input.language.as_deref(), &settings.primary_language);
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Dialogue"));
    }

    let mut conn = pool.get()?;
    let scenario = if let Some(id) = input.scenario_id {
        DialogueRepo::get_scenario_by_id(&conn, id)?
    } else if let Some(slug) = input
        .scenario_slug
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        DialogueRepo::get_scenario_by_slug(&conn, slug)?
    } else {
        DialogueRepo::get_scenario_by_slug(&conn, DEFAULT_SCENARIO_SLUG)?
    };

    DialogueRepo::start_session(&mut conn, scenario.id, &language)
}

#[tauri::command]
pub async fn get_dialogue_session(
    session_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<DialogueSessionDto, AppError> {
    let conn = db.get()?;
    DialogueRepo::get_session(&conn, session_id)
}

#[tauri::command]
pub async fn end_dialogue_session(
    session_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<DialogueSessionDto, AppError> {
    let conn = db.get()?;
    DialogueRepo::end_session(&conn, session_id)
}

#[tauri::command]
pub async fn send_dialogue_turn(
    input: SendDialogueTurnInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<DialogueSessionDto, AppError> {
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Dialogue"));
    }

    let session = {
        let conn = pool.get()?;
        DialogueRepo::get_session(&conn, input.session_id)?
    };
    if session.status != "active" {
        return Err(AppError::Validation(
            "Dialogue session is not active".to_string(),
        ));
    }

    let scenario = {
        let conn = pool.get()?;
        DialogueRepo::get_scenario_by_id(&conn, session.scenario_id)?
    };

    let text_opt = input
        .text
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    let audio_opt = input
        .audio_base64
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let (user_text, audio_path) = match (text_opt, audio_opt) {
        (Some(text), None) => (validate_user_text(&text)?.to_string(), None),
        (Some(text), Some(_)) => {
            // Prefer explicit text when both are provided (chip / typed reply).
            (validate_user_text(&text)?.to_string(), None)
        }
        (None, Some(audio_b64)) => {
            let mime = input
                .mime_type
                .as_deref()
                .unwrap_or("audio/webm")
                .to_string();
            let bytes = audio_cache::decode_audio_payload(audio_b64)?;

            // Speech recognition only — the reply is in the session language,
            // there is nothing to translate.
            let speech = registry_for_role(&app, &pool, &settings, ModelRole::SpeechToText)?;
            let asr = speech
                .transcribe_audio(TranscribeAudioRequest {
                    audio_base64: audio_b64.to_string(),
                    mime_type: mime.clone(),
                    language: Some(session.language.clone()),
                    prompt: None,
                })
                .await?;
            let transcribed = validate_user_text(&asr.text)?.to_string();

            // Keep the recording only once it was understood (no orphan files).
            let app_dir = app.path().app_data_dir()?;
            let dir = audio_cache::ensure_attempts_dir(&app_dir)?;
            let path = audio_cache::save_recording(&dir, &bytes, &mime)?;
            let path_str = path
                .to_str()
                .ok_or_else(|| AppError::Io("Audio path is not valid UTF-8".to_string()))?
                .to_string();
            (transcribed, Some(path_str))
        }
        (None, None) => {
            return Err(AppError::Validation(
                "Provide spoken audio or reply text".to_string(),
            ));
        }
    };

    let history: Vec<DialogueHistoryMessage> = session
        .turns
        .iter()
        .map(|t| DialogueHistoryMessage {
            role: t.role.clone(),
            text: t.text.clone(),
        })
        .collect();

    let registry = registry_for_role(&app, &pool, &settings, ModelRole::TextQuality)?;
    let ai = registry
        .dialogue_turn(DialogueTurnRequest {
            scenario_title: scenario.title.clone(),
            tutor_role: scenario.tutor_role.clone(),
            level: scenario.level.clone(),
            language: session.language.clone(),
            history,
            user_text: user_text.clone(),
        })
        .await?;

    let suggestions = if ai.vocabulary_suggestions.is_empty() {
        scenario.suggested_vocab.clone()
    } else {
        ai.vocabulary_suggestions.clone()
    };

    let mut conn = pool.get()?;
    DialogueRepo::append_exchange(
        &mut conn,
        session.id,
        InsertTurnInput {
            role: "user".into(),
            text: user_text,
            audio_path,
            turn_score: Some(i64::from(ai.turn_score)),
            fluency_score: Some(i64::from(ai.fluency_score)),
            clarity_score: Some(i64::from(ai.clarity_score)),
            grammar_score: Some(i64::from(ai.grammar_score)),
            suggestions: vec![],
        },
        InsertTurnInput {
            role: "tutor".into(),
            text: ai.tutor_reply,
            audio_path: None,
            turn_score: None,
            fluency_score: None,
            clarity_score: None,
            grammar_score: None,
            suggestions,
        },
    )
}
