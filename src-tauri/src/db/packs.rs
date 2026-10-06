// ============================================================
// LEXORA — System pack shells + lazy load pipeline
// ============================================================

use crate::commands::collections::PackLoadProgress;
use crate::commands::media::ensure_lexeme_image;
use crate::commands::settings::AppSettings;
use crate::commands::translate::{
    build_configured_registry, translate_text_with, EnrichMode, TranslateInput,
};
use crate::providers::models::roles::ModelRole;
use crate::db::repos::lexeme::LexemeRepo;
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{extract_json, RewriteRequest};
use rusqlite::{params, Connection};
use serde::Deserialize;
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager};

pub const PACK_LOAD_PROGRESS_EVENT: &str = "lexora:pack-load-progress";

const SYSTEM_PACKS: &[(&str, &str, &str, i64)] = &[
    (
        "top_5000",
        "Top 5000 Words",
        "Most frequent words for this language",
        1,
    ),
    (
        "phrasal_verbs",
        "Phrasal Verbs",
        "Common phrasal / multi-word verbs",
        2,
    ),
    (
        "irregular_verbs",
        "Irregular Verbs",
        "Irregular / strong verbs",
        3,
    ),
    (
        "business",
        "Business",
        "Business and workplace vocabulary",
        4,
    ),
    ("academic", "Academic", "University and exam vocabulary", 5),
    ("travel", "Travel", "Travel and hospitality vocabulary", 6),
];

fn pack_load_lock() -> &'static Mutex<bool> {
    static LOCK: OnceLock<Mutex<bool>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(false))
}

#[derive(Debug, Clone)]
struct SeedWord {
    text: String,
    pos: Option<String>,
    rank: Option<i64>,
    translation: Option<String>,
    example: Option<String>,
}

/// Ensure empty system pack shells exist for a language.
pub fn ensure_system_packs(conn: &Connection, language_id: i64) -> Result<usize, AppError> {
    let lang_code: String = conn
        .query_row(
            "SELECT code FROM language WHERE id = ?1",
            params![language_id],
            |row| row.get(0),
        )
        .map_err(|_| AppError::NotFound(format!("Language id {language_id} not found")))?;

    let mut created = 0usize;
    for (pack_key, name, description, sort_order) in SYSTEM_PACKS {
        let label = if lang_code == "en" {
            (*name).to_string()
        } else {
            format!("{name} ({})", lang_code.to_uppercase())
        };
        let changed = conn.execute(
            "INSERT OR IGNORE INTO collection
                (name, description, collection_type, language_id, is_active, sort_order, pack_key, load_status)
             VALUES (?1, ?2, 'system', ?3, 0, ?4, ?5, 'empty')",
            params![label, description, language_id, sort_order, pack_key],
        )?;
        created += changed;

        if lang_code == "en" {
            conn.execute(
                "UPDATE collection SET pack_key = COALESCE(pack_key, ?1)
                 WHERE language_id = ?2 AND name = ?3 AND pack_key IS NULL",
                params![pack_key, language_id, name],
            )?;
        }
    }
    Ok(created)
}

