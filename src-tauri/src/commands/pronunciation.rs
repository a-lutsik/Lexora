// ============================================================
// LEXORA — Pronunciation Coach Commands
// Stage 3: save recording, evaluate, history, problem phonemes, pairs.
// ============================================================

use crate::db::repos::lexeme::LexemeRepo;
use crate::db::repos::pronunciation::{
    CreateAttemptInput, MinimalPairDto, PhonemePatternDto, PhonemeScoreInput,
    PronunciationAttemptDto, PronunciationRepo,
};
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::pronunciation::audio_cache;
use crate::providers::ai::{
    evaluate_pronunciation_heuristic, ArticulationTipRequest, ArticulationTipResult,
    EvaluatePronunciationRequest, PronunciationEvaluationResult,
};
use crate::providers::tts::spoken::{canonical_ipa, spoken_form};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

const MAX_TARGET_CHARS: usize = 500;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAudioRecordingInput {
    pub audio_base64: String,
    pub mime_type: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAudioRecordingResult {
    pub audio_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvaluatePronunciationInput {
    pub target_text: String,
    pub target_ipa: Option<String>,
    pub language: Option<String>,
    pub audio_path: Option<String>,
    pub recognized_text: Option<String>,
    pub lexeme_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticulationTipInput {
    pub phoneme: String,
    pub language: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PronunciationModelDto {
    pub spoken_text: String,
    pub ipa: Option<String>,
}

fn normalize_language(raw: Option<&str>, fallback: &str) -> String {
    raw.map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(fallback)
        .to_string()
}

fn validate_target_text(text: &str) -> Result<&str, AppError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Target text is empty".to_string()));
    }
    if trimmed.chars().count() > MAX_TARGET_CHARS {
        return Err(AppError::Validation(format!(
            "Target text is too long (max {MAX_TARGET_CHARS} characters)"
        )));
    }
    Ok(trimmed)
}

fn persist_evaluation(
    pool: &DbPool,
    input: &EvaluatePronunciationInput,
    target_text: &str,
    audio_path: &str,
    language: &str,
    result: &PronunciationEvaluationResult,
) -> Result<PronunciationAttemptDto, AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;

    if let Some(lexeme_id) = input.lexeme_id {
        if !PronunciationRepo::lexeme_exists(&tx, lexeme_id)? {
            return Err(AppError::NotFound(format!("Lexeme {lexeme_id} not found")));
        }
    }

    let phonemes: Vec<PhonemeScoreInput> = result
        .phonemes
        .iter()
        .map(|p| PhonemeScoreInput {
            target_phoneme: p.target_phoneme.clone(),
            recognized_phoneme: p.recognized_phoneme.clone(),
            accuracy: i64::from(p.accuracy.min(100)),
            status: p.status.clone(),
            position: p.position,
        })
        .collect();

    let attempt_id = PronunciationRepo::create_attempt(
        &tx,
        &CreateAttemptInput {
            lexeme_id: input.lexeme_id,
            audio_path,
            overall_score: i64::from(result.overall_score.min(100)),
            recognized_text: (!result.recognized_text.is_empty())
                .then_some(result.recognized_text.as_str()),
            target_text,
            target_ipa: (!result.target_ipa.is_empty()).then_some(result.target_ipa.as_str()),
            recognized_ipa: (!result.recognized_ipa.is_empty())
                .then_some(result.recognized_ipa.as_str()),
            stress_feedback: result.stress_feedback.as_deref(),
            summary: (!result.summary.is_empty()).then_some(result.summary.as_str()),
            language,
        },
        &phonemes,
    )?;

    for phone in &phonemes {
        if phone.status == "ok" {
            continue;
        }
        PronunciationRepo::increment_phoneme_pattern(
            &tx,
            &phone.target_phoneme,
            language,
            Some(phone.target_phoneme.as_str()),
            phone.recognized_phoneme.as_deref(),
        )?;
    }

    tx.commit()?;
    PronunciationRepo::get_attempt_with_scores(&conn, attempt_id)
}

#[tauri::command]
pub async fn save_audio_recording(
    input: SaveAudioRecordingInput,
    app: AppHandle,
) -> Result<SaveAudioRecordingResult, AppError> {
    let bytes = audio_cache::decode_audio_payload(&input.audio_base64)?;
    let mime = input
        .mime_type
        .as_deref()
        .unwrap_or("audio/webm")
        .to_string();
    let app_dir = app.path().app_data_dir()?;
    let dir = audio_cache::ensure_attempts_dir(&app_dir)?;
    let path = audio_cache::save_recording(&dir, &bytes, &mime)?;
    let audio_path = path
        .to_str()
        .ok_or_else(|| AppError::Io("Audio path is not valid UTF-8".to_string()))?
        .to_string();
    Ok(SaveAudioRecordingResult { audio_path })
}

#[tauri::command]
pub async fn evaluate_pronunciation(
    input: EvaluatePronunciationInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<PronunciationAttemptDto, AppError> {
    let target_text = validate_target_text(&input.target_text)?.to_string();
    let has_audio = input
        .audio_path
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .is_some();
    let has_recognized = input
        .recognized_text
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .is_some();
    if !has_audio && !has_recognized {
        return Err(AppError::Validation(
            "Provide an audio recording or recognized text".to_string(),
        ));
    }
    if let Some(path) = input
        .audio_path
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        if !std::path::Path::new(path).is_file() {
            return Err(AppError::NotFound(format!("Audio file not found: {path}")));
        }
    }

    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let language = normalize_language(input.language.as_deref(), &settings.primary_language);

    let req = EvaluatePronunciationRequest {
        target_text: target_text.clone(),
        target_ipa: input
            .target_ipa
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
            .or_else(|| canonical_ipa(&target_text, &language)),
        language: language.clone(),
        audio_path: input
            .audio_path
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string),
        recognized_text: input
            .recognized_text
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string),
    };

    let result = if settings.offline_mode || settings.ai_provider == "offline" {
        if req.recognized_text.is_none() {
            return Err(AppError::Validation(
                "Pronunciation scoring from audio needs an AI model. Open Settings and add an API key, or type what you said."
                    .to_string(),
            ));
        }
        evaluate_pronunciation_heuristic(&req)
    } else {
        match crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextQuality) {
            Ok(registry) => match registry.evaluate_pronunciation(req.clone()).await {
                Ok(ai) => ai,
                Err(e) => {
                    if req.recognized_text.is_some() {
                        log::warn!("Pronunciation AI failed ({e}); using IPA heuristic");
                        evaluate_pronunciation_heuristic(&req)
                    } else {
                        return Err(e);
                    }
                }
            },
            Err(e) => {
                if req.recognized_text.is_some() {
                    log::warn!("No AI provider ({e}); using IPA heuristic");
                    evaluate_pronunciation_heuristic(&req)
                } else {
                    return Err(e);
                }
            }
        }
    };

    let audio_path = req
        .audio_path
        .clone()
        .unwrap_or_else(|| "offline".to_string());
    persist_evaluation(&pool, &input, &target_text, &audio_path, &language, &result)
}

