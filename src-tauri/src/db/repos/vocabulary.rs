// ============================================================
// LEXORA — User Vocabulary Repository
// Handles user words, collections membership, soft delete.
// ============================================================

use crate::commands::vocabulary::{
    AddVocabularyInput, LexemeDto, VocabularyEntryDto, VocabularyFilters,
};
use crate::db::repos::lexeme::LexemeRepo;
use crate::error::AppError;
use rusqlite::{params, Connection, OptionalExtension};

pub struct VocabularyRepo;

impl VocabularyRepo {
    /// Soft-delete a selection atomically, retaining lexemes and review history.
    pub fn remove_batch(conn: &mut Connection, ids: &[i64]) -> Result<(), AppError> {
        if ids.is_empty() || ids.iter().any(|id| *id <= 0) {
            return Err(AppError::Validation(
                "Select at least one vocabulary entry with a positive ID".to_string(),
            ));
        }

        let tx = conn.transaction()?;
        let mut seen = std::collections::HashSet::new();
        for &id in ids {
            if !seen.insert(id) {
                continue;
            }
            let affected = tx.execute(
                "UPDATE user_vocabulary SET deleted_at = unixepoch()
                 WHERE id = ?1 AND deleted_at IS NULL",
                params![id],
            )?;
            if affected == 0 {
                return Err(AppError::NotFound(format!(
                    "Vocabulary entry {id} not found"
                )));
            }
        }
        tx.commit()?;
        Ok(())
    }

    /// List vocabulary entries with full filtering, search, pagination, and joined data.
    pub fn list(
        conn: &Connection,
        filters: &VocabularyFilters,
    ) -> Result<Vec<VocabularyEntryDto>, AppError> {
        let language_id = filters.language_id.unwrap_or(1);
        let page = filters.page.unwrap_or(1).max(1);
        let per_page = filters.per_page.unwrap_or(50).min(200);
        let offset = (page - 1) * per_page;
        let search = filters.search.as_deref().unwrap_or("").trim();
        let status_filter = filters.status.as_deref().filter(|s| *s != "all");

        let mut query = String::from(
            "SELECT
                uv.id, uv.user_id, uv.lexeme_id, uv.added_at,
                uv.is_favorite, uv.notes, uv.source,
                l.id, l.language_id, l.text, l.normalized_text,
                l.part_of_speech, l.phonetic, l.frequency_rank, l.created_at,
                rs.id, rs.status, rs.ease, rs.interval, rs.due_at,
                rs.lapses, rs.repetitions, uv.category_id
             FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             LEFT JOIN review_state rs ON rs.user_vocabulary_id = uv.id
             WHERE uv.deleted_at IS NULL
               AND l.language_id = ?1
               AND l.deleted_at IS NULL",
        );

        if !search.is_empty() {
            query.push_str(" AND (l.normalized_text LIKE '%' || LOWER(?2) || '%' OR EXISTS (
                SELECT 1 FROM translation t WHERE t.lexeme_id = l.id AND LOWER(t.translated_text) LIKE '%' || LOWER(?2) || '%'
            ))");
        } else {
            query.push_str(" AND (1 = 1 OR ?2 = '')");
        }

        if status_filter.is_some() {
            query.push_str(" AND rs.status = ?3");
        } else {
            query.push_str(" AND (1 = 1 OR ?3 = '')");
        }

        query.push_str(" AND (?6 IS NULL OR uv.category_id = ?6)");
        query.push_str(" AND (?7 IS NULL OR EXISTS (SELECT 1 FROM collection_item ci WHERE ci.collection_id = ?7 AND ci.lexeme_id = l.id))");

        // Sorting
        match filters.sort_by.as_deref() {
            Some("alphabetical") => query.push_str(" ORDER BY l.normalized_text ASC"),
            Some("frequency") => query.push_str(" ORDER BY l.frequency_rank ASC NULLS LAST"),
            Some("due_date") => query.push_str(" ORDER BY rs.due_at ASC"),
            _ => query.push_str(" ORDER BY uv.added_at DESC"),
        }

        query.push_str(" LIMIT ?4 OFFSET ?5");

        let mut stmt = conn.prepare(&query)?;
        let status_val = status_filter.unwrap_or("");

