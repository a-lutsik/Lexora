// ============================================================
// LEXORA — DB Backup & Recovery (M6)
// Проверка целостности БД при старте, восстановление из бэкапа,
// ротация бэкапов. Битый файл никогда не удаляется —
// переименовывается в lexora.db.corrupt-<timestamp>.
// ============================================================

use crate::db::DbPool;
use crate::error::AppError;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Prefix of every automatic backup file inside `app_data_dir/backups/`.
const BACKUP_PREFIX: &str = "lexora-backup-";
/// Suffix marker for quarantined corrupt database files.
const CORRUPT_MARKER: &str = ".corrupt-";

// ── Types ────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DbHealthStatus {
    /// Database exists and passed integrity check.
    Ok,
    /// No database file — clean first start.
    Clean,
    /// Database was corrupt; restored from a backup copy.
    RecoveredFromBackup,
    /// Database was corrupt and no usable backup existed;
    /// a fresh empty DB will be created and re-migrated.
    RecoveredEmpty,
}

#[derive(Debug, Clone)]
pub struct DbHealth {
    pub status: DbHealthStatus,
    pub message: String,
    pub backup_used: Option<PathBuf>,
}

/// DTO for the `get_db_health` IPC command (future Settings UI).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbHealthDto {
    pub status: DbHealthStatus,
    pub message: String,
    pub backups: Vec<BackupInfoDto>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfoDto {
    pub name: String,
    pub size_bytes: u64,
    /// Unix seconds (file mtime).
    pub created_at: i64,
}

// ── Integrity check & recovery ───────────────────────────────

/// Run `PRAGMA integrity_check` on a database file.
/// Returns Ok(()) when the check reports "ok", Err with details otherwise.
/// The connection is opened directly (not via the pool) because this runs
/// before the pool exists.
fn check_integrity(db_path: &Path) -> Result<(), AppError> {
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare("PRAGMA integrity_check")?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<String>, _>>()?;

    if rows.len() == 1 && rows[0] == "ok" {
        Ok(())
    } else {
        Err(AppError::Database(format!(
            "integrity_check failed: {}",
            rows.join("; ")
        )))
    }
}

/// Move the corrupt database aside (never delete user data) and clean up
/// its WAL/SHM sidecars, which belong to the corrupt file and would
/// poison any restored copy.
fn quarantine_corrupt_db(db_path: &Path) -> Result<PathBuf, AppError> {
    let timestamp = chrono::Local::now().format("%Y%m%d-%H%M%S");
    let corrupt_path = db_path.with_extension(format!("db{CORRUPT_MARKER}{timestamp}"));
    std::fs::rename(db_path, &corrupt_path)?;
    log::warn!("Corrupt database quarantined: {}", corrupt_path.display());

    for sidecar in ["wal", "shm"] {
        let sidecar_path = db_path.with_extension(format!("db-{sidecar}"));
        if sidecar_path.exists() {
            if let Err(e) = std::fs::remove_file(&sidecar_path) {
                log::warn!(
                    "Failed to remove stale {} of corrupt DB: {e}",
                    sidecar_path.display()
                );
            }
        }
    }
    Ok(corrupt_path)
}

/// Newest-first list of backup files in `backups_dir`.
fn list_backups(backups_dir: &Path) -> Result<Vec<PathBuf>, AppError> {
    let mut backups: Vec<PathBuf> = Vec::new();
    if backups_dir.is_dir() {
        for entry in std::fs::read_dir(backups_dir)? {
            let path = entry?.path();
            let is_backup = path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.starts_with(BACKUP_PREFIX) && n.ends_with(".db"))
                .unwrap_or(false);
            if is_backup {
                backups.push(path);
            }
        }
    }
    // Timestamped names sort chronologically; newest first.
    backups.sort_by(|a, b| b.cmp(a));
    Ok(backups)
}

/// The most recent backup file, if any. Used for the daily-backup freshness
/// check and as a restore candidate.
pub fn latest_backup(backups_dir: &Path) -> Result<Option<PathBuf>, AppError> {
    Ok(list_backups(backups_dir)?.into_iter().next())
}

/// Directory where backups live for a given database file.
pub fn backups_dir_for(db_path: &Path) -> PathBuf {
    db_path
        .parent()
        .map(|p| p.join("backups"))
        .unwrap_or_else(|| PathBuf::from("backups"))
}

