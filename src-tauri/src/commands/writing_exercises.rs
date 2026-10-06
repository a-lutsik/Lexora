// ============================================================
// LEXORA — Writing Exercises Commands
// Stage 2: generate_writing_exercises — practice exercises
// generated from the user's own recurring error patterns.
// ============================================================

use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::writing::WritingRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{ErrorPatternSummary, GenerateExercisesRequest, WritingExerciseRaw};
use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, State};

/// Cap on error patterns sent to the LLM in a single request.
const MAX_PATTERNS_PER_REQUEST: usize = 5;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WritingExerciseDto {
    pub category: String,
    pub exercise_type: String,
    pub prompt: String,
    pub correct_answer: String,
    pub explanation: String,
}

impl From<WritingExerciseRaw> for WritingExerciseDto {
    fn from(raw: WritingExerciseRaw) -> Self {
        Self {
            category: raw.category,
            exercise_type: raw.exercise_type,
            prompt: raw.prompt,
            correct_answer: raw.correct_answer,
            explanation: raw.explanation,
        }
    }
}

pub(crate) fn validate_language(language: &str) -> Result<&str, AppError> {
    let trimmed = language.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Language is empty".to_string()));
    }
    Ok(trimmed)
}

#[tauri::command]
pub async fn generate_writing_exercises(
    language: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<Vec<WritingExerciseDto>, AppError> {
    let language = validate_language(&language)?.to_string();

    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Writing exercises"));
    }

    let patterns = {
        let conn = pool.get()?;
        WritingRepo::get_error_patterns(&conn, &language)?
    };

    // No recorded mistakes yet — nothing to practice. Skip the AI call entirely.
    if patterns.is_empty() {
        return Ok(vec![]);
    }

    let registry = crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextQuality)?;
    let exercises = registry
        .generate_exercises(GenerateExercisesRequest {
            language,
            patterns: patterns
                .iter()
                .take(MAX_PATTERNS_PER_REQUEST)
                .map(|p| ErrorPatternSummary {
                    category: p.category.clone(),
                    occurrence_count: p.occurrence_count,
                    sample_original: p.sample_original.clone(),
                    sample_fix: p.sample_fix.clone(),
                })
                .collect(),
        })
        .await?;

    Ok(exercises
        .into_iter()
        .map(WritingExerciseDto::from)
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_language_rejects_blank() {
        assert!(validate_language("").is_err());
        assert!(validate_language("   \n").is_err());
    }

    #[test]
    fn validate_language_trims() {
        assert_eq!(validate_language("  en  ").unwrap(), "en");
    }

    #[test]
    fn dto_from_raw_maps_all_fields() {
        let raw = WritingExerciseRaw {
            category: "grammar".to_string(),
            exercise_type: "fill_blank".to_string(),
            prompt: "He ___ to school.".to_string(),
            correct_answer: "goes".to_string(),
            explanation: "Third person singular.".to_string(),
        };
        let dto = WritingExerciseDto::from(raw);
        assert_eq!(dto.category, "grammar");
        assert_eq!(dto.exercise_type, "fill_blank");
        assert_eq!(dto.prompt, "He ___ to school.");
        assert_eq!(dto.correct_answer, "goes");
        assert_eq!(dto.explanation, "Third person singular.");
    }
}
