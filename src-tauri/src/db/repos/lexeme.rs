// ============================================================
// LEXORA — Lexeme Repository
// Handles canonical words/phrases, deduplication, search via FTS5.
// ============================================================

use crate::commands::vocabulary::{ExampleDto, LexemeDto, TranslationDto};
use crate::error::AppError;
use rusqlite::{params, Connection, OptionalExtension};
use std::collections::HashMap;
use std::sync::OnceLock;

/// Stored visual mnemonic fields on a lexeme (V011).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VisualMnemonicRow {
    pub sense: Option<String>,
    pub association: Option<String>,
    pub memory_hook: Option<String>,
    pub image_prompt: Option<String>,
    pub photo_query: Option<String>,
}

fn english_frequency_map() -> &'static HashMap<String, i64> {
    static MAP: OnceLock<HashMap<String, i64>> = OnceLock::new();
    MAP.get_or_init(|| {
        let mut map = HashMap::new();
        for raw in [
            include_str!("../../../../scripts/seed/data/top5000.csv"),
            include_str!("../../../../scripts/seed/data/top5000_extra.csv"),
        ] {
            for (i, line) in raw.lines().enumerate() {
                if i == 0 || line.trim().is_empty() {
                    continue;
                }
                let mut parts = line.splitn(3, ',');
                let word = parts.next().unwrap_or("").trim().to_lowercase();
                let _pos = parts.next();
                let rank = parts.next().and_then(|s| s.trim().parse::<i64>().ok());
                if word.is_empty() {
                    continue;
                }
                if let Some(rank) = rank {
                    map.entry(word).or_insert(rank);
                }
            }
        }
        map
    })
}

fn english_frequency_rank(normalized: &str) -> Option<i64> {
    english_frequency_map().get(normalized).copied()
}

pub struct LexemeRepo;

impl LexemeRepo {
    /// Normalize region/script tags to a base ISO 639-1 code.
    pub fn normalize_lang_code(raw: &str) -> Option<String> {
        let trimmed = raw.trim().to_lowercase().replace('_', "-");
        if trimmed.is_empty() || trimmed == "auto" {
            return None;
        }
        let base = trimmed.split('-').next().unwrap_or(&trimmed);
        let mapped = match base {
            "nb" | "nn" => "no",
            "iw" => "he",
            "in" => "id",
            "fil" => "tl",
            other => other,
        };
        Some(mapped.to_string())
    }

    /// Language id by ISO code (`en`, `ru`, …).
    pub fn language_id_by_code(conn: &Connection, code: &str) -> Result<i64, AppError> {
        let normalized = Self::normalize_lang_code(code).unwrap_or_else(|| code.to_lowercase());
        conn.query_row(
            "SELECT id FROM language WHERE code = ?1",
            params![normalized],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| AppError::NotFound(format!("Language '{code}' not found")))
    }

