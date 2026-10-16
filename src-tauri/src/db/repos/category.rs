use crate::commands::categories::CategoryDto;
use crate::error::AppError;
use rusqlite::{params, Connection, OptionalExtension};
use std::collections::HashSet;

const MAX_CATEGORY_NAME_CHARS: usize = 80;

pub struct CategoryRepo;

impl CategoryRepo {
    pub fn list(conn: &Connection, language_id: i64) -> Result<Vec<CategoryDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.name, c.language_id, c.is_general, COUNT(uv.id)
             FROM vocabulary_category c
             LEFT JOIN user_vocabulary uv ON uv.category_id = c.id AND uv.deleted_at IS NULL
                 AND EXISTS (SELECT 1 FROM lexeme l WHERE l.id = uv.lexeme_id AND l.deleted_at IS NULL)
             WHERE c.language_id = ?1 AND c.deleted_at IS NULL
             GROUP BY c.id ORDER BY c.is_general DESC, c.normalized_name, c.id",
        )?;
        let rows = stmt
            .query_map([language_id], |row| {
                Ok(CategoryDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    language_id: row.get(2)?,
                    is_general: row.get::<_, i64>(3)? != 0,
                    word_count: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    fn get(conn: &Connection, id: i64) -> Result<CategoryDto, AppError> {
        let language_id: i64 = conn
            .query_row(
                "SELECT language_id FROM vocabulary_category WHERE id = ?1 AND deleted_at IS NULL",
                [id],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("Category {id} not found")))?;
        Self::list(conn, language_id)?
            .into_iter()
            .find(|c| c.id == id)
            .ok_or_else(|| AppError::NotFound(format!("Category {id} not found")))
    }

    pub fn validate_for_language(
        conn: &Connection,
        id: i64,
        language_id: i64,
    ) -> Result<(), AppError> {
        let category = Self::get(conn, id)?;
        if category.language_id != language_id {
            return Err(AppError::Validation(
                "Category must belong to the word language".into(),
            ));
        }
        Ok(())
    }

    fn validated_name(
        conn: &Connection,
        language_id: i64,
        name: &str,
        except_id: Option<i64>,
    ) -> Result<(String, String), AppError> {
        let name = name.trim();
        if name.is_empty() || name.chars().count() > MAX_CATEGORY_NAME_CHARS {
            return Err(AppError::Validation(format!(
                "Category name must contain 1–{MAX_CATEGORY_NAME_CHARS} characters"
            )));
        }
        let normalized = name.to_lowercase();
        let duplicate: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM vocabulary_category WHERE language_id = ?1 AND normalized_name = ?2 AND deleted_at IS NULL AND (?3 IS NULL OR id != ?3))",
            params![language_id, normalized, except_id], |row| row.get(0),
        )?;
        if duplicate {
            return Err(AppError::Validation(
                "A category with this name already exists".into(),
            ));
        }
        Ok((name.to_string(), normalized))
    }

    /// Called within the importer's transaction; old exports resolve to General.
    pub fn resolve_imported(
        conn: &Connection,
        language_id: i64,
        name: Option<&str>,
    ) -> Result<i64, AppError> {
        let name = name.unwrap_or("General").trim();
        let normalized = name.to_lowercase();
        let existing: Option<i64> = conn.query_row(
            "SELECT id FROM vocabulary_category WHERE language_id = ?1 AND normalized_name = ?2 AND deleted_at IS NULL",
            params![language_id, normalized], |row| row.get(0),
        ).optional()?;
        if let Some(id) = existing {
            return Ok(id);
        }
        let (name, normalized) = Self::validated_name(conn, language_id, name, None)?;
        conn.execute("INSERT INTO vocabulary_category(language_id, name, normalized_name) VALUES (?1, ?2, ?3)", params![language_id, name, normalized])?;
        Ok(conn.last_insert_rowid())
    }

    pub fn create(
        conn: &mut Connection,
        language_id: i64,
        name: &str,
    ) -> Result<CategoryDto, AppError> {
        let tx = conn.transaction()?;
        let exists: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM language WHERE id = ?1)",
            [language_id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::NotFound(format!(
                "Language {language_id} not found"
            )));
        }
        let (name, normalized) = Self::validated_name(&tx, language_id, name, None)?;
        tx.execute("INSERT INTO vocabulary_category(language_id, name, normalized_name) VALUES (?1, ?2, ?3)", params![language_id, name, normalized])?;
        let result = Self::get(&tx, tx.last_insert_rowid())?;
        tx.commit()?;
        Ok(result)
    }

    pub fn rename(conn: &mut Connection, id: i64, name: &str) -> Result<CategoryDto, AppError> {
        let tx = conn.transaction()?;
        let category = Self::get(&tx, id)?;
        if category.is_general {
            return Err(AppError::Validation("General cannot be renamed".into()));
        }
        let (name, normalized) = Self::validated_name(&tx, category.language_id, name, Some(id))?;
        tx.execute(
            "UPDATE vocabulary_category SET name = ?1, normalized_name = ?2 WHERE id = ?3",
            params![name, normalized, id],
        )?;
        let result = Self::get(&tx, id)?;
        tx.commit()?;
        Ok(result)
    }

    pub fn delete(conn: &mut Connection, id: i64) -> Result<(), AppError> {
        let tx = conn.transaction()?;
        let category = Self::get(&tx, id)?;
        if category.is_general {
            return Err(AppError::Validation("General cannot be deleted".into()));
        }
        let general_id: i64 = tx.query_row(
            "SELECT id FROM vocabulary_category WHERE language_id = ?1 AND is_general = 1 AND deleted_at IS NULL",
            [category.language_id], |row| row.get(0),
        )?;
        tx.execute(
            "UPDATE user_vocabulary SET category_id = ?1 WHERE category_id = ?2",
            params![general_id, id],
        )?;
        tx.execute(
            "UPDATE vocabulary_category SET deleted_at = unixepoch() WHERE id = ?1",
            [id],
        )?;
        tx.commit()?;
        Ok(())
    }

    pub fn move_entries(
        conn: &mut Connection,
        ids: &[i64],
        category_id: i64,
    ) -> Result<(), AppError> {
        if ids.is_empty() || ids.iter().any(|id| *id <= 0) {
            return Err(AppError::Validation(
                "Select at least one vocabulary entry with a positive ID".into(),
            ));
        }
        let tx = conn.transaction()?;
        let category = Self::get(&tx, category_id)?;
        let mut seen = HashSet::new();
        for &id in ids {
            if !seen.insert(id) {
                continue;
            }
            let language_id: i64 = tx.query_row(
                "SELECT l.language_id FROM user_vocabulary uv JOIN lexeme l ON l.id = uv.lexeme_id WHERE uv.id = ?1 AND uv.deleted_at IS NULL AND l.deleted_at IS NULL",
                [id], |row| row.get(0),
            ).optional()?.ok_or_else(|| AppError::NotFound(format!("Vocabulary entry {id} not found")))?;
            if language_id != category.language_id {
                return Err(AppError::Validation(
                    "Category must belong to the word language".into(),
                ));
            }
            tx.execute(
                "UPDATE user_vocabulary SET category_id = ?1 WHERE id = ?2",
                params![category_id, id],
            )?;
        }
        tx.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vocabulary::{AddVocabularyInput, VocabularyFilters};
    use crate::db::repos::vocabulary::VocabularyRepo;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn pool() -> DbPool {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        pool
    }

    fn add(conn: &Connection, text: &str, category_id: Option<i64>) -> i64 {
        VocabularyRepo::add(
            conn,
            &AddVocabularyInput {
                lexeme_id: None,
                text: text.into(),
                source_language: "en".into(),
                notes: None,
                source: Some("manual".into()),
                category_id,
            },
        )
        .expect("add")
    }

    fn category(conn: &Connection, id: i64) -> i64 {
        conn.query_row(
            "SELECT category_id FROM user_vocabulary WHERE id = ?1",
            [id],
            |r| r.get(0),
        )
        .expect("category")
    }

    #[test]
    fn categories_validate_names_and_protect_general() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let general = CategoryRepo::list(&conn, 1).expect("list").remove(0);
        assert!(general.is_general);
        assert!(CategoryRepo::rename(&mut conn, general.id, "Other").is_err());
        assert!(CategoryRepo::delete(&mut conn, general.id).is_err());
        assert!(CategoryRepo::create(&mut conn, 1, " GENERAL ").is_err());
        assert!(CategoryRepo::create(&mut conn, 1, " ").is_err());
        assert!(CategoryRepo::create(&mut conn, 1, &"x".repeat(81)).is_err());
        let created = CategoryRepo::create(&mut conn, 1, "  Путешествия  ").expect("create");
        assert_eq!(created.name, "Путешествия");
        assert!(CategoryRepo::create(&mut conn, 1, "путешествия").is_err());
        assert!(CategoryRepo::create(&mut conn, 2, "путешествия").is_ok());
        let renamed = CategoryRepo::rename(&mut conn, created.id, "Travel").expect("rename");
        assert_eq!(renamed.name, "Travel");
    }

    #[test]
    fn explicit_add_moves_existing_but_omission_preserves_category() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let travel = CategoryRepo::create(&mut conn, 1, "Travel").expect("create");
        let word = add(&conn, "category passport", None);
        assert_ne!(category(&conn, word), travel.id);
        assert_eq!(add(&conn, "category passport", Some(travel.id)), word);
        assert_eq!(add(&conn, "category passport", None), word);
        assert_eq!(category(&conn, word), travel.id);
        assert_eq!(
            CategoryRepo::get(&conn, travel.id).expect("get").word_count,
            1
        );
    }

    #[test]
    fn move_and_delete_preserve_srs_and_roll_back_mixed_batches() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let travel = CategoryRepo::create(&mut conn, 1, "Travel").expect("create");
        let first = add(&conn, "category airport", None);
        let second = add(&conn, "category ticket", None);
        let general = category(&conn, first);
        conn.execute(
            "UPDATE review_state SET interval = 42, due_at = 123456 WHERE user_vocabulary_id = ?1",
            [first],
        )
        .expect("srs");
        assert!(CategoryRepo::move_entries(&mut conn, &[first, i64::MAX], travel.id).is_err());
        assert_eq!(category(&conn, first), general, "whole batch rolls back");
        let foreign = CategoryRepo::create(&mut conn, 2, "Other language").expect("create");
        assert!(CategoryRepo::move_entries(&mut conn, &[first], foreign.id).is_err());
        CategoryRepo::move_entries(&mut conn, &[first, second, first], travel.id).expect("move");
        assert_eq!(
            CategoryRepo::get(&conn, travel.id).expect("get").word_count,
            2
        );
        CategoryRepo::delete(&mut conn, travel.id).expect("delete");
        assert_eq!(category(&conn, first), general);
        assert_eq!(category(&conn, second), general);
        let srs: (i64, i64) = conn
            .query_row(
                "SELECT interval, due_at FROM review_state WHERE user_vocabulary_id = ?1",
                [first],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .expect("srs");
        assert_eq!(srs, (42, 123456));
        assert!(CategoryRepo::get(&conn, travel.id).is_err());
    }

    #[test]
    fn add_wrong_language_category_rolls_back_created_lexeme() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let foreign = CategoryRepo::create(&mut conn, 2, "Foreign").expect("create");
        let result = VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: None,
                text: "category rejected word".into(),
                source_language: "en".into(),
                notes: None,
                source: None,
                category_id: Some(foreign.id),
            },
        );
        assert!(matches!(result, Err(AppError::Validation(_))));
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM lexeme WHERE normalized_text = 'category rejected word'",
                [],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(count, 0);
    }

    #[test]
    fn category_filter_combines_with_search_status_and_collection() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let travel = CategoryRepo::create(&mut conn, 1, "Travel").expect("create");
        let airport = add(&conn, "category airport", Some(travel.id));
        add(&conn, "category ticket", Some(travel.id));
        add(&conn, "category office", None);
        conn.execute(
            "INSERT INTO collection(name, language_id) VALUES ('category test', 1)",
            [],
        )
        .expect("collection");
        let collection_id = conn.last_insert_rowid();
        conn.execute("INSERT INTO collection_item(collection_id, lexeme_id) SELECT ?1, lexeme_id FROM user_vocabulary WHERE id = ?2", params![collection_id, airport]).expect("item");
        let mut filters = VocabularyFilters {
            search: Some("airport".into()),
            language_id: Some(1),
            status: Some("new".into()),
            collection_id: Some(collection_id),
            category_id: Some(travel.id),
            sort_by: None,
            sort_dir: None,
            page: None,
            per_page: None,
        };
        let entries = VocabularyRepo::list(&conn, &filters).expect("list");
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, airport);
        assert_eq!(entries[0].category_id, travel.id);
        filters.status = Some("learning".into());
        assert!(VocabularyRepo::list(&conn, &filters)
            .expect("list")
            .is_empty());
        filters.status = None;
        filters.search = None;
        filters.collection_id = None;
        filters.category_id = None;
        assert_eq!(VocabularyRepo::list(&conn, &filters).expect("all").len(), 3);
    }
    #[test]
    fn explicit_add_of_collection_word_claims_it_without_changing_srs() {
        use crate::db::repos::collection::CollectionRepo;
        use crate::db::repos::lexeme::LexemeRepo;

        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let travel = CategoryRepo::create(&mut conn, 1, "Travel").expect("category");
        for (tag, source, expected_source, survives_deactivation) in [
            ("manual", Some("manual"), "manual", true),
            ("fallback", None, "manual", true),
            ("collection", Some("collection"), "collection", false),
        ] {
            let text = format!("category claim {tag}");
            let lexeme =
                LexemeRepo::find_or_create(&conn, 1, &text, None, None, None).expect("lexeme");
            let collection =
                CollectionRepo::create(&conn, &format!("Category claim {tag}"), None, 1)
                    .expect("collection");
            conn.execute(
                "INSERT INTO collection_item(collection_id, lexeme_id) VALUES (?1, ?2)",
                params![collection.id, lexeme],
            )
            .expect("item");
            CollectionRepo::toggle(&mut conn, collection.id, true).expect("activate");
            let word: i64 = conn
                .query_row(
                    "SELECT id FROM user_vocabulary WHERE lexeme_id = ?1",
                    [lexeme],
                    |r| r.get(0),
                )
                .expect("word");
            conn.execute("UPDATE review_state SET interval = 42, due_at = 123456 WHERE user_vocabulary_id = ?1", [word]).expect("srs");

            // Merely organizing a collection word must retain collection ownership.
            CategoryRepo::move_entries(&mut conn, &[word], travel.id).expect("move");
            let original_source: String = conn
                .query_row(
                    "SELECT source FROM user_vocabulary WHERE id = ?1",
                    [word],
                    |r| r.get(0),
                )
                .expect("source");
            assert_eq!(original_source, "collection");
            VocabularyRepo::add(
                &conn,
                &AddVocabularyInput {
                    lexeme_id: Some(lexeme),
                    text,
                    source_language: "en".into(),
                    notes: None,
                    source: source.map(str::to_string),
                    category_id: Some(travel.id),
                },
            )
            .expect("explicit add");
            CollectionRepo::toggle(&mut conn, collection.id, false).expect("deactivate");
            let (saved_source, deleted, category_id): (String, Option<i64>, i64) = conn
                .query_row(
                    "SELECT source, deleted_at, category_id FROM user_vocabulary WHERE id = ?1",
                    [word],
                    |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
                )
                .expect("saved word");
            assert_eq!(saved_source, expected_source);
            assert_eq!(deleted.is_none(), survives_deactivation);
            assert_eq!(category_id, travel.id);
            let srs: (i64, i64) = conn
                .query_row(
                    "SELECT interval, due_at FROM review_state WHERE user_vocabulary_id = ?1",
                    [word],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .expect("srs");
            assert_eq!(srs, (42, 123456));
        }
    }
}