fn collection_meta(
    conn: &Connection,
    collection_id: i64,
) -> Result<(i64, String, String, String), AppError> {
    conn.query_row(
        "SELECT c.language_id, COALESCE(c.pack_key, ''), c.load_status, l.code
         FROM collection c
         JOIN language l ON l.id = c.language_id
         WHERE c.id = ?1",
        params![collection_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    )
    .map_err(|_| AppError::NotFound(format!("Collection {collection_id} not found")))
}

fn set_load_status(conn: &Connection, collection_id: i64, status: &str) -> Result<(), AppError> {
    if status == "ready" {
        conn.execute(
            "UPDATE collection SET load_status = ?1, loaded_at = unixepoch() WHERE id = ?2",
            params![status, collection_id],
        )?;
    } else {
        conn.execute(
            "UPDATE collection SET load_status = ?1 WHERE id = ?2",
            params![status, collection_id],
        )?;
    }
    Ok(())
}

fn emit_progress(app: &AppHandle, progress: &PackLoadProgress) {
    if let Err(e) = app.emit(PACK_LOAD_PROGRESS_EVENT, progress) {
        log::warn!("Failed to emit pack load progress: {e}");
    }
}

fn release_pack_lock() {
    if let Ok(mut guard) = pack_load_lock().lock() {
        *guard = false;
    }
}

/// Start background pack load. Returns immediately.
pub fn spawn_load_system_pack(
    app: AppHandle,
    pool: Arc<DbPool>,
    collection_id: i64,
    with_images: bool,
) -> Result<(), AppError> {
    {
        let mut guard = pack_load_lock()
            .lock()
            .map_err(|_| AppError::Validation("Pack load lock poisoned".into()))?;
        if *guard {
            return Err(AppError::Validation(
                "Another pack is already loading. Wait for it to finish.".into(),
            ));
        }
        *guard = true;
    }

    {
        let conn = pool.get()?;
        let (_lang_id, pack_key, status, _code) = collection_meta(&conn, collection_id)?;
        if pack_key.is_empty() {
            release_pack_lock();
            return Err(AppError::Validation(
                "Only system packs can be loaded this way".into(),
            ));
        }
        if status == "ready" {
            let count: i64 = conn.query_row(
                "SELECT COUNT(*) FROM collection_item WHERE collection_id = ?1",
                params![collection_id],
                |row| row.get(0),
            )?;
            if count > 0 {
                release_pack_lock();
                return Ok(());
            }
        }
        set_load_status(&conn, collection_id, "loading")?;
    }

    tauri::async_runtime::spawn(async move {
        let result = load_pack_job(app.clone(), pool.clone(), collection_id, with_images).await;
        if let Err(e) = result {
            log::warn!("Pack load failed: {e}");
            if let Ok(conn) = pool.get() {
                let _ = set_load_status(&conn, collection_id, "error");
            }
            emit_progress(
                &app,
                &PackLoadProgress {
                    collection_id,
                    done: 0,
                    total: 0,
                    phase: "error".into(),
                    text: None,
                    error: Some(e.to_string()),
                },
            );
        }
        release_pack_lock();
    });

    Ok(())
}

async fn load_pack_job(
    app: AppHandle,
    pool: Arc<DbPool>,
    collection_id: i64,
    with_images: bool,
) -> Result<(), AppError> {
    let (language_id, pack_key, _status, lang_code) = {
        let conn = pool.get()?;
        collection_meta(&conn, collection_id)?
    };

    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    let target_lang = {
        let iface = settings.interface_language.trim().to_lowercase();
        if !iface.is_empty() && iface != lang_code {
            iface
        } else if lang_code != "en" {
            "en".to_string()
        } else {
            "ru".to_string()
        }
    };

    let words = if lang_code == "en" {
        load_english_seed_words(&pack_key)?
    } else {
        generate_ai_pack_words(&app, &settings, &lang_code, &pack_key).await?
    };

    let total = words.len() as i64;
    emit_progress(
        &app,
        &PackLoadProgress {
            collection_id,
            done: 0,
            total,
            phase: "words".into(),
            text: Some(format!("Importing {total} words…")),
            error: None,
        },
    );

    let registry = build_configured_registry(&app, &pool, &settings, ModelRole::TextFast);
    let mut untranslated = 0usize;

    for (index, word) in words.iter().enumerate() {
        let lexeme_id = {
            let mut conn = pool.get()?;
            let tx = conn.transaction()?;
            let lexeme_id = LexemeRepo::find_or_create(
                &tx,
                language_id,
                &word.text,
                word.pos.as_deref(),
                None,
                word.rank,
            )?;
            tx.execute(
                "UPDATE lexeme SET is_system = 1 WHERE id = ?1",
                params![lexeme_id],
            )?;
            tx.execute(
                "INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
                 VALUES (?1, ?2, ?3)",
                params![collection_id, lexeme_id, index as i64 + 1],
            )?;

            if let Some(ref translation) = word.translation {
                let target_id = LexemeRepo::ensure_language(&tx, &target_lang)?;
                LexemeRepo::upsert_translation(
                    &tx,
                    lexeme_id,
                    target_id,
                    translation,
                    None,
                    Some("seed"),
                    Some(0.9),
            "general",
        )?;
            }

            if let Some(ref example) = word.example {
                LexemeRepo::upsert_example(&tx, lexeme_id, example, None, Some("seed"), None)?;
            }

            tx.commit()?;
            lexeme_id
        };

        if word.translation.is_none() {
            // No card enrichment while loading a pack: a 5000-word pack would
            // otherwise start thousands of LLM + image jobs in the background.
            if let Err(e) = translate_text_with(
                TranslateInput {
                    text: word.text.clone(),
                    source_language: Some(lang_code.clone()),
                    target_language: target_lang.clone(),
                    context_sentence: None,
                    lexical_domain: None,
                },
                pool.clone(),
                app.clone(),
                EnrichMode::Skip,
            )
            .await
            {
                untranslated += 1;
                log::warn!("Pack word '{}' left without translation: {e}", word.text);
            }
        }

        if with_images {
            let translation = word.translation.clone().unwrap_or_default();
            let _ = ensure_lexeme_image(
                &app,
                &pool,
                lexeme_id,
                &word.text,
                &translation,
                "",
                &settings,
                registry.as_ref(),
            )
            .await;
        }

        emit_progress(
            &app,
            &PackLoadProgress {
                collection_id,
                done: (index as i64) + 1,
                total,
                phase: if with_images {
                    "images".into()
                } else {
                    "words".into()
                },
                text: Some(word.text.clone()),
                error: None,
            },
        );

        if index + 1 < words.len() {
            tokio::time::sleep(std::time::Duration::from_millis(if with_images {
                80
            } else {
                10
            }))
            .await;
        }
    }

    {
        let conn = pool.get()?;
        set_load_status(&conn, collection_id, "ready")?;
    }

    emit_progress(
        &app,
        &PackLoadProgress {
            collection_id,
            done: total,
            total,
            phase: "done".into(),
            // Words without a gloss are translated later, when a card or sticker shows them.
            text: (untranslated > 0)
                .then(|| format!("{untranslated} words still without translation")),
            error: None,
        },
    );

    Ok(())
}

fn load_english_seed_words(pack_key: &str) -> Result<Vec<SeedWord>, AppError> {
    match pack_key {
        "top_5000" => {
            let mut words =
                parse_frequency_csv(include_str!("../../../scripts/seed/data/top5000.csv"))?;
            let extra =
                parse_frequency_csv(include_str!("../../../scripts/seed/data/top5000_extra.csv"))?;
            words.extend(extra);
            Ok(words)
        }
        "phrasal_verbs" => {
            parse_phrasal_csv(include_str!("../../../scripts/seed/data/phrasal_verbs.csv"))
        }
        "irregular_verbs" => parse_irregular_csv(include_str!(
            "../../../scripts/seed/data/irregular_verbs.csv"
        )),
        "business" | "academic" | "travel" => {
            let collection_name = match pack_key {
                "business" => "Business English",
                "academic" => "Academic English",
                "travel" => "Travel English",
                _ => unreachable!(),
            };
            parse_thematic_csv(
                include_str!("../../../scripts/seed/data/english_thematic.csv"),
                collection_name,
            )
        }
        other => Err(AppError::Validation(format!("Unknown pack key '{other}'"))),
    }
}

fn parse_frequency_csv(raw: &str) -> Result<Vec<SeedWord>, AppError> {
    let mut out = Vec::new();
    for (i, line) in raw.lines().enumerate() {
        if i == 0 || line.trim().is_empty() {
            continue;
        }
        let mut parts = line.splitn(3, ',');
        let word = parts.next().unwrap_or("").trim();
        let pos = parts.next().map(str::trim).filter(|s| !s.is_empty());
        let rank = parts.next().and_then(|s| s.trim().parse::<i64>().ok());
        if word.is_empty() {
            continue;
        }
        out.push(SeedWord {
            text: word.to_string(),
            pos: pos.map(String::from),
            rank,
            translation: None,
            example: None,
        });
    }
    Ok(out)
}

fn parse_phrasal_csv(raw: &str) -> Result<Vec<SeedWord>, AppError> {
    let mut out = Vec::new();
    for (i, line) in raw.lines().enumerate() {
        if i == 0 || line.trim().is_empty() {
            continue;
        }
        let (verb, rest) = line.split_once(',').unwrap_or((line, ""));
        let (translation, example) = split_csv_tail(rest);
        out.push(SeedWord {
            text: verb.trim().to_string(),
            pos: Some("phrase".into()),
            rank: None,
            translation,
            example,
        });
    }
    Ok(out)
}

fn parse_irregular_csv(raw: &str) -> Result<Vec<SeedWord>, AppError> {
    let mut out = Vec::new();
    for (i, line) in raw.lines().enumerate() {
        if i == 0 || line.trim().is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.splitn(4, ',').collect();
        let base = parts.first().map(|s| s.trim()).unwrap_or("");
        if base.is_empty() {
            continue;
        }
        let translation = parts.get(3).map(|s| s.trim().to_string());
        out.push(SeedWord {
            text: base.to_string(),
            pos: Some("verb".into()),
            rank: None,
            translation,
            example: None,
        });
    }
    Ok(out)
}

fn parse_thematic_csv(raw: &str, collection_name: &str) -> Result<Vec<SeedWord>, AppError> {
    let mut out = Vec::new();
    for (i, line) in raw.lines().enumerate() {
        if i == 0 || line.trim().is_empty() {
            continue;
        }
        let Some((col, rest)) = line.split_once(',') else {
            continue;
        };
        if col.trim() != collection_name {
            continue;
        }
        let Some((word, rest2)) = rest.split_once(',') else {
            continue;
        };
        let Some((pos, rest3)) = rest2.split_once(',') else {
            continue;
        };
        let (translation, example) = split_csv_tail(rest3);
        out.push(SeedWord {
            text: word.trim().to_string(),
            pos: Some(pos.trim().to_string()).filter(|s| !s.is_empty()),
            rank: None,
            translation,
            example,
        });
    }
    Ok(out)
}

fn split_csv_tail(rest: &str) -> (Option<String>, Option<String>) {
    let rest = rest.trim();
    if rest.is_empty() {
        return (None, None);
    }
    if let Some(idx) = rest.find(",\"") {
        let translation = rest[..idx].trim().trim_matches('"').to_string();
        let example = rest[idx + 1..].trim().trim_matches('"').to_string();
        return (
            Some(translation).filter(|s| !s.is_empty()),
            Some(example).filter(|s| !s.is_empty()),
        );
    }
    if let Some((a, b)) = rest.split_once(',') {
        return (
            Some(a.trim().to_string()).filter(|s| !s.is_empty()),
            Some(b.trim().trim_matches('"').to_string()).filter(|s| !s.is_empty()),
        );
    }
    (Some(rest.trim_matches('"').to_string()), None)
}

#[derive(Debug, Deserialize)]
struct AiPackBatch {
    words: Vec<AiPackWord>,
}

#[derive(Debug, Deserialize)]
struct AiPackWord {
    text: String,
    #[serde(default)]
    pos: Option<String>,
    #[serde(default)]
    rank: Option<i64>,
    #[serde(default)]
    translation: Option<String>,
}

async fn generate_ai_pack_words(
    app: &AppHandle,
    settings: &AppSettings,
    lang_code: &str,
    pack_key: &str,
) -> Result<Vec<SeedWord>, AppError> {
    let pool = app
        .try_state::<Arc<DbPool>>()
        .map(|state| state.inner().clone())
        .ok_or_else(|| AppError::Database("Database is not ready".to_string()))?;
    let registry = build_configured_registry(app, &pool, settings, ModelRole::TextQuality)
        .ok_or_else(|| AppError::ai_not_connected("Vocabulary packs"))?;

    let (kind, total) = match pack_key {
        "top_5000" => ("most frequent lemmas", 500usize),
        "phrasal_verbs" => ("common multi-word / phrasal-verb equivalents", 120),
        "irregular_verbs" => ("common irregular or strong verbs", 100),
        "business" => ("business and workplace vocabulary", 100),
        "academic" => ("academic / university vocabulary", 90),
        "travel" => ("travel and hospitality vocabulary", 70),
        other => {
            return Err(AppError::Validation(format!("Unknown pack key '{other}'")));
        }
    };

    let batch_size = 50usize;
    let mut collected: Vec<SeedWord> = Vec::new();
    let mut seen = std::collections::HashSet::new();

    while collected.len() < total {
        let start = collected.len() + 1;
        let end = (collected.len() + batch_size).min(total);
        let instruction = format!(
            "Ignore the placeholder text. Output ONLY a JSON object (no markdown) with this schema:\n\
             {{\"words\":[{{\"text\":\"lemma\",\"pos\":\"noun|verb|adj|adv|phrase\",\"rank\":1,\"translation\":null}}]}}\n\
             Language code: {lang_code}. Category: {kind}.\n\
             Return unique lemmas with ranks {start}–{end}. Natural citation forms only."
        );

        let result = registry
            .rewrite_text(RewriteRequest {
                text: "GENERATE_VOCAB_PACK".into(),
                language: lang_code.to_string(),
                mode: "custom".into(),
                custom_instruction: instruction,
            })
            .await;

        let raw = match result {
            Ok(res) => res.rewritten_text,
            Err(e) => {
                if collected.is_empty() {
                    return Err(e);
                }
                break;
            }
        };

        let parsed: AiPackBatch = match extract_json(&raw).and_then(|v| {
            serde_json::from_value(v)
                .map_err(|e| AppError::Provider(format!("Invalid pack JSON: {e}")))
        }) {
            Ok(batch) => batch,
            Err(_) => break,
        };

        let before = collected.len();
        for w in parsed.words {
            let text = w.text.trim().to_string();
            if text.is_empty() {
                continue;
            }
            let key = text.to_lowercase();
            if !seen.insert(key) {
                continue;
            }
            collected.push(SeedWord {
                text,
                pos: w.pos,
                rank: w.rank,
                translation: w.translation,
                example: None,
            });
            if collected.len() >= total {
                break;
            }
        }
        if collected.len() == before {
            break;
        }
    }

    if collected.is_empty() {
        return Err(AppError::Provider(
            "AI returned no words for this pack".into(),
        ));
    }

    Ok(collected)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations};

    #[test]
    fn ensure_system_packs_creates_empty_shells() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let conn = pool.get().expect("conn");
        // V018 strips seed items — top_5000 shell should be empty
        ensure_system_packs(&conn, 1).expect("ensure");
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM collection WHERE language_id = 1 AND pack_key IS NOT NULL",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(count >= 6);
        let word_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM collection_item ci
                 JOIN collection c ON c.id = ci.collection_id
                 WHERE c.pack_key = 'top_5000'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(word_count, 0);
    }

    #[test]
    fn parse_frequency_csv_reads_rows() {
        let words = parse_frequency_csv("word,pos,rank\nhello,noun,1\nworld,noun,2\n").unwrap();
        assert_eq!(words.len(), 2);
        assert_eq!(words[0].text, "hello");
    }
}
