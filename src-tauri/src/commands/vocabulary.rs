// ============================================================
// LEXORA — Vocabulary Commands
// Все команды возвращают Result<T, AppError>.
// Бизнес-логика делегируется в репозиторий.
// ============================================================

use crate::commands::translate::{translate_in_background, TranslateInput};
use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::vocabulary::VocabularyRepo;
use crate::db::DbPool;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

pub const MAX_BULK_WORDS: usize = 100;
pub const MAX_CHARS_PER_LINE: usize = 200;
pub const BULK_TRANSLATE_DELAY_MS: u64 = 2000;
pub const BULK_TRANSLATE_PROGRESS_EVENT: &str = "lexora:bulk-translate-progress";

fn bulk_queue_lock() -> &'static Mutex<bool> {
    static LOCK: OnceLock<Mutex<bool>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(false))
}

/// Prefer interface_language as translation target; if it matches source, fall back to English
/// (never hardcode Russian).
pub(crate) fn resolve_target_language(interface_language: &str, source_language: &str) -> String {
    let iface = interface_language.trim().to_lowercase();
    let source = source_language.trim().to_lowercase();
    if !iface.is_empty() && iface != source {
        iface
    } else if source != "en" {
        "en".to_string()
    } else {
        "ru".to_string()
    }
}

