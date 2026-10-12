// ============================================================
// LEXORA — Statistics Commands
// ============================================================

use crate::db::DbPool;
use crate::error::AppError;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

const SECONDS_PER_DAY: i64 = 86_400;
/// Longest window `get_daily_activity` serves (one leap year).
const MAX_ACTIVITY_DAYS: i64 = 366;

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
        streak: review_streak(&conn, language_id, now_sec, local_utc_offset_secs())?,
        accuracy_percent: (accuracy_percent * 10.0).round() / 10.0,
        words_added_this_week,
        mature_count,
    })
}

/// Seconds east of UTC for the user's current local timezone. Days in the
/// statistics follow the user's wall clock, not UTC midnight.
fn local_utc_offset_secs() -> i64 {
    use chrono::Offset;
    i64::from(chrono::Local::now().offset().fix().local_minus_utc())
}

/// Calendar-day index (days since 1970-01-01) of `ts` in a timezone
/// `tz_offset_secs` east of UTC.
fn day_index(ts: i64, tz_offset_secs: i64) -> i64 {
    (ts + tz_offset_secs).div_euclid(SECONDS_PER_DAY)
}

/// `YYYY-MM-DD` for a day index produced by [`day_index`].
fn format_day(day: i64) -> String {
    chrono::DateTime::from_timestamp(day * SECONDS_PER_DAY, 0)
        .map(|dt| dt.format("%Y-%m-%d").to_string())
        .unwrap_or_default()
}

/// Consecutive days with at least one review, counted back from `today`.
///
/// `active_days_desc` — distinct day indexes, newest first. A streak is still
/// alive when the last review was yesterday (today is not over yet), so it only
/// resets after a full day without reviews. Days in the future are ignored.
/// Pure function: same input, same output.
pub fn compute_streak(active_days_desc: &[i64], today: i64) -> i64 {
    let mut days = active_days_desc.iter().copied().filter(|d| *d <= today);
    let Some(latest) = days.next() else {
        return 0;
    };
    if latest < today - 1 {
        return 0;
    }

    let mut streak = 1;
    let mut expected = latest - 1;
    for day in days {
        if day == expected {
            streak += 1;
            expected -= 1;
        } else if day < expected {
            break;
        }
    }
    streak
}

pub fn review_streak(
    conn: &rusqlite::Connection,
    language_id: i64,
    now_sec: i64,
    tz_offset_secs: i64,
) -> Result<i64, AppError> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT (re.timestamp + ?2) / ?3 AS day
         FROM review_event re
         JOIN review_state rs ON rs.id = re.review_state_id
         JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
         JOIN lexeme l ON l.id = uv.lexeme_id
         WHERE l.language_id = ?1
         ORDER BY day DESC",
    )?;
    let days = stmt
        .query_map(params![language_id, tz_offset_secs, SECONDS_PER_DAY], |row| {
            row.get::<_, i64>(0)
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(compute_streak(&days, day_index(now_sec, tz_offset_secs)))
}

/// One entry per calendar day for the last `days` days (oldest first, today
/// last) — days without activity are included as zeros so charts stay dense.
pub fn daily_activity(
    conn: &rusqlite::Connection,
    language_id: i64,
    days: i64,
    now_sec: i64,
    tz_offset_secs: i64,
) -> Result<Vec<DailyActivity>, AppError> {
    if !(1..=MAX_ACTIVITY_DAYS).contains(&days) {
        return Err(AppError::Validation(format!(
            "days must be between 1 and {MAX_ACTIVITY_DAYS}"
        )));
    }

    let today = day_index(now_sec, tz_offset_secs);
    let first_day = today - (days - 1);
    // Start of the first local day, as a UTC timestamp.
    let window_start = first_day * SECONDS_PER_DAY - tz_offset_secs;

    // day -> (reviews, correct)
    let mut reviews: HashMap<i64, (i64, i64)> = HashMap::new();
    let mut stmt = conn.prepare(
        "SELECT (re.timestamp + ?2) / ?3 AS day,
                COUNT(*),
                COUNT(CASE WHEN re.grade >= 3 THEN 1 END)
         FROM review_event re
         JOIN review_state rs ON rs.id = re.review_state_id
         JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
         JOIN lexeme l ON l.id = uv.lexeme_id
         WHERE l.language_id = ?1 AND re.timestamp >= ?4
         GROUP BY day",
    )?;
    let rows = stmt.query_map(
        params![language_id, tz_offset_secs, SECONDS_PER_DAY, window_start],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?, row.get::<_, i64>(2)?)),
    )?;
    for row in rows {
        let (day, total, correct) = row?;
        reviews.insert(day, (total, correct));
    }

    // day -> words added
    let mut added: HashMap<i64, i64> = HashMap::new();
    let mut stmt = conn.prepare(
        "SELECT (uv.added_at + ?2) / ?3 AS day, COUNT(*)
         FROM user_vocabulary uv
         JOIN lexeme l ON l.id = uv.lexeme_id
         WHERE uv.deleted_at IS NULL AND l.language_id = ?1 AND uv.added_at >= ?4
         GROUP BY day",
    )?;
    let rows = stmt.query_map(
        params![language_id, tz_offset_secs, SECONDS_PER_DAY, window_start],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)),
    )?;
    for row in rows {
        let (day, count) = row?;
        added.insert(day, count);
    }

    Ok((first_day..=today)
        .map(|day| {
            let (reviewed, correct) = reviews.get(&day).copied().unwrap_or((0, 0));
            DailyActivity {
                date: format_day(day),
                reviewed,
                added: added.get(&day).copied().unwrap_or(0),
                accuracy: accuracy_percent(correct, reviewed),
            }
        })
        .collect())
}