    /// ISO code by language id (`1` → `en`, …).
    pub fn language_code_by_id(conn: &Connection, id: i64) -> Result<String, AppError> {
        conn.query_row(
            "SELECT code FROM language WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| AppError::NotFound(format!("Language {id} not found")))
    }

    /// Ensure a language row exists (insert minimal stub for rare AI-detected codes).
    pub fn ensure_language(conn: &Connection, code: &str) -> Result<i64, AppError> {
        let normalized = Self::normalize_lang_code(code)
            .ok_or_else(|| AppError::Validation(format!("Invalid language code '{code}'")))?;

        if let Ok(id) = Self::language_id_by_code(conn, &normalized) {
            return Ok(id);
        }

        let name = normalized.to_uppercase();
        conn.execute(
            "INSERT OR IGNORE INTO language (code, name, native_name, writing_system, has_tts, has_asr)
             VALUES (?1, ?2, ?2, 'other', 0, 0)",
            params![normalized, name],
        )?;
        Self::language_id_by_code(conn, &normalized)
    }

    /// Exact lookup by (language_id, normalized_text). None if missing.
    pub fn find_by_normalized(
        conn: &Connection,
        language_id: i64,
        text: &str,
    ) -> Result<Option<LexemeDto>, AppError> {
        let normalized = text.trim().to_lowercase();
        if normalized.is_empty() {
            return Ok(None);
        }

        let row = conn
            .query_row(
                "SELECT id, language_id, text, normalized_text,
                        part_of_speech, phonetic, frequency_rank, created_at
                 FROM lexeme
                 WHERE language_id = ?1 AND normalized_text = ?2 AND deleted_at IS NULL",
                params![language_id, normalized],
                |row| {
                    Ok(LexemeDto {
                        id: row.get(0)?,
                        language_id: row.get(1)?,
                        text: row.get(2)?,
                        normalized_text: row.get(3)?,
                        part_of_speech: row.get(4)?,
                        phonetic: row.get(5)?,
                        frequency_rank: row.get(6)?,
                        created_at: row.get(7)?,
                    })
                },
            )
            .optional()?;

        Ok(row)
    }

    /// Lookup by primary key. None if missing or soft-deleted.
    pub fn get_by_id(conn: &Connection, lexeme_id: i64) -> Result<Option<LexemeDto>, AppError> {
        let row = conn
            .query_row(
                "SELECT id, language_id, text, normalized_text,
                        part_of_speech, phonetic, frequency_rank, created_at
                 FROM lexeme
                 WHERE id = ?1 AND deleted_at IS NULL",
                params![lexeme_id],
                |row| {
                    Ok(LexemeDto {
                        id: row.get(0)?,
                        language_id: row.get(1)?,
                        text: row.get(2)?,
                        normalized_text: row.get(3)?,
                        part_of_speech: row.get(4)?,
                        phonetic: row.get(5)?,
                        frequency_rank: row.get(6)?,
                        created_at: row.get(7)?,
                    })
                },
            )
            .optional()?;
        Ok(row)
    }

    /// Frequency rank from the seeded lexicon (Top 5000), if this form exists.
    /// Looks up DB first, then the embedded English frequency CSV (lazy packs
    /// no longer pre-insert all Top 5000 lexemes).
    pub fn seed_frequency_rank(
        conn: &Connection,
        language_id: i64,
        text: &str,
    ) -> Result<Option<i64>, AppError> {
        let normalized = text.trim().to_lowercase();
        if normalized.is_empty() {
            return Ok(None);
        }
        let rank = conn
            .query_row(
                "SELECT frequency_rank FROM lexeme
                 WHERE language_id = ?1
                   AND normalized_text = ?2
                   AND frequency_rank IS NOT NULL
                 LIMIT 1",
                params![language_id, normalized],
                |row| row.get(0),
            )
            .optional()?;
        if rank.is_some() {
            return Ok(rank);
        }

        let is_english: bool = conn
            .query_row(
                "SELECT code = 'en' FROM language WHERE id = ?1",
                params![language_id],
                |row| row.get(0),
            )
            .optional()?
            .unwrap_or(false);
        if is_english {
            return Ok(english_frequency_rank(&normalized));
        }
        Ok(None)
    }

    /// Fill `frequency_rank` from the seed list when the lexeme has none.
    pub fn apply_seed_frequency(
        conn: &Connection,
        lexeme_id: i64,
    ) -> Result<Option<i64>, AppError> {
        let (language_id, normalized, current): (i64, String, Option<i64>) = conn.query_row(
            "SELECT language_id, normalized_text, frequency_rank FROM lexeme WHERE id = ?1",
            params![lexeme_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;
        if current.is_some() {
            return Ok(current);
        }
        let Some(rank) = Self::seed_frequency_rank(conn, language_id, &normalized)? else {
            return Ok(None);
        };
        conn.execute(
            "UPDATE lexeme
             SET frequency_rank = ?1, updated_at = unixepoch()
             WHERE id = ?2 AND frequency_rank IS NULL",
            params![rank, lexeme_id],
        )?;
        Ok(Some(rank))
    }

    /// Find or create a lexeme by text and language_id (deduplication).
    pub fn find_or_create(
        conn: &Connection,
        language_id: i64,
        text: &str,
        part_of_speech: Option<&str>,
        phonetic: Option<&str>,
        frequency_rank: Option<i64>,
    ) -> Result<i64, AppError> {
        let trimmed = text.trim();
        let normalized = trimmed.to_lowercase();
        let frequency_rank =
            frequency_rank.or(Self::seed_frequency_rank(conn, language_id, trimmed)?);

        // 1. Try to find existing
        let existing: Option<i64> = conn
            .query_row(
                "SELECT id FROM lexeme WHERE language_id = ?1 AND normalized_text = ?2 AND deleted_at IS NULL",
                params![language_id, normalized],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(id) = existing {
            // Optionally update frequency or phonetic if missing
            if phonetic.is_some() || frequency_rank.is_some() || part_of_speech.is_some() {
                conn.execute(
                    "UPDATE lexeme SET
                        phonetic = COALESCE(?1, phonetic),
                        frequency_rank = COALESCE(?2, frequency_rank),
                        part_of_speech = COALESCE(?3, part_of_speech),
                        updated_at = unixepoch()
                     WHERE id = ?4",
                    params![phonetic, frequency_rank, part_of_speech, id],
                )?;
            }
            return Ok(id);
        }

        // 2. Insert new lexeme
        conn.execute(
            "INSERT INTO lexeme (language_id, text, normalized_text, part_of_speech, phonetic, frequency_rank, is_system)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)",
            params![language_id, trimmed, normalized, part_of_speech, phonetic, frequency_rank],
        )?;

        let new_id = conn.last_insert_rowid();

        // 3. Keep FTS index in sync
        conn.execute(
            "INSERT INTO lexeme_fts (rowid, text, normalized_text) VALUES (?1, ?2, ?3)",
            params![new_id, trimmed, normalized],
        )?;

        Ok(new_id)
    }

    /// Search lexemes using SQLite FTS5 full-text search.
    pub fn search_fts(
        conn: &Connection,
        language_id: i64,
        query: &str,
        limit: i64,
    ) -> Result<Vec<LexemeDto>, AppError> {
        let trimmed = query.trim();
        if trimmed.is_empty() {
            return Ok(vec![]);
        }

        // Prepare FTS prefix search token (e.g. "appl*")
        let fts_query = format!("{trimmed}*");

        let mut stmt = conn.prepare(
            "SELECT l.id, l.language_id, l.text, l.normalized_text,
                    l.part_of_speech, l.phonetic, l.frequency_rank, l.created_at
             FROM lexeme l
             JOIN lexeme_fts fts ON fts.rowid = l.id
             WHERE l.language_id = ?1
               AND l.deleted_at IS NULL
               AND lexeme_fts MATCH ?2
             ORDER BY rank
             LIMIT ?3",
        )?;

        let rows = stmt
            .query_map(params![language_id, fts_query, limit], |row| {
                Ok(LexemeDto {
                    id: row.get(0)?,
                    language_id: row.get(1)?,
                    text: row.get(2)?,
                    normalized_text: row.get(3)?,
                    part_of_speech: row.get(4)?,
                    phonetic: row.get(5)?,
                    frequency_rank: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(rows)
    }

    /// Add a translation for a lexeme (no dedup — callers use upsert helpers).
    // One parameter per column of the `translation` row.
    #[allow(clippy::too_many_arguments)]
    pub fn add_translation(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: i64,
        translated_text: &str,
        sense: Option<&str>,
        source: Option<&str>,
        confidence: Option<f64>,
        lexical_domain: &str,
    ) -> Result<i64, AppError> {
        let domain = crate::providers::ai::lexical_domain::parse_resolved_domain(Some(lexical_domain))
            .unwrap_or_else(|| "general".to_string());
        conn.execute(
            "INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence, lexical_domain)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                lexeme_id,
                target_language_id,
                translated_text.trim(),
                sense,
                source,
                confidence,
                domain
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Insert translation if the same (lexeme, target, domain, normalized text) is absent.
    // One parameter per column of the `translation` row.
    #[allow(clippy::too_many_arguments)]
    pub fn upsert_translation(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: i64,
        translated_text: &str,
        sense: Option<&str>,
        source: Option<&str>,
        confidence: Option<f64>,
        lexical_domain: &str,
    ) -> Result<(), AppError> {
        let trimmed = translated_text.trim();
        if trimmed.is_empty() {
            return Ok(());
        }
        let domain = crate::providers::ai::lexical_domain::parse_resolved_domain(Some(lexical_domain))
            .unwrap_or_else(|| "general".to_string());
        // Case-insensitive dedup. Comparison happens in Rust because SQLite's
        // LOWER() only folds ASCII — Cyrillic and other scripts would slip
        // through (e.g. "Яблоко" vs "яблоко").
        let normalized = trimmed.to_lowercase();
        let mut stmt = conn.prepare(
            "SELECT translated_text FROM translation
             WHERE lexeme_id = ?1 AND target_language_id = ?2 AND lexical_domain = ?3",
        )?;
        let exists = stmt
            .query_map(params![lexeme_id, target_language_id, domain], |row| {
                row.get::<_, String>(0)
            })?
            .collect::<Result<Vec<_>, _>>()?
            .iter()
            .any(|text| text.trim().to_lowercase() == normalized);
        if exists {
            return Ok(());
        }
        Self::add_translation(
            conn,
            lexeme_id,
            target_language_id,
            trimmed,
            sense,
            source,
            confidence,
            &domain,
        )?;
        Ok(())
    }

    /// Get translations for a lexeme, optionally filtered by target language and domain.
    pub fn get_translations(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: Option<i64>,
    ) -> Result<Vec<TranslationDto>, AppError> {
        Self::get_translations_for_domain(conn, lexeme_id, target_language_id, None)
    }

    pub fn get_translations_for_domain(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: Option<i64>,
        lexical_domain: Option<&str>,
    ) -> Result<Vec<TranslationDto>, AppError> {
        let domain = lexical_domain
            .and_then(|d| {
                crate::providers::ai::lexical_domain::parse_resolved_domain(Some(d))
            });
        let mut stmt = conn.prepare(
            "SELECT id, lexeme_id, target_language_id, translated_text, sense, confidence, lexical_domain
             FROM translation
             WHERE lexeme_id = ?1
               AND (?2 IS NULL OR target_language_id = ?2)
               AND (?3 IS NULL OR lexical_domain = ?3)
             ORDER BY confidence DESC, id ASC",
        )?;

        let rows = stmt
            .query_map(
                params![lexeme_id, target_language_id, domain],
                |row| {
                    Ok(TranslationDto {
                        id: row.get(0)?,
                        lexeme_id: row.get(1)?,
                        target_language_id: row.get(2)?,
                        translated_text: row.get(3)?,
                        sense: row.get(4)?,
                        confidence: row.get(5)?,
                        lexical_domain: row.get(6)?,
                    })
                },
            )?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(rows)
    }

    /// Upsert a synonym for a lexeme in a given language.
    pub fn upsert_synonym(
        conn: &Connection,
        lexeme_id: i64,
        language_id: i64,
        text: &str,
        source: Option<&str>,
    ) -> Result<(), AppError> {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return Ok(());
        }
        let normalized = trimmed.to_lowercase();
        conn.execute(
            "INSERT OR IGNORE INTO lexeme_synonym
                (lexeme_id, language_id, text, normalized_text, source)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![lexeme_id, language_id, trimmed, normalized, source],
        )?;
        Ok(())
    }

    /// Synonym texts for a lexeme filtered by language.
    pub fn get_synonyms(
        conn: &Connection,
        lexeme_id: i64,
        language_id: i64,
    ) -> Result<Vec<String>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT text FROM lexeme_synonym
             WHERE lexeme_id = ?1 AND language_id = ?2
             ORDER BY id ASC",
        )?;
        let rows = stmt
            .query_map(params![lexeme_id, language_id], |row| row.get(0))?
            .collect::<Result<Vec<String>, _>>()?;
        Ok(rows)
    }

    /// Get usage examples for a lexeme (for cloze mode and word detail).
    pub fn get_examples(conn: &Connection, lexeme_id: i64) -> Result<Vec<ExampleDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, lexeme_id, sentence, translation, source, difficulty
             FROM example
             WHERE lexeme_id = ?1
             ORDER BY difficulty ASC, id ASC",
        )?;

        let rows = stmt
            .query_map(params![lexeme_id], |row| {
                Ok(ExampleDto {
                    id: row.get(0)?,
                    lexeme_id: row.get(1)?,
                    sentence: row.get(2)?,
                    translation: row.get(3)?,
                    source: row.get(4)?,
                    difficulty: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(rows)
    }

    /// Insert an example if the same sentence is not already stored.
    pub fn upsert_example(
        conn: &Connection,
        lexeme_id: i64,
        sentence: &str,
        translation: Option<&str>,
        source: Option<&str>,
        difficulty: Option<i64>,
    ) -> Result<(), AppError> {
        let trimmed = sentence.trim();
        if trimmed.is_empty() {
            return Ok(());
        }
        let exists: Option<i64> = conn
            .query_row(
                "SELECT id FROM example
                 WHERE lexeme_id = ?1 AND LOWER(TRIM(sentence)) = LOWER(TRIM(?2))",
                params![lexeme_id, trimmed],
                |row| row.get(0),
            )
            .optional()?;
        if exists.is_some() {
            return Ok(());
        }
        conn.execute(
            "INSERT INTO example (lexeme_id, sentence, translation, source, difficulty)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![lexeme_id, trimmed, translation, source, difficulty],
        )?;
        Ok(())
    }

    /// True when the lexeme has no real photo yet (missing, or only a seed SVG).
    pub fn needs_associated_image(conn: &Connection, lexeme_id: i64) -> Result<bool, AppError> {
        let provider: Option<String> = conn
            .query_row(
                "SELECT provider FROM media
                 WHERE lexeme_id = ?1 AND media_type IN ('image', 'gif')
                 ORDER BY id DESC LIMIT 1",
                params![lexeme_id],
                |row| row.get(0),
            )
            .optional()?;
        Ok(match provider {
            None => true,
            Some(p) => {
                let p = p.trim();
                p.is_empty() || p.eq_ignore_ascii_case("seed-svg")
            }
        })
    }

    /// Local image/gif path for a lexeme, if cached. Newest row wins after regenerate.
    pub fn get_image_path(conn: &Connection, lexeme_id: i64) -> Result<Option<String>, AppError> {
        let path = conn
            .query_row(
                "SELECT local_path FROM media
                 WHERE lexeme_id = ?1 AND media_type IN ('image', 'gif')
                 ORDER BY id DESC LIMIT 1",
                params![lexeme_id],
                |row| row.get(0),
            )
            .optional()?;
        Ok(path)
    }

    /// Source URLs already stored for this lexeme — skip them when regenerating.
    pub fn list_image_source_urls(
        conn: &Connection,
        lexeme_id: i64,
    ) -> Result<Vec<String>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT source_url FROM media
             WHERE lexeme_id = ?1 AND media_type IN ('image', 'gif')
               AND source_url IS NOT NULL AND TRIM(source_url) != ''",
        )?;
        let urls = stmt
            .query_map(params![lexeme_id], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(urls)
    }

    /// Content hashes already stored for this lexeme.
    pub fn list_image_content_hashes(
        conn: &Connection,
        lexeme_id: i64,
    ) -> Result<Vec<String>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT content_hash FROM media
             WHERE lexeme_id = ?1 AND media_type IN ('image', 'gif')
               AND content_hash IS NOT NULL AND TRIM(content_hash) != ''",
        )?;
        let hashes = stmt
            .query_map(params![lexeme_id], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(hashes)
    }

    /// Persist cached media row (idempotent by content_hash when provided).
    pub fn upsert_media(
        conn: &Connection,
        lexeme_id: i64,
        media_type: &str,
        local_path: &str,
        source_url: Option<&str>,
        provider: Option<&str>,
        content_hash: Option<&str>,
    ) -> Result<(), AppError> {
        if let Some(hash) = content_hash {
            let exists: Option<i64> = conn
                .query_row(
                    "SELECT id FROM media WHERE lexeme_id = ?1 AND content_hash = ?2",
                    params![lexeme_id, hash],
                    |row| row.get(0),
                )
                .optional()?;
            if exists.is_some() {
                return Ok(());
            }
        }
        conn.execute(
            "INSERT INTO media (lexeme_id, media_type, local_path, source_url, provider, content_hash)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![lexeme_id, media_type, local_path, source_url, provider, content_hash],
        )?;
        Ok(())
    }

    /// Persist visual mnemonic metadata for a lexeme (overwrite).
    pub fn upsert_visual_mnemonic(
        conn: &Connection,
        lexeme_id: i64,
        sense: &str,
        association: &str,
        memory_hook: &str,
        image_prompt: &str,
        photo_query: &str,
    ) -> Result<(), AppError> {
        conn.execute(
            "UPDATE lexeme SET
                visual_sense = ?2,
                visual_association = ?3,
                visual_memory_hook = ?4,
                visual_image_prompt = ?5,
                visual_photo_query = ?6,
                updated_at = unixepoch()
             WHERE id = ?1",
            params![
                lexeme_id,
                sense.trim(),
                association.trim(),
                memory_hook.trim(),
                image_prompt.trim(),
                photo_query.trim(),
            ],
        )?;
        Ok(())
    }

    /// Load stored visual mnemonic fields (any may be None).
    pub fn get_visual_mnemonic(
        conn: &Connection,
        lexeme_id: i64,
    ) -> Result<Option<VisualMnemonicRow>, AppError> {
        let row = conn
            .query_row(
                "SELECT visual_sense, visual_association, visual_memory_hook,
                        visual_image_prompt, visual_photo_query
                 FROM lexeme WHERE id = ?1",
                params![lexeme_id],
                |row| {
                    Ok(VisualMnemonicRow {
                        sense: row.get(0)?,
                        association: row.get(1)?,
                        memory_hook: row.get(2)?,
                        image_prompt: row.get(3)?,
                        photo_query: row.get(4)?,
                    })
                },
            )
            .optional()?;
        Ok(row)
    }

    /// Mark lexeme as fully enriched (example + media attempted).
    pub fn mark_enriched(conn: &Connection, lexeme_id: i64) -> Result<(), AppError> {
        conn.execute(
            "UPDATE lexeme SET enriched_at = unixepoch(), updated_at = unixepoch() WHERE id = ?1",
            params![lexeme_id],
        )?;
        Ok(())
    }

    /// Whether enrichment already ran for this lexeme.
    pub fn is_enriched(conn: &Connection, lexeme_id: i64) -> Result<bool, AppError> {
        let enriched: Option<i64> = conn
            .query_row(
                "SELECT enriched_at FROM lexeme WHERE id = ?1",
                params![lexeme_id],
                |row| row.get(0),
            )
            .optional()?
            .flatten();
        Ok(enriched.is_some())
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
    fn find_or_create_deduplicates_by_normalized_text() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id1 = LexemeRepo::find_or_create(&conn, 1, " Zzt Dedup ", None, None, None)
            .expect("first create");
        let id2 = LexemeRepo::find_or_create(&conn, 1, "zzt dedup", None, None, None)
            .expect("second call");

        assert_eq!(id1, id2, "dedup must return the same lexeme id");

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM lexeme WHERE language_id = 1 AND normalized_text = 'zzt dedup'",
                [],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(count, 1, "no duplicate lexeme row");

        let text: String = conn
            .query_row("SELECT text FROM lexeme WHERE id = ?1", params![id1], |r| {
                r.get(0)
            })
            .expect("text");
        assert_eq!(text, "Zzt Dedup");
    }

    #[test]
    fn find_or_create_fills_missing_metadata_on_existing() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_meta", None, None, None).expect("create");
        let id2 = LexemeRepo::find_or_create(
            &conn,
            1,
            "zzt_meta",
            Some("noun"),
            Some("/zzt/"),
            Some(4242),
        )
        .expect("update call");

        assert_eq!(id, id2);
        let (pos, phonetic, freq): (Option<String>, Option<String>, Option<i64>) = conn
            .query_row(
                "SELECT part_of_speech, phonetic, frequency_rank FROM lexeme WHERE id = ?1",
                params![id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .expect("metadata");
        assert_eq!(pos.as_deref(), Some("noun"));
        assert_eq!(phonetic.as_deref(), Some("/zzt/"));
        assert_eq!(freq, Some(4242));
    }

    #[test]
    fn find_or_create_matches_seeded_word() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Lazy packs no longer pre-insert Top 5000; find_or_create still
        // attaches frequency from the embedded English frequency CSV.
        let id = LexemeRepo::find_or_create(&conn, 1, " The ", None, None, None)
            .expect("find_or_create");
        let id2 = LexemeRepo::find_or_create(&conn, 1, "the", None, None, None).expect("dedupe");
        assert_eq!(id, id2);

        let rank: Option<i64> = conn
            .query_row(
                "SELECT frequency_rank FROM lexeme WHERE id = ?1",
                params![id],
                |r| r.get(0),
            )
            .expect("rank");
        assert_eq!(rank, Some(2), "embedded CSV rank for 'the' is 2");
    }

    #[test]
    fn seed_frequency_rank_finds_top5000_word() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        assert_eq!(
            LexemeRepo::seed_frequency_rank(&conn, 1, "  SUPPOSED ")
                .expect("lookup")
                .expect("ranked"),
            434
        );
        assert!(LexemeRepo::seed_frequency_rank(&conn, 1, "zzt_not_in_seed")
            .expect("missing")
            .is_none());
    }

    #[test]
    fn find_by_normalized_and_synonyms_roundtrip() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id = LexemeRepo::find_or_create(&conn, 1, "zzt_syn", Some("noun"), None, None)
            .expect("create");
        LexemeRepo::upsert_synonym(&conn, id, 1, "syn-a", Some("test")).expect("syn a");
        LexemeRepo::upsert_synonym(&conn, id, 1, "Syn-A", Some("test")).expect("dup ignore");
        LexemeRepo::upsert_synonym(&conn, id, 2, "синоним", Some("test")).expect("syn ru");

        let found = LexemeRepo::find_by_normalized(&conn, 1, " ZZT_SYN ")
            .expect("find")
            .expect("present");
        assert_eq!(found.id, id);

        let en = LexemeRepo::get_synonyms(&conn, id, 1).expect("en");
        assert_eq!(en, vec!["syn-a".to_string()]);
        let ru = LexemeRepo::get_synonyms(&conn, id, 2).expect("ru");
        assert_eq!(ru, vec!["синоним".to_string()]);
    }

    #[test]
    fn upsert_translation_is_idempotent() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id = LexemeRepo::find_or_create(&conn, 1, "zzt_up", None, None, None).expect("create");
        LexemeRepo::upsert_translation(&conn, id, 2, "яблоко", None, Some("ai"), Some(0.9),
            "general",
        )
            .expect("first");
        LexemeRepo::upsert_translation(&conn, id, 2, " Яблоко ", None, Some("ai"), Some(0.9),
            "general",
        )
            .expect("second");
        let tr = LexemeRepo::get_translations(&conn, id, Some(2)).expect("list");
        assert_eq!(tr.len(), 1);
    }

    #[test]
    fn translations_roundtrip_with_language_filter_and_confidence_order() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let lexeme_id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_trans", None, None, None).expect("create");
        LexemeRepo::add_translation(&conn, lexeme_id, 2, "низкая", None, Some("test"), Some(0.5),
            "general",
        )
            .expect("translation ru");
        LexemeRepo::add_translation(
            &conn,
            lexeme_id,
            2,
            "высокая",
            None,
            Some("test"),
            Some(0.9),
            "general",
        )
        .expect("translation ru 2");
        LexemeRepo::add_translation(&conn, lexeme_id, 3, "deutsch", None, Some("test"), None, "general")
            .expect("translation de");

        let all = LexemeRepo::get_translations(&conn, lexeme_id, None).expect("all");
        assert_eq!(all.len(), 3);
        assert_eq!(all[0].translated_text, "высокая");
        assert_eq!(all[1].translated_text, "низкая");

        let ru_only = LexemeRepo::get_translations(&conn, lexeme_id, Some(2)).expect("ru");
        assert_eq!(ru_only.len(), 2);
        assert!(ru_only.iter().all(|t| t.target_language_id == 2));

        let none = LexemeRepo::get_translations(&conn, lexeme_id, Some(99)).expect("none");
        assert!(none.is_empty());
    }

    #[test]
    fn examples_roundtrip_ordered_by_difficulty() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let lexeme_id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_ex", None, None, None).expect("create");

        conn.execute(
            "INSERT INTO example (lexeme_id, sentence, translation, source, difficulty)
             VALUES (?1, 'Hard zzt_ex sentence', 'трудно', 'test', 3)",
            params![lexeme_id],
        )
        .expect("example hard");
        conn.execute(
            "INSERT INTO example (lexeme_id, sentence, translation, source, difficulty)
             VALUES (?1, 'Easy zzt_ex sentence', 'легко', 'test', 1)",
            params![lexeme_id],
        )
        .expect("example easy");

        let examples = LexemeRepo::get_examples(&conn, lexeme_id).expect("examples");
        assert_eq!(examples.len(), 2);
        assert_eq!(examples[0].sentence, "Easy zzt_ex sentence");
        assert_eq!(examples[0].difficulty, Some(1));
        assert_eq!(examples[1].sentence, "Hard zzt_ex sentence");

        let empty = LexemeRepo::get_examples(&conn, 999_999).expect("empty");
        assert!(empty.is_empty());
    }

    #[test]
    fn search_fts_prefix_match_and_empty_query() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id = LexemeRepo::find_or_create(&conn, 1, "zztsearchable", None, None, None)
            .expect("create");

        let hits = LexemeRepo::search_fts(&conn, 1, "zztsearch", 10).expect("prefix search");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].id, id);
        assert_eq!(hits[0].normalized_text, "zztsearchable");

