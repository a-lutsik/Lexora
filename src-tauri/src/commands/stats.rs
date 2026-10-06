// ============================================================
// LEXORA — Statistics Commands
// ============================================================

use crate::db::DbPool;
use crate::error::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatsSummary {
    pub total_words: i64,
    pub due_today: i64,
    pub streak: i64,
    pub accuracy_percent: f64,
    pub words_added_this_week: i64,
    pub mature_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date: String,
    pub reviewed: i64,
    pub added: i64,
    pub accuracy: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ErrorBreakdownDto {
    pub error_type: String,
    pub count: i64,
    pub accuracy_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HardestWordDto {
    pub entry_id: i64,
    pub text: String,
    pub translation: Option<String>,
    pub lapses: i64,
    pub total_reviews: i64,
    pub accuracy_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WordsAddedDto {
    pub today: i64,
    pub this_week: i64,
    pub this_month: i64,
    pub total: i64,
}

#[tauri::command]
pub async fn get_stats_summary(
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<StatsSummary, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    let now_sec = chrono::Utc::now().timestamp();
    let week_ago = now_sec - (7 * 86400);

    let total_words: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE uv.deleted_at IS NULL AND l.language_id = ?1",
            params![language_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let due_today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM review_state rs
             JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE rs.due_at <= ?1 AND uv.deleted_at IS NULL AND l.language_id = ?2",
            params![now_sec, language_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let mature_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM review_state rs
             JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE rs.status = 'mature' AND uv.deleted_at IS NULL AND l.language_id = ?1",
            params![language_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let words_added_this_week: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE uv.added_at >= ?1 AND uv.deleted_at IS NULL AND l.language_id = ?2",
            params![week_ago, language_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Calculate accuracy from review_events
    let (total_reviews, correct_reviews): (i64, i64) = conn
        .query_row(
            "SELECT COUNT(*), COUNT(CASE WHEN grade >= 3 THEN 1 END)
             FROM review_event re
             JOIN review_state rs ON rs.id = re.review_state_id
             JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE l.language_id = ?1",
            params![language_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0, 0));

    let accuracy_percent = if total_reviews > 0 {
        (correct_reviews as f64 / total_reviews as f64) * 100.0
    } else {
        0.0
    };

    Ok(StatsSummary {
        total_words,
        due_today,
        streak: 1,
        accuracy_percent: (accuracy_percent * 10.0).round() / 10.0,
        words_added_this_week,
        mature_count,
    })
}

#[tauri::command]
pub async fn get_daily_activity(
    _days: i64,
    _db: State<'_, Arc<DbPool>>,
) -> Result<Vec<DailyActivity>, AppError> {
    Ok(vec![])
}

// ── Extended statistics (read-only) ───────────────────────

/// Accuracy rounded to 1 decimal place (share of grade >= 3 events).
fn accuracy_percent(correct: i64, total: i64) -> f64 {
    if total > 0 {
        (correct as f64 * 1000.0 / total as f64).round() / 10.0
    } else {
        0.0
    }
}

pub fn error_breakdown(
    conn: &rusqlite::Connection,
    language_id: i64,
) -> Result<Vec<ErrorBreakdownDto>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT re.error_type,
                COUNT(*) AS cnt,
                COUNT(CASE WHEN re.grade >= 3 THEN 1 END) AS correct
         FROM review_event re
         JOIN review_state rs ON rs.id = re.review_state_id
         JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
         JOIN lexeme l ON l.id = uv.lexeme_id
         WHERE re.error_type IS NOT NULL AND l.language_id = ?1
         GROUP BY re.error_type
         ORDER BY cnt DESC, re.error_type ASC",
    )?;

    let rows = stmt
        .query_map(params![language_id], |row| {
            let count: i64 = row.get(1)?;
            let correct: i64 = row.get(2)?;
            Ok(ErrorBreakdownDto {
                error_type: row.get(0)?,
                count,
                accuracy_percent: accuracy_percent(correct, count),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_error_breakdown(
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<ErrorBreakdownDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    error_breakdown(&conn, language_id)
}

pub fn hardest_words(
    conn: &rusqlite::Connection,
    language_id: i64,
    limit: i64,
) -> Result<Vec<HardestWordDto>, AppError> {
    let limit = limit.clamp(1, 50);

    let mut stmt = conn.prepare(
        "SELECT uv.id, l.text,
                (SELECT t.translated_text FROM translation t
                  WHERE t.lexeme_id = l.id
                  ORDER BY t.confidence DESC, t.id ASC LIMIT 1) AS translation,
                rs.lapses,
                COUNT(re.id) AS total_reviews,
                COUNT(CASE WHEN re.grade >= 3 THEN 1 END) AS correct_reviews
         FROM review_state rs
         JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
         JOIN lexeme l ON l.id = uv.lexeme_id
         LEFT JOIN review_event re ON re.review_state_id = rs.id
         WHERE uv.deleted_at IS NULL AND l.language_id = ?1 AND rs.lapses > 0
         GROUP BY uv.id
         ORDER BY rs.lapses DESC,
                  CASE WHEN total_reviews > 0
                       THEN CAST(correct_reviews AS REAL) / total_reviews
                       ELSE 0.0
                  END ASC,
                  uv.id ASC
         LIMIT ?2",
    )?;

    let rows = stmt
        .query_map(params![language_id, limit], |row| {
            let total_reviews: i64 = row.get(4)?;
            let correct_reviews: i64 = row.get(5)?;
            Ok(HardestWordDto {
                entry_id: row.get(0)?,
                text: row.get(1)?,
                translation: row.get(2)?,
                lapses: row.get(3)?,
                total_reviews,
                accuracy_percent: accuracy_percent(correct_reviews, total_reviews),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_hardest_words(
    language_id: i64,
    limit: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<HardestWordDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    hardest_words(&conn, language_id, limit)
}

pub fn words_added_stats(
    conn: &rusqlite::Connection,
    language_id: i64,
) -> Result<WordsAddedDto, AppError> {
    // Rolling windows (deterministic via unixepoch): today = last 24h,
    // week = last 7 days, month = last 30 days.
    let now_sec = chrono::Utc::now().timestamp();
    let day_ago = now_sec - 86400;
    let week_ago = now_sec - (7 * 86400);
    let month_ago = now_sec - (30 * 86400);

    let (today, this_week, this_month, total): (i64, i64, i64, i64) = conn.query_row(
        "SELECT COUNT(CASE WHEN uv.added_at >= ?1 THEN 1 END),
                COUNT(CASE WHEN uv.added_at >= ?2 THEN 1 END),
                COUNT(CASE WHEN uv.added_at >= ?3 THEN 1 END),
                COUNT(*)
         FROM user_vocabulary uv
         JOIN lexeme l ON l.id = uv.lexeme_id
         WHERE uv.deleted_at IS NULL AND l.language_id = ?4",
        params![day_ago, week_ago, month_ago, language_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    )?;

    Ok(WordsAddedDto {
        today,
        this_week,
        this_month,
        total,
    })
}

#[tauri::command]
pub async fn get_words_added_stats(
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<WordsAddedDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    words_added_stats(&conn, language_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::repos::lexeme::LexemeRepo;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};
    use rusqlite::Connection;

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    /// Insert lexeme + user_vocabulary (added `days_ago` back) + review_state.
    /// Returns the user_vocabulary entry id.
    fn fixture_word(conn: &Connection, text: &str, lapses: i64, days_ago: i64) -> i64 {
        let lexeme_id =
            LexemeRepo::find_or_create(conn, 1, text, None, None, None).expect("lexeme");
        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, added_at)
             VALUES (1, ?1, unixepoch() - ?2)",
            params![lexeme_id, days_ago * 86400],
        )
        .expect("user_vocabulary");
        let uv_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO review_state (user_vocabulary_id, status, lapses)
             VALUES (?1, 'review', ?2)",
            params![uv_id, lapses],
        )
        .expect("review_state");
        uv_id
    }

    fn fixture_event(conn: &Connection, uv_id: i64, grade: i64, error_type: Option<&str>) {
        let rs_id: i64 = conn
            .query_row(
                "SELECT id FROM review_state WHERE user_vocabulary_id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("review_state id");
        conn.execute(
            "INSERT INTO review_event (review_state_id, mode, grade, error_type)
             VALUES (?1, 'flashcard', ?2, ?3)",
            params![rs_id, grade, error_type],
        )
        .expect("review_event");
    }

    // ── error_breakdown ─────────────────────────────────────

    #[test]
    fn error_breakdown_empty_when_no_events() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let rows = error_breakdown(&conn, 1).expect("breakdown");
        assert!(rows.is_empty());
    }

    #[test]
    fn error_breakdown_groups_counts_and_accuracy() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let word_a = fixture_word(&conn, "zzt_err_a", 2, 0);
        fixture_event(&conn, word_a, 4, Some("spelling"));
        fixture_event(&conn, word_a, 2, Some("spelling"));
        fixture_event(&conn, word_a, 3, Some("spelling"));

        let word_b = fixture_word(&conn, "zzt_err_b", 1, 0);
        fixture_event(&conn, word_b, 1, Some("grammar"));
        fixture_event(&conn, word_b, 0, Some("grammar"));

        // NULL error_type must be excluded
        fixture_event(&conn, word_b, 4, None);

        let rows = error_breakdown(&conn, 1).expect("breakdown");
        assert_eq!(rows.len(), 2);

        // Ordered by count DESC
        assert_eq!(rows[0].error_type, "spelling");
        assert_eq!(rows[0].count, 3);
        assert!((rows[0].accuracy_percent - 66.7).abs() < 0.05);

        assert_eq!(rows[1].error_type, "grammar");
        assert_eq!(rows[1].count, 2);
        assert!((rows[1].accuracy_percent - 0.0).abs() < f64::EPSILON);
    }

    // ── hardest_words ───────────────────────────────────────

    #[test]
    fn hardest_words_orders_by_lapses_then_accuracy() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Same lapses: lower accuracy first
        let w1 = fixture_word(&conn, "zzt_hard_lowacc", 5, 0);
        for grade in [3, 1, 1, 1, 1] {
            fixture_event(&conn, w1, grade, Some("spelling"));
        }
        let w2 = fixture_word(&conn, "zzt_hard_highacc", 5, 0);
        for grade in [3, 3, 3, 1, 1] {
            fixture_event(&conn, w2, grade, Some("spelling"));
        }
        let w3 = fixture_word(&conn, "zzt_hard_fewer", 2, 0);
        fixture_event(&conn, w3, 0, Some("grammar"));
        fixture_event(&conn, w3, 1, Some("grammar"));

        LexemeRepo::upsert_translation(
            &conn,
            w1_lexeme(&conn, w1),
            2,
            "перевод",
            None,
            Some("test"),
            Some(0.9),
            "general",
        )
        .expect("translation");

        let rows = hardest_words(&conn, 1, 10).expect("hardest");
        assert_eq!(rows.len(), 3);

        assert_eq!(rows[0].entry_id, w1);
        assert_eq!(rows[0].text, "zzt_hard_lowacc");
        assert_eq!(rows[0].lapses, 5);
        assert_eq!(rows[0].total_reviews, 5);
        assert!((rows[0].accuracy_percent - 20.0).abs() < 0.05);
        assert_eq!(rows[0].translation.as_deref(), Some("перевод"));

        assert_eq!(rows[1].entry_id, w2);
        assert!((rows[1].accuracy_percent - 60.0).abs() < 0.05);
        assert_eq!(rows[1].translation, None);

        assert_eq!(rows[2].entry_id, w3);
        assert_eq!(rows[2].lapses, 2);

        // Limit is applied
        let limited = hardest_words(&conn, 1, 2).expect("limited");
        assert_eq!(limited.len(), 2);
        assert_eq!(limited[0].entry_id, w1);
        assert_eq!(limited[1].entry_id, w2);

        // Limit is clamped to [1, 50]
        let clamped_low = hardest_words(&conn, 1, 0).expect("clamped low");
        assert_eq!(clamped_low.len(), 1);
        let clamped_high = hardest_words(&conn, 1, 500).expect("clamped high");
        assert_eq!(clamped_high.len(), 3);
    }

    fn w1_lexeme(conn: &Connection, uv_id: i64) -> i64 {
        conn.query_row(
            "SELECT lexeme_id FROM user_vocabulary WHERE id = ?1",
            params![uv_id],
            |r| r.get(0),
        )
        .expect("lexeme_id")
    }

    #[test]
    fn hardest_words_excludes_soft_deleted_and_zero_lapses() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let active = fixture_word(&conn, "zzt_active", 3, 0);
        fixture_event(&conn, active, 1, Some("spelling"));

        let deleted = fixture_word(&conn, "zzt_deleted", 9, 0);
        conn.execute(
            "UPDATE user_vocabulary SET deleted_at = unixepoch() WHERE id = ?1",
            params![deleted],
        )
        .expect("soft delete");

        // Zero lapses → not a "hard" word
        let _easy = fixture_word(&conn, "zzt_easy", 0, 0);

        let rows = hardest_words(&conn, 1, 10).expect("hardest");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].entry_id, active);
    }

    // ── words_added_stats ───────────────────────────────────

    #[test]
    fn words_added_stats_aggregates_rolling_windows() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        fixture_word(&conn, "zzt_added_now", 0, 0);
        fixture_word(&conn, "zzt_added_3d", 0, 3);
        fixture_word(&conn, "zzt_added_10d", 0, 10);
        fixture_word(&conn, "zzt_added_40d", 0, 40);

        // Soft-deleted entry must not be counted
        let gone = fixture_word(&conn, "zzt_added_gone", 0, 0);
        conn.execute(
            "UPDATE user_vocabulary SET deleted_at = unixepoch() WHERE id = ?1",
            params![gone],
        )
        .expect("soft delete");

        let stats = words_added_stats(&conn, 1).expect("stats");
        assert_eq!(stats.today, 1);
        assert_eq!(stats.this_week, 2);
        assert_eq!(stats.this_month, 3);
        assert_eq!(stats.total, 4);
    }

    #[test]
    fn stats_queries_respect_language_filter() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Word in another language (ru = 2) must not leak into en stats
        let ru_lexeme =
            LexemeRepo::find_or_create(&conn, 2, "zzt_слово", None, None, None).expect("ru lexeme");
        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id) VALUES (1, ?1)",
            params![ru_lexeme],
        )
        .expect("ru uv");
        let ru_uv = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO review_state (user_vocabulary_id, status, lapses) VALUES (?1, 'review', 7)",
            params![ru_uv],
        )
        .expect("ru rs");
        fixture_event(&conn, ru_uv, 1, Some("spelling"));

        assert!(error_breakdown(&conn, 1).expect("breakdown").is_empty());
        assert!(hardest_words(&conn, 1, 10).expect("hardest").is_empty());
        let stats = words_added_stats(&conn, 1).expect("added");
        assert_eq!(stats.total, 0);
    }
}