#[tauri::command]
pub async fn get_daily_activity(
    days: i64,
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<DailyActivity>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    daily_activity(
        &conn,
        language_id,
        days,
        chrono::Utc::now().timestamp(),
        local_utc_offset_secs(),
    )
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

    // ── streak & daily activity ─────────────────────────────

    /// Noon UTC of day index 20_400 (2025-11-08) — a fixed "now" keeps the
    /// date maths deterministic.
    const TODAY: i64 = 20_400;
    const NOW: i64 = TODAY * SECONDS_PER_DAY + 12 * 3600;

    /// Word with explicit `added_at`, plus its review_state. Returns the uv id.
    fn fixture_word_added_at(conn: &Connection, text: &str, added_at: i64) -> i64 {
        let lexeme_id =
            LexemeRepo::find_or_create(conn, 1, text, None, None, None).expect("lexeme");
        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, added_at) VALUES (1, ?1, ?2)",
            params![lexeme_id, added_at],
        )
        .expect("user_vocabulary");
        let uv_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO review_state (user_vocabulary_id, status) VALUES (?1, 'review')",
            params![uv_id],
        )
        .expect("review_state");
        uv_id
    }

    fn fixture_event_at(conn: &Connection, uv_id: i64, grade: i64, timestamp: i64) {
        let rs_id: i64 = conn
            .query_row(
                "SELECT id FROM review_state WHERE user_vocabulary_id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("review_state id");
        conn.execute(
            "INSERT INTO review_event (review_state_id, mode, grade, timestamp)
             VALUES (?1, 'flashcard', ?2, ?3)",
            params![rs_id, grade, timestamp],
        )
        .expect("review_event");
    }

    #[test]
    fn compute_streak_is_zero_without_activity() {
        assert_eq!(compute_streak(&[], TODAY), 0);
    }

    #[test]
    fn compute_streak_counts_consecutive_days_ending_today() {
        assert_eq!(compute_streak(&[TODAY], TODAY), 1);
        assert_eq!(compute_streak(&[TODAY, TODAY - 1, TODAY - 2], TODAY), 3);
    }

    #[test]
    fn compute_streak_stops_at_the_first_gap() {
        assert_eq!(compute_streak(&[TODAY, TODAY - 1, TODAY - 3, TODAY - 4], TODAY), 2);
    }

    #[test]
    fn compute_streak_survives_a_day_without_reviews_yet() {
        // Last review yesterday: today is not over, the streak is still alive.
        assert_eq!(compute_streak(&[TODAY - 1, TODAY - 2], TODAY), 2);
    }

    #[test]
    fn compute_streak_resets_after_a_full_missed_day() {
        assert_eq!(compute_streak(&[TODAY - 2, TODAY - 3], TODAY), 0);
    }

    #[test]
    fn compute_streak_ignores_future_days_and_duplicates() {
        assert_eq!(compute_streak(&[TODAY + 1, TODAY, TODAY, TODAY - 1], TODAY), 2);
    }

    #[test]
    fn review_streak_reads_distinct_days_from_events() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let word = fixture_word_added_at(&conn, "zzt_streak", NOW - 10 * SECONDS_PER_DAY);

        // Two reviews today, one yesterday, one two days ago, then a gap.
        fixture_event_at(&conn, word, 3, NOW);
        fixture_event_at(&conn, word, 4, NOW - 3600);
        fixture_event_at(&conn, word, 3, NOW - SECONDS_PER_DAY);
        fixture_event_at(&conn, word, 2, NOW - 2 * SECONDS_PER_DAY);
        fixture_event_at(&conn, word, 3, NOW - 5 * SECONDS_PER_DAY);

        assert_eq!(review_streak(&conn, 1, NOW, 0).expect("streak"), 3);
    }

    #[test]
    fn review_streak_is_zero_for_an_empty_history_and_other_languages() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        assert_eq!(review_streak(&conn, 1, NOW, 0).expect("streak"), 0);

        let word = fixture_word_added_at(&conn, "zzt_streak_lang", NOW - SECONDS_PER_DAY);
        fixture_event_at(&conn, word, 3, NOW);
        assert_eq!(review_streak(&conn, 2, NOW, 0).expect("streak"), 0);
    }

    #[test]
    fn review_streak_follows_the_local_timezone() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let word = fixture_word_added_at(&conn, "zzt_streak_tz", NOW - 10 * SECONDS_PER_DAY);

        // 23:30 UTC on TODAY-2 is already TODAY-1 at UTC+3, where it lands on
        // the same local day as the TODAY-1 noon event. In UTC they are two days.
        let late_evening = (TODAY - 2) * SECONDS_PER_DAY + 23 * 3600 + 1800;
        fixture_event_at(&conn, word, 3, late_evening);
        fixture_event_at(&conn, word, 3, NOW - SECONDS_PER_DAY);

        assert_eq!(review_streak(&conn, 1, NOW, 0).expect("utc"), 2);
        assert_eq!(review_streak(&conn, 1, NOW, 3 * 3600).expect("utc+3"), 1);
    }

    #[test]
    fn daily_activity_is_dense_oldest_first_and_zero_filled() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let rows = daily_activity(&conn, 1, 7, NOW, 0).expect("activity");
        assert_eq!(rows.len(), 7);
        assert_eq!(rows[0].date, "2025-11-02");
        assert_eq!(rows[6].date, "2025-11-08");
        assert!(rows
            .iter()
            .all(|d| d.reviewed == 0 && d.added == 0 && d.accuracy == 0.0));
    }

    #[test]
    fn daily_activity_aggregates_reviews_additions_and_accuracy() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let word = fixture_word_added_at(&conn, "zzt_act_a", NOW - SECONDS_PER_DAY);
        fixture_word_added_at(&conn, "zzt_act_b", NOW - SECONDS_PER_DAY + 60);
        // Today: 3 reviews, 2 correct (grade >= 3).
        fixture_event_at(&conn, word, 4, NOW);
        fixture_event_at(&conn, word, 3, NOW - 60);
        fixture_event_at(&conn, word, 1, NOW - 120);
        // Yesterday: 1 incorrect review.
        fixture_event_at(&conn, word, 0, NOW - SECONDS_PER_DAY);
        // Outside the 3-day window: must not appear.
        fixture_event_at(&conn, word, 3, NOW - 10 * SECONDS_PER_DAY);

        let rows = daily_activity(&conn, 1, 3, NOW, 0).expect("activity");
        assert_eq!(rows.len(), 3);

        let (two_days_ago, yesterday, today) = (&rows[0], &rows[1], &rows[2]);
        assert_eq!((two_days_ago.reviewed, two_days_ago.added), (0, 0));
        assert_eq!((yesterday.reviewed, yesterday.added), (1, 2));
        assert!((yesterday.accuracy - 0.0).abs() < f64::EPSILON);
        assert_eq!((today.reviewed, today.added), (3, 0));
        assert!((today.accuracy - 66.7).abs() < 0.05);
    }

    #[test]
    fn daily_activity_skips_deleted_words_and_other_languages() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let deleted = fixture_word_added_at(&conn, "zzt_act_deleted", NOW);
        conn.execute(
            "UPDATE user_vocabulary SET deleted_at = ?1 WHERE id = ?2",
            params![NOW, deleted],
        )
        .expect("soft delete");

        let rows = daily_activity(&conn, 1, 2, NOW, 0).expect("activity");
        assert_eq!(rows[1].added, 0, "soft-deleted words are not 'added'");

        let rows_ru = daily_activity(&conn, 2, 2, NOW, 0).expect("activity ru");
        assert!(rows_ru.iter().all(|d| d.added == 0 && d.reviewed == 0));
    }

    #[test]
    fn daily_activity_groups_by_local_day() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let word = fixture_word_added_at(&conn, "zzt_act_tz", NOW - 5 * SECONDS_PER_DAY);

        // 23:30 UTC on TODAY-1: yesterday in UTC, today at UTC+3.
        fixture_event_at(&conn, word, 3, (TODAY - 1) * SECONDS_PER_DAY + 23 * 3600 + 1800);

        let utc = daily_activity(&conn, 1, 2, NOW, 0).expect("utc");
        assert_eq!((utc[0].reviewed, utc[1].reviewed), (1, 0));

        let east = daily_activity(&conn, 1, 2, NOW, 3 * 3600).expect("utc+3");
        assert_eq!((east[0].reviewed, east[1].reviewed), (0, 1));
    }

    #[test]
    fn daily_activity_rejects_out_of_range_windows() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        for days in [0, -1, MAX_ACTIVITY_DAYS + 1] {
            assert!(matches!(
                daily_activity(&conn, 1, days, NOW, 0),
                Err(AppError::Validation(_))
            ));
        }
        assert_eq!(
            daily_activity(&conn, 1, MAX_ACTIVITY_DAYS, NOW, 0)
                .expect("max window")
                .len(),
            MAX_ACTIVITY_DAYS as usize
        );
    }
}
