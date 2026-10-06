// ============================================================
// LEXORA — Offline associative seed images for system lexemes
// Generates a unique educational SVG per word (emoji + scene).
// Stock/AI photos can replace these later; newest media row wins.
// ============================================================

use crate::db::repos::lexeme::LexemeRepo;
use crate::db::DbPool;
use crate::error::AppError;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, OnceLock};

const PROVIDER: &str = "seed-svg";
const EMOJI_CSV: &str = include_str!("../../../../scripts/seed/data/word_emoji.csv");

struct SeedLexeme {
    id: i64,
    text: String,
    translation: Option<String>,
    association: Option<String>,
}

fn emoji_map() -> &'static HashMap<String, String> {
    static MAP: OnceLock<HashMap<String, String>> = OnceLock::new();
    MAP.get_or_init(|| {
        let mut map = HashMap::new();
        for line in EMOJI_CSV.lines().skip(1) {
            let Some((word, emoji)) = line.split_once(',') else {
                continue;
            };
            let word = word.trim().to_ascii_lowercase();
            let emoji = emoji.trim();
            if word.is_empty() || emoji.is_empty() {
                continue;
            }
            map.entry(word).or_insert_with(|| emoji.to_string());
        }
        map
    })
}

fn xml_escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            c => out.push(c),
        }
    }
    out
}

fn word_hue(word: &str) -> u16 {
    let mut hash: u32 = 2_166_136_261;
    for byte in word.bytes() {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(16_777_619);
    }
    (hash % 360) as u16
}

fn emoji_for(word: &str) -> &'static str {
    emoji_map()
        .get(&word.trim().to_ascii_lowercase())
        .map(String::as_str)
        .unwrap_or("✦")
}

/// Educational association card: unique palette + emoji hook + meaning line.
pub fn association_svg(word: &str, translation: &str, association: &str) -> String {
    let hue = word_hue(word);
    let bg = format!("hsl({hue}, 28%, 14%)");
    let panel = format!("hsl({hue}, 32%, 20%)");
    let accent = format!("hsl({hue}, 72%, 62%)");
    let glow = format!("hsl({}, 70%, 56%)", (hue + 40) % 360);
    let emoji = xml_escape(emoji_for(word));
    let title = xml_escape(word.trim());
    let subtitle = if translation.trim().is_empty() {
        String::new()
    } else {
        xml_escape(translation.trim())
    };
    let hook = {
        let trimmed = association.trim();
        if trimmed.is_empty() {
            format!("A scene that shows what “{}” means", word.trim())
        } else {
            trimmed.to_string()
        }
    };
    let hook = xml_escape(&hook);
    let subtitle_svg = if subtitle.is_empty() {
        String::new()
    } else {
        format!(
            r##"<text x="320" y="368" text-anchor="middle" fill="#cbd5e1" font-size="22" font-family="Inter, system-ui, sans-serif">{subtitle}</text>"##
        )
    };

    format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="{title}">
  <rect width="640" height="480" rx="28" fill="{bg}"/>
  <circle cx="132" cy="120" r="88" fill="{accent}" fill-opacity="0.22"/>
  <circle cx="520" cy="390" r="120" fill="{glow}" fill-opacity="0.16"/>
  <rect x="56" y="48" width="528" height="384" rx="24" fill="{panel}"/>
  <text x="320" y="188" text-anchor="middle" font-size="92">{emoji}</text>
  <text x="320" y="268" text-anchor="middle" fill="#f8fafc" font-size="42" font-weight="600" font-family="Inter, system-ui, sans-serif">{title}</text>
  {subtitle_svg}
  <text x="320" y="412" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="Inter, system-ui, sans-serif">{hook}</text>
</svg>
"##
    )
}

fn seed_filename(normalized: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"seed-svg:");
    hasher.update(normalized.as_bytes());
    format!("{:x}.svg", hasher.finalize())
}

fn lexemes_missing_images(
    pool: &DbPool,
    vocabulary_only: bool,
) -> Result<Vec<SeedLexeme>, AppError> {
    let conn = pool.get()?;
    let sql = if vocabulary_only {
        "SELECT l.id, l.text, l.normalized_text,
                (SELECT t.translated_text FROM translation t
                 WHERE t.lexeme_id = l.id
                 ORDER BY t.id LIMIT 1),
                l.visual_association
         FROM lexeme l
         WHERE l.deleted_at IS NULL
           AND EXISTS (
               SELECT 1 FROM user_vocabulary uv
               WHERE uv.lexeme_id = l.id AND uv.deleted_at IS NULL
           )
           AND NOT EXISTS (
               SELECT 1 FROM media m
               WHERE m.lexeme_id = l.id AND m.media_type IN ('image', 'gif')
           )"
    } else {
        "SELECT l.id, l.text, l.normalized_text,
                (SELECT t.translated_text FROM translation t
                 WHERE t.lexeme_id = l.id
                 ORDER BY t.id LIMIT 1),
                l.visual_association
         FROM lexeme l
         WHERE l.language_id = 1 AND l.deleted_at IS NULL
           AND NOT EXISTS (
               SELECT 1 FROM media m
               WHERE m.lexeme_id = l.id AND m.media_type IN ('image', 'gif')
           )"
    };
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows
        .into_iter()
        .map(|(id, text, _norm, translation, association)| SeedLexeme {
            id,
            text,
            translation,
            association,
        })
        .collect())
}