#[tauri::command]
pub async fn resolve_pronunciation_model(
    text: String,
    language: Option<String>,
    db: State<'_, Arc<DbPool>>,
) -> Result<PronunciationModelDto, AppError> {
    let target = validate_target_text(&text)?.to_string();
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let language = normalize_language(language.as_deref(), &settings.primary_language);
    let spoken_text = spoken_form(&target, &language);
    let ipa =
        canonical_ipa(&target, &language).or_else(|| lookup_lexeme_ipa(&pool, &target, &language));
    Ok(PronunciationModelDto { spoken_text, ipa })
}

fn lookup_lexeme_ipa(pool: &DbPool, text: &str, language: &str) -> Option<String> {
    let conn = pool.get().ok()?;
    let language_id = LexemeRepo::language_id_by_code(&conn, language).ok()?;
    let lexeme = LexemeRepo::find_by_normalized(&conn, language_id, text).ok()??;
    lexeme
        .phonetic
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

#[tauri::command]
pub async fn get_articulation_tip(
    input: ArticulationTipInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<ArticulationTipResult, AppError> {
    let phoneme = input.phoneme.trim();
    if phoneme.is_empty() {
        return Err(AppError::Validation("Phoneme is empty".to_string()));
    }
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Articulation tips"));
    }
    let language = normalize_language(input.language.as_deref(), &settings.primary_language);
    let registry = crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextFast)?;
    registry
        .get_articulation_tip(ArticulationTipRequest {
            phoneme: phoneme.to_string(),
            language,
        })
        .await
}

#[tauri::command]
pub async fn get_pronunciation_history(
    lexeme_id: Option<i64>,
    language: Option<String>,
    limit: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<PronunciationAttemptDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    PronunciationRepo::list_attempts(
        &conn,
        lexeme_id,
        language.as_deref().map(str::trim).filter(|s| !s.is_empty()),
        limit.unwrap_or(20),
    )
}

#[tauri::command]
pub async fn get_problem_phonemes(
    language: Option<String>,
    limit: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<PhonemePatternDto>, AppError> {
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let language = normalize_language(language.as_deref(), &settings.primary_language);
    let conn = pool.get()?;
    PronunciationRepo::get_problem_phonemes(&conn, &language, limit.unwrap_or(10))
}

#[tauri::command]
pub async fn get_minimal_pairs(
    language: Option<String>,
    contrast_type: Option<String>,
    limit: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<MinimalPairDto>, AppError> {
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let language = normalize_language(language.as_deref(), &settings.primary_language);
    let contrast = contrast_type
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(kind) = contrast {
        if kind != "vowel" && kind != "consonant" {
            return Err(AppError::Validation(
                "contrastType must be 'vowel' or 'consonant'".to_string(),
            ));
        }
    }
    let conn = pool.get()?;
    PronunciationRepo::list_minimal_pairs(&conn, &language, contrast, limit.unwrap_or(200))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_target_text_rejects_empty_and_too_long() {
        assert!(validate_target_text("  ").is_err());
        let long = "a".repeat(MAX_TARGET_CHARS + 1);
        assert!(validate_target_text(&long).is_err());
        assert_eq!(validate_target_text(" ship ").unwrap(), "ship");
    }

    #[test]
    fn resolve_model_uses_spoken_form_and_ipa_for_ok() {
        assert_eq!(spoken_form("OK", "en"), "okay");
        assert_eq!(canonical_ipa("OK", "en").as_deref(), Some("/oʊˈkeɪ/"));
    }
}
