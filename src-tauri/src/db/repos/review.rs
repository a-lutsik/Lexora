// ============================================================
// LEXORA — Review State & History Repository (SRS)
// ============================================================

use crate::error::AppError;
use crate::srs::algorithm::{calculate_next_review, Grade, ReviewState};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReviewEventRecord {
    pub id: i64,
    pub review_state_id: i64,
    pub mode: String,
    pub grade: u8,
    pub user_response: Option<String>,
    pub latency_ms: Option<i64>,
    pub error_type: Option<String>,
    pub timestamp: i64,
}

pub struct ReviewRepo;

impl ReviewRepo {
    /// Record a review event and calculate next review date via deterministic SM-2.
    pub fn process_review(
        conn: &Connection,
        review_state_id: i64,
        mode: &str,
        grade: Grade,
        user_response: Option<&str>,
        latency_ms: Option<i64>,
        error_type: Option<&str>,
    ) -> Result<i64, AppError> {
        // 1. Fetch current review state
        let (ease, interval, repetitions, lapses): (f64, i64, i64, i64) = conn
            .query_row(
                "SELECT ease, interval, repetitions, lapses FROM review_state WHERE id = ?1",
                params![review_state_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .optional()?
            .ok_or_else(|| {
                AppError::NotFound(format!("ReviewState {review_state_id} not found"))
            })?;

        let current_state = ReviewState {
            ease,
            interval,
            repetitions,
            lapses,
        };

        // 2. Calculate next review deterministically
        let (next_state, days_until_next) = calculate_next_review(&current_state, grade);

        // Status classification:
        // 0-1 => learning
        // > 21 days interval => mature
        // other => review
        let new_status = if next_state.interval >= 21 {
            "mature"
        } else if next_state.repetitions <= 1 || grade < 2 {
            "learning"
        } else {
            "review"
        };

        let now_sec = chrono::Utc::now().timestamp();
        let next_due_at = now_sec + (days_until_next * 86400);

        // 3–4. State update and history event are one unit of work: a failed
        // event insert must not leave the schedule moved without a log entry.
        let tx = conn.unchecked_transaction()?;

        // 3. Update review_state in database
        tx.execute(
            "UPDATE review_state SET
                status = ?1,
                ease = ?2,
                interval = ?3,
                due_at = ?4,
                lapses = ?5,
                repetitions = ?6,
                updated_at = ?7
             WHERE id = ?8",
            params![
                new_status,
                next_state.ease,
                next_state.interval,
                next_due_at,
                next_state.lapses,
                next_state.repetitions,
                now_sec,
                review_state_id
            ],
        )?;

        // 4. Record history event
        tx.execute(
            "INSERT INTO review_event (review_state_id, mode, grade, user_response, latency_ms, error_type, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                review_state_id,
                mode,
                grade,
                user_response,
                latency_ms,
                error_type,
                now_sec
            ],
        )?;

        tx.commit()?;
        Ok(next_due_at)
    }

    /// Count cards due for review.
    pub fn count_due(conn: &Connection, language_id: i64) -> Result<i64, AppError> {
        let now_sec = chrono::Utc::now().timestamp();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*)
             FROM review_state rs
             JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE rs.due_at <= ?1
               AND rs.status != 'suspended'
               AND uv.deleted_at IS NULL
               AND l.language_id = ?2",
            params![now_sec, language_id],
            |row| row.get(0),
        )?;

