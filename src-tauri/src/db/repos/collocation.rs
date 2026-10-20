// ============================================================
// LEXORA — Collocation Repository
// AI collocations cached per (word, target language) and the
// link from a collocation to its own vocabulary card (V030).
// ============================================================

use crate::commands::collocations::{CollocationDrillDto, CollocationDto};
use crate::error::AppError;
use crate::providers::ai::CollocationItem;
use rusqlite::{params, Connection, OptionalExtension};

/// Stored collocation fields needed to create its vocabulary card.
#[derive(Debug, Clone)]
pub struct CollocationRow {
    pub id: i64,
    pub text: String,
    pub translation: String,
    pub example: Option<String>,
    pub nuance: Option<String>,
}

fn parse_distractors(raw: &str) -> Vec<String> {
    serde_json::from_str(raw).unwrap_or_default()
}

pub struct CollocationRepo;

impl CollocationRepo {
    /// Collocations of a word for one target language, with vocabulary membership.
    /// A collocation counts as added when its phrase is an active vocabulary entry,
    /// also when the user added that phrase manually before.
    pub fn list(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: i64,
    ) -> Result<Vec<CollocationDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.lexeme_id, c.text, c.pattern, c.translation, c.example,
                    c.focus, c.distractors, c.nuance, uv.id
             FROM lexeme_collocation c
             JOIN lexeme w ON w.id = c.lexeme_id
             LEFT JOIN lexeme p ON p.language_id = w.language_id
                  AND p.normalized_text = c.normalized_text AND p.deleted_at IS NULL
             LEFT JOIN user_vocabulary uv ON uv.lexeme_id = p.id AND uv.deleted_at IS NULL
             WHERE c.lexeme_id = ?1 AND c.target_language_id = ?2
             ORDER BY c.sort_order ASC, c.id ASC",
        )?;
        let rows = stmt
            .query_map(params![lexeme_id, target_language_id], |row| {
                let distractors: String = row.get(7)?;
                Ok(CollocationDto {
                    id: row.get(0)?,
                    lexeme_id: row.get(1)?,
                    text: row.get(2)?,
                    pattern: row.get(3)?,
                    translation: row.get(4)?,
                    example: row.get(5)?,
                    focus: row.get(6)?,
                    distractors: parse_distractors(&distractors),
                    nuance: row.get(8)?,
                    vocabulary_entry_id: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    /// True when the model was already asked for this word and target language
    /// and had no collocations.
    pub fn known_to_have_none(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: i64,
    ) -> Result<bool, AppError> {
        let none: i64 = conn.query_row(
            "SELECT EXISTS (
                SELECT 1 FROM lexeme_collocation_check k
                WHERE k.lexeme_id = ?1 AND k.target_language_id = ?2
                  AND NOT EXISTS (
                      SELECT 1 FROM lexeme_collocation c
                      WHERE c.lexeme_id = ?1 AND c.target_language_id = ?2))",
            params![lexeme_id, target_language_id],
            |row| row.get(0),
        )?;
        Ok(none != 0)
    }

    /// Store model collocations in order and mark the pair as checked.
    /// A list already stored for this word and language wins: two concurrent
    /// first opens must not merge two model answers into one list.
    pub fn insert_batch(
        conn: &Connection,
        lexeme_id: i64,
        target_language_id: i64,
        items: &[CollocationItem],
        source: Option<&str>,
    ) -> Result<(), AppError> {
        let stored: i64 = conn.query_row(
            "SELECT COUNT(*) FROM lexeme_collocation WHERE lexeme_id = ?1 AND target_language_id = ?2",
            params![lexeme_id, target_language_id],
            |row| row.get(0),
        )?;
        if stored == 0 {
            let mut stmt = conn.prepare(
                "INSERT OR IGNORE INTO lexeme_collocation
                    (lexeme_id, target_language_id, text, normalized_text, pattern, translation,
                     example, focus, distractors, nuance, sort_order, source)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            )?;
            for (index, item) in items.iter().enumerate() {
                let text = item.text.trim();
                let distractors = serde_json::to_string(&item.distractors)
                    .map_err(|e| AppError::Database(e.to_string()))?;
                stmt.execute(params![
                    lexeme_id,
                    target_language_id,
                    text,
                    text.to_lowercase(),
                    item.pattern,
                    item.translation,
                    item.example,
                    item.focus,
                    distractors,
                    item.nuance,
                    i64::try_from(index).unwrap_or(i64::MAX),
                    source,
                ])?;
            }
        }
        conn.execute(
            "INSERT OR REPLACE INTO lexeme_collocation_check (lexeme_id, target_language_id, checked_at)
             VALUES (?1, ?2, unixepoch())",
            params![lexeme_id, target_language_id],
        )?;
        Ok(())
    }

    /// The word was respelled: its collocations and the drills of phrase cards
    /// made from it described the old spelling.
    pub fn forget_for_lexeme(conn: &Connection, lexeme_id: i64) -> Result<(), AppError> {
        conn.execute("DELETE FROM lexeme_collocation WHERE lexeme_id = ?1", [lexeme_id])?;
        conn.execute("DELETE FROM lexeme_collocation_check WHERE lexeme_id = ?1", [lexeme_id])?;
        conn.execute(
            "UPDATE lexeme_collocation SET collocation_lexeme_id = NULL WHERE collocation_lexeme_id = ?1",
            [lexeme_id],
        )?;
        Ok(())
    }

    /// Collocation of this word and target language, or None when it belongs elsewhere.
    pub fn get_for_word(
        conn: &Connection,
        id: i64,
        lexeme_id: i64,
        target_language_id: i64,
    ) -> Result<Option<CollocationRow>, AppError> {
        Ok(conn
            .query_row(
                "SELECT id, text, translation, example, nuance
                 FROM lexeme_collocation
                 WHERE id = ?1 AND lexeme_id = ?2 AND target_language_id = ?3",
                params![id, lexeme_id, target_language_id],
                |row| {
                    Ok(CollocationRow {
                        id: row.get(0)?,
                        text: row.get(1)?,
                        translation: row.get(2)?,
                        example: row.get(3)?,
                        nuance: row.get(4)?,
                    })
                },
            )
            .optional()?)
    }

    pub fn link_phrase_lexeme(
        conn: &Connection,
        id: i64,
        phrase_lexeme_id: i64,
    ) -> Result<(), AppError> {
        conn.execute(
            "UPDATE lexeme_collocation SET collocation_lexeme_id = ?1 WHERE id = ?2",
            params![phrase_lexeme_id, id],
        )?;
        Ok(())
    }

    /// Study hints for a phrase card created from a collocation (first drillable link).
    pub fn drill_for_phrase(
        conn: &Connection,
        phrase_lexeme_id: i64,
    ) -> Result<Option<CollocationDrillDto>, AppError> {
        Ok(conn
            .query_row(
                "SELECT c.focus, c.distractors, c.translation, c.example, c.pattern, w.text
                 FROM lexeme_collocation c
                 JOIN lexeme w ON w.id = c.lexeme_id
                 WHERE c.collocation_lexeme_id = ?1 AND c.focus IS NOT NULL
                 ORDER BY c.id ASC
                 LIMIT 1",
                [phrase_lexeme_id],
                |row| {
                    let distractors: String = row.get(1)?;
                    Ok(CollocationDrillDto {
                        focus: row.get(0)?,
                        distractors: parse_distractors(&distractors),
                        translation: row.get(2)?,
                        example: row.get(3)?,
                        pattern: row.get(4)?,
                        headword: row.get(5)?,
                    })
                },
            )
            .optional()?
            .filter(|drill| !drill.distractors.is_empty()))
    }
}
