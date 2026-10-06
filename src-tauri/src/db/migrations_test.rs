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
