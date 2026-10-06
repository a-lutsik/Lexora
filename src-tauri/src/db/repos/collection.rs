// ============================================================
// LEXORA — Collection Repository
// ============================================================

use crate::commands::collections::CollectionDto;
use crate::error::AppError;
use rusqlite::{params, Connection};

pub struct CollectionRepo;

impl CollectionRepo {
    /// List all collections for a given language with word counts.
    pub fn list(
        conn: &Connection,
        language_id: Option<i64>,
    ) -> Result<Vec<CollectionDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.name, c.description, c.collection_type, c.language_id, c.is_active,
                    COUNT(ci.id) as word_count,
                    c.pack_key,
                    COALESCE(c.load_status, 'empty')
             FROM collection c
             LEFT JOIN collection_item ci ON ci.collection_id = c.id
             WHERE (?1 IS NULL OR c.language_id = ?1)
             GROUP BY c.id
             ORDER BY c.sort_order ASC, c.name ASC",
        )?;

        let collections = stmt
            .query_map(params![language_id], |row| {
                Ok(CollectionDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    collection_type: row.get(3)?,
                    language_id: row.get(4)?,
                    is_active: row.get::<_, i64>(5)? != 0,
                    word_count: row.get(6)?,
                    pack_key: row.get(7)?,
                    load_status: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(collections)
    }

    /// Toggle collection active state for SRS queue inclusion.
    ///
    /// Activation (0 → 1): all collection lexemes are imported into
    /// user_vocabulary (source = 'collection') and get a 'new' review_state,
    /// so they enter the SRS queue and stickers.
    /// Deactivation (1 → 0): vocabulary rows with source = 'collection'
    /// whose lexemes are not part of any other active collection are
    /// soft-deleted. Manually added words (source 'popup'/'manual') are
    /// never touched. All mutations run in a single transaction.
    pub fn toggle(conn: &mut Connection, id: i64, active: bool) -> Result<CollectionDto, AppError> {
        let tx = conn.transaction()?;

        tx.execute(
            "UPDATE collection SET is_active = ?1 WHERE id = ?2",
            params![if active { 1 } else { 0 }, id],
        )?;

        if active {
            // Resurrect previously soft-deleted collection imports
            tx.execute(
                "UPDATE user_vocabulary SET deleted_at = NULL
                 WHERE user_id = 1
                   AND source = 'collection'
                   AND deleted_at IS NOT NULL
                   AND lexeme_id IN (SELECT lexeme_id FROM collection_item WHERE collection_id = ?1)",
                params![id],
            )?;

            // Import lexemes the user does not have in vocabulary yet
            tx.execute(
                "INSERT OR IGNORE INTO user_vocabulary (user_id, lexeme_id, source)
                 SELECT 1, ci.lexeme_id, 'collection'
                 FROM collection_item ci
                 WHERE ci.collection_id = ?1",
                params![id],
            )?;

            // Ensure every imported word has an SRS state
            tx.execute(
                "INSERT OR IGNORE INTO review_state (user_vocabulary_id, status)
                 SELECT uv.id, 'new'
                 FROM user_vocabulary uv
                 JOIN collection_item ci ON ci.lexeme_id = uv.lexeme_id
                 WHERE ci.collection_id = ?1
                   AND uv.user_id = 1
                   AND uv.deleted_at IS NULL",
                params![id],
            )?;
        } else {
            // Soft-delete collection imports whose lexemes are not covered
            // by any other active collection
            tx.execute(
                "UPDATE user_vocabulary SET deleted_at = unixepoch()
                 WHERE user_id = 1
                   AND source = 'collection'
                   AND deleted_at IS NULL
                   AND lexeme_id IN (SELECT lexeme_id FROM collection_item WHERE collection_id = ?1)
                   AND lexeme_id NOT IN (
                       SELECT ci.lexeme_id
                       FROM collection_item ci
                       JOIN collection c ON c.id = ci.collection_id
                       WHERE c.is_active = 1 AND c.id != ?1
                   )",
                params![id],
            )?;
        }

        tx.commit()?;

        let collections = Self::list(conn, None)?;
        collections
            .into_iter()
            .find(|c| c.id == id)
            .ok_or_else(|| AppError::NotFound(format!("Collection {id} not found")))
    }

    /// Create a user collection. Name is unique per language.
    pub fn create(
        conn: &Connection,
        name: &str,
        description: Option<&str>,
        language_id: i64,
    ) -> Result<CollectionDto, AppError> {
        let name = name.trim();
        if name.is_empty() {
            return Err(AppError::Validation("Collection name is required".into()));
        }
        if name.chars().count() > 80 {
            return Err(AppError::Validation(
                "Collection name must be 80 characters or fewer".into(),
            ));
        }

        let description = description.map(str::trim).filter(|value| !value.is_empty());

        let insert = conn.execute(
            "INSERT INTO collection (name, description, collection_type, language_id, sort_order)
             VALUES (
               ?1,
               ?2,
               'user',
               ?3,
               COALESCE((SELECT MAX(sort_order) FROM collection WHERE language_id = ?3), 0) + 1
             )",
            params![name, description, language_id],
        );

        if let Err(err) = insert {
            if matches!(
                &err,
                rusqlite::Error::SqliteFailure(e, _)
                    if e.code == rusqlite::ErrorCode::ConstraintViolation
            ) {
                return Err(AppError::Validation(format!(
                    "A collection named \"{name}\" already exists"
                )));
            }
            return Err(err.into());
        }

        let id = conn.last_insert_rowid();
        Self::list(conn, Some(language_id))?
            .into_iter()
            .find(|c| c.id == id)
            .ok_or_else(|| AppError::NotFound(format!("Collection {id} not found")))
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

    fn create_collection(conn: &Connection, name: &str) -> i64 {
        conn.execute(
            "INSERT INTO collection (name, collection_type, language_id) VALUES (?1, 'system', 1)",
            params![name],
        )
        .expect("insert collection");
        conn.last_insert_rowid()
    }

    fn create_lexeme(conn: &Connection, text: &str) -> i64 {
        conn.execute(
            "INSERT INTO lexeme (language_id, text, normalized_text) VALUES (1, ?1, ?2)",
            params![text, text.to_lowercase()],
        )
        .expect("insert lexeme");
        conn.last_insert_rowid()
    }

    fn add_item(conn: &Connection, collection_id: i64, lexeme_id: i64) {
        conn.execute(
            "INSERT INTO collection_item (collection_id, lexeme_id) VALUES (?1, ?2)",
            params![collection_id, lexeme_id],
        )
        .expect("insert collection_item");
    }

    /// (active rows, soft-deleted rows) in user_vocabulary for a lexeme
    fn uv_state(conn: &Connection, lexeme_id: i64) -> (i64, i64) {
        let active: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM user_vocabulary WHERE lexeme_id = ?1 AND deleted_at IS NULL",
                params![lexeme_id],
                |r| r.get(0),
            )
            .expect("count active");
        let deleted: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM user_vocabulary WHERE lexeme_id = ?1 AND deleted_at IS NOT NULL",
                params![lexeme_id],
                |r| r.get(0),
            )
            .expect("count deleted");
        (active, deleted)
    }

    #[test]
    fn activation_imports_words_and_creates_review_state() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        let cid = create_collection(&conn, "Zzt Test Collection");
        let l1 = create_lexeme(&conn, "zzt_apple");
        let l2 = create_lexeme(&conn, "zzt_banana");
        add_item(&conn, cid, l1);
        add_item(&conn, cid, l2);

        let dto = CollectionRepo::toggle(&mut conn, cid, true).expect("activate");
        assert!(dto.is_active);

        // Both lexemes imported with source = 'collection' and SRS state 'new'
        for lexeme_id in [l1, l2] {
            assert_eq!(uv_state(&conn, lexeme_id), (1, 0));
            let (source, status): (String, String) = conn
                .query_row(
                    "SELECT uv.source, rs.status
                     FROM user_vocabulary uv
                     JOIN review_state rs ON rs.user_vocabulary_id = uv.id
                     WHERE uv.lexeme_id = ?1",
                    params![lexeme_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .expect("uv + review_state");
            assert_eq!(source, "collection");
            assert_eq!(status, "new");
        }

        // Re-activation is idempotent — no duplicates
        CollectionRepo::toggle(&mut conn, cid, true).expect("re-activate");
        assert_eq!(uv_state(&conn, l1), (1, 0));
        assert_eq!(uv_state(&conn, l2), (1, 0));

        // Deactivate → soft-delete, re-activate → resurrect same rows
        CollectionRepo::toggle(&mut conn, cid, false).expect("deactivate");
        assert_eq!(uv_state(&conn, l1), (0, 1));
        CollectionRepo::toggle(&mut conn, cid, true).expect("resurrect");
        assert_eq!(uv_state(&conn, l1), (1, 0));
    }

    #[test]
    fn deactivation_keeps_words_in_other_active_collections() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        let cid_a = create_collection(&conn, "Zzt Collection A");
        let cid_b = create_collection(&conn, "Zzt Collection B");
        let only_a = create_lexeme(&conn, "zzt_only_a");
        let shared = create_lexeme(&conn, "zzt_shared");
        add_item(&conn, cid_a, only_a);
        add_item(&conn, cid_a, shared);
        add_item(&conn, cid_b, shared);

        CollectionRepo::toggle(&mut conn, cid_a, true).expect("activate A");
        CollectionRepo::toggle(&mut conn, cid_b, true).expect("activate B");
        assert_eq!(uv_state(&conn, only_a), (1, 0));
        assert_eq!(uv_state(&conn, shared), (1, 0));

        // Deactivate A: 'only-a' is soft-deleted, 'shared' survives via B
        CollectionRepo::toggle(&mut conn, cid_a, false).expect("deactivate A");
        assert_eq!(uv_state(&conn, only_a), (0, 1));
        assert_eq!(uv_state(&conn, shared), (1, 0));
    }

    #[test]
    fn manual_words_are_never_touched() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        let cid = create_collection(&conn, "Zzt Test Collection");
        let lexeme_id = create_lexeme(&conn, "zzt_manual_word");
        add_item(&conn, cid, lexeme_id);

        // User added the same word manually before activation
        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, source) VALUES (1, ?1, 'manual')",
            params![lexeme_id],
        )
        .expect("insert manual word");

        CollectionRepo::toggle(&mut conn, cid, true).expect("activate");

        // Still a single row, still source = 'manual'
        let source: String = conn
            .query_row(
                "SELECT source FROM user_vocabulary WHERE lexeme_id = ?1",
                params![lexeme_id],
                |r| r.get(0),
            )
            .expect("source");
        assert_eq!(source, "manual");
        assert_eq!(uv_state(&conn, lexeme_id), (1, 0));

        // Deactivation must not soft-delete the manual row
        CollectionRepo::toggle(&mut conn, cid, false).expect("deactivate");
        assert_eq!(uv_state(&conn, lexeme_id), (1, 0));
    }

    #[test]
    fn list_returns_seeded_collections_with_word_counts() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let all = CollectionRepo::list(&conn, None).expect("list all");
        assert!(
            all.len() >= 6,
            "V001+V012 seed at least 6 English collections"
        );

        let top5000 = all
            .iter()
            .find(|c| c.name == "Top 5000 Words")
            .expect("seeded 'Top 5000 Words'");
        assert_eq!(top5000.language_id, 1);
        assert!(!top5000.is_active, "collections start inactive");
        // V018 strips unused system seed content — packs start empty until Load
        assert_eq!(top5000.word_count, 0, "lazy packs start empty");
        assert_eq!(top5000.pack_key.as_deref(), Some("top_5000"));
        assert_eq!(top5000.load_status.as_deref(), Some("empty"));

        let business = all
            .iter()
            .find(|c| c.name == "Business English")
            .expect("seeded 'Business English'");
        assert_eq!(
            business.word_count, 0,
            "V018 strips thematic seeds until Load"
        );
        assert_eq!(business.pack_key.as_deref(), Some("business"));

        // Language filter: en has collections, ru (id 2) has none
        let en = CollectionRepo::list(&conn, Some(1)).expect("list en");
        assert_eq!(en.len(), all.len());
        let ru = CollectionRepo::list(&conn, Some(2)).expect("list ru");
        assert!(ru.is_empty());
    }

    #[test]
    fn list_word_count_tracks_collection_items() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let cid = create_collection(&conn, "Zzt Count Collection");
        let l1 = create_lexeme(&conn, "zzt_count_one");
        let l2 = create_lexeme(&conn, "zzt_count_two");

        let count_of = |conn: &Connection| {
            CollectionRepo::list(conn, None)
                .expect("list")
                .into_iter()
                .find(|c| c.id == cid)
                .expect("collection present")
                .word_count
        };

        assert_eq!(count_of(&conn), 0);
        add_item(&conn, cid, l1);
        assert_eq!(count_of(&conn), 1);
        add_item(&conn, cid, l2);
        assert_eq!(count_of(&conn), 2);
    }

    #[test]
    fn toggle_unknown_collection_returns_not_found() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        match CollectionRepo::toggle(&mut conn, 999_999, true) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn double_deactivation_is_idempotent() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        let cid = create_collection(&conn, "Zzt Double Deactivate");
        let l1 = create_lexeme(&conn, "zzt_dd");
        add_item(&conn, cid, l1);

        CollectionRepo::toggle(&mut conn, cid, true).expect("activate");
        assert_eq!(uv_state(&conn, l1), (1, 0));

        let dto = CollectionRepo::toggle(&mut conn, cid, false).expect("deactivate");
        assert!(!dto.is_active);
        assert_eq!(uv_state(&conn, l1), (0, 1));

        // Second deactivation: no error, no resurrection, still soft-deleted
        let dto2 = CollectionRepo::toggle(&mut conn, cid, false).expect("double deactivate");
        assert!(!dto2.is_active);
        assert_eq!(uv_state(&conn, l1), (0, 1));
    }

    #[test]
    fn activate_empty_collection_only_flips_flag() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");

        let cid = create_collection(&conn, "Zzt Empty Collection");
        let dto = CollectionRepo::toggle(&mut conn, cid, true).expect("activate");
        assert!(dto.is_active);
        assert_eq!(dto.word_count, 0);

        let uv_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM user_vocabulary", [], |r| r.get(0))
            .expect("count");
        assert_eq!(uv_count, 0, "no words imported from an empty collection");
    }

    #[test]
    fn create_user_collection_and_reject_duplicate_name() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let created = CollectionRepo::create(&conn, "  Travel  ", Some(" airport words "), 1)
            .expect("create");
        assert!(created.id > 0);
        assert_eq!(created.name, "Travel");
        assert_eq!(created.description.as_deref(), Some("airport words"));
        assert_eq!(created.collection_type, "user");
        assert_eq!(created.language_id, 1);
        assert_eq!(created.word_count, 0);
        assert!(!created.is_active);

        let empty = CollectionRepo::create(&conn, "   ", None, 1);
        assert!(matches!(empty, Err(AppError::Validation(_))));

        let dup = CollectionRepo::create(&conn, "Travel", None, 1);
        assert!(matches!(dup, Err(AppError::Validation(msg)) if msg.contains("already exists")));
    }
}
