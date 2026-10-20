// ============================================================
// LEXORA — Migration content tests
// Fresh DB: languages seeded, system packs empty (lazy load).
// ============================================================

use super::{create_pool_test_memory, run_migrations};
use crate::error::AppError;

fn collection_item_count(
    conn: &rusqlite::Connection,
    collection_name: &str,
) -> Result<i64, rusqlite::Error> {
    conn.query_row(
        "SELECT COUNT(*)
         FROM collection_item ci
         JOIN collection c ON c.id = ci.collection_id
         WHERE c.name = ?1",
        [collection_name],
        |r| r.get(0),
    )
}

#[test]
fn migrations_seed_languages_and_empty_lazy_packs() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    run_migrations(&pool)?;

    let conn = pool.get()?;

    // V017: broad language catalog
    let lang_count: i64 = conn.query_row("SELECT COUNT(*) FROM language", [], |r| r.get(0))?;
    assert!(
        lang_count >= 20,
        "expected expanded language catalog, got {lang_count}"
    );
    for code in ["en", "ru", "it", "ko", "pt", "tr"] {
        let found: i64 = conn.query_row(
            "SELECT COUNT(*) FROM language WHERE code = ?1",
            [code],
            |r| r.get(0),
        )?;
        assert_eq!(found, 1, "missing language {code}");
    }

    // V018: system packs exist but content is stripped until Load
    let top = collection_item_count(&conn, "Top 5000 Words")?;
    let phrasal = collection_item_count(&conn, "Phrasal Verbs")?;
    let irregular = collection_item_count(&conn, "Irregular Verbs")?;
    let business = collection_item_count(&conn, "Business English")?;
    assert_eq!(top, 0, "Top 5000 must start empty (lazy load)");
    assert_eq!(phrasal, 0, "Phrasal Verbs must start empty");
    assert_eq!(irregular, 0, "Irregular Verbs must start empty");
    assert_eq!(business, 0, "Business English must start empty");

    let pack_ready: i64 = conn.query_row(
        "SELECT COUNT(*) FROM collection
         WHERE pack_key = 'top_5000' AND load_status = 'empty'",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(pack_ready, 1, "top_5000 shell should be empty");

    // Idempotent re-run
    drop(conn);
    run_migrations(&pool)?;
    let conn = pool.get()?;
    let top2 = collection_item_count(&conn, "Top 5000 Words")?;
    assert_eq!(top2, 0);

    Ok(())
}

#[test]
fn v009_seeds_english_minimal_pairs() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;

    let conn = pool.get()?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM minimal_pair", [], |r| r.get(0))?;
    assert!(
        count >= 100,
        "V009 should seed at least 100 English minimal pairs, got {count}"
    );
    Ok(())
}

fn settings_ai_row(conn: &rusqlite::Connection) -> Result<(String, String, Option<String>), AppError> {
    Ok(conn.query_row(
        "SELECT ai_provider, ai_model, model_package FROM user_settings WHERE id = 1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?)
}

#[test]
fn v023_moves_fresh_install_to_gemini_package() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    let conn = pool.get()?;

    let (provider, model, package) = settings_ai_row(&conn)?;
    assert_eq!(provider, "gemini");
    assert_eq!(model, "gemini-3.8-flash");
    assert_eq!(package.as_deref(), Some("gemini"));

    let routes: i64 = conn.query_row("SELECT COUNT(*) FROM model_route", [], |r| r.get(0))?;
    assert_eq!(routes, 0, "routes are seeded by Rust on startup, not by SQL");
    Ok(())
}

#[test]
fn v023_keeps_customized_ai_settings() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    {
        let mut conn = pool.get()?;
        super::migrations::runner()
            .set_target(refinery::Target::Version(22))
            .run(&mut *conn)
            .map_err(|e| AppError::Database(e.to_string()))?;
        conn.execute(
            "UPDATE user_settings SET ai_provider = 'openai', ai_model = 'gpt-4o-mini' WHERE id = 1",
            [],
        )?;
    }

    run_migrations(&pool)?;
    let conn = pool.get()?;
    let (provider, model, package) = settings_ai_row(&conn)?;
    assert_eq!(provider, "openai", "a user's own choice must survive the upgrade");
    assert_eq!(model, "gpt-4o-mini");
    assert_eq!(package, None);
    Ok(())
}

