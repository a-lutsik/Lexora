// ============================================================
// LEXORA — Export / Import Commands
// JSON-бэкап словаря (local-first, §2.8 плана).
// Формат файла версионируется; импорт — одна транзакция.
// ============================================================

use crate::db::repos::lexeme::LexemeRepo;
use crate::db::DbPool;
use crate::error::AppError;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tauri::State;

/// Текущая версия формата экспорт-файла.
const EXPORT_FORMAT_VERSION: i64 = 1;

// ── Формат файла ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportFile {
    pub version: i64,
    pub exported_at: i64,
    pub entries: Vec<ExportEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportEntry {
    pub language_code: String,
    pub text: String,
    pub normalized_text: String,
    pub part_of_speech: Option<String>,
    pub phonetic: Option<String>,
    pub translations: Vec<ExportTranslation>,
    pub notes: Option<String>,
    pub is_favorite: bool,
    pub source: Option<String>,
    pub added_at: i64,
    pub review_state: Option<ExportReviewState>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportTranslation {
    pub target_language_code: String,
    pub translated_text: String,
    pub sense: Option<String>,
    pub source: Option<String>,
    pub confidence: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportReviewState {
    pub status: String,
    pub ease: f64,
    pub interval: i64,
    pub due_at: i64,
    pub lapses: i64,
    pub repetitions: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: i64,
    pub skipped: i64,
}

// ── Commands ──────────────────────────────────────────────

#[tauri::command]
pub async fn export_vocabulary(path: String, db: State<'_, Arc<DbPool>>) -> Result<i64, AppError> {
    let pool = db.inner().clone();
    export_vocabulary_inner(&pool, Path::new(&path))
}

#[tauri::command]
pub async fn import_vocabulary(
    path: String,
    db: State<'_, Arc<DbPool>>,
) -> Result<ImportResult, AppError> {
    let pool = db.inner().clone();
    import_vocabulary_inner(&pool, Path::new(&path))
}

// ── Бизнес-логика (тестируемая без Tauri runtime) ────────

fn export_vocabulary_inner(pool: &DbPool, path: &Path) -> Result<i64, AppError> {
    let conn = pool.get()?;

    let mut stmt = conn.prepare(
        "SELECT uv.lexeme_id, uv.added_at, uv.is_favorite, uv.notes, uv.source,
                l.text, l.normalized_text, l.part_of_speech, l.phonetic,
                lang.code,
                rs.status, rs.ease, rs.interval, rs.due_at, rs.lapses, rs.repetitions
         FROM user_vocabulary uv
         JOIN lexeme l ON l.id = uv.lexeme_id
         JOIN language lang ON lang.id = l.language_id
         LEFT JOIN review_state rs ON rs.user_vocabulary_id = uv.id
         WHERE uv.deleted_at IS NULL
         ORDER BY uv.added_at ASC, uv.id ASC",
    )?;

    let entries = stmt
        .query_map([], |row| {
            let review_state = match row.get::<_, Option<String>>(10)? {
                Some(status) => Some(ExportReviewState {
                    status,
                    ease: row.get(11)?,
                    interval: row.get(12)?,
                    due_at: row.get(13)?,
                    lapses: row.get(14)?,
                    repetitions: row.get(15)?,
                }),
                None => None,
            };

            Ok((
                row.get::<_, i64>(0)?, // lexeme_id — для догрузки переводов
                ExportEntry {
                    added_at: row.get(1)?,
                    is_favorite: row.get::<_, i64>(2)? != 0,
                    notes: row.get(3)?,
                    source: row.get(4)?,
                    text: row.get(5)?,
                    normalized_text: row.get(6)?,
                    part_of_speech: row.get(7)?,
                    phonetic: row.get(8)?,
                    language_code: row.get(9)?,
                    translations: vec![],
                    review_state,
                },
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut tr_stmt = conn.prepare(
        "SELECT t.translated_text, t.sense, t.source, t.confidence, lang.code
         FROM translation t
         JOIN language lang ON lang.id = t.target_language_id
         WHERE t.lexeme_id = ?1
         ORDER BY t.confidence DESC, t.id ASC",
    )?;

    let count = entries.len() as i64;
    let mut out_entries = Vec::with_capacity(entries.len());
    for (lexeme_id, mut entry) in entries {
        entry.translations = tr_stmt
            .query_map(params![lexeme_id], |row| {
                Ok(ExportTranslation {
                    translated_text: row.get(0)?,
                    sense: row.get(1)?,
                    source: row.get(2)?,
                    confidence: row.get(3)?,
                    target_language_code: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        out_entries.push(entry);
    }

    let file = ExportFile {
        version: EXPORT_FORMAT_VERSION,
        exported_at: chrono::Utc::now().timestamp(),
        entries: out_entries,
    };

    let json = serde_json::to_string_pretty(&file)?;
    std::fs::write(path, json)?;

    log::info!("Exported {count} vocabulary entries to {}", path.display());
    Ok(count)
}

fn import_vocabulary_inner(pool: &DbPool, path: &Path) -> Result<ImportResult, AppError> {
    let raw = std::fs::read_to_string(path)?;
    let file: ExportFile = serde_json::from_str(&raw)
        .map_err(|e| AppError::Validation(format!("Invalid vocabulary export file: {e}")))?;

    if file.version != EXPORT_FORMAT_VERSION {
        return Err(AppError::Validation(format!(
            "Unsupported export format version {} (expected {EXPORT_FORMAT_VERSION})",
            file.version
        )));
    }

    let mut conn = pool.get()?;
    let tx = conn.transaction()?;

    let mut result = ImportResult {
        imported: 0,
        skipped: 0,
    };

    for entry in &file.entries {
        // 1. Язык лексемы — обязателен, иначе файл не соответствует схеме
        let language_id: i64 = tx
            .query_row(
                "SELECT id FROM language WHERE code = ?1",
                params![entry.language_code],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| {
                AppError::Validation(format!(
                    "Unknown language code '{}' in import file",
                    entry.language_code
                ))
            })?;

        // 2. Дедупликация лексемы по language + normalized_text
        let lexeme_id = LexemeRepo::find_or_create(
            &tx,
            language_id,
            &entry.text,
            entry.part_of_speech.as_deref(),
            entry.phonetic.as_deref(),
            None,
        )?;

        // 3. Уже есть в словаре (и не удалена) → пропускаем
        let existing: Option<(i64, Option<i64>)> = tx
            .query_row(
                "SELECT id, deleted_at FROM user_vocabulary
                 WHERE user_id = 1 AND lexeme_id = ?1",
                params![lexeme_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;

        if let Some((_, None)) = existing {
            result.skipped += 1;
            continue;
        }

        // 4. Вставка новой записи (или воскрешение soft-deleted)
        tx.execute(
            "INSERT INTO user_vocabulary (user_id, lexeme_id, source, notes, is_favorite, added_at)
             VALUES (1, ?1, 'import', ?2, ?3, ?4)
             ON CONFLICT(user_id, lexeme_id) DO UPDATE SET
                deleted_at = NULL,
                source = 'import',
                notes = COALESCE(?2, notes),
                is_favorite = ?3",
            params![
                lexeme_id,
                entry.notes,
                entry.is_favorite as i64,
                entry.added_at
            ],
        )?;

        let uv_id: i64 = tx.query_row(
            "SELECT id FROM user_vocabulary WHERE user_id = 1 AND lexeme_id = ?1",
            params![lexeme_id],
            |row| row.get(0),
        )?;

        // 5. Восстановление SRS-состояния (только для новой записи)
        match &entry.review_state {
            Some(rs) => {
                tx.execute(
                    "INSERT OR IGNORE INTO review_state
                        (user_vocabulary_id, status, ease, interval, due_at, lapses, repetitions)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        uv_id,
                        rs.status,
                        rs.ease,
                        rs.interval,
                        rs.due_at,
                        rs.lapses,
                        rs.repetitions
                    ],
                )?;
            }
            None => {
                tx.execute(
                    "INSERT OR IGNORE INTO review_state (user_vocabulary_id, status, due_at)
                     VALUES (?1, 'new', unixepoch())",
                    params![uv_id],
                )?;
            }
        }

        // 6. Переводы — не дублируем существующие
        for tr in &entry.translations {
            let target_language_id: Option<i64> = tx
                .query_row(
                    "SELECT id FROM language WHERE code = ?1",
                    params![tr.target_language_code],
                    |row| row.get(0),
                )
                .optional()?;

            let Some(target_language_id) = target_language_id else {
                log::warn!(
                    "Skipping translation with unknown target language '{}'",
                    tr.target_language_code
                );
                continue;
            };

            tx.execute(
                "INSERT INTO translation
                    (lexeme_id, target_language_id, translated_text, sense, source, confidence)
                 SELECT ?1, ?2, ?3, ?4, ?5, ?6
                 WHERE NOT EXISTS (
                    SELECT 1 FROM translation
                    WHERE lexeme_id = ?1 AND target_language_id = ?2 AND translated_text = ?3
                 )",
                params![
                    lexeme_id,
                    target_language_id,
                    tr.translated_text.trim(),
                    tr.sense,
                    tr.source,
                    tr.confidence
                ],
            )?;
        }

        result.imported += 1;
    }

    tx.commit()?;

    log::info!(
        "Imported {} entries ({} skipped) from {}",
        result.imported,
        result.skipped,
        path.display()
    );
    Ok(result)
}

// ── Tests ─────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vocabulary::AddVocabularyInput;
    use crate::db::repos::vocabulary::VocabularyRepo;
    use crate::db::{create_pool_test_memory, run_migrations};

    fn test_pool() -> DbPool {
        let pool = create_pool_test_memory().expect("in-memory pool");
        run_migrations(&pool).expect("migrations");
        pool
    }

    fn temp_file(tag: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "lexora-export-import-test-{tag}-{}.json",
            uuid::Uuid::new_v4()
        ))
    }

    fn seed_word(pool: &DbPool, text: &str, notes: Option<&str>) {
        let conn = pool.get().expect("conn");
        let uv_id = VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: None,
                text: text.to_string(),
                source_language: "en".to_string(),
                notes: notes.map(|s| s.to_string()),
                source: Some("manual".to_string()),
            },
        )
        .expect("add word");

        // Перевод + нетривиальное SRS-состояние для round-trip проверки
        let lexeme_id: i64 = conn
            .query_row(
                "SELECT lexeme_id FROM user_vocabulary WHERE id = ?1",
                params![uv_id],
                |row| row.get(0),
            )
            .expect("lexeme id");
        LexemeRepo::add_translation(
            &conn,
            lexeme_id,
            2,
            "перевод",
            None,
            Some("manual"),
            Some(0.9),
            "general",
        )
        .expect("add translation");
        conn.execute(
            "UPDATE review_state SET status = 'review', ease = 2.7, interval = 6,
                lapses = 1, repetitions = 4
             WHERE user_vocabulary_id = ?1",
            params![uv_id],
        )
        .expect("update review state");
    }

    #[test]
    fn export_import_roundtrip_into_empty_db() -> Result<(), AppError> {
        let src = test_pool();
        seed_word(&src, "apple", Some("fruit"));
        seed_word(&src, "serendipity", None);

        let path = temp_file("roundtrip");
        let exported = export_vocabulary_inner(&src, &path)?;
        assert_eq!(exported, 2);

        let dst = test_pool();
        let result = import_vocabulary_inner(&dst, &path)?;
        assert_eq!(result.imported, 2);
        assert_eq!(result.skipped, 0);

        // Данные восстановлены: лексема, заметки, перевод, SRS-состояние
        let conn = dst.get()?;
        let (text, notes): (String, Option<String>) = conn.query_row(
            "SELECT l.text, uv.notes
             FROM user_vocabulary uv JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE l.normalized_text = 'apple' AND uv.deleted_at IS NULL",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;
        assert_eq!(text, "apple");
        assert_eq!(notes.as_deref(), Some("fruit"));

        let tr_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM translation t
             JOIN lexeme l ON l.id = t.lexeme_id
             WHERE l.normalized_text = 'apple'",
            [],
            |row| row.get(0),
        )?;
        assert_eq!(tr_count, 1);

        let (status, ease, interval, lapses, repetitions): (String, f64, i64, i64, i64) = conn
            .query_row(
                "SELECT rs.status, rs.ease, rs.interval, rs.lapses, rs.repetitions
                 FROM review_state rs
                 JOIN user_vocabulary uv ON uv.id = rs.user_vocabulary_id
                 JOIN lexeme l ON l.id = uv.lexeme_id
                 WHERE l.normalized_text = 'apple'",
                [],
                |row| {
                    Ok((
                        row.get(0)?,
                        row.get(1)?,
                        row.get(2)?,
                        row.get(3)?,
                        row.get(4)?,
                    ))
                },
            )?;
        assert_eq!(
            (status.as_str(), ease, interval, lapses, repetitions),
            ("review", 2.7, 6, 1, 4)
        );

        let _ = std::fs::remove_file(&path);
        Ok(())
    }

    #[test]
    fn reimport_skips_existing_entries() -> Result<(), AppError> {
        let src = test_pool();
        seed_word(&src, "apple", None);
        seed_word(&src, "serendipity", None);

        let path = temp_file("reimport");
        export_vocabulary_inner(&src, &path)?;

        let dst = test_pool();
        let first = import_vocabulary_inner(&dst, &path)?;
        assert_eq!(first.imported, 2);

        let second = import_vocabulary_inner(&dst, &path)?;
        assert_eq!(second.imported, 0);
        assert_eq!(second.skipped, 2);

        // Переводы не задублировались (считаем только переводы слов из словаря,
        // системные коллекции V002 содержат свои переводы)
        let conn = dst.get()?;
        let tr_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM translation t
             JOIN lexeme l ON l.id = t.lexeme_id
             JOIN user_vocabulary uv ON uv.lexeme_id = l.id",
            [],
            |row| row.get(0),
        )?;
        assert_eq!(tr_count, 2);

        let _ = std::fs::remove_file(&path);
        Ok(())
    }

    #[test]
    fn import_broken_json_is_validation_error() -> Result<(), AppError> {
        let path = temp_file("broken");
        std::fs::write(&path, "{ not valid json !!!")?;

        let dst = test_pool();
        let err = import_vocabulary_inner(&dst, &path).expect_err("must fail");
        assert!(
            matches!(err, AppError::Validation(_)),
            "expected Validation error, got: {err:?}"
        );

        let _ = std::fs::remove_file(&path);
        Ok(())
    }

    #[test]
    fn import_unsupported_version_is_validation_error() -> Result<(), AppError> {
        let path = temp_file("version");
        std::fs::write(&path, r#"{"version": 99, "exported_at": 0, "entries": []}"#)?;

        let dst = test_pool();
        let err = import_vocabulary_inner(&dst, &path).expect_err("must fail");
        assert!(
            matches!(err, AppError::Validation(_)),
            "expected Validation error, got: {err:?}"
        );

        let _ = std::fs::remove_file(&path);
        Ok(())
    }
}