        let entries = stmt
            .query_map(
                params![
                    language_id,
                    search,
                    status_val,
                    per_page,
                    offset,
                    filters.category_id,
                    filters.collection_id
                ],
                |row| {
                    let review_state = match row.get::<_, Option<i64>>(15)? {
                        Some(rs_id) => Some(crate::commands::vocabulary::ReviewStateDto {
                            id: rs_id,
                            user_vocabulary_id: row.get(0)?,
                            status: row.get(16)?,
                            ease: row.get(17)?,
                            interval: row.get(18)?,
                            due_at: row.get(19)?,
                            lapses: row.get(20)?,
                            repetitions: row.get(21)?,
                        }),
                        None => None,
                    };

                    Ok(VocabularyEntryDto {
                        id: row.get(0)?,
                        user_id: row.get(1)?,
                        lexeme_id: row.get(2)?,
                        category_id: row.get(22)?,
                        added_at: row.get(3)?,
                        is_favorite: row.get::<_, i64>(4)? != 0,
                        notes: row.get(5)?,
                        source: row.get(6)?,
                        lexeme: LexemeDto {
                            id: row.get(7)?,
                            language_id: row.get(8)?,
                            text: row.get(9)?,
                            normalized_text: row.get(10)?,
                            part_of_speech: row.get(11)?,
                            phonetic: row.get(12)?,
                            frequency_rank: row.get(13)?,
                            created_at: row.get(14)?,
                        },
                        translations: vec![],
                        examples: vec![],
                        synonyms: vec![],
                        review_state,
                        image_path: None,
                        collocation_drill: None,
                    })
                },
            )?
            .collect::<Result<Vec<_>, _>>()?;

        // Enrich with translations, examples and synonyms
        let mut full_entries = entries;
        for entry in &mut full_entries {
            entry.translations = LexemeRepo::get_translations(conn, entry.lexeme.id, None)?;
            entry.examples = LexemeRepo::get_examples(conn, entry.lexeme.id)?;
            entry.synonyms =
                LexemeRepo::get_synonyms(conn, entry.lexeme.id, entry.lexeme.language_id)?;
            entry.image_path = LexemeRepo::get_image_path(conn, entry.lexeme.id)?;
            entry.collocation_drill =
                crate::db::repos::collocation::CollocationRepo::drill_for_phrase(conn, entry.lexeme.id)?;
        }