#[test]
fn vocabulary_categories_default_all_insertion_paths_to_general() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    let conn = pool.get()?;
    let language_count: i64 = conn.query_row("SELECT COUNT(*) FROM language", [], |r| r.get(0))?;
    let general_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vocabulary_category WHERE is_general = 1 AND deleted_at IS NULL",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(general_count, language_count);
    conn.execute("INSERT INTO lexeme (language_id, text, normalized_text) VALUES (1, 'category default', 'category default')", [])?;
    let lexeme_id = conn.last_insert_rowid();
    conn.execute(
        "INSERT INTO user_vocabulary (lexeme_id, source) VALUES (?1, 'import')",
        [lexeme_id],
    )?;
    let (name, language_id): (String, i64) = conn.query_row(
        "SELECT c.name, c.language_id FROM user_vocabulary uv JOIN vocabulary_category c ON c.id = uv.category_id WHERE uv.lexeme_id = ?1",
        [lexeme_id], |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    assert_eq!(name, "General");
    assert_eq!(language_id, 1);
    assert!(conn.execute(
        "UPDATE user_vocabulary SET category_id = (SELECT id FROM vocabulary_category WHERE language_id = 2 AND is_general = 1) WHERE lexeme_id = ?1",
        [lexeme_id],
    ).is_err(), "raw writes must reject cross-language categories");
    assert!(conn.execute(
        "UPDATE user_vocabulary SET category_id = NULL WHERE lexeme_id = ?1",
        [lexeme_id],
    ).is_err(), "persisted words must retain a category");
    Ok(())
}

#[test]
fn category_migration_backfills_existing_words_and_restarts_safely() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    {
        let mut conn = pool.get()?;
        super::migrations::runner()
            .set_target(refinery::Target::Version(28))
            .run(&mut *conn)
            .map_err(|e| AppError::Database(e.to_string()))?;
        conn.execute("INSERT INTO lexeme(language_id, text, normalized_text) VALUES (1, 'existing category word', 'existing category word')", [])?;
        let lexeme_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO user_vocabulary(lexeme_id) VALUES (?1)",
            [lexeme_id],
        )?;
    }
    run_migrations(&pool)?;
    run_migrations(&pool)?;
    let conn = pool.get()?;
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM user_vocabulary uv JOIN vocabulary_category c ON c.id = uv.category_id WHERE c.is_general = 1 AND c.language_id = 1",
        [], |row| row.get(0),
    )?;
    assert_eq!(count, 1);
    conn.execute("INSERT INTO language(code, name, native_name) VALUES ('zz', 'Category language', 'Category language')", [])?;
    let general_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vocabulary_category WHERE language_id = (SELECT id FROM language WHERE code = 'zz') AND is_general = 1",
        [], |row| row.get(0),
    )?;
    assert_eq!(general_count, 1);
    Ok(())
}

#[test]
fn v030_adds_collocation_cache_and_check_table() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    run_migrations(&pool)?;

    let conn = pool.get()?;
    let table: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'lexeme_collocation'",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(table, 1);
    let marker: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'lexeme_collocation_check'",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(marker, 1);
    Ok(())
}

#[test]
fn v032_adds_advanced_models_switch_off_by_default() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    run_migrations(&pool)?;

    let conn = pool.get()?;
    let advanced: i64 = conn.query_row(
        "SELECT advanced_models FROM user_settings WHERE id = 1",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(advanced, 0);
    Ok(())
}

#[test]
fn v031_adds_voice_translate_hotkey_with_default() -> Result<(), AppError> {
    let pool = create_pool_test_memory()?;
    run_migrations(&pool)?;
    run_migrations(&pool)?;

    let conn = pool.get()?;
    let hotkey: String = conn.query_row(
        "SELECT hotkey_voice_translate FROM user_settings WHERE id = 1",
        [],
        |r| r.get(0),
    )?;
    assert_eq!(hotkey, crate::hotkeys::VOICE_TRANSLATE_SHORTCUT);
    Ok(())
}