        let empty = LexemeRepo::search_fts(&conn, 1, "   ", 10).expect("empty query");
        assert!(empty.is_empty());

        let no_match = LexemeRepo::search_fts(&conn, 1, "zztnothere", 10).expect("no match");
        assert!(no_match.is_empty());
    }

    #[test]
    fn v006_lexeme_synonym_table_exists() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='lexeme_synonym'",
                [],
                |r| r.get(0),
            )
            .expect("table check");
        assert_eq!(count, 1);
    }

    #[test]
    fn language_id_by_code_returns_id_and_not_found_for_unknown() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let en = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        let ru = LexemeRepo::language_id_by_code(&conn, "ru").expect("ru");
        assert_ne!(en, ru, "distinct languages have distinct ids");

        match LexemeRepo::language_id_by_code(&conn, "xx") {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn find_by_normalized_edge_cases() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Empty / whitespace-only input → None without touching the DB
        assert!(LexemeRepo::find_by_normalized(&conn, 1, "")
            .expect("empty")
            .is_none());
        assert!(LexemeRepo::find_by_normalized(&conn, 1, "   ")
            .expect("spaces")
            .is_none());

        // Missing word → None
        assert!(LexemeRepo::find_by_normalized(&conn, 1, "zzt_absent")
            .expect("absent")
            .is_none());

        // Unicode text: trim + case-fold normalization on lookup
        let id =
            LexemeRepo::find_or_create(&conn, 1, "Zzt Café", None, None, None).expect("create");
        let found = LexemeRepo::find_by_normalized(&conn, 1, "  ZZT CAFÉ ")
            .expect("find")
            .expect("present");
        assert_eq!(found.id, id);
        assert_eq!(found.text, "Zzt Café");
        assert_eq!(found.normalized_text, "zzt café");

        // Same text in another language → None
        assert!(LexemeRepo::find_by_normalized(&conn, 2, "zzt café")
            .expect("other lang")
            .is_none());
    }

    #[test]
    fn find_or_create_without_metadata_preserves_existing_fields() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id = LexemeRepo::find_or_create(
            &conn,
            1,
            "zzt_keep",
            Some("verb"),
            Some("/keep/"),
            Some(100),
        )
        .expect("create with metadata");
        let id2 = LexemeRepo::find_or_create(&conn, 1, "zzt_keep", None, None, None)
            .expect("second call without metadata");
        assert_eq!(id, id2);

        // COALESCE fills but never nulls out existing values
        let (pos, phonetic, freq): (Option<String>, Option<String>, Option<i64>) = conn
            .query_row(
                "SELECT part_of_speech, phonetic, frequency_rank FROM lexeme WHERE id = ?1",
                params![id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .expect("metadata");
        assert_eq!(pos.as_deref(), Some("verb"));
        assert_eq!(phonetic.as_deref(), Some("/keep/"));
        assert_eq!(freq, Some(100));
    }

    #[test]
    fn search_fts_respects_language_and_limit() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        for i in 0..3 {
            LexemeRepo::find_or_create(&conn, 1, &format!("zztlimit{i}"), None, None, None)
                .expect("create en");
        }
        // Same prefix in another language must not leak into results
        let ru_id = LexemeRepo::find_or_create(&conn, 2, "zztlimitru", None, None, None)
            .expect("create ru");

        let limited = LexemeRepo::search_fts(&conn, 1, "zztlimit", 2).expect("limited");
        assert_eq!(limited.len(), 2, "LIMIT is applied");

        let all = LexemeRepo::search_fts(&conn, 1, "zztlimit", 10).expect("all");
        assert_eq!(all.len(), 3);
        assert!(all.iter().all(|l| l.language_id == 1));
        assert!(all.iter().all(|l| l.id != ru_id));

        let ru = LexemeRepo::search_fts(&conn, 2, "zztlimit", 10).expect("ru");
        assert_eq!(ru.len(), 1);
        assert_eq!(ru[0].id, ru_id);
    }

    #[test]
    fn search_fts_unicode_and_special_characters() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Unicode prefix search works (FTS5 unicode61 tokenizer)
        let id = LexemeRepo::find_or_create(&conn, 2, "zztкафе", None, None, None)
            .expect("create unicode");
        let hits = LexemeRepo::search_fts(&conn, 2, "zztкаф", 10).expect("unicode search");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].id, id);

        // Apostrophe breaks FTS5 query syntax: the query text is interpolated
        // into MATCH unescaped, so this currently surfaces as a DB error.
        let result = LexemeRepo::search_fts(&conn, 1, "zzt's", 10);
        assert!(
            result.is_err(),
            "raw FTS5 interpolation errors on apostrophe"
        );
    }

    #[test]
    fn upsert_helpers_ignore_empty_text() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_empty", None, None, None).expect("create");

        LexemeRepo::upsert_translation(&conn, id, 2, "   ", None, None, None, "general")
            .expect("empty translation");
        assert!(LexemeRepo::get_translations(&conn, id, None)
            .expect("translations")
            .is_empty());

        LexemeRepo::upsert_example(&conn, id, "  ", None, None, None).expect("empty example");
        assert!(LexemeRepo::get_examples(&conn, id)
            .expect("examples")
            .is_empty());

        LexemeRepo::upsert_synonym(&conn, id, 1, "   ", None).expect("empty synonym");
        assert!(LexemeRepo::get_synonyms(&conn, id, 1)
            .expect("synonyms")
            .is_empty());
    }

    #[test]
    fn upsert_example_is_idempotent_by_sentence() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id = LexemeRepo::find_or_create(&conn, 1, "zzt_upsert_ex", None, None, None)
            .expect("create");

        LexemeRepo::upsert_example(
            &conn,
            id,
            "Zzt upsert sentence.",
            Some("перевод"),
            Some("ai"),
            Some(2),
        )
        .expect("first");
        // Same sentence with different case/whitespace → dedup
        LexemeRepo::upsert_example(&conn, id, " zzt upsert SENTENCE. ", None, None, None)
            .expect("duplicate ignored");
        // Different sentence → second row
        LexemeRepo::upsert_example(
            &conn,
            id,
            "Another zzt upsert sentence.",
            None,
            Some("ai"),
            Some(1),
        )
        .expect("second");

        let examples = LexemeRepo::get_examples(&conn, id).expect("examples");
        assert_eq!(examples.len(), 2);
        // Ordered by difficulty ASC
        assert_eq!(examples[0].sentence, "Another zzt upsert sentence.");
        assert_eq!(examples[1].sentence, "Zzt upsert sentence.");
        assert_eq!(examples[1].translation.as_deref(), Some("перевод"));
        assert_eq!(examples[1].difficulty, Some(2));
    }

    #[test]
    fn upsert_media_and_get_image_path_roundtrip() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_media", None, None, None).expect("create");

        assert!(LexemeRepo::needs_associated_image(&conn, id).expect("needs image"));
        assert!(LexemeRepo::needs_associated_image(&conn, id).expect("needs image"));
        assert_eq!(
            LexemeRepo::get_image_path(&conn, id).expect("none yet"),
            None);

        // Audio rows are not images
        LexemeRepo::upsert_media(&conn, id, "audio", "/tmp/zzt.mp3", None, Some("tts"), None)
            .expect("audio");
        assert_eq!(
            LexemeRepo::get_image_path(&conn, id).expect("audio ignored"),
            None);
        assert!(LexemeRepo::needs_associated_image(&conn, id).expect("audio is not a photo"));

        LexemeRepo::upsert_media(
            &conn,
            id,
            "image",
            "/tmp/zzt.png",
            Some("https://img.example/zzt.png"),
            Some("unsplash"),
            Some("hash1"),
        )
        .expect("image");
        assert_eq!(
            LexemeRepo::get_image_path(&conn, id)
                .expect("image")
                .as_deref(),
            Some("/tmp/zzt.png")
        );
        assert!(!LexemeRepo::needs_associated_image(&conn, id).expect("has photo"));

        // Same content_hash → idempotent, no second row
        LexemeRepo::upsert_media(
            &conn,
            id,
            "image",
            "/tmp/zzt2.png",
            None,
            None,
            Some("hash1"),
        )
        .expect("dup hash ignored");
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM media WHERE lexeme_id = ?1",
                params![id],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(count, 2, "audio + single image row");

        // Without a hash, duplicates are allowed
        LexemeRepo::upsert_media(&conn, id, "gif", "/tmp/zzt.gif", None, Some("giphy"), None)
            .expect("gif");
        LexemeRepo::upsert_media(&conn, id, "gif", "/tmp/zzt.gif", None, Some("giphy"), None)
            .expect("gif dup allowed without hash");
        let seed_id = LexemeRepo::find_or_create(&conn, 1, "zzt_seed_img", None, None, None)
            .expect("seed lexeme");
        LexemeRepo::upsert_media(
            &conn,
            seed_id,
            "image",
            "/tmp/seed.svg",
            None,
            Some("seed-svg"),
            Some("seed-hash"),
        )
        .expect("seed");
        assert!(
            LexemeRepo::needs_associated_image(&conn, seed_id).expect("seed is a placeholder"),
            "seed-svg must still be upgraded to a real photo"
        );

        let gifs: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM media WHERE lexeme_id = ?1 AND media_type = 'gif'",
                params![id],
                |r| r.get(0),
            )
            .expect("gif count");
        assert_eq!(gifs, 2);

        // get_image_path returns the newest image/gif row (ORDER BY id DESC)
        assert_eq!(
            LexemeRepo::get_image_path(&conn, id)
                .expect("path")
                .as_deref(),
            Some("/tmp/zzt.gif")
        );

        let urls = LexemeRepo::list_image_source_urls(&conn, id).expect("urls");
        assert!(urls.iter().any(|u| u.contains("zzt.png")));
        let hashes = LexemeRepo::list_image_content_hashes(&conn, id).expect("hashes");
        assert!(hashes.iter().any(|h| h == "hash1"));
    }

    #[test]
    fn visual_mnemonic_upsert_roundtrip() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id = LexemeRepo::find_or_create(&conn, 1, "pesky", None, None, None).expect("create");

        let before = LexemeRepo::get_visual_mnemonic(&conn, id).expect("get");
        assert!(before.is_some());
        let before = before.expect("row");
        assert!(before.sense.is_none());

        LexemeRepo::upsert_visual_mnemonic(
            &conn,
            id,
            "annoyingly persistent",
            "A mosquito keeps returning after being swatted away",
            "keeps coming back and bothering you",
            "An illustration of a mosquito...",
            "mosquito buzzing around face photograph",
        )
        .expect("upsert");

        let after = LexemeRepo::get_visual_mnemonic(&conn, id)
            .expect("get")
            .expect("row");
        assert_eq!(after.sense.as_deref(), Some("annoyingly persistent"));
        assert_eq!(
            after.association.as_deref(),
            Some("A mosquito keeps returning after being swatted away")
        );
        assert_eq!(
            after.memory_hook.as_deref(),
            Some("keeps coming back and bothering you")
        );
        assert!(after
            .image_prompt
            .as_deref()
            .is_some_and(|s| s.contains("mosquito")));
        assert_eq!(
            after.photo_query.as_deref(),
            Some("mosquito buzzing around face photograph")
        );
    }

    #[test]
    fn enrichment_flag_roundtrip() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let id =
            LexemeRepo::find_or_create(&conn, 1, "zzt_enrich", None, None, None).expect("create");

        assert!(!LexemeRepo::is_enriched(&conn, id).expect("not enriched"));
        // Unknown id → false, not an error
        assert!(!LexemeRepo::is_enriched(&conn, 999_999).expect("unknown id"));

        LexemeRepo::mark_enriched(&conn, id).expect("mark");
        assert!(LexemeRepo::is_enriched(&conn, id).expect("enriched"));
    }
}
