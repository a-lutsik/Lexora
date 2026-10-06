// ============================================================
// LEXORA — Study Commands
// ============================================================

use crate::commands::vocabulary::VocabularyEntryDto;
use crate::db::repos::review::{ReviewEventRecord, ReviewRepo};
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{ExplainRequest, ProviderRegistry};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::registry_for_role;
use crate::srs::evaluator::AnswerEvaluator;
use crate::srs::queue::QueueBuilder;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, State};

/// Max time to wait for the AI explanation before falling back to heuristic,
/// so a study session never hangs on a slow/unreachable provider.
const AI_EXPLAIN_TIMEOUT_SECS: u64 = 10;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudyQueueFilters {
    pub language_id: i64,
    pub limit: i64,
    pub include_new: bool,
    pub include_mature_refresh: bool,
    /// When `Some`, restrict results to user-added words and/or collections.
    #[serde(default)]
    pub include_mine: Option<bool>,
    #[serde(default)]
    pub collection_ids: Vec<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvaluateAnswerInput {
    pub review_state_id: i64,
    pub mode: String,
    pub user_answer: String,
    pub target_text: String,
    pub latency_ms: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationResult {
    pub is_correct: bool,
    pub grade: u8,
    pub error_type: Option<String>,
    pub correct_answer: String,
    pub explanation: Option<String>,
    pub short_rule: Option<String>,
}

#[tauri::command]
pub async fn get_study_queue(
    filters: StudyQueueFilters,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<VocabularyEntryDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    QueueBuilder::build_queue(&conn, &filters)
}

#[tauri::command]
pub async fn evaluate_answer(
    input: EvaluateAnswerInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<EvaluationResult, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    // 1. Evaluate answer heuristically (always runs first — deterministic offline path)
    let heuristic = AnswerEvaluator::evaluate_heuristic(&input.target_text, &input.user_answer);

    // 2. If the heuristic says "incorrect" and an AI provider is configured,
    //    ask the AI to re-evaluate and explain the mistake.
    //    Any AI failure falls back silently to the heuristic result.
    let result = if heuristic.grade < 3 {
        // Resolve provider and request synchronously: rusqlite::Connection is
        // !Sync, so no DB references may live across the await below.
        match prepare_ai_explanation(&app, &pool, &conn, &input, &heuristic) {
            Some((registry, req)) => {
                match tokio::time::timeout(
                    std::time::Duration::from_secs(AI_EXPLAIN_TIMEOUT_SECS),
                    registry.explain_error(req),
                )
                .await
                {
                    Ok(Ok(ai_result)) => AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result),
                    Ok(Err(e)) => {
                        log::warn!("AI explain_error failed: {e}. Falling back to heuristic.");
                        heuristic
                    }
                    Err(_) => {
                        log::warn!(
                            "AI explain_error timed out after {AI_EXPLAIN_TIMEOUT_SECS}s. Falling back to heuristic."
                        );
                        heuristic
                    }
                }
            }
            None => heuristic,
        }
    } else {
        heuristic
    };

    // 3. Process review in SRS state and record review_event
    ReviewRepo::process_review(
        &conn,
        input.review_state_id,
        &input.mode,
        result.grade,
        Some(&input.user_answer),
        Some(input.latency_ms),
        result.error_type.as_deref(),
    )?;

    Ok(result)
}

/// Prepare an AI explanation call for an incorrect answer: resolve settings,
/// the TextFast role chain and request. Returns None (→ heuristic fallback)
/// when no model is configured or offline mode is on.
fn prepare_ai_explanation(
    app: &AppHandle,
    pool: &DbPool,
    conn: &rusqlite::Connection,
    input: &EvaluateAnswerInput,
    heuristic: &EvaluationResult,
) -> Option<(ProviderRegistry, ExplainRequest)> {
    let settings = SettingsRepo::get(conn).unwrap_or_default();
    if settings.offline_mode || settings.ai_provider == "offline" {
        return None;
    }
    let registry = registry_for_role(app, pool, &settings, ModelRole::TextFast).ok()?;
    let language = lookup_language(conn, input.review_state_id)
        .unwrap_or_else(|| settings.primary_language.clone());
    let req = ExplainRequest {
        target_text: input.target_text.clone(),
        user_answer: input.user_answer.clone(),
        mode: input.mode.clone(),
        language,
        error_type: heuristic
            .error_type
            .clone()
            .unwrap_or_else(|| "meaning".to_string()),
    };
    Some((registry, req))
}

/// Resolve the language code of the card being reviewed.
fn lookup_language(conn: &rusqlite::Connection, review_state_id: i64) -> Option<String> {
    conn.query_row(
        "SELECT lang.code
         FROM review_state rs
         JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
         JOIN lexeme l ON l.id = uv.lexeme_id
         JOIN language lang ON lang.id = l.language_id
         WHERE rs.id = ?1",
        rusqlite::params![review_state_id],
        |row| row.get(0),
    )
    .ok()
}

#[tauri::command]
pub async fn get_review_history(
    review_state_id: i64,
    limit: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<ReviewEventRecord>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let mut stmt = conn.prepare(
        "SELECT id, review_state_id, mode, grade, user_response, latency_ms, error_type, timestamp
         FROM review_event
         WHERE review_state_id = ?1
         ORDER BY timestamp DESC
         LIMIT ?2",
    )?;

    let events = stmt
        .query_map(rusqlite::params![review_state_id, limit], |row| {
            Ok(ReviewEventRecord {
                id: row.get(0)?,
                review_state_id: row.get(1)?,
                mode: row.get(2)?,
                grade: row.get::<_, u8>(3)?,
                user_response: row.get(4)?,
                latency_ms: row.get(5)?,
                error_type: row.get(6)?,
                timestamp: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(events)
}

#[tauri::command]
pub async fn get_due_count(language_id: i64, db: State<'_, Arc<DbPool>>) -> Result<i64, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    ReviewRepo::count_due(&conn, language_id)
}