        Ok(count)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vocabulary::AddVocabularyInput;
    use crate::db::repos::vocabulary::VocabularyRepo;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    /// Add a word to vocabulary, return (user_vocabulary_id, review_state_id).
    fn add_word(conn: &Connection, text: &str) -> (i64, i64) {
        let input = AddVocabularyInput {
            lexeme_id: None,
            text: text.to_string(),
            source_language: "en".to_string(),
            notes: None,
            source: Some("manual".to_string()),
            category_id: None,
        };
        let uv_id = VocabularyRepo::add(conn, &input).expect("add word");
        let rs_id: i64 = conn
            .query_row(
                "SELECT id FROM review_state WHERE user_vocabulary_id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("review_state id");
        (uv_id, rs_id)
    }

    /// (status, ease, interval, due_at, lapses, repetitions)
    fn state_of(conn: &Connection, rs_id: i64) -> (String, f64, i64, i64, i64, i64) {
        conn.query_row(
            "SELECT status, ease, interval, due_at, lapses, repetitions
             FROM review_state WHERE id = ?1",
            params![rs_id],
            |r| {
                Ok((
                    r.get(0)?,
                    r.get(1)?,
                    r.get(2)?,
                    r.get(3)?,
                    r.get(4)?,
                    r.get(5)?,
                ))
            },
        )
        .expect("review_state")
    }

    #[test]
    fn process_review_good_grade_updates_state_and_logs_event() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_good");
        let before = chrono::Utc::now().timestamp();

        let due_at = ReviewRepo::process_review(
            &conn,
            rs_id,
            "flashcard",
            3,
            Some("zzt_rev_good"),
            Some(1500),
            None,
        )
        .expect("process_review");

        // Fresh word (reps=0) + grade 3 → SM-2: interval 1 day, repetitions 1
        let (status, ease, interval, db_due_at, lapses, repetitions) = state_of(&conn, rs_id);
        assert_eq!(interval, 1);
        assert_eq!(repetitions, 1);
        assert_eq!(lapses, 0);
        assert!(
            (ease - 2.5).abs() < f64::EPSILON,
            "ease unchanged on grade 3"
        );
        assert_eq!(status, "learning", "first repetition is still learning");
        assert_eq!(due_at, db_due_at);
        assert!(
            due_at >= before + 86_400 && due_at <= before + 86_400 + 10,
            "due_at ≈ now + 1 day, got {due_at}"
        );

        // Review event recorded
        let (mode, grade, response, latency): (String, i64, Option<String>, Option<i64>) = conn
            .query_row(
                "SELECT mode, grade, user_response, latency_ms
                 FROM review_event WHERE review_state_id = ?1",
                params![rs_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .expect("review_event");
        assert_eq!(mode, "flashcard");
        assert_eq!(grade, 3);
        assert_eq!(response.as_deref(), Some("zzt_rev_good"));
        assert_eq!(latency, Some(1500));
    }

    #[test]
    fn process_review_blackout_resets_progress() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_blackout");

        // Simulate a mature-ish word
        conn.execute(
            "UPDATE review_state SET interval = 30, repetitions = 5, lapses = 1 WHERE id = ?1",
            params![rs_id],
        )
        .expect("seed state");

        ReviewRepo::process_review(&conn, rs_id, "typing", 0, None, None, Some("meaning"))
            .expect("process_review");

        let (status, ease, interval, _, lapses, repetitions) = state_of(&conn, rs_id);
        assert_eq!(interval, 1, "blackout resets interval to 1 day");
        assert_eq!(repetitions, 0, "blackout resets repetitions");
        assert_eq!(lapses, 2, "blackout increments lapses");
        assert!((ease - 2.3).abs() < 1e-9, "ease 2.5 - 0.2");
        assert_eq!(status, "learning");
    }

    #[test]
    fn process_review_long_interval_becomes_mature() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_mature");
        let before = chrono::Utc::now().timestamp();

        // interval 25, reps 5, grade 3 → round(25 * 2.5) = 63 days ≥ 21 → mature
        conn.execute(
            "UPDATE review_state SET interval = 25, repetitions = 5 WHERE id = ?1",
            params![rs_id],
        )
        .expect("seed state");

        let due_at = ReviewRepo::process_review(&conn, rs_id, "cloze", 3, None, None, None)
            .expect("process_review");

        let (status, _, interval, _, _, repetitions) = state_of(&conn, rs_id);
        assert_eq!(interval, 63);
        assert_eq!(repetitions, 6);
        assert_eq!(status, "mature");
        assert!(
            due_at >= before + 63 * 86_400 && due_at <= before + 63 * 86_400 + 10,
            "due_at ≈ now + 63 days"
        );
    }

    #[test]
    fn process_review_is_atomic_when_event_insert_fails() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_atomic");
        let before = state_of(&conn, rs_id);