/// Verify database integrity and recover from backup if corrupt.
/// Must be called BEFORE `create_pool`.
pub fn verify_and_recover(db_path: &Path) -> Result<DbHealth, AppError> {
    if !db_path.exists() {
        return Ok(DbHealth {
            status: DbHealthStatus::Clean,
            message: "No database file — clean start".to_string(),
            backup_used: None,
        });
    }

    match check_integrity(db_path) {
        Ok(()) => {
            return Ok(DbHealth {
                status: DbHealthStatus::Ok,
                message: "Database integrity check passed".to_string(),
                backup_used: None,
            });
        }
        Err(e) => {
            log::warn!("Database integrity check failed: {e}");
        }
    }

    // ── Recovery path ────────────────────────────────────────
    let corrupt_path = quarantine_corrupt_db(db_path)?;
    let backups_dir = backups_dir_for(db_path);

    // Try backups newest-first; skip ones that fail their own check.
    for backup in list_backups(&backups_dir)? {
        if check_integrity(&backup).is_err() {
            log::warn!("Skipping unhealthy backup candidate: {}", backup.display());
            continue;
        }
        std::fs::copy(&backup, db_path)?;
        log::warn!("Database restored from backup: {}", backup.display());
        return Ok(DbHealth {
            status: DbHealthStatus::RecoveredFromBackup,
            message: format!(
                "Database was corrupt (quarantined to {}) and restored from backup {}",
                corrupt_path.display(),
                backup.display()
            ),
            backup_used: Some(backup),
        });
    }

    // No usable backup — leave no file; create_pool + migrations rebuild
    // an empty schema. The corrupt file stays on disk for manual rescue.
    Ok(DbHealth {
        status: DbHealthStatus::RecoveredEmpty,
        message: format!(
            "Database was corrupt (quarantined to {}) and no usable backup found; starting with an empty database",
            corrupt_path.display()
        ),
        backup_used: None,
    })
}

// ── Backup creation & rotation ───────────────────────────────

/// Create a consistent backup copy via `VACUUM INTO`.
/// VACUUM INTO produces a transactionally consistent snapshot and is
/// safe with WAL: the copy contains main DB + all checkpointed/WAL data.
pub fn create_backup(db_path: &Path, backups_dir: &Path) -> Result<PathBuf, AppError> {
    std::fs::create_dir_all(backups_dir)?;

    let timestamp = chrono::Local::now().format("%Y%m%d-%H%M%S");
    let backup_path = backups_dir.join(format!("{BACKUP_PREFIX}{timestamp}.db"));

    let conn = Connection::open(db_path)?;
    let path_str = backup_path.to_string_lossy().into_owned();
    conn.execute("VACUUM INTO ?1", params![path_str])?;
    log::info!("Database backup created: {}", backup_path.display());

    Ok(backup_path)
}

/// Keep the `keep` newest backups, delete the rest.
pub fn rotate_backups(backups_dir: &Path, keep: usize) -> Result<(), AppError> {
    let backups = list_backups(backups_dir)?;
    for stale in backups.into_iter().skip(keep) {
        std::fs::remove_file(&stale)?;
        log::info!("Rotated out old backup: {}", stale.display());
    }
    Ok(())
}

// ── IPC commands ─────────────────────────────────────────────

/// Fresh integrity check on the live DB + list of existing backups.
#[tauri::command]
pub async fn get_db_health(
    app: tauri::AppHandle,
    db: tauri::State<'_, Arc<DbPool>>,
) -> Result<DbHealthDto, AppError> {
    use tauri::Manager;

    let (status, message) = {
        let conn = db.get()?;
        match conn.prepare("PRAGMA integrity_check").and_then(|mut stmt| {
            let rows = stmt
                .query_map([], |row| row.get::<_, String>(0))?
                .collect::<Result<Vec<String>, _>>()?;
            Ok(rows)
        }) {
            Ok(rows) if rows.len() == 1 && rows[0] == "ok" => (
                DbHealthStatus::Ok,
                "Database integrity check passed".to_string(),
            ),
            Ok(rows) => (
                DbHealthStatus::RecoveredEmpty,
                format!("integrity_check failed: {}", rows.join("; ")),
            ),
            Err(e) => (
                DbHealthStatus::RecoveredEmpty,
                format!("integrity_check error: {e}"),
            ),
        }
    };

    let db_path = app.path().app_data_dir()?.join("lexora.db");
    let backups_dir = backups_dir_for(&db_path);

    let mut backups: Vec<BackupInfoDto> = Vec::new();
    for path in list_backups(&backups_dir)? {
        let meta = std::fs::metadata(&path)?;
        let created_at = meta
            .modified()?
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        backups.push(BackupInfoDto {
            name,
            size_bytes: meta.len(),
            created_at,
        });
    }

    Ok(DbHealthDto {
        status,
        message,
        backups,
    })
}

/// Create a backup right now (manual action from future Settings UI).
/// Returns the path of the created backup file.
#[tauri::command]
pub async fn create_db_backup(app: tauri::AppHandle) -> Result<String, AppError> {
    use tauri::Manager;

    let db_path = app.path().app_data_dir()?.join("lexora.db");
    let backups_dir = backups_dir_for(&db_path);
    let path = create_backup(&db_path, &backups_dir)?;
    Ok(path.to_string_lossy().into_owned())
}

