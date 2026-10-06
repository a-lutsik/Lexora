// ============================================================
// LEXORA — SRS Review Queue Builder
// Implements priority queue ordering: Overdue > Learning > New
// ============================================================

use crate::commands::study::StudyQueueFilters;
use crate::commands::vocabulary::VocabularyEntryDto;
use crate::error::AppError;
use rusqlite::types::Value;
use rusqlite::{params_from_iter, Connection};

pub struct QueueBuilder;

/// Optional extra WHERE clause + bind values for sticker/study source filters.
/// `include_mine == None` means "do not filter by source" (study page).
fn source_filter_sql(include_mine: Option<bool>, collection_ids: &[i64]) -> (String, Vec<i64>) {
    let Some(include_mine) = include_mine else {
        return (String::new(), Vec::new());
    };

    let mut clauses: Vec<String> = Vec::new();
    let mut params: Vec<i64> = Vec::new();

    if include_mine {
        clauses.push("(uv.source IS NULL OR uv.source != 'collection')".to_string());
    }
    if !collection_ids.is_empty() {
        let placeholders = collection_ids
            .iter()
            .map(|_| "?")
            .collect::<Vec<_>>()
            .join(", ");
        clauses.push(format!(
            "uv.lexeme_id IN (SELECT lexeme_id FROM collection_item WHERE collection_id IN ({placeholders}))"
        ));
        params.extend(collection_ids.iter().copied());
    }

    if clauses.is_empty() {
        return ("AND 0".to_string(), Vec::new());
    }
    (format!("AND ({})", clauses.join(" OR ")), params)
}

fn query_ids(conn: &Connection, sql: &str, params: Vec<Value>) -> Result<Vec<i64>, AppError> {
    let mut stmt = conn.prepare(sql)?;
    let ids = stmt
        .query_map(params_from_iter(params), |row| row.get(0))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(ids)
}

impl QueueBuilder {
    /// Build a study session queue based on SRS state and filters.
    pub fn build_queue(
        conn: &Connection,
        filters: &StudyQueueFilters,
    ) -> Result<Vec<VocabularyEntryDto>, AppError> {
        let now_sec = chrono::Utc::now().timestamp();
        let limit = filters.limit.clamp(5, 100);
        let (source_sql, source_params) =
            source_filter_sql(filters.include_mine, &filters.collection_ids);

        // Fetch due cards (ordered by overdue duration)
        let mut due_params: Vec<Value> = vec![now_sec.into(), filters.language_id.into()];
        due_params.extend(source_params.iter().copied().map(Value::from));
        due_params.push(limit.into());

        let uv_ids = query_ids(
            conn,
            &format!(
                "SELECT uv.id
                 FROM review_state rs
                 JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
                 JOIN lexeme l ON l.id = uv.lexeme_id
                 WHERE rs.due_at <= ?
                   AND rs.status != 'suspended'
                   AND uv.deleted_at IS NULL
                   AND l.language_id = ?
                   {source_sql}
                 ORDER BY
                    CASE rs.status
                        WHEN 'learning' THEN 1
                        WHEN 'review'   THEN 2
                        WHEN 'new'      THEN 3
                        ELSE 4
                    END,
                    rs.due_at ASC
                 LIMIT ?"
            ),
            due_params,
        )?;

        // If we don't have enough due cards and include_new is enabled, add new words
        let mut all_ids = uv_ids;
        if (all_ids.len() as i64) < limit && filters.include_new {
            let remaining = limit - (all_ids.len() as i64);
            let mut new_params: Vec<Value> = vec![filters.language_id.into()];
            new_params.extend(source_params.iter().copied().map(Value::from));
            new_params.push(remaining.into());

            let new_ids = query_ids(
                conn,
                &format!(
                    "SELECT uv.id
                     FROM user_vocabulary uv
                     JOIN review_state rs ON rs.user_vocabulary_id = uv.id
                     JOIN lexeme l ON l.id = uv.lexeme_id
                     WHERE rs.status = 'new'
                       AND uv.deleted_at IS NULL
                       AND l.language_id = ?
                       {source_sql}
                     ORDER BY uv.added_at ASC
                     LIMIT ?"
                ),
                new_params,
            )?;

            for id in new_ids {
                if !all_ids.contains(&id) {
                    all_ids.push(id);
                }
            }
        }

        // Mature refresh: sprinkle a small share of mature words (not yet due)
        // at the tail of the queue so long-term memory stays fresh.
        // Quota is ~15% of limit (min 1), deterministic order: least recently
        // reviewed first (updated_at ASC).
        if filters.include_mature_refresh {
            let mature_quota = ((limit * 15) / 100).max(1);
            let mut mature_params: Vec<Value> = vec![now_sec.into(), filters.language_id.into()];
            mature_params.extend(source_params.iter().copied().map(Value::from));
            mature_params.push(mature_quota.into());

            let mature_ids = query_ids(
                conn,
                &format!(
                    "SELECT uv.id
                     FROM review_state rs
                     JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
                     JOIN lexeme l ON l.id = uv.lexeme_id
                     WHERE (rs.status = 'mature' OR rs.interval >= 21)
                       AND rs.status != 'suspended'
                       AND rs.due_at > ?
                       AND uv.deleted_at IS NULL
                       AND l.language_id = ?
                       {source_sql}
                     ORDER BY rs.updated_at ASC, rs.id ASC
                     LIMIT ?"
                ),
                mature_params,
            )?;

            for id in mature_ids {
                if !all_ids.contains(&id) {
                    all_ids.push(id);
                }
            }
        }

        // Fetch full entries for these IDs
        let mut entries = Vec::new();
        for id in all_ids {
            if let Ok(entry) = crate::commands::vocabulary::get_vocabulary_entry_by_id(conn, id) {
                entries.push(entry);
            }
        }

        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{run_migrations, DbPool};
    use r2d2::Pool;
    use r2d2_sqlite::SqliteConnectionManager;

    fn setup_db() -> DbPool {
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    /// Insert lexeme + user_vocabulary + review_state, return user_vocabulary id.
    fn insert_word(
        conn: &Connection,
        text: &str,
        status: &str,
        interval: i64,
        due_at: i64,
        updated_at: i64,
    ) -> i64 {
        conn.execute(
            "INSERT INTO lexeme (language_id, text, normalized_text) VALUES (1, ?1, ?2)",
            rusqlite::params![text, text.to_lowercase()],
        )
        .expect("insert lexeme");
        let lexeme_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, source) VALUES (1, ?1, 'manual')",
            rusqlite::params![lexeme_id],
        )
        .expect("insert user_vocabulary");
        let uv_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO review_state (user_vocabulary_id, status, interval, due_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![uv_id, status, interval, due_at, updated_at],
        )
        .expect("insert review_state");

        uv_id
    }