        // Make the history insert fail *after* review_state was already updated.
        conn.execute_batch(
            "CREATE TRIGGER zzt_fail_event BEFORE INSERT ON review_event
             BEGIN SELECT RAISE(ABORT, 'simulated review_event failure'); END;",
        )
        .expect("create failing trigger");

        let res = ReviewRepo::process_review(&conn, rs_id, "flashcard", 3, None, None, None);
        assert!(res.is_err(), "event insert failure must surface as Err");

        // No silent partial write (AGENTS §0.3): the SRS state is untouched.
        assert_eq!(state_of(&conn, rs_id), before);
    }

    #[test]
    fn process_review_unknown_state_returns_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        match ReviewRepo::process_review(&conn, 999_999, "flashcard", 3, None, None, None) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn process_review_mid_interval_becomes_review_status() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_review");

        // interval 6, reps 2, grade 3 → round(6 * 2.5) = 15 days:
        // < 21 and reps 3 > 1 and grade ≥ 2 → 'review' status
        conn.execute(
            "UPDATE review_state SET interval = 6, repetitions = 2 WHERE id = ?1",
            params![rs_id],
        )
        .expect("seed state");

        ReviewRepo::process_review(&conn, rs_id, "flashcard", 3, None, None, None)
            .expect("process_review");

        let (status, _, interval, _, _, repetitions) = state_of(&conn, rs_id);
        assert_eq!(interval, 15);
        assert_eq!(repetitions, 3);
        assert_eq!(status, "review");
    }

    #[test]
    fn process_review_wrong_grade_returns_to_learning_and_logs_error_type() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let (_, rs_id) = add_word(&conn, "zzt_rev_wrong");

        // interval 6, reps 2, grade 1 (wrong) → reset to learning
        conn.execute(
            "UPDATE review_state SET interval = 6, repetitions = 2 WHERE id = ?1",
            params![rs_id],
        )
        .expect("seed state");

        ReviewRepo::process_review(&conn, rs_id, "typing", 1, None, None, Some("spelling"))
            .expect("process_review");

        let (status, ease, interval, _, lapses, repetitions) = state_of(&conn, rs_id);
        assert_eq!(interval, 1, "wrong grade resets interval");
        assert_eq!(repetitions, 0);
        assert_eq!(lapses, 1);
        assert!((ease - 2.35).abs() < 1e-9, "ease 2.5 - 0.15");
        assert_eq!(status, "learning");

        // error_type persisted on the review event
        let error_type: Option<String> = conn
            .query_row(
                "SELECT error_type FROM review_event WHERE review_state_id = ?1",
                params![rs_id],
                |r| r.get(0),
            )
            .expect("review_event");
        assert_eq!(error_type.as_deref(), Some("spelling"));
    }

    #[test]
    fn count_due_counts_only_due_active_cards() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        // New words get due_at = now → immediately due
        let (_, rs_due) = add_word(&conn, "zzt_due_now");
        let (_, rs_future) = add_word(&conn, "zzt_due_future");
        let (_, rs_suspended) = add_word(&conn, "zzt_due_suspended");

        conn.execute(
            "UPDATE review_state SET due_at = ?1 WHERE id = ?2",
            params![now + 86_400, rs_future],
        )
        .expect("future due");
        conn.execute(
            "UPDATE review_state SET status = 'suspended' WHERE id = ?1",
            params![rs_suspended],
        )
        .expect("suspend");

        assert_eq!(ReviewRepo::count_due(&conn, 1).expect("count"), 1);

        // Other language → nothing due
        assert_eq!(ReviewRepo::count_due(&conn, 2).expect("count"), 0);

        // Soft-deleted vocabulary entry is excluded
        let uv_due: i64 = conn
            .query_row(
                "SELECT user_vocabulary_id FROM review_state WHERE id = ?1",
                params![rs_due],
                |r| r.get(0),
            )
            .expect("uv id");
        conn.execute(
            "UPDATE user_vocabulary SET deleted_at = unixepoch() WHERE id = ?1",
            params![uv_due],
        )
        .expect("soft delete");
        assert_eq!(ReviewRepo::count_due(&conn, 1).expect("count"), 0);
    }
}
