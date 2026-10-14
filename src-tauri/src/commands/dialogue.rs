// ============================================================
// LEXORA — AI Dialogue Commands
// Scenario sessions, voice/text turns, scoring.
// ============================================================

use crate::db::repos::dialogue::{
    DialogueRepo, DialogueScenarioDto, DialogueSessionDto, InsertTurnInput, NewScenario,
    BASE_LANGUAGE, KIND_FREE, KIND_GUIDED, ORIGIN_CUSTOM, ORIGIN_GENERATED,
};
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::pronunciation::audio_cache;
use crate::providers::ai::{
    DialogueHistoryMessage, DialogueTurnRequest, GenerateScenarioRequest, GeneratedScenario,
    ScenarioSeed, TranscribeAudioRequest,
};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::registry_for_role;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

const MAX_USER_CHARS: usize = 2_000;
const DEFAULT_SCENARIO_SLUG: &str = "coffee-shop-london-b2";
const LEVELS: [&str; 6] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MAX_TITLE_CHARS: usize = 80;
const MAX_DESCRIPTION_CHARS: usize = 500;
const FREE_TALK_TITLE: &str = "Free conversation";
const FREE_TALK_DESCRIPTION: &str = "Talk about anything you like.";

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDialogueScenarioInput {
    pub language: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub level: String,
    /// `guided` or `free`.
    pub kind: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateScenariosResult {
    /// Localizations created by this call.
    pub created: i64,
    /// Builtin scenarios still without a localization (a later call continues).
    pub remaining: i64,
}

fn trimmed(raw: Option<&str>) -> String {
    raw.map(str::trim).unwrap_or_default().to_string()
}

fn check_len(label: &str, value: &str, max: usize) -> Result<(), AppError> {
    if value.chars().count() > max {
        return Err(AppError::Validation(format!(
            "{label} is too long (max {max} characters)"
        )));
    }
    Ok(())
}

/// Validated learner input → the seed the model composes a scenario from.
fn custom_scenario_seed(input: &CreateDialogueScenarioInput) -> Result<ScenarioSeed, AppError> {
    let level = input.level.trim().to_uppercase();
    if !LEVELS.contains(&level.as_str()) {
        return Err(AppError::Validation(format!("Unknown level '{}'", input.level)));
    }
    let kind = input.kind.trim();
    if kind != KIND_GUIDED && kind != KIND_FREE {
        return Err(AppError::Validation(format!("Unknown scenario type '{kind}'")));
    }
    let mut title = trimmed(input.title.as_deref());
    let mut description = trimmed(input.description.as_deref());
    check_len("Title", &title, MAX_TITLE_CHARS)?;
    check_len("Description", &description, MAX_DESCRIPTION_CHARS)?;

    if kind == KIND_GUIDED {
        if title.is_empty() {
            return Err(AppError::Validation("Give the scenario a title".to_string()));
        }
        if description.is_empty() {
            return Err(AppError::Validation(
                "Describe the situation to practice".to_string(),
            ));
        }
    } else {
        if title.is_empty() {
            title = FREE_TALK_TITLE.to_string();
        }
        if description.is_empty() {
            description = FREE_TALK_DESCRIPTION.to_string();
        }
    }
    Ok(ScenarioSeed {
        title,
        level,
        kind: kind.to_string(),
        description,
        tutor_role: String::new(),
        opening_line: String::new(),
        suggested_vocab: vec![],
    })
}

/// A builtin English scenario as the source of its localization.
fn localization_seed(base: &DialogueScenarioDto) -> ScenarioSeed {
    ScenarioSeed {
        title: base.title.clone(),
        level: base.level.clone(),
        kind: base.kind.clone(),
        description: base.description.clone().unwrap_or_default(),
        tutor_role: base.tutor_role.clone(),
        opening_line: base.opening_line.clone(),
        suggested_vocab: base.suggested_vocab.clone(),
    }
}

fn localized_scenario(
    base: &DialogueScenarioDto,
    language: &str,
    generated: GeneratedScenario,
) -> NewScenario {
    NewScenario {
        slug: format!("{}-{language}", base.slug),
        title: generated.title,
        level: base.level.clone(),
        language: language.to_string(),
        description: Some(generated.description).filter(|d| !d.is_empty()),
        tutor_role: generated.tutor_role,
        opening_line: generated.opening_line,
        suggested_vocab: generated.suggested_vocab,
        kind: base.kind.clone(),
        origin: ORIGIN_GENERATED.to_string(),
        base_slug: Some(base.slug.clone()),
        sort_order: Some(base.sort_order),
    }
}

fn custom_scenario(seed: ScenarioSeed, language: &str, generated: GeneratedScenario) -> NewScenario {
    NewScenario {
        slug: format!("custom-{}", uuid::Uuid::new_v4().simple()),
        title: generated.title,
        level: seed.level,
        language: language.to_string(),
        description: Some(generated.description).filter(|d| !d.is_empty()),
        tutor_role: generated.tutor_role,
        opening_line: generated.opening_line,
        suggested_vocab: generated.suggested_vocab,
        kind: seed.kind,
        origin: ORIGIN_CUSTOM.to_string(),
        base_slug: None,
        sort_order: None,
    }
}

/// Localize the builtin English scenarios into `language` with the AI.
/// Idempotent: only scenarios without a localization are generated, one model
/// call each, so a failure midway keeps what was already created.
#[tauri::command]
pub async fn generate_dialogue_scenarios(
    language: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<GenerateScenariosResult, AppError> {
    let pool = db.inner().clone();
    let language = language.trim().to_string();
    if language.is_empty() || language == BASE_LANGUAGE {
        return Err(AppError::Validation(
            "Built-in scenarios are already available in English".to_string(),
        ));
    }
    let (settings, language_name, missing) = {
        let conn = pool.get()?;
        let name = DialogueRepo::language_name(&conn, &language)?
            .ok_or_else(|| AppError::Validation(format!("Unknown language '{language}'")))?;
        (
            SettingsRepo::get(&conn)?,
            name,
            DialogueRepo::missing_base_scenarios(&conn, &language)?,
        )
    };
    if missing.is_empty() {
        return Ok(GenerateScenariosResult { created: 0, remaining: 0 });
    }
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Dialogue"));
    }

    let registry = registry_for_role(&app, &pool, &settings, ModelRole::TextQuality)?;
    let mut created = 0i64;
    for base in &missing {
        let generated = registry
            .generate_scenario(GenerateScenarioRequest {
                language_name: language_name.clone(),
                seed: localization_seed(base),
            })
            .await;
        let generated = match generated {
            Ok(g) => g,
            // Keep the localizations already saved; the next call continues.
            Err(_) if created > 0 => break,
            Err(e) => return Err(e),
        };
        let mut conn = pool.get()?;
        DialogueRepo::insert_scenario(&mut conn, &localized_scenario(base, &language, generated))?;
        created += 1;
    }
    Ok(GenerateScenariosResult {
        created,
        remaining: missing.len() as i64 - created,
    })
}

/// Create the learner's own scenario: the AI writes the tutor role, opening
/// line and vocabulary from the title and description, in the learner's language.
#[tauri::command]
pub async fn create_dialogue_scenario(
    input: CreateDialogueScenarioInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<DialogueScenarioDto, AppError> {
    let pool = db.inner().clone();
    let seed = custom_scenario_seed(&input)?;
    let (settings, language, language_name) = {
        let conn = pool.get()?;
        let settings = SettingsRepo::get(&conn)?;
        let language = normalize_language(input.language.as_deref(), &settings.primary_language);
        let name = DialogueRepo::language_name(&conn, &language)?
            .ok_or_else(|| AppError::Validation(format!("Unknown language '{language}'")))?;
        (settings, language, name)
    };
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Dialogue"));
    }

    let registry = registry_for_role(&app, &pool, &settings, ModelRole::TextQuality)?;
    let generated = registry
        .generate_scenario(GenerateScenarioRequest {
            language_name,
            seed: seed.clone(),
        })
        .await?;
    let mut conn = pool.get()?;
    DialogueRepo::insert_scenario(&mut conn, &custom_scenario(seed, &language, generated))
}

#[tauri::command]
pub async fn delete_dialogue_scenario(
    id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<(), AppError> {
    let conn = db.get()?;
    DialogueRepo::delete_scenario(&conn, id)
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
        // A fresh page opens the first scenario of the learner's language;
        // the English coffee shop only when that language has none yet.
        match DialogueRepo::first_scenario(&conn, &language)? {
            Some(first) => first,
            None => DialogueRepo::get_scenario_by_slug(&conn, DEFAULT_SCENARIO_SLUG)?,
        }
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

#[cfg(test)]
mod tests {
    use super::*;

    fn input(kind: &str, title: &str, description: &str, level: &str) -> CreateDialogueScenarioInput {
        CreateDialogueScenarioInput {
            language: None,
            title: Some(title.into()),
            description: Some(description.into()),
            level: level.into(),
            kind: kind.into(),
        }
    }

    #[test]
    fn guided_scenario_needs_title_and_description() {
        assert!(custom_scenario_seed(&input("guided", "", "At the bank", "B1")).is_err());
        assert!(custom_scenario_seed(&input("guided", "Bank", "  ", "B1")).is_err());
        let seed = custom_scenario_seed(&input("guided", " Bank ", " Open an account ", "b1"))
            .expect("valid");
        assert_eq!(seed.title, "Bank");
        assert_eq!(seed.description, "Open an account");
        assert_eq!(seed.level, "B1");
        assert!(seed.tutor_role.is_empty() && seed.opening_line.is_empty());
    }

    #[test]
    fn free_scenario_falls_back_to_default_title_and_description() {
        let seed = custom_scenario_seed(&input("free", "", "", "A2")).expect("valid");
        assert_eq!(seed.kind, "free");
        assert_eq!(seed.title, FREE_TALK_TITLE);
        assert_eq!(seed.description, FREE_TALK_DESCRIPTION);
    }

    #[test]
    fn rejects_unknown_level_kind_and_overlong_text() {
        assert!(custom_scenario_seed(&input("free", "", "", "D9")).is_err());
        assert!(custom_scenario_seed(&input("quiz", "t", "d", "B1")).is_err());
        let long = "x".repeat(MAX_DESCRIPTION_CHARS + 1);
        assert!(custom_scenario_seed(&input("guided", "t", &long, "B1")).is_err());
    }
}