// ── DTOs ─────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LexemeDto {
    pub id: i64,
    pub language_id: i64,
    pub text: String,
    pub normalized_text: String,
    pub part_of_speech: Option<String>,
    pub phonetic: Option<String>,
    pub frequency_rank: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TranslationDto {
    pub id: i64,
    pub lexeme_id: i64,
    pub target_language_id: i64,
    pub translated_text: String,
    pub sense: Option<String>,
    pub confidence: Option<f64>,
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExampleDto {
    pub id: i64,
    pub lexeme_id: i64,
    pub sentence: String,
    pub translation: Option<String>,
    pub source: Option<String>,
    pub difficulty: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReviewStateDto {
    pub id: i64,
    pub user_vocabulary_id: i64,
    pub status: String,
    pub ease: f64,
    pub interval: i64,
    pub due_at: i64,
    pub lapses: i64,
    pub repetitions: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyEntryDto {
    pub id: i64,
    pub user_id: i64,
    pub lexeme_id: i64,
    pub added_at: i64,
    pub is_favorite: bool,
    pub notes: Option<String>,
    pub source: Option<String>,
    pub lexeme: LexemeDto,
    pub translations: Vec<TranslationDto>,
    pub examples: Vec<ExampleDto>,
    pub synonyms: Vec<String>,
    pub review_state: Option<ReviewStateDto>,
    /// Persisted local image path (AI / stock / seed). Newest media row.
    #[serde(default)]
    pub image_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LanguageDto {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub native_name: String,
    pub has_tts: bool,
    pub has_asr: bool,
}

// ── Input types ───────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyFilters {
    pub search: Option<String>,
    pub language_id: Option<i64>,
    pub status: Option<String>,
    pub collection_id: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddVocabularyInput {
    pub lexeme_id: Option<i64>,
    pub text: String,
    pub source_language: String,
    pub notes: Option<String>,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddVocabularyBatchInput {
    pub texts: Vec<String>,
    pub source_language: String,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportWordListInput {
    pub path: String,
    pub source_language: String,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchAddedItem {
    pub text: String,
    pub lexeme_id: i64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AddVocabularyBatchResult {
    pub added: i64,
    pub skipped: i64,
    pub items: Vec<BatchAddedItem>,
    pub translate_queued: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BulkTranslateProgress {
    pub done: i64,
    pub total: i64,
    pub text: String,
    pub error: Option<String>,
}

/// Parse newline-separated word list: trim, skip blanks/long lines, dedupe (case-insensitive).
pub(crate) fn parse_word_list(raw: &str) -> Result<Vec<String>, AppError> {
    let mut seen = std::collections::HashSet::new();
    let mut words = Vec::new();
    for line in raw.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed.chars().count() > MAX_CHARS_PER_LINE {
            continue;
        }
        let key = trimmed.to_lowercase();
        if !seen.insert(key) {
            continue;
        }
        if words.len() >= MAX_BULK_WORDS {
            break;
        }
        words.push(trimmed.to_string());
    }
    if words.is_empty() {
        return Err(AppError::Validation(
            "Word list is empty. Add one word or phrase per line.".to_string(),
        ));
    }
    Ok(words)
}

fn validate_batch_texts(texts: &[String]) -> Result<Vec<String>, AppError> {
    if texts.is_empty() {
        return Err(AppError::Validation(
            "Word list is empty. Add one word or phrase per line.".to_string(),
        ));
    }
    if texts.len() > MAX_BULK_WORDS {
        return Err(AppError::Validation(format!(
            "Too many words (max {MAX_BULK_WORDS})"
        )));
    }
    // Re-normalize through the same parser so IPC and file paths share rules.
    let joined = texts.join("\n");
    parse_word_list(&joined)
}

fn try_begin_bulk_queue() -> Result<(), AppError> {
    let mut busy = bulk_queue_lock()
        .lock()
        .map_err(|_| AppError::Validation("Bulk translate queue is busy".to_string()))?;
    if *busy {
        return Err(AppError::Validation(
            "A bulk translate job is already running. Wait until it finishes.".to_string(),
        ));
    }
    *busy = true;
    Ok(())
}

fn end_bulk_queue() {
    if let Ok(mut busy) = bulk_queue_lock().lock() {
        *busy = false;
    }
}

fn spawn_bulk_translate_queue(
    app: AppHandle,
    pool: Arc<DbPool>,
    items: Vec<BatchAddedItem>,
    source_language: String,
    target_language: String,
) {
    tauri::async_runtime::spawn(async move {
        struct BulkGuard;
        impl Drop for BulkGuard {
            fn drop(&mut self) {
                end_bulk_queue();
            }
        }
        let _guard = BulkGuard;

        let total = items.len() as i64;
        for (index, item) in items.into_iter().enumerate() {
            let input = TranslateInput {
                text: item.text.clone(),
                source_language: Some(source_language.clone()),
                target_language: target_language.clone(),
                context_sentence: None,
                lexical_domain: None,
            };
            let error = match translate_in_background(input, pool.clone(), app.clone()).await {
                Ok(_) => None,
                Err(e) => {
                    log::warn!("Bulk translate failed for '{}': {e}", item.text);
                    Some(e.to_string())
                }
            };
            let payload = BulkTranslateProgress {
                done: (index as i64) + 1,
                total,
                text: item.text,
                error,
            };
            if let Err(e) = app.emit(BULK_TRANSLATE_PROGRESS_EVENT, &payload) {
                log::warn!("Failed to emit bulk translate progress: {e}");
            }
            if index + 1 < total as usize {
                tokio::time::sleep(Duration::from_millis(BULK_TRANSLATE_DELAY_MS)).await;
            }
        }
    });
}

fn add_vocabulary_batch_inner(
    pool: &Arc<DbPool>,
    app: &AppHandle,
    texts: Vec<String>,
    source_language: &str,
    source: Option<&str>,
) -> Result<AddVocabularyBatchResult, AppError> {
    let words = validate_batch_texts(&texts)?;
    let source_label = source.unwrap_or("bulk");

    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    let target_language = resolve_target_language(&settings.interface_language, source_language);
    let offline = settings.offline_mode || settings.ai_provider == "offline";
    let queue_locked = if !offline {
        try_begin_bulk_queue()?;
        true
    } else {
        false
    };

    let batch_result = (|| -> Result<(Vec<BatchAddedItem>, i64), AppError> {
        let mut conn = pool.get()?;
        let tx = conn.transaction()?;
        let mut added = Vec::new();
        let mut skip = 0i64;
        for text in &words {
            let language_id: i64 = tx
                .query_row(
                    "SELECT id FROM language WHERE code = ?1",
                    rusqlite::params![source_language],
                    |row| row.get(0),
                )
                .map_err(|_| {
                    AppError::NotFound(format!("Language '{source_language}' not found"))
                })?;

            let lexeme_id = crate::db::repos::lexeme::LexemeRepo::find_or_create(
                &tx,
                language_id,
                text,
                None,
                None,
                None,
            )?;
            crate::db::repos::lexeme::LexemeRepo::apply_seed_frequency(&tx, lexeme_id)?;

            let already_active: bool = tx
                .query_row(
                    "SELECT COUNT(*) FROM user_vocabulary
                     WHERE user_id = 1 AND lexeme_id = ?1 AND deleted_at IS NULL",
                    rusqlite::params![lexeme_id],
                    |row| row.get::<_, i64>(0),
                )
                .map(|c| c > 0)
                .unwrap_or(false);

            if already_active {
                skip += 1;
                continue;
            }

            let input = AddVocabularyInput {
                lexeme_id: Some(lexeme_id),
                text: text.clone(),
                source_language: source_language.to_string(),
                notes: None,
                source: Some(source_label.to_string()),
            };
            VocabularyRepo::add(&tx, &input)?;
            added.push(BatchAddedItem {
                text: text.clone(),
                lexeme_id,
            });
        }
        tx.commit()?;
        Ok((added, skip))
    })();

    let (added_items, skipped) = match batch_result {
        Ok(pair) => pair,
        Err(e) => {
            if queue_locked {
                end_bulk_queue();
            }
            return Err(e);
        }
    };

    let translate_queued = if !added_items.is_empty() && queue_locked {
        spawn_bulk_translate_queue(
            app.clone(),
            pool.clone(),
            added_items.clone(),
            source_language.to_string(),
            target_language,
        );
        true
    } else {
        if queue_locked {
            end_bulk_queue();
        }
        false
    };

    Ok(AddVocabularyBatchResult {
        added: added_items.len() as i64,
        skipped,
        items: added_items,
        translate_queued,
    })
}

// ── Commands ──────────────────────────────────────────────

#[tauri::command]
pub async fn list_vocabulary(
    filters: VocabularyFilters,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<VocabularyEntryDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let language_id = filters.language_id.unwrap_or(1);
    let page = filters.page.unwrap_or(1).max(1);
    let per_page = filters.per_page.unwrap_or(50).min(200);
    let offset = (page - 1) * per_page;
    let search = filters.search.unwrap_or_default();

    let mut stmt = conn
        .prepare(
            "SELECT
            uv.id, uv.user_id, uv.lexeme_id, uv.added_at,
            uv.is_favorite, uv.notes, uv.source,
            l.id, l.language_id, l.text, l.normalized_text,
            l.part_of_speech, l.phonetic, l.frequency_rank, l.created_at,
            rs.id, rs.status, rs.ease, rs.interval, rs.due_at,
            rs.lapses, rs.repetitions
         FROM user_vocabulary uv
         JOIN lexeme l ON l.id = uv.lexeme_id
         LEFT JOIN review_state rs ON rs.user_vocabulary_id = uv.id
         WHERE uv.deleted_at IS NULL
           AND l.language_id = ?1
           AND l.deleted_at IS NULL
           AND (?2 = '' OR l.normalized_text LIKE '%' || LOWER(TRIM(?2)) || '%')
           AND (?3 IS NULL OR rs.status = ?3)
         ORDER BY uv.added_at DESC
         LIMIT ?4 OFFSET ?5",
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    let status_filter: Option<String> = filters.status.filter(|s| s != "all");

    let entries: Vec<_> = stmt
        .query_map(
            rusqlite::params![language_id, search, status_filter, per_page, offset],
            |row| {
                let review_state = match row.get::<_, Option<i64>>(15)? {
                    Some(rs_id) => Some(ReviewStateDto {
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
                    translations: vec![], // Loaded separately
                    examples: vec![],     // Loaded separately
                    synonyms: vec![],     // Loaded separately
                    review_state,
                    image_path: None,
                })
            },
        )
        .map_err(|e| AppError::Database(e.to_string()))?
        .collect::<Result<_, _>>()
        .map_err(|e| AppError::Database(e.to_string()))?;

    // Load translations, examples and synonyms for entries
    let mut enriched = entries;
    for entry in &mut enriched {
        entry.translations =
            crate::db::repos::lexeme::LexemeRepo::get_translations(&conn, entry.lexeme.id, None)?;
        entry.examples =
            crate::db::repos::lexeme::LexemeRepo::get_examples(&conn, entry.lexeme.id)?;
        entry.synonyms = crate::db::repos::lexeme::LexemeRepo::get_synonyms(
            &conn,
            entry.lexeme.id,
            entry.lexeme.language_id,
        )?;
        entry.image_path =
            crate::db::repos::lexeme::LexemeRepo::get_image_path(&conn, entry.lexeme.id)?;
    }

    Ok(enriched)
}

pub fn get_vocabulary_entry_by_id(
    conn: &rusqlite::Connection,
    id: i64,
) -> Result<VocabularyEntryDto, AppError> {
    let mut entry = conn
        .query_row(
            "SELECT uv.id, uv.user_id, uv.lexeme_id, uv.added_at,
                    uv.is_favorite, uv.notes, uv.source,
                    l.id, l.language_id, l.text, l.normalized_text,
                    l.part_of_speech, l.phonetic, l.frequency_rank, l.created_at,
                    rs.id, rs.status, rs.ease, rs.interval, rs.due_at,
                    rs.lapses, rs.repetitions
             FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             LEFT JOIN review_state rs ON rs.user_vocabulary_id = uv.id
             WHERE uv.id = ?1 AND uv.deleted_at IS NULL",
            rusqlite::params![id],
            |row| {
                let review_state = match row.get::<_, Option<i64>>(15)? {
                    Some(rs_id) => Some(ReviewStateDto {
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
                })
            },
        )
        .map_err(|_| AppError::NotFound(format!("Vocabulary entry {id} not found")))?;

    entry.translations =
        crate::db::repos::lexeme::LexemeRepo::get_translations(conn, entry.lexeme.id, None)?;
    entry.examples = crate::db::repos::lexeme::LexemeRepo::get_examples(conn, entry.lexeme.id)?;
    entry.synonyms = crate::db::repos::lexeme::LexemeRepo::get_synonyms(
        conn,
        entry.lexeme.id,
        entry.lexeme.language_id,
    )?;
    entry.image_path = crate::db::repos::lexeme::LexemeRepo::get_image_path(conn, entry.lexeme.id)?;

    Ok(entry)
}

#[tauri::command]
pub async fn get_vocabulary_entry(
    id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<VocabularyEntryDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    get_vocabulary_entry_by_id(&conn, id)
}

#[tauri::command]
pub async fn add_to_vocabulary(
    input: AddVocabularyInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<VocabularyEntryDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let normalized = input.text.trim().to_lowercase();

    // Find language by code
    let language_id: i64 = conn
        .query_row(
            "SELECT id FROM language WHERE code = ?1",
            rusqlite::params![input.source_language],
            |row| row.get(0),
        )
        .map_err(|_| {
            AppError::NotFound(format!("Language '{}' not found", input.source_language))
        })?;

    // Upsert lexeme (deduplication by normalized_text + language)
    let lexeme_id = if let Some(id) = input.lexeme_id {
        id
    } else {
        conn.execute(
            "INSERT OR IGNORE INTO lexeme (language_id, text, normalized_text, is_system)
             VALUES (?1, ?2, ?3, 0)",
            rusqlite::params![language_id, input.text.trim(), normalized],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

        conn.query_row(
            "SELECT id FROM lexeme WHERE language_id = ?1 AND normalized_text = ?2",
            rusqlite::params![language_id, normalized],
            |row| row.get(0),
        )
        .map_err(|e| AppError::Database(e.to_string()))?
    };
    crate::db::repos::lexeme::LexemeRepo::apply_seed_frequency(&conn, lexeme_id)?;

    // Add to user_vocabulary (transaction)
    conn.execute(
        "INSERT OR IGNORE INTO user_vocabulary (user_id, lexeme_id, source, notes)
         VALUES (1, ?1, ?2, ?3)",
        rusqlite::params![lexeme_id, input.source, input.notes],
    )
    .map_err(|e| AppError::Database(e.to_string()))?;

    let uv_id: i64 = conn
        .query_row(
            "SELECT id FROM user_vocabulary WHERE user_id = 1 AND lexeme_id = ?1",
            rusqlite::params![lexeme_id],
            |row| row.get(0),
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    // Create initial SRS review state if not exists
    conn.execute(
        "INSERT OR IGNORE INTO review_state (user_vocabulary_id, status, due_at)
         VALUES (?1, 'new', unixepoch())",
        rusqlite::params![uv_id],
    )
    .map_err(|e| AppError::Database(e.to_string()))?;

    // Popup/modal already started card enrich via translate_text when lexeme_id
    // is known. Re-running it here (and blocking on photo generation) reloaded
    // the card and grew extra example-skeleton panels after Add Word.
    let should_enrich = input.lexeme_id.is_none();
    let enrich_job = if should_enrich {
        let lexeme_text: String = conn
            .query_row(
                "SELECT text FROM lexeme WHERE id = ?1",
                rusqlite::params![lexeme_id],
                |row| row.get(0),
            )
            .unwrap_or_else(|_| input.text.trim().to_string());
        let settings = crate::db::repos::settings::SettingsRepo::get(&conn).unwrap_or_default();
        let source_lang = input.source_language.clone();
        let target_lang = resolve_target_language(&settings.interface_language, &source_lang);
        let main_translation =
            match crate::db::repos::lexeme::LexemeRepo::language_id_by_code(&conn, &target_lang) {
                Ok(tid) => crate::db::repos::lexeme::LexemeRepo::get_translations(
                    &conn,
                    lexeme_id,
                    Some(tid),
                )?
                .into_iter()
                .next()
                .map(|t| t.translated_text)
                .unwrap_or_default(),
                Err(_) => {
                    crate::db::repos::lexeme::LexemeRepo::get_translations(&conn, lexeme_id, None)?
                        .into_iter()
                        .next()
                        .map(|t| t.translated_text)
                        .unwrap_or_default()
                }
            };
        Some((lexeme_text, source_lang, target_lang, main_translation))
    } else {
        None
    };
    drop(conn);

    if let Some((lexeme_text, source_lang, target_lang, main_translation)) = enrich_job {
        crate::commands::translate::spawn_enrich(
            app,
            pool,
            lexeme_id,
            lexeme_text,
            source_lang,
            target_lang,
            main_translation,
        );
    }

    get_vocabulary_entry(uv_id, db).await
}

#[tauri::command]
pub async fn remove_from_vocabulary(id: i64, db: State<'_, Arc<DbPool>>) -> Result<(), AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    // Soft delete
    let affected = conn
        .execute(
            "UPDATE user_vocabulary SET deleted_at = unixepoch() WHERE id = ?1",
            rusqlite::params![id],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    if affected == 0 {
        return Err(AppError::NotFound(format!(
            "Vocabulary entry {id} not found"
        )));
    }

    Ok(())
}

#[tauri::command]
pub async fn toggle_favorite(
    id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<VocabularyEntryDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    conn.execute(
        "UPDATE user_vocabulary
         SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
         WHERE id = ?1 AND deleted_at IS NULL",
        rusqlite::params![id],
    )
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_vocabulary_entry(id, db).await
}

#[tauri::command]
pub async fn update_vocabulary_notes(
    id: i64,
    notes: String,
    db: State<'_, Arc<DbPool>>,
) -> Result<VocabularyEntryDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    conn.execute(
        "UPDATE user_vocabulary SET notes = ?1 WHERE id = ?2 AND deleted_at IS NULL",
        rusqlite::params![notes, id],
    )
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_vocabulary_entry(id, db).await
}

pub const MAX_EDIT_WORD_CHARS: usize = 200;

/// Result of the transactional part of an edit.
struct EditOutcome {
    renamed: bool,
    lexeme_id: i64,
    text: String,
    source_lang: String,
}

/// Fix a typo in a saved card: new spelling and/or main translation.
/// Review progress stays (the card is the same); everything generated for the
/// old spelling (phonetic, examples, image, mnemonic) is dropped and rebuilt
/// in the background. A spelling that already exists in the dictionary is rejected.
fn apply_entry_edit(
    conn: &mut rusqlite::Connection,
    id: i64,
    new_text: &str,
    new_translation: Option<&str>,
) -> Result<EditOutcome, AppError> {
    let text = new_text.trim();
    if text.is_empty() {
        return Err(AppError::Validation("Word is empty".to_string()));
    }
    if text.chars().count() > MAX_EDIT_WORD_CHARS {
        return Err(AppError::Validation(format!(
            "Word is longer than {MAX_EDIT_WORD_CHARS} characters"
        )));
    }
    let normalized = text.to_lowercase();

    let tx = conn.transaction()?;
    let (lexeme_id, language_id, old_text, old_normalized, is_system): (i64, i64, String, String, i64) = tx
        .query_row(
            "SELECT l.id, l.language_id, l.text, l.normalized_text, l.is_system
             FROM user_vocabulary uv JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE uv.id = ?1 AND uv.deleted_at IS NULL",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|_| AppError::NotFound(format!("Vocabulary entry {id} not found")))?;

    let respelled = text != old_text;
    let renamed = normalized != old_normalized;
    if renamed {
        if is_system != 0 {
            return Err(AppError::Validation(
                "Built-in dictionary words cannot be renamed".to_string(),
            ));
        }
        let taken: Option<i64> = tx
            .query_row(
                "SELECT id FROM lexeme WHERE language_id = ?1 AND normalized_text = ?2 AND id != ?3",
                rusqlite::params![language_id, normalized, lexeme_id],
                |row| row.get(0),
            )
            .ok();
        if taken.is_some() {
            return Err(AppError::Validation(
                "This word already exists in the dictionary".to_string(),
            ));
        }
    }
    if respelled {
        tx.execute(
            "INSERT INTO lexeme_fts (lexeme_fts, rowid, text, normalized_text) VALUES ('delete', ?1, ?2, ?3)",
            rusqlite::params![lexeme_id, old_text, old_normalized],
        )?;
        tx.execute(
            "UPDATE lexeme SET text = ?1, normalized_text = ?2, updated_at = unixepoch() WHERE id = ?3",
            rusqlite::params![text, normalized, lexeme_id],
        )?;
        tx.execute(
            "INSERT INTO lexeme_fts (rowid, text, normalized_text) VALUES (?1, ?2, ?3)",
            rusqlite::params![lexeme_id, text, normalized],
        )?;
    }
    if renamed {
        // Everything below describes the old spelling — it is rebuilt after commit.
        tx.execute(
            "UPDATE lexeme SET phonetic = NULL, enriched_at = NULL,
                    visual_sense = NULL, visual_association = NULL, visual_memory_hook = NULL,
                    visual_image_prompt = NULL, visual_photo_query = NULL
             WHERE id = ?1",
            rusqlite::params![lexeme_id],
        )?;
        tx.execute("DELETE FROM example WHERE lexeme_id = ?1", rusqlite::params![lexeme_id])?;
        tx.execute("DELETE FROM media WHERE lexeme_id = ?1", rusqlite::params![lexeme_id])?;
    }

    if let Some(translation) = new_translation.map(str::trim).filter(|t| !t.is_empty()) {
        let current: Option<(i64, String)> = tx
            .query_row(
                "SELECT id, translated_text FROM translation WHERE lexeme_id = ?1 ORDER BY id LIMIT 1",
                rusqlite::params![lexeme_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();
        match current {
            Some((tid, old)) if old != translation => {
                tx.execute(
                    "UPDATE translation SET translated_text = ?1, source = 'manual' WHERE id = ?2",
                    rusqlite::params![translation, tid],
                )?;
            }
            Some(_) => {}
            None => {
                let target: i64 = tx
                    .query_row("SELECT id FROM language WHERE code = 'ru'", [], |row| row.get(0))
                    .unwrap_or(language_id);
                tx.execute(
                    "INSERT INTO translation (lexeme_id, target_language_id, translated_text, source)
                     VALUES (?1, ?2, ?3, 'manual')",
                    rusqlite::params![lexeme_id, target, translation],
                )?;
            }
        }
    }

    let source_lang = tx
        .query_row(
            "SELECT code FROM language WHERE id = ?1",
            rusqlite::params![language_id],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_else(|_| "en".to_string());
    tx.commit()?;
    Ok(EditOutcome {
        renamed,
        lexeme_id,
        text: text.to_string(),
        source_lang,
    })
}

#[tauri::command]
pub async fn update_vocabulary_entry(
    id: i64,
    text: String,
    translation: Option<String>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<VocabularyEntryDto, AppError> {
    let pool = db.inner().clone();
    let (outcome, target_lang, main_translation) = {
        let mut conn = pool.get()?;
        let outcome = apply_entry_edit(&mut conn, id, &text, translation.as_deref())?;
        let settings = SettingsRepo::get(&conn).unwrap_or_default();
        let target_lang = resolve_target_language(&settings.interface_language, &outcome.source_lang);
        let main_translation = crate::db::repos::lexeme::LexemeRepo::get_translations(
            &conn,
            outcome.lexeme_id,
            None,
        )?
        .into_iter()
        .next()
        .map(|t| t.translated_text)
        .unwrap_or_default();
        (outcome, target_lang, main_translation)
    };

    if outcome.renamed {
        crate::commands::translate::spawn_enrich(
            app,
            pool.clone(),
            outcome.lexeme_id,
            outcome.text,
            outcome.source_lang,
            target_lang,
            main_translation,
        );
    }
    get_vocabulary_entry(id, db).await
}

#[tauri::command]
pub async fn count_vocabulary(
    language_id: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<i64, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM user_vocabulary uv
             JOIN lexeme l ON l.id = uv.lexeme_id
             WHERE uv.deleted_at IS NULL
               AND l.deleted_at IS NULL
               AND (?1 IS NULL OR l.language_id = ?1)",
            rusqlite::params![language_id],
            |row| row.get(0),
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(count)
}

#[tauri::command]
pub async fn add_vocabulary_batch(
    input: AddVocabularyBatchInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<AddVocabularyBatchResult, AppError> {
    let pool = db.inner().clone();
    add_vocabulary_batch_inner(
        &pool,
        &app,
        input.texts,
        &input.source_language,
        input.source.as_deref(),
    )
}

#[tauri::command]
pub async fn import_word_list(
    input: ImportWordListInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<AddVocabularyBatchResult, AppError> {
    let path = Path::new(&input.path);
    if !path.is_file() {
        return Err(AppError::NotFound(format!(
            "File not found: {}",
            input.path
        )));
    }
    let raw = std::fs::read_to_string(path)
        .map_err(|e| AppError::Io(format!("Failed to read word list: {e}")))?;
    let words = parse_word_list(&raw)?;
    let pool = db.inner().clone();
    add_vocabulary_batch_inner(
        &pool,
        &app,
        words,
        &input.source_language,
        input.source.as_deref().or(Some("file")),
    )
}

#[tauri::command]
pub async fn list_languages(db: State<'_, Arc<DbPool>>) -> Result<Vec<LanguageDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let mut stmt = conn
        .prepare("SELECT id, code, name, native_name, has_tts, has_asr FROM language ORDER BY name")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let languages: Vec<_> = stmt
        .query_map([], |row| {
            Ok(LanguageDto {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                native_name: row.get(3)?,
                has_tts: row.get::<_, i64>(4)? != 0,
                has_asr: row.get::<_, i64>(5)? != 0,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?
        .collect::<Result<_, _>>()
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(languages)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations};

    #[test]
    fn parse_word_list_trims_dedupes_and_rejects_empty() {
        let words = parse_word_list("  apple  \n\nApple\nget along\n").expect("words");
        assert_eq!(words, vec!["apple", "get along"]);
        assert!(parse_word_list("  \n\t\n ").is_err());
    }

    #[test]
    fn parse_word_list_skips_long_lines_and_caps() {
        let long = "x".repeat(MAX_CHARS_PER_LINE + 1);
        let words = parse_word_list(&format!("ok\n{long}\nfine")).expect("words");
        assert_eq!(words, vec!["ok", "fine"]);

        let many = (0..(MAX_BULK_WORDS + 3))
            .map(|i| format!("w{i}"))
            .collect::<Vec<_>>()
            .join("\n");
        let capped = parse_word_list(&many).expect("capped");
        assert_eq!(capped.len(), MAX_BULK_WORDS);
    }

    fn seeded_entry(pool: &DbPool, text: &str) -> i64 {
        let conn = pool.get().expect("conn");
        let input = AddVocabularyInput {
            lexeme_id: None,
            text: text.to_string(),
            source_language: "en".to_string(),
            notes: None,
            source: Some("manual".to_string()),
        };
        VocabularyRepo::add(&conn, &input).expect("add")
    }

    #[test]
    fn edit_entry_renames_and_resets_generated_data() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let id = seeded_entry(&pool, "recieve");
        let mut conn = pool.get().expect("conn");
        let lexeme_id: i64 = conn
            .query_row("SELECT lexeme_id FROM user_vocabulary WHERE id = ?1", [id], |r| r.get(0))
            .expect("lexeme");
        conn.execute(
            "INSERT INTO example (lexeme_id, sentence) VALUES (?1, 'I recieve mail.')",
            [lexeme_id],
        )
        .expect("example");
        conn.execute("UPDATE lexeme SET enriched_at = 1, phonetic = '/x/' WHERE id = ?1", [lexeme_id])
            .expect("enrich");

        let outcome = apply_entry_edit(&mut conn, id, "  Receive ", None).expect("edit");
        assert!(outcome.renamed);
        let (text, normalized, phonetic, enriched): (String, String, Option<String>, Option<i64>) = conn
            .query_row(
                "SELECT text, normalized_text, phonetic, enriched_at FROM lexeme WHERE id = ?1",
                [lexeme_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .expect("row");
        assert_eq!((text.as_str(), normalized.as_str()), ("Receive", "receive"));
        assert!(phonetic.is_none() && enriched.is_none());
        let examples: i64 = conn
            .query_row("SELECT COUNT(*) FROM example WHERE lexeme_id = ?1", [lexeme_id], |r| r.get(0))
            .expect("count");
        assert_eq!(examples, 0);
        // Same card, same SRS row.
        let reviews: i64 = conn
            .query_row("SELECT COUNT(*) FROM review_state WHERE user_vocabulary_id = ?1", [id], |r| r.get(0))
            .expect("reviews");
        assert_eq!(reviews, 1);
    }

    #[test]
    fn edit_entry_rejects_existing_word_and_empty_text() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let typo = seeded_entry(&pool, "recieve");
        seeded_entry(&pool, "receive");
        let mut conn = pool.get().expect("conn");
        assert!(matches!(
            apply_entry_edit(&mut conn, typo, "Receive", None),
            Err(AppError::Validation(_))
        ));
        assert!(matches!(
            apply_entry_edit(&mut conn, typo, "   ", None),
            Err(AppError::Validation(_))
        ));
        let text: String = conn
            .query_row(
                "SELECT l.text FROM user_vocabulary uv JOIN lexeme l ON l.id = uv.lexeme_id WHERE uv.id = ?1",
                [typo],
                |r| r.get(0),
            )
            .expect("text");
        assert_eq!(text, "recieve");
    }

    #[test]
    fn edit_entry_case_only_change_keeps_generated_data() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let id = seeded_entry(&pool, "paris");
        let mut conn = pool.get().expect("conn");
        conn.execute("UPDATE lexeme SET enriched_at = 1", []).expect("enrich");
        let outcome = apply_entry_edit(&mut conn, id, "Paris", None).expect("edit");
        assert!(!outcome.renamed);
        let enriched: Option<i64> = conn
            .query_row("SELECT enriched_at FROM lexeme WHERE id = ?1", [outcome.lexeme_id], |r| r.get(0))
            .expect("row");
        assert!(enriched.is_some());
    }

    #[test]
    fn batch_add_skips_duplicates_in_db() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        // Offline settings so queue does not start (no AppHandle for translate).
        {
            let conn = pool.get().expect("conn");
            conn.execute("UPDATE user_settings SET offline_mode = 1 WHERE id = 1", [])
                .ok();
        }

        // Minimal AppHandle is hard in unit tests — call inner pieces via repo path.
        let words = parse_word_list("alpha\nbeta\nalpha").expect("parse");
        assert_eq!(words.len(), 2);

        {
            let mut conn = pool.get().expect("conn");
            let tx = conn.transaction().expect("tx");
            for text in &words {
                let input = AddVocabularyInput {
                    lexeme_id: None,
                    text: text.clone(),
                    source_language: "en".to_string(),
                    notes: None,
                    source: Some("bulk".to_string()),
                };
                VocabularyRepo::add(&tx, &input).expect("add");
            }
            tx.commit().expect("commit");
        }

        let count: i64 = pool
            .get()
            .expect("conn")
            .query_row(
                "SELECT COUNT(*) FROM user_vocabulary WHERE deleted_at IS NULL",
                [],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(count, 2);

        // Second pass: both already active → would be skipped by batch logic
        let mut skipped = 0i64;
        let conn = pool.get().expect("conn");
        for text in &words {
            let language_id: i64 = conn
                .query_row("SELECT id FROM language WHERE code = 'en'", [], |r| {
                    r.get(0)
                })
                .expect("lang");
            let lexeme_id = crate::db::repos::lexeme::LexemeRepo::find_or_create(
                &conn,
                language_id,
                text,
                None,
                None,
                None,
            )
            .expect("lexeme");
            let already: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM user_vocabulary
                     WHERE user_id = 1 AND lexeme_id = ?1 AND deleted_at IS NULL",
                    rusqlite::params![lexeme_id],
                    |r| r.get::<_, i64>(0),
                )
                .map(|c| c > 0)
                .unwrap_or(false);
            if already {
                skipped += 1;
            }
        }
        assert_eq!(skipped, 2);
    }

    #[test]
    fn import_word_list_reads_file() {
        let dir = std::env::temp_dir().join(format!(
            "lexora-wordlist-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("time")
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).expect("dir");
        let path = dir.join("words.txt");
        std::fs::write(&path, "gamma\ndelta\ngamma\n").expect("write");
        let raw = std::fs::read_to_string(&path).expect("read");
        let words = parse_word_list(&raw).expect("parse");
        assert_eq!(words, vec!["gamma", "delta"]);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