        Ok(full_entries)
    }

    /// Add a word to user vocabulary (transactional).
    pub fn add(conn: &Connection, input: &AddVocabularyInput) -> Result<i64, AppError> {
        if conn.is_autocommit() {
            let tx = conn.unchecked_transaction()?;
            let id = Self::add_inner(&tx, input)?;
            tx.commit()?;
            Ok(id)
        } else {
            // Batch callers already own the transaction and propagate failures.
            Self::add_inner(conn, input)
        }
    }

    fn add_inner(conn: &Connection, input: &AddVocabularyInput) -> Result<i64, AppError> {
        let language_id: i64 = conn
            .query_row(
                "SELECT id FROM language WHERE code = ?1",
                params![input.source_language],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| {
                AppError::NotFound(format!("Language '{}' not found", input.source_language))
            })?;

        let lexeme_id = match input.lexeme_id {
            Some(id) => id,
            None => LexemeRepo::find_or_create(conn, language_id, &input.text, None, None, None)?,
        };
        LexemeRepo::apply_seed_frequency(conn, lexeme_id)?;

        let lexeme_language_id: i64 = conn.query_row(
            "SELECT language_id FROM lexeme WHERE id = ?1",
            [lexeme_id],
            |row| row.get(0),
        )?;
        if lexeme_language_id != language_id {
            return Err(AppError::Validation(
                "Word must belong to the source language".into(),
            ));
        }
        if let Some(category_id) = input.category_id {
            crate::db::repos::category::CategoryRepo::validate_for_language(
                conn,
                category_id,
                language_id,
            )?;
        }

        // Insert user vocabulary entry
        conn.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, source, notes, category_id)
             VALUES (1, ?1, ?2, ?3, ?4)
             ON CONFLICT(user_id, lexeme_id) DO UPDATE SET
                deleted_at = NULL,
                notes = COALESCE(?3, notes),
                category_id = COALESCE(?4, user_vocabulary.category_id),
                source = CASE
                    WHEN ?4 IS NOT NULL AND user_vocabulary.source = 'collection'
                        AND COALESCE(?2, 'manual') != 'collection'
                    THEN COALESCE(?2, 'manual')
                    ELSE user_vocabulary.source
                END",
            params![lexeme_id, input.source, input.notes, input.category_id],
        )?;

        let uv_id: i64 = conn.query_row(
            "SELECT id FROM user_vocabulary WHERE user_id = 1 AND lexeme_id = ?1",
            params![lexeme_id],
            |row| row.get(0),
        )?;

        // Initialize review state
        conn.execute(
            "INSERT OR IGNORE INTO review_state (user_vocabulary_id, status, due_at)
             VALUES (?1, 'new', unixepoch())",
            params![uv_id],
        )?;

        Ok(uv_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    fn input(text: &str, source: Option<&str>, notes: Option<&str>) -> AddVocabularyInput {
        AddVocabularyInput {
            lexeme_id: None,
            text: text.to_string(),
            source_language: "en".to_string(),
            notes: notes.map(str::to_string),
            source: source.map(str::to_string),
            category_id: None,
        }
    }

    fn filters(search: Option<&str>, status: Option<&str>) -> VocabularyFilters {
        VocabularyFilters {
            search: search.map(str::to_string),
            language_id: Some(1),
            status: status.map(str::to_string),
            collection_id: None,
            sort_by: None,
            sort_dir: None,
            page: None,
            per_page: None,
            category_id: None,
        }
    }

    fn filters_full(
        search: Option<&str>,
        status: Option<&str>,
        collection_id: Option<i64>,
        sort_by: Option<&str>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> VocabularyFilters {
        VocabularyFilters {
            search: search.map(str::to_string),
            language_id: Some(1),
            status: status.map(str::to_string),
            collection_id,
            sort_by: sort_by.map(str::to_string),
            sort_dir: None,
            page,
            per_page,
            category_id: None,
        }
    }

    /// Row count of active (non soft-deleted) vocabulary entries for language 1.
    /// Mirrors the COUNT query behind the `count_vocabulary` command.
    fn active_count(conn: &Connection) -> i64 {
        conn.query_row(
            "SELECT COUNT(*) FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE uv.deleted_at IS NULL
               AND l.deleted_at IS NULL
               AND l.language_id = 1",
            [],
            |r| r.get(0),
        )
        .expect("count")
    }

    /// Soft delete — the exact mutation performed by the `remove_from_vocabulary` command.
    /// Returns affected row count (0 = entry not found).
    fn soft_delete(conn: &Connection, id: i64) -> usize {
        conn.execute(
            "UPDATE user_vocabulary SET deleted_at = unixepoch() WHERE id = ?1",
            params![id],
        )
        .expect("soft delete")
    }

    #[test]
    fn add_manual_word_creates_entry_and_review_state() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id =
            VocabularyRepo::add(&conn, &input("Zzt Manual", Some("manual"), Some("my note")))
                .expect("add");

        let (source, notes, status): (Option<String>, Option<String>, String) = conn
            .query_row(
                "SELECT uv.source, uv.notes, rs.status
                 FROM user_vocabulary uv
                 JOIN review_state rs ON rs.user_vocabulary_id = uv.id
                 WHERE uv.id = ?1",
                params![uv_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .expect("entry + review_state");
        assert_eq!(source.as_deref(), Some("manual"));
        assert_eq!(notes.as_deref(), Some("my note"));
        assert_eq!(status, "new");
    }

    #[test]
    fn add_same_word_twice_is_idempotent() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id1 = VocabularyRepo::add(&conn, &input("Zzt Idem", Some("manual"), Some("first")))
            .expect("first add");
        let id2 = VocabularyRepo::add(&conn, &input(" zzt idem ", Some("manual"), None))
            .expect("second add");

        assert_eq!(id1, id2, "duplicate add returns the same entry id");
        assert_eq!(active_count(&conn), 1, "no duplicate vocabulary row");
    }

    #[test]
    fn add_unknown_language_returns_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let mut bad = input("zzt whatever", Some("manual"), None);
        bad.source_language = "xx".to_string();

        match VocabularyRepo::add(&conn, &bad) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn list_filters_by_search_and_status() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        VocabularyRepo::add(&conn, &input("Zzt Appleword", Some("manual"), None)).expect("add 1");
        VocabularyRepo::add(&conn, &input("Zzt Bananaword", Some("manual"), None)).expect("add 2");

        // No filter — both words present
        let all = VocabularyRepo::list(&conn, &filters(None, None)).expect("list all");
        assert_eq!(all.len(), 2);
        assert!(all.iter().all(|e| e.review_state.is_some()));
        assert!(all.iter().all(|e| !e.is_favorite));

        // Search matches normalized_text (case-insensitive)
        let found = VocabularyRepo::list(&conn, &filters(Some("ZZT APPLE"), None)).expect("search");
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].lexeme.normalized_text, "zzt appleword");

        // Status filter: both are 'new', nothing is 'learning'
        let new = VocabularyRepo::list(&conn, &filters(None, Some("new"))).expect("status new");
        assert_eq!(new.len(), 2);
        let learning =
            VocabularyRepo::list(&conn, &filters(None, Some("learning"))).expect("status learning");
        assert!(learning.is_empty());

        // 'all' status disables the filter
        let all_status = VocabularyRepo::list(&conn, &filters(None, Some("all"))).expect("all");
        assert_eq!(all_status.len(), 2);
    }

    #[test]
    fn soft_delete_excludes_entry_from_list_and_count() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id =
            VocabularyRepo::add(&conn, &input("Zzt Gone", Some("manual"), None)).expect("add");
        assert_eq!(active_count(&conn), 1);

        assert_eq!(soft_delete(&conn, uv_id), 1, "one row soft-deleted");

        let deleted_at: Option<i64> = conn
            .query_row(
                "SELECT deleted_at FROM user_vocabulary WHERE id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("deleted_at");
        assert!(deleted_at.is_some(), "deleted_at must be set");

        let list = VocabularyRepo::list(&conn, &filters(None, None)).expect("list");
        assert!(list.is_empty(), "soft-deleted entry not returned by list");
        assert_eq!(active_count(&conn), 0);

        // Re-adding the same word resurrects the entry (ON CONFLICT deleted_at = NULL)
        let resurrected = VocabularyRepo::add(&conn, &input("zzt gone", Some("manual"), None))
            .expect("resurrect");
        assert_eq!(resurrected, uv_id);
        assert_eq!(active_count(&conn), 1);
    }

    #[test]
    fn soft_delete_nonexistent_id_affects_zero_rows() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // The remove_from_vocabulary command maps affected == 0 to AppError::NotFound
        assert_eq!(soft_delete(&conn, 999_999), 0);
    }

    #[test]
    fn remove_batch_deduplicates_and_keeps_word_data_and_review_history() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let first = VocabularyRepo::add(&conn, &input("Zzt First", None, None)).expect("add");
        let second = VocabularyRepo::add(&conn, &input("Zzt Second", None, None)).expect("add");
        let retained = VocabularyRepo::add(&conn, &input("Zzt Retained", None, None)).expect("add");

        VocabularyRepo::remove_batch(&mut conn, &[first, second, first]).expect("remove selection");

        let entries = VocabularyRepo::list(&conn, &filters(None, None)).expect("list");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, retained);
        assert_eq!(active_count(&conn), 1);
        let (deleted, lexemes, reviews): (i64, i64, i64) = conn
            .query_row(
                "SELECT
                (SELECT COUNT(*) FROM user_vocabulary WHERE deleted_at IS NOT NULL),
                (SELECT COUNT(*) FROM lexeme WHERE deleted_at IS NULL
                    AND id IN (SELECT lexeme_id FROM user_vocabulary)),
                (SELECT COUNT(*) FROM review_state)",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .expect("retained data");
        assert_eq!(deleted, 2);
        assert_eq!(lexemes, 3);
        assert_eq!(reviews, 3);
    }

    #[test]
    fn remove_batch_rolls_back_when_an_entry_is_missing_or_already_deleted() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let active = VocabularyRepo::add(&conn, &input("Zzt Active", None, None)).expect("add");
        let removed = VocabularyRepo::add(&conn, &input("Zzt Removed", None, None)).expect("add");
        VocabularyRepo::remove_batch(&mut conn, &[removed]).expect("initial remove");

        for unavailable in [999_999, removed] {
            assert!(matches!(
                VocabularyRepo::remove_batch(&mut conn, &[active, unavailable]),
                Err(AppError::NotFound(_))
            ));
            let entries = VocabularyRepo::list(&conn, &filters(None, None)).expect("list");
            assert_eq!(
                entries.len(),
                1,
                "failed batch must retain the active entry"
            );
            assert_eq!(entries[0].id, active);
        }
    }

    #[test]
    fn remove_batch_rejects_invalid_selection_without_changing_entries() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let active = VocabularyRepo::add(&conn, &input("Zzt Active", None, None)).expect("add");

        for ids in [vec![], vec![active, 0], vec![active, -1]] {
            assert!(matches!(
                VocabularyRepo::remove_batch(&mut conn, &ids),
                Err(AppError::Validation(_))
            ));
            assert_eq!(active_count(&conn), 1);
        }
    }

    #[test]
    fn favorite_and_notes_updates_are_visible_in_list() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id =
            VocabularyRepo::add(&conn, &input("Zzt Fav", Some("manual"), None)).expect("add");

        // Same UPDATE as the toggle_favorite command
        conn.execute(
            "UPDATE user_vocabulary
             SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
             WHERE id = ?1 AND deleted_at IS NULL",
            params![uv_id],
        )
        .expect("toggle favorite");

        // Same UPDATE as the update_vocabulary_notes command
        conn.execute(
            "UPDATE user_vocabulary SET notes = ?1 WHERE id = ?2 AND deleted_at IS NULL",
            params!["updated note", uv_id],
        )
        .expect("update notes");

        let list = VocabularyRepo::list(&conn, &filters(None, None)).expect("list");
        assert_eq!(list.len(), 1);
        assert!(list[0].is_favorite, "favorite flag toggled on");
        assert_eq!(list[0].notes.as_deref(), Some("updated note"));

        // Toggle again → back off
        conn.execute(
            "UPDATE user_vocabulary
             SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
             WHERE id = ?1 AND deleted_at IS NULL",
            params![uv_id],
        )
        .expect("toggle favorite off");
        let list = VocabularyRepo::list(&conn, &filters(None, None)).expect("list");
        assert!(!list[0].is_favorite, "favorite flag toggled off");
    }

    #[test]
    fn add_with_lexeme_id_preserves_existing_translations() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let lexeme_id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_cached", Some("noun"), None, None)
                .expect("lex");
        LexemeRepo::upsert_translation(
            &conn,
            lexeme_id,
            2,
            "кэшированный",
            None,
            Some("ai"),
            Some(0.95),
            "general",
        )
        .expect("tr");

        let uv_id = VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: Some(lexeme_id),
                text: "zzt_cached".to_string(),
                source_language: "en".to_string(),
                notes: None,
                source: Some("popup".to_string()),
                category_id: None,
            },
        )
        .expect("add");

        let (linked_lexeme, translation_count): (i64, i64) = conn
            .query_row(
                "SELECT uv.lexeme_id,
                        (SELECT COUNT(*) FROM translation t WHERE t.lexeme_id = uv.lexeme_id)
                 FROM user_vocabulary uv
                 WHERE uv.id = ?1",
                params![uv_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .expect("row");

        assert_eq!(linked_lexeme, lexeme_id);
        assert_eq!(translation_count, 1);
    }

    #[test]
    fn add_seeded_word_attaches_frequency_rank() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id = VocabularyRepo::add(&conn, &input("  Supposed ", Some("popup"), None))
            .expect("add supposed");
        let rank: Option<i64> = conn
            .query_row(
                "SELECT l.frequency_rank
                 FROM user_vocabulary uv
                 JOIN lexeme l ON l.id = uv.lexeme_id
                 WHERE uv.id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("rank");
        assert_eq!(rank, Some(434));
    }

    #[test]
    fn list_sort_orders() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_alpha = VocabularyRepo::add(&conn, &input("Zzts Alpha", Some("manual"), None))
            .expect("add alpha");
        let uv_bravo = VocabularyRepo::add(&conn, &input("Zzts Bravo", Some("manual"), None))
            .expect("add bravo");
        let uv_charlie = VocabularyRepo::add(&conn, &input("Zzts Charlie", Some("manual"), None))
            .expect("add charlie");

        // Explicit timestamps/frequency/due dates — added_at defaults to
        // unixepoch() and would tie within the same second.
        conn.execute(
            "UPDATE user_vocabulary SET added_at = 1000 WHERE id = ?1",
            params![uv_alpha],
        )
        .expect("ts alpha");
        conn.execute(
            "UPDATE user_vocabulary SET added_at = 3000 WHERE id = ?1",
            params![uv_bravo],
        )
        .expect("ts bravo");
        conn.execute(
            "UPDATE user_vocabulary SET added_at = 2000 WHERE id = ?1",
            params![uv_charlie],
        )
        .expect("ts charlie");
        conn.execute(
            "UPDATE lexeme SET frequency_rank = 10 WHERE normalized_text = 'zzts alpha'",
            [],
        )
        .expect("freq alpha");
        conn.execute(
            "UPDATE lexeme SET frequency_rank = 5 WHERE normalized_text = 'zzts bravo'",
            [],
        )
        .expect("freq bravo");
        conn.execute(
            "UPDATE review_state SET due_at = 200 WHERE user_vocabulary_id = ?1",
            params![uv_alpha],
        )
        .expect("due alpha");
        conn.execute(
            "UPDATE review_state SET due_at = 300 WHERE user_vocabulary_id = ?1",
            params![uv_bravo],
        )
        .expect("due bravo");
        conn.execute(
            "UPDATE review_state SET due_at = 100 WHERE user_vocabulary_id = ?1",
            params![uv_charlie],
        )
        .expect("due charlie");

        let names = |sort_by: Option<&str>| {
            VocabularyRepo::list(&conn, &filters_full(None, None, None, sort_by, None, None))
                .expect("list")
                .into_iter()
                .map(|e| e.lexeme.normalized_text)
                .collect::<Vec<_>>()
        };

        // Default and unknown sort keys → added_at DESC
        let default_order = vec!["zzts bravo", "zzts charlie", "zzts alpha"];
        assert_eq!(names(None), default_order);
        assert_eq!(names(Some("added_date")), default_order);
        assert_eq!(names(Some("bogus")), default_order);

        assert_eq!(
            names(Some("alphabetical")),
            vec!["zzts alpha", "zzts bravo", "zzts charlie"]
        );
        // frequency_rank ASC, NULLS LAST (charlie has no rank)
        assert_eq!(
            names(Some("frequency")),
            vec!["zzts bravo", "zzts alpha", "zzts charlie"]
        );
        assert_eq!(
            names(Some("due_date")),
            vec!["zzts charlie", "zzts alpha", "zzts bravo"]
        );
    }

    #[test]
    fn list_paginates_with_page_and_per_page() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        for i in 0..5 {
            VocabularyRepo::add(
                &conn,
                &input(&format!("Zztp Word{i}"), Some("manual"), None),
            )
            .expect("add");
        }

        let page = |p: i64, pp: i64| {
            VocabularyRepo::list(
                &conn,
                &filters_full(None, None, None, Some("alphabetical"), Some(p), Some(pp)),
            )
            .expect("list")
            .into_iter()
            .map(|e| e.lexeme.normalized_text)
            .collect::<Vec<_>>()
        };

        assert_eq!(page(1, 2), vec!["zztp word0", "zztp word1"]);
        assert_eq!(page(2, 2), vec!["zztp word2", "zztp word3"]);
        assert_eq!(page(3, 2), vec!["zztp word4"]);
        assert!(page(4, 2).is_empty(), "page beyond the end is empty");
        // page 0 / negative pages are clamped to 1
        assert_eq!(page(0, 2), page(1, 2));
        assert_eq!(page(-5, 2), page(1, 2));
    }

    #[test]
    fn list_filters_by_collection_id_and_combines_with_other_filters() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_in =
            VocabularyRepo::add(&conn, &input("Zztc Incol", Some("manual"), None)).expect("add in");
        VocabularyRepo::add(&conn, &input("Zztc Outcol", Some("manual"), None)).expect("add out");

        let lexeme_in: i64 = conn
            .query_row(
                "SELECT lexeme_id FROM user_vocabulary WHERE id = ?1",
                params![uv_in],
                |r| r.get(0),
            )
            .expect("lexeme id");
        conn.execute(
            "INSERT INTO collection (name, collection_type, language_id) VALUES ('Zztc Col', 'custom', 1)",
            [],
        )
        .expect("collection");
        let cid = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO collection_item (collection_id, lexeme_id) VALUES (?1, ?2)",
            params![cid, lexeme_in],
        )
        .expect("collection item");

        // collection_id alone
        let in_col = VocabularyRepo::list(
            &conn,
            &filters_full(None, None, Some(cid), None, None, None),
        )
        .expect("list by collection");
        assert_eq!(in_col.len(), 1);
        assert_eq!(in_col[0].lexeme.normalized_text, "zztc incol");

        // collection + non-matching search → empty
        let none = VocabularyRepo::list(
            &conn,
            &filters_full(Some("outcol"), None, Some(cid), None, None, None),
        )
        .expect("collection + search");
        assert!(none.is_empty());

        // collection + matching search
        let found = VocabularyRepo::list(
            &conn,
            &filters_full(Some("incol"), None, Some(cid), None, None, None),
        )
        .expect("collection + matching search");
        assert_eq!(found.len(), 1);

        // collection + status
        let new = VocabularyRepo::list(
            &conn,
            &filters_full(None, Some("new"), Some(cid), None, None, None),
        )
        .expect("collection + status new");
        assert_eq!(new.len(), 1);
        let learning = VocabularyRepo::list(
            &conn,
            &filters_full(None, Some("learning"), Some(cid), None, None, None),
        )
        .expect("collection + status learning");
        assert!(learning.is_empty());
    }

    #[test]
    fn list_search_matches_translation_text_and_enriches_entries() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id = VocabularyRepo::add(&conn, &input("Zztt Transword", Some("manual"), None))
            .expect("add with translation");
        VocabularyRepo::add(&conn, &input("Zztt Plainword", Some("manual"), None))
            .expect("add plain");

        let lexeme_id: i64 = conn
            .query_row(
                "SELECT lexeme_id FROM user_vocabulary WHERE id = ?1",
                params![uv_id],
                |r| r.get(0),
            )
            .expect("lexeme id");
        LexemeRepo::upsert_translation(
            &conn,
            lexeme_id,
            2,
            "уникальныйперевод",
            None,
            Some("ai"),
            Some(0.9),
            "general",
        )
        .expect("translation");
        LexemeRepo::upsert_example(
            &conn,
            lexeme_id,
            "A zztt transword example.",
            None,
            Some("ai"),
            Some(1),
        )
        .expect("example");

        // Search term that only appears in the translation, not the word itself
        let hits = VocabularyRepo::list(
            &conn,
            &filters_full(Some("уникальн"), None, None, None, None, None),
        )
        .expect("search by translation");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].lexeme.normalized_text, "zztt transword");

        // list() enriches entries with translations and examples
        assert_eq!(hits[0].translations.len(), 1);
        assert_eq!(hits[0].translations[0].translated_text, "уникальныйперевод");
        assert_eq!(hits[0].examples.len(), 1);
    }

    #[test]
    fn list_handles_entry_without_review_state() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let uv_id =
            VocabularyRepo::add(&conn, &input("Zztn Nostate", Some("manual"), None)).expect("add");
        conn.execute(
            "DELETE FROM review_state WHERE user_vocabulary_id = ?1",
            params![uv_id],
        )
        .expect("delete review_state");

        let list = VocabularyRepo::list(&conn, &filters_full(None, None, None, None, None, None))
            .expect("list");
        assert_eq!(list.len(), 1);
        assert!(list[0].review_state.is_none(), "LEFT JOIN yields None");

        // Status filter excludes stateless entries (rs.status IS NULL)
        let filtered = VocabularyRepo::list(
            &conn,
            &filters_full(None, Some("new"), None, None, None, None),
        )
        .expect("status filter");
        assert!(filtered.is_empty());
    }
}
