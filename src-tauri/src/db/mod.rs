// ============================================================
// LEXORA — DB Module
// SQLite connection pool (r2d2 + rusqlite).
// PRAGMA WAL + foreign keys настроены при каждом соединении.
// ============================================================

pub mod backup;
pub mod packs;
pub mod repos;

#[cfg(test)]
mod migrations_test;

use crate::error::AppError;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::path::Path;

/// Type alias for our connection pool
pub type DbPool = Pool<SqliteConnectionManager>;

/// Create a new r2d2 SQLite connection pool with Lexora pragmas.
pub fn create_pool(db_path: &Path) -> Result<DbPool, AppError> {
    let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
        // Apply performance and integrity pragmas on each connection
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
                 PRAGMA synchronous = NORMAL;
                 PRAGMA foreign_keys = ON;
                 PRAGMA busy_timeout = 5000;
                 PRAGMA cache_size = -64000;", // 64MB page cache
        )
    });

    let pool = Pool::builder()
        .max_size(8)
        .build(manager)
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(pool)
}

/// In-memory pool for tests. max_size(1) guarantees a single shared
/// connection, so the transient in-memory database survives across
/// pool.get() calls.
#[cfg(test)]
pub fn create_pool_test_memory() -> Result<DbPool, AppError> {
    let manager = SqliteConnectionManager::memory();
    Pool::builder()
        .max_size(1)
        .build(manager)
        .map_err(|e| AppError::Database(e.to_string()))
}

// Embed versioned migrations (src/db/migrations/V*.sql) into the binary
refinery::embed_migrations!("src/db/migrations");

/// Run all schema migrations. Idempotent — safe to call on every startup.
/// On existing databases refinery creates its `refinery_schema_history`
/// table and applies V001, which is fully IF NOT EXISTS / INSERT OR IGNORE,
/// so already-applied schema is left untouched.
pub fn run_migrations(pool: &DbPool) -> Result<(), AppError> {
    let mut conn = pool.get()?;

    // r2d2 PooledConnection derefs to rusqlite::Connection
    // The database may have been migrated by a different build of Lexora
    // (a newer version, or a local branch with its own migrations). Migrations
    // are additive, so versions this binary does not know are ignored instead
    // of aborting startup with «migration VNN is missing from the filesystem».
    migrations::runner()
        .set_abort_missing(false)
        .run(&mut *conn)
        .map_err(|e| AppError::Database(format!("Migration failed: {e}")))?;

    // Safe incremental column additions for existing user_settings table.
    // Kept for databases created before these columns were part of the schema;
    // errors are ignored because ALTER TABLE fails when the column exists.
    let _ = conn.execute(
        "ALTER TABLE user_settings ADD COLUMN custom_base_url TEXT",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE user_settings ADD COLUMN cloudflare_account_id TEXT",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE user_settings ADD COLUMN sticker_sources TEXT NOT NULL DEFAULT '[\"all\"]'",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE user_settings ADD COLUMN image_model TEXT NOT NULL DEFAULT 'cloudflare:@cf/black-forest-labs/flux-1-schnell'",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE user_settings ADD COLUMN fallback_image_model TEXT NOT NULL DEFAULT 'gemini:gemini-3.1-flash-image'",
        [],
    );

    log::info!("Database migrations applied successfully");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use r2d2_sqlite::SqliteConnectionManager;

    #[test]
    fn run_migrations_twice_is_idempotent() -> Result<(), AppError> {
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .map_err(|e| AppError::Database(e.to_string()))?;

        // First run applies V001, second run must be a no-op (no error)
        run_migrations(&pool)?;
        run_migrations(&pool)?;

        // Sanity check: core tables and seed data exist
        let conn = pool.get()?;
        let lang_count: i64 = conn.query_row("SELECT COUNT(*) FROM language", [], |r| r.get(0))?;
        assert!(
            lang_count >= 20,
            "V017 expands language catalog, got {lang_count}"
        );
        Ok(())
    }

    /// A database migrated by another build (e.g. a local branch with V026)
    /// must still open: unknown applied migrations are ignored.
    #[test]
    fn run_migrations_ignores_migrations_unknown_to_this_build() -> Result<(), AppError> {
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .map_err(|e| AppError::Database(e.to_string()))?;
        run_migrations(&pool)?;

        let conn = pool.get()?;
        conn.execute(
            "INSERT INTO refinery_schema_history (version, name, applied_on, checksum)
             VALUES (9999, 'from_another_build', '2026-10-12T00:00:00.000000000+00:00', '1')",
            [],
        )?;
        drop(conn);

        run_migrations(&pool)?;
        Ok(())
    }
}
