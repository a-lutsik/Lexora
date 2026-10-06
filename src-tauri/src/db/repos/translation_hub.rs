// ============================================================
// LEXORA — Translation Hub Repository
// Stage 4: DB persistence for Multimodal Translation Hub history.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslationHistoryDto {
    pub id: i64,
    pub mode: String,
    pub source_language: String,
    pub target_language: String,
    pub original_text: String,
    pub translated_text: String,
    pub metadata_json: Option<String>,
    pub is_favorite: bool,
    pub created_at: i64,
}

pub struct TranslationHubRepo;

impl TranslationHubRepo {
    pub fn create_entry(
        conn: &Connection,
        mode: &str,
        source_language: &str,
        target_language: &str,
        original_text: &str,
        translated_text: &str,
        metadata_json: Option<&str>,
    ) -> Result<i64, AppError> {
        conn.execute(
            "INSERT INTO translation_history
             (mode, source_language, target_language, original_text, translated_text, metadata_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                mode,
                source_language,
                target_language,
                original_text,
                translated_text,
                metadata_json,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn list_history(
        conn: &Connection,
        mode: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<TranslationHistoryDto>, AppError> {
        let limit = limit.clamp(1, 100);
        let offset = offset.max(0);

        if let Some(m) = mode {
            let mut stmt = conn.prepare(
                "SELECT id, mode, source_language, target_language, original_text,
                        translated_text, metadata_json, is_favorite, created_at
                 FROM translation_history
                 WHERE mode = ?1 AND deleted_at IS NULL
                 ORDER BY created_at DESC, id DESC
                 LIMIT ?2 OFFSET ?3",
            )?;
            let rows = stmt
                .query_map(params![m, limit, offset], |row| {
                    Ok(TranslationHistoryDto {
                        id: row.get(0)?,
                        mode: row.get(1)?,
                        source_language: row.get(2)?,
                        target_language: row.get(3)?,
                        original_text: row.get(4)?,
                        translated_text: row.get(5)?,
                        metadata_json: row.get(6)?,
                        is_favorite: row.get::<_, i64>(7)? != 0,
                        created_at: row.get(8)?,
                    })
                })?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, mode, source_language, target_language, original_text,
                        translated_text, metadata_json, is_favorite, created_at
                 FROM translation_history
                 WHERE deleted_at IS NULL
                 ORDER BY created_at DESC, id DESC
                 LIMIT ?1 OFFSET ?2",
            )?;
            let rows = stmt
                .query_map(params![limit, offset], |row| {
                    Ok(TranslationHistoryDto {
                        id: row.get(0)?,
                        mode: row.get(1)?,
                        source_language: row.get(2)?,
                        target_language: row.get(3)?,
                        original_text: row.get(4)?,
                        translated_text: row.get(5)?,
                        metadata_json: row.get(6)?,
                        is_favorite: row.get::<_, i64>(7)? != 0,
                        created_at: row.get(8)?,
                    })
                })?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        }
    }

    pub fn toggle_favorite(conn: &Connection, id: i64) -> Result<bool, AppError> {
        let current: i64 = conn
            .query_row(
                "SELECT is_favorite FROM translation_history WHERE id = ?1 AND deleted_at IS NULL",
                params![id],
                |row| row.get(0),
            )
            .map_err(|_| AppError::NotFound(format!("Translation history entry {id} not found")))?;

        let new_val = if current == 0 { 1 } else { 0 };
        conn.execute(
            "UPDATE translation_history SET is_favorite = ?1 WHERE id = ?2",
            params![new_val, id],
        )?;
        Ok(new_val == 1)
    }

    pub fn delete_entry(conn: &Connection, id: i64) -> Result<(), AppError> {
        let rows = conn.execute(
            "UPDATE translation_history SET deleted_at = unixepoch() WHERE id = ?1 AND deleted_at IS NULL",
            params![id],
        )?;
        if rows == 0 {
            return Err(AppError::NotFound(format!(
                "Translation history entry {id} not found"
            )));
        }
        Ok(())
    }

    pub fn clear_history(conn: &Connection, mode: Option<&str>) -> Result<usize, AppError> {
        let rows = if let Some(m) = mode {
            conn.execute(
                "UPDATE translation_history SET deleted_at = unixepoch() WHERE mode = ?1 AND deleted_at IS NULL",
                params![m],
            )?
        } else {
            conn.execute(
                "UPDATE translation_history SET deleted_at = unixepoch() WHERE deleted_at IS NULL",
                params![],
            )?
        };
        Ok(rows)
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

    #[test]
    fn create_and_list_history() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id1 = TranslationHubRepo::create_entry(
            &conn,
            "text",
            "en",
            "ru",
            "Hello world",
            "Привет мир",
            None,
        )
        .expect("create text");

        let id2 = TranslationHubRepo::create_entry(
            &conn,
            "image",
            "en",
            "ru",
            "Stop sign",
            "Знак стоп",
            Some("{\"bboxes\":[]}"),
        )
        .expect("create image");

        let all = TranslationHubRepo::list_history(&conn, None, 10, 0).expect("list all");
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].id, id2);
        assert_eq!(all[1].id, id1);

        let image_only =
            TranslationHubRepo::list_history(&conn, Some("image"), 10, 0).expect("list image");
        assert_eq!(image_only.len(), 1);
        assert_eq!(image_only[0].mode, "image");

        // Toggle favorite
        let is_fav = TranslationHubRepo::toggle_favorite(&conn, id1).expect("toggle");
        assert!(is_fav);

        // Delete entry
        TranslationHubRepo::delete_entry(&conn, id2).expect("delete id2");
        let remaining = TranslationHubRepo::list_history(&conn, None, 10, 0).expect("list");
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].id, id1);
    }
}