    fn insert_collection_word(
        conn: &Connection,
        text: &str,
        status: &str,
        due_at: i64,
        collection_id: i64,
    ) -> i64 {
        conn.execute(
            "INSERT INTO lexeme (language_id, text, normalized_text) VALUES (1, ?1, ?2)",
            rusqlite::params![text, text.to_lowercase()],
        )
        .expect("insert lexeme");
        let lexeme_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO collection_item (collection_id, lexeme_id) VALUES (?1, ?2)",
            rusqlite::params![collection_id, lexeme_id],
        )
        .expect("insert collection_item");

        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, source) VALUES (1, ?1, 'collection')",
            rusqlite::params![lexeme_id],
        )
        .expect("insert user_vocabulary");
        let uv_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO review_state (user_vocabulary_id, status, interval, due_at, updated_at)
             VALUES (?1, ?2, 1, ?3, ?3)",
            rusqlite::params![uv_id, status, due_at],
        )
        .expect("insert review_state");

        uv_id
    }

    fn filters(limit: i64, include_new: bool, include_mature_refresh: bool) -> StudyQueueFilters {
        StudyQueueFilters {
            language_id: 1,
            limit,
            include_new,
            include_mature_refresh,
            include_mine: None,
            collection_ids: Vec::new(),
        }
    }

    #[test]
    fn mature_refresh_appends_oldest_mature_after_due_and_new() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        let due_id = insert_word(&conn, "zzt_due", "learning", 1, now - 100, now - 100);
        let new_id = insert_word(&conn, "zzt_new", "new", 0, now + 86_400, now);
        // Mature words, not yet due; oldest reviewed must be picked first
        let mature_old = insert_word(
            &conn,
            "zzt_mature_old",
            "mature",
            45,
            now + 86_400,
            now - 90_000,
        );
        let _mature_mid = insert_word(
            &conn,
            "zzt_mature_mid",
            "mature",
            30,
            now + 86_400,
            now - 50_000,
        );
        let _mature_new = insert_word(
            &conn,
            "zzt_mature_new",
            "mature",
            21,
            now + 86_400,
            now - 10_000,
        );

        // limit = 10 → mature quota = max(1, 10 * 15 / 100) = 1
        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, true)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids.len(), 3);
        assert_eq!(ids[0], due_id, "due card first");
        assert_eq!(ids[1], new_id, "new card second");
        assert_eq!(ids[2], mature_old, "oldest mature word last");
    }

    #[test]
    fn mature_refresh_disabled_excludes_mature_words() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        let due_id = insert_word(&conn, "zzt_due", "learning", 1, now - 100, now - 100);
        let _mature = insert_word(
            &conn,
            "zzt_mature",
            "mature",
            45,
            now + 86_400,
            now - 90_000,
        );

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, false)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![due_id]);
    }

    #[test]
    fn interval_over_21_days_counts_as_mature() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        // Status is still 'review', but interval >= 21 → eligible for refresh
        let mature_id = insert_word(
            &conn,
            "zzt_long_interval",
            "review",
            25,
            now + 86_400,
            now - 60_000,
        );

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, true)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![mature_id]);
    }

    #[test]
    fn mature_word_already_due_is_not_duplicated() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        // Mature word whose due date has passed → comes from the due branch only
        let due_mature = insert_word(&conn, "zzt_due_mature", "mature", 40, now - 500, now - 500);

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, true)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![due_mature]);
    }

    #[test]
    fn include_new_false_excludes_new_words() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        let due_id = insert_word(&conn, "zzt_due", "learning", 1, now - 100, now - 100);
        let _new = insert_word(&conn, "zzt_new", "new", 0, now + 86_400, now);

        let queue = QueueBuilder::build_queue(&conn, &filters(10, false, false)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![due_id]);
    }

    #[test]
    fn limit_is_clamped_to_minimum_5() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        for i in 0..7 {
            insert_word(
                &conn,
                &format!("zzt_clamp_min_{i}"),
                "review",
                3,
                now - 100 - i,
                now - 100,
            );
        }

        // limit = 1 → clamped up to 5
        let queue = QueueBuilder::build_queue(&conn, &filters(1, false, false)).expect("queue");
        assert_eq!(queue.len(), 5);
    }

    #[test]
    fn limit_is_clamped_to_maximum_100() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        for i in 0..105 {
            insert_word(
                &conn,
                &format!("zzt_clamp_max_{i}"),
                "review",
                3,
                now - 200 + i,
                now - 100,
            );
        }

        // limit = 500 → clamped down to 100
        let queue = QueueBuilder::build_queue(&conn, &filters(500, false, false)).expect("queue");
        assert_eq!(queue.len(), 100);
    }

    #[test]
    fn suspended_words_are_excluded() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        let due_id = insert_word(&conn, "zzt_due", "learning", 1, now - 100, now - 100);
        let _suspended_due =
            insert_word(&conn, "zzt_susp_due", "suspended", 1, now - 200, now - 200);
        let _suspended_mature = insert_word(
            &conn,
            "zzt_susp_mature",
            "suspended",
            45,
            now + 86_400,
            now - 90_000,
        );

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, true)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![due_id]);
    }

    #[test]
    fn new_word_already_due_is_not_duplicated() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        // status 'new' but due date in the past → matches BOTH branches;
        // must appear exactly once (from the due branch, first position)
        let new_due = insert_word(&conn, "zzt_new_due", "new", 0, now - 50, now - 50);

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, false)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        assert_eq!(ids, vec![new_due]);
    }

    #[test]
    fn new_words_fill_remaining_quota_in_added_order() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        let due_id = insert_word(&conn, "zzt_due", "learning", 1, now - 100, now - 100);
        let new_first = insert_word(&conn, "zzt_new_first", "new", 0, now + 86_400, now);
        let new_second = insert_word(&conn, "zzt_new_second", "new", 0, now + 86_400, now);

        let queue = QueueBuilder::build_queue(&conn, &filters(10, true, false)).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();

        // due first, then new words ordered by added_at ASC (insertion order)
        assert_eq!(ids, vec![due_id, new_first, new_second]);
    }

    #[test]
    fn include_mine_excludes_collection_imports() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT INTO collection (name, collection_type, language_id, sort_order)
             VALUES ('zzt_filter', 'user', 1, 99)",
            [],
        )
        .expect("collection");
        let col_id = conn.last_insert_rowid();

        let mine = insert_word(&conn, "zzt_mine", "learning", 1, now - 100, now - 100);
        let _collection =
            insert_collection_word(&conn, "zzt_col_word", "learning", now - 50, col_id);

        let mut only_mine = filters(10, false, false);
        only_mine.include_mine = Some(true);
        let queue = QueueBuilder::build_queue(&conn, &only_mine).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();
        assert_eq!(ids, vec![mine]);
    }

    #[test]
    fn collection_ids_filter_returns_only_those_lists() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT INTO collection (name, collection_type, language_id, sort_order)
             VALUES ('zzt_a', 'user', 1, 98), ('zzt_b', 'user', 1, 99)",
            [],
        )
        .expect("collections");
        let col_b = conn.last_insert_rowid();
        let col_a = col_b - 1;

        let _mine = insert_word(&conn, "zzt_mine_skip", "learning", 1, now - 100, now - 100);
        let _from_a = insert_collection_word(&conn, "zzt_from_a", "learning", now - 80, col_a);
        let from_b = insert_collection_word(&conn, "zzt_from_b", "learning", now - 40, col_b);

        let mut only_b = filters(10, false, false);
        only_b.include_mine = Some(false);
        only_b.collection_ids = vec![col_b];
        let queue = QueueBuilder::build_queue(&conn, &only_b).expect("queue");
        let ids: Vec<i64> = queue.iter().map(|e| e.id).collect();
        assert_eq!(ids, vec![from_b]);
    }

    #[test]
    fn empty_explicit_source_filter_returns_nothing() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let now = chrono::Utc::now().timestamp();
        let _mine = insert_word(
            &conn,
            "zzt_empty_filter",
            "learning",
            1,
            now - 100,
            now - 100,
        );

        let mut none = filters(10, false, false);
        none.include_mine = Some(false);
        let queue = QueueBuilder::build_queue(&conn, &none).expect("queue");
        assert!(queue.is_empty());
    }
}
