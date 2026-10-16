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
    #[serde(default)]
    pub category_ids: Vec<i64>,
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

/// Highest valid grade: 0 = blackout … 4 = easy (see `srs::algorithm`).
const MAX_GRADE: u8 = 4;
/// Review-mode identifiers are short ASCII slugs (`flashcard`, `typing`, …).
const MAX_MODE_LEN: usize = 32;

/// Self-assessed review: the user rated recall themselves (e.g. Flashcards),
/// so there is no answer text to grade and no AI involvement.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitReviewInput {
    pub review_state_id: i64,
    pub mode: String,
    pub grade: u8,
    pub latency_ms: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SubmitReviewResult {
    /// Unix seconds of the next scheduled review.
    pub due_at: i64,
}

fn validate_submit_review(input: &SubmitReviewInput) -> Result<(), AppError> {
    if input.review_state_id <= 0 {
        return Err(AppError::Validation(
            "review_state_id must be a positive id".to_string(),
        ));
    }
    if input.grade > MAX_GRADE {
        return Err(AppError::Validation(format!(
            "grade must be in 0..={MAX_GRADE}, got {}",
            input.grade
        )));
    }
    if input.latency_ms < 0 {
        return Err(AppError::Validation(
            "latency_ms must not be negative".to_string(),
        ));
    }
    let mode = input.mode.trim();
    let mode_ok = !mode.is_empty()
        && mode.len() <= MAX_MODE_LEN
        && mode.chars().all(|c| c.is_ascii_alphanumeric() || c == '_');
    if !mode_ok {
        return Err(AppError::Validation(
            "mode must be a short [a-z0-9_] identifier".to_string(),
        ));
    }
    Ok(())
}

/// Business logic for [`submit_review`]: validate, then apply the grade through
/// the deterministic SM-2 path (one transaction inside `process_review`).
pub fn submit_review_inner(
    conn: &rusqlite::Connection,
    input: &SubmitReviewInput,
) -> Result<SubmitReviewResult, AppError> {
    validate_submit_review(input)?;
    let due_at = ReviewRepo::process_review(
        conn,
        input.review_state_id,
        input.mode.trim(),
        input.grade,
        None,
        Some(input.latency_ms),
        None,
    )?;
    Ok(SubmitReviewResult { due_at })
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

/// Record a self-assessed review (Flashcards). Deterministic: no AI call.
#[tauri::command]
pub async fn submit_review(
    input: SubmitReviewInput,
    db: State<'_, Arc<DbPool>>,
) -> Result<SubmitReviewResult, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    submit_review_inner(&conn, &input)
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vocabulary::AddVocabularyInput;
    use crate::db::repos::vocabulary::VocabularyRepo;
    use crate::db::{create_pool_test_memory, run_migrations};
    use rusqlite::{params, Connection};

    fn input(review_state_id: i64, mode: &str, grade: u8, latency_ms: i64) -> SubmitReviewInput {
        SubmitReviewInput {
            review_state_id,
            mode: mode.to_string(),
            grade,
            latency_ms,
        }
    }

    /// Add a word, return its review_state id.
    fn add_word(conn: &Connection, text: &str) -> i64 {
        let uv_id = VocabularyRepo::add(
            conn,
            &AddVocabularyInput {
                lexeme_id: None,
                category_id: None,
                text: text.to_string(),
                source_language: "en".to_string(),
                notes: None,
                source: Some("manual".to_string()),
            },
        )
        .expect("add word");
        conn.query_row(
            "SELECT id FROM review_state WHERE user_vocabulary_id = ?1",
            params![uv_id],
            |r| r.get(0),
        )
        .expect("review_state id")
    }

    #[test]
    fn validate_accepts_every_grade_in_range() {
        for grade in 0..=MAX_GRADE {
            assert!(validate_submit_review(&input(1, "flashcard", grade, 0)).is_ok());
        }
    }

    #[test]
    fn validate_rejects_bad_input() {
        let cases = [
            input(1, "flashcard", MAX_GRADE + 1, 10),
            input(0, "flashcard", 3, 10),
            input(-5, "flashcard", 3, 10),
            input(1, "flashcard", 3, -1),
            input(1, "", 3, 10),
            input(1, "   ", 3, 10),
            input(1, "fl ash;DROP", 3, 10),
            input(1, &"x".repeat(MAX_MODE_LEN + 1), 3, 10),
        ];
        for case in &cases {
            assert!(
                matches!(validate_submit_review(case), Err(AppError::Validation(_))),
                "expected Validation error for {case:?}"
            );
        }
    }

    #[test]
    fn submit_review_updates_schedule_and_logs_event_without_answer_text() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        let conn = pool.get().expect("conn");
        let rs_id = add_word(&conn, "zzt_submit_good");

        let res = submit_review_inner(&conn, &input(rs_id, "flashcard", 3, 1200)).expect("submit");

        // Fresh word + grade 3 → SM-2: interval 1 day, repetitions 1.
        let (interval, repetitions, due_at): (i64, i64, i64) = conn
            .query_row(
                "SELECT interval, repetitions, due_at FROM review_state WHERE id = ?1",
                params![rs_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .expect("state");
        assert_eq!((interval, repetitions), (1, 1));
        assert_eq!(res.due_at, due_at, "result mirrors the stored schedule");

        let (mode, grade, response, latency): (String, i64, Option<String>, Option<i64>) = conn
            .query_row(
                "SELECT mode, grade, user_response, latency_ms
                 FROM review_event WHERE review_state_id = ?1",
                params![rs_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .expect("event");
        assert_eq!(mode, "flashcard");
        assert_eq!(grade, 3);
        assert_eq!(response, None, "self-graded review has no answer text");
        assert_eq!(latency, Some(1200));
    }

    #[test]
    fn submit_review_is_deterministic_for_equal_inputs() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        let conn = pool.get().expect("conn");
        let a = add_word(&conn, "zzt_submit_det_a");
        let b = add_word(&conn, "zzt_submit_det_b");

        for grade in [3u8, 4, 2] {
            submit_review_inner(&conn, &input(a, "flashcard", grade, 100)).expect("a");
            submit_review_inner(&conn, &input(b, "flashcard", grade, 900)).expect("b");
        }

        let read = |id: i64| -> (f64, i64, i64, i64) {
            conn.query_row(
                "SELECT ease, interval, repetitions, lapses FROM review_state WHERE id = ?1",
                params![id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .expect("state")
        };
        assert_eq!(read(a), read(b), "latency must not influence the schedule");
    }

    #[test]
    fn submit_review_unknown_state_is_not_found() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        let conn = pool.get().expect("conn");

        match submit_review_inner(&conn, &input(999_999, "flashcard", 3, 10)) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn invalid_grade_writes_nothing() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        let conn = pool.get().expect("conn");
        let rs_id = add_word(&conn, "zzt_submit_invalid");

        assert!(submit_review_inner(&conn, &input(rs_id, "flashcard", 9, 10)).is_err());

        let events: i64 = conn
            .query_row("SELECT COUNT(*) FROM review_event", [], |r| r.get(0))
            .expect("count");
        assert_eq!(events, 0);
    }
}