// ── Tests ────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Unique temp directory per test, removed on drop.
    struct TestDir(PathBuf);

    impl TestDir {
        fn new() -> Result<Self, AppError> {
            let dir =
                std::env::temp_dir().join(format!("lexora-backup-test-{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&dir)?;
            Ok(Self(dir))
        }

        fn db_path(&self) -> PathBuf {
            self.0.join("lexora.db")
        }

        fn backups_dir(&self) -> PathBuf {
            self.0.join("backups")
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn create_test_db(db_path: &Path) -> Result<(), AppError> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch(
            "CREATE TABLE sample (id INTEGER PRIMARY KEY, word TEXT NOT NULL);
             INSERT INTO sample (word) VALUES ('hello'), ('world');",
        )?;
        Ok(())
    }

    fn count_rows(db_path: &Path) -> Result<i64, AppError> {
        let conn = Connection::open(db_path)?;
        let n: i64 = conn.query_row("SELECT COUNT(*) FROM sample", [], |r| r.get(0))?;
        Ok(n)
    }

    #[test]
    fn create_backup_produces_consistent_copy() -> Result<(), AppError> {
        let dir = TestDir::new()?;
        create_test_db(&dir.db_path())?;

        let backup = create_backup(&dir.db_path(), &dir.backups_dir())?;

        assert!(backup.exists());
        assert_eq!(count_rows(&backup)?, 2);
        check_integrity(&backup)?;
        Ok(())
    }

    #[test]
    fn rotate_backups_keeps_newest() -> Result<(), AppError> {
        let dir = TestDir::new()?;
        let backups = dir.backups_dir();
        std::fs::create_dir_all(&backups)?;

        // Five fake backups, oldest → newest (names sort chronologically)
        for i in 1..=5 {
            std::fs::write(
                backups.join(format!("lexora-backup-2026010{i}-000000.db")),
                b"x",
            )?;
        }

        rotate_backups(&backups, 3)?;

        let remaining = list_backups(&backups)?;
        assert_eq!(remaining.len(), 3);
        assert!(backups.join("lexora-backup-20260105-000000.db").exists());
        assert!(backups.join("lexora-backup-20260104-000000.db").exists());
        assert!(backups.join("lexora-backup-20260103-000000.db").exists());
        assert!(!backups.join("lexora-backup-20260101-000000.db").exists());
        assert!(!backups.join("lexora-backup-20260102-000000.db").exists());
        Ok(())
    }

    #[test]
    fn verify_healthy_db_is_ok() -> Result<(), AppError> {
        let dir = TestDir::new()?;
        create_test_db(&dir.db_path())?;

        let health = verify_and_recover(&dir.db_path())?;

        assert_eq!(health.status, DbHealthStatus::Ok);
        assert!(health.backup_used.is_none());
        assert_eq!(count_rows(&dir.db_path())?, 2);
        Ok(())
    }

    #[test]
    fn verify_missing_db_is_clean() -> Result<(), AppError> {
        let dir = TestDir::new()?;

        let health = verify_and_recover(&dir.db_path())?;

        assert_eq!(health.status, DbHealthStatus::Clean);
        Ok(())
    }

    #[test]
    fn verify_corrupt_db_recovers_from_backup() -> Result<(), AppError> {
        let dir = TestDir::new()?;

        // Prepare a healthy backup in advance
        create_test_db(&dir.db_path())?;
        let backup = create_backup(&dir.db_path(), &dir.backups_dir())?;

        // Replace the live DB with garbage
        std::fs::write(dir.db_path(), b"this is definitely not a sqlite database")?;

        let health = verify_and_recover(&dir.db_path())?;

        assert_eq!(health.status, DbHealthStatus::RecoveredFromBackup);
        assert_eq!(health.backup_used.as_deref(), Some(backup.as_path()));
        // Live DB restored and readable
        assert_eq!(count_rows(&dir.db_path())?, 2);
        check_integrity(&dir.db_path())?;
        // Corrupt file preserved, not deleted
        let parent = dir
            .db_path()
            .parent()
            .ok_or_else(|| AppError::Io("no parent dir".to_string()))?
            .to_path_buf();
        let corrupt_files: Vec<_> = std::fs::read_dir(parent)?
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().contains(CORRUPT_MARKER))
            .collect();
        assert_eq!(corrupt_files.len(), 1);
        Ok(())
    }

    #[test]
    fn verify_corrupt_db_without_backup_recovers_empty() -> Result<(), AppError> {
        let dir = TestDir::new()?;
        std::fs::write(dir.db_path(), b"garbage, not a database at all")?;

        let health = verify_and_recover(&dir.db_path())?;

        assert_eq!(health.status, DbHealthStatus::RecoveredEmpty);
        assert!(health.backup_used.is_none());
        // Original removed so create_pool starts fresh…
        assert!(!dir.db_path().exists());
        // …but quarantined copy is kept for manual rescue
        let has_corrupt = std::fs::read_dir(&dir.0)?
            .filter_map(|e| e.ok())
            .any(|e| e.file_name().to_string_lossy().contains(CORRUPT_MARKER));
        assert!(has_corrupt);
        Ok(())
    }
}