/// Write a seed SVG and media row for every English lexeme that has no image yet.
pub fn ensure_seed_images(pool: &Arc<DbPool>, cache_dir: &Path) -> Result<usize, AppError> {
    ensure_seed_images_inner(pool, cache_dir, false)
}

/// Only seed images for words already in the user's vocabulary (not unloaded packs).
pub fn ensure_seed_images_for_vocabulary(
    pool: &Arc<DbPool>,
    cache_dir: &Path,
) -> Result<usize, AppError> {
    ensure_seed_images_inner(pool, cache_dir, true)
}

fn ensure_seed_images_inner(
    pool: &Arc<DbPool>,
    cache_dir: &Path,
    vocabulary_only: bool,
) -> Result<usize, AppError> {
    std::fs::create_dir_all(cache_dir)?;
    let missing = lexemes_missing_images(pool, vocabulary_only)?;
    if missing.is_empty() {
        return Ok(0);
    }

    let mut written = 0usize;
    for row in missing {
        let norm = row.text.trim().to_ascii_lowercase();
        let path = cache_dir.join(seed_filename(&norm));
        if !path.exists() {
            let svg = association_svg(
                &row.text,
                row.translation.as_deref().unwrap_or(""),
                row.association.as_deref().unwrap_or(""),
            );
            std::fs::write(&path, svg)?;
        }
        let local = path.to_string_lossy().to_string();
        let conn = pool.get()?;
        LexemeRepo::upsert_media(
            &conn,
            row.id,
            "image",
            &local,
            None,
            Some(PROVIDER),
            Some(&seed_filename(&norm)),
        )?;
        written += 1;
    }
    log::info!("Seeded {written} associative SVG images");
    Ok(written)
}

/// System lexemes still showing a seed SVG (eligible for stock/photo upgrade).
pub fn lexemes_pending_photo_upgrade(
    pool: &DbPool,
) -> Result<Vec<(i64, String, String, Option<String>)>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT l.id, l.text, IFNULL(l.visual_photo_query, l.text),
                (SELECT t.translated_text FROM translation t
                 WHERE t.lexeme_id = l.id
                 ORDER BY t.id LIMIT 1)
         FROM lexeme l
         WHERE l.language_id = 1 AND l.deleted_at IS NULL
           AND EXISTS (
               SELECT 1 FROM media m
               WHERE m.lexeme_id = l.id AND m.media_type IN ('image', 'gif')
           )
           AND NOT EXISTS (
               SELECT 1 FROM media m
               WHERE m.lexeme_id = l.id AND m.media_type IN ('image', 'gif')
                 AND IFNULL(m.provider, '') NOT IN ('', 'seed-svg')
           )
         ORDER BY COALESCE(l.frequency_rank, 999999), l.id",
    )?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::{association_svg, emoji_for, ensure_seed_images_for_vocabulary, xml_escape};
    use crate::db::{create_pool_test_memory, repos::lexeme::LexemeRepo, run_migrations};
    use std::sync::Arc;

    #[test]
    fn svg_escapes_and_includes_word() {
        let svg = association_svg("don't", "не надо", r#"He said "stop""#);
        assert!(svg.contains("don&apos;t"));
        assert!(svg.contains("не надо"));
        assert!(svg.contains("&quot;stop&quot;"));
        assert!(!svg.contains("don't"));
    }

    #[test]
    fn xml_escape_covers_markup() {
        assert_eq!(xml_escape(r#"a&b<c>"#), "a&amp;b&lt;c&gt;");
    }

    #[test]
    fn known_word_has_emoji() {
        assert_eq!(emoji_for("apple"), "🍎");
        assert_eq!(emoji_for("  Apple "), "🍎");
    }

    #[test]
    fn ensure_seed_images_is_idempotent() {
        let pool = Arc::new(create_pool_test_memory().expect("pool"));
        run_migrations(&pool).expect("migrate");
        {
            let conn = pool.get().expect("conn");
            conn.execute(
                "INSERT INTO lexeme (language_id, text, normalized_text, is_system)
                 VALUES (1, 'apple', 'apple', 0)",
                [],
            )
            .expect("lexeme");
            let lid = conn.last_insert_rowid();
            conn.execute(
                "INSERT INTO user_vocabulary (user_id, lexeme_id, source) VALUES (1, ?1, 'manual')",
                rusqlite::params![lid],
            )
            .expect("uv");
        }
        let dir = tempfile_dir();
        let first = ensure_seed_images_for_vocabulary(&pool, &dir).expect("first");
        assert!(first > 0, "expected seed images, got {first}");
        let second = ensure_seed_images_for_vocabulary(&pool, &dir).expect("second");
        assert_eq!(second, 0, "second run must not duplicate");

        let conn = pool.get().expect("conn");
        let images: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM media WHERE media_type = 'image' AND provider = 'seed-svg'",
                [],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(images, first as i64);
        let apple = conn
            .query_row(
                "SELECT id FROM lexeme WHERE normalized_text = 'apple' AND language_id = 1",
                [],
                |r| r.get::<_, i64>(0),
            )
            .expect("apple");
        let path = LexemeRepo::get_image_path(&conn, apple).expect("path");
        assert!(path.is_some());
    }

    fn tempfile_dir() -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "lexora-seed-img-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0)
        ));
        std::fs::create_dir_all(&dir).expect("tmpdir");
        dir
    }
}
