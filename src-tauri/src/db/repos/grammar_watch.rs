// ============================================================
// LEXORA — System-wide writing check settings repository (V025)
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// Upper bound on the exclusion list so a broken form cannot bloat the row.
pub const MAX_EXCLUDED_APPS: usize = 200;
const MAX_BUNDLE_ID_CHARS: usize = 255;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrammarWatchSettings {
    pub enabled: bool,
    /// macOS bundle ids; an entry ending in `*` matches a prefix.
    pub excluded_apps: Vec<String>,
}

/// Trim, drop blanks and duplicates (order kept), validate length.
pub fn normalize_excluded_apps(apps: &[String]) -> Result<Vec<String>, AppError> {
    let mut result: Vec<String> = Vec::new();
    for app in apps {
        let trimmed = app.trim();
        if trimmed.is_empty() || result.iter().any(|existing| existing == trimmed) {
            continue;
        }
        if trimmed.chars().count() > MAX_BUNDLE_ID_CHARS {
            return Err(AppError::Validation(format!(
                "App id is too long (max {MAX_BUNDLE_ID_CHARS} characters)"
            )));
        }
        result.push(trimmed.to_string());
    }
    if result.len() > MAX_EXCLUDED_APPS {
        return Err(AppError::Validation(format!(
            "Too many excluded apps (max {MAX_EXCLUDED_APPS})"
        )));
    }
    Ok(result)
}

fn parse_excluded_apps(raw: &str) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(raw).unwrap_or_default()
}

pub struct GrammarWatchRepo;

impl GrammarWatchRepo {
    pub fn get(conn: &Connection) -> Result<GrammarWatchSettings, AppError> {
        let settings = conn.query_row(
            "SELECT enabled, excluded_apps FROM grammar_watch_settings WHERE id = 1",
            [],
            |row| {
                Ok(GrammarWatchSettings {
                    enabled: row.get::<_, i64>(0)? != 0,
                    excluded_apps: parse_excluded_apps(&row.get::<_, String>(1)?),
                })
            },
        )?;
        Ok(settings)
    }

    pub fn update(
        conn: &mut Connection,
        settings: &GrammarWatchSettings,
    ) -> Result<GrammarWatchSettings, AppError> {
        let excluded = normalize_excluded_apps(&settings.excluded_apps)?;
        let excluded_json = serde_json::to_string(&excluded)?;
        let tx = conn.transaction()?;
        tx.execute(
            "INSERT INTO grammar_watch_settings (id, enabled, excluded_apps, updated_at)
             VALUES (1, ?1, ?2, unixepoch())
             ON CONFLICT(id) DO UPDATE SET
                enabled = excluded.enabled,
                excluded_apps = excluded.excluded_apps,
                updated_at = unixepoch()",
            params![i64::from(settings.enabled), excluded_json],
        )?;
        tx.commit()?;
        Self::get(conn)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations};

    #[test]
    fn defaults_are_off_with_sensitive_apps_excluded() -> Result<(), AppError> {
        let pool = create_pool_test_memory()?;
        run_migrations(&pool)?;
        let conn = pool.get()?;
        let settings = GrammarWatchRepo::get(&conn)?;
        assert!(!settings.enabled);
        assert!(settings
            .excluded_apps
            .contains(&"com.1password.1password".to_string()));
        assert!(settings
            .excluded_apps
            .contains(&"com.apple.Terminal".to_string()));
        assert!(settings
            .excluded_apps
            .contains(&"com.jetbrains.*".to_string()));
        Ok(())
    }

    #[test]
    fn update_roundtrip_normalizes_list() -> Result<(), AppError> {
        let pool = create_pool_test_memory()?;
        run_migrations(&pool)?;
        let mut conn = pool.get()?;
        let saved = GrammarWatchRepo::update(
            &mut conn,
            &GrammarWatchSettings {
                enabled: true,
                excluded_apps: vec![
                    " com.tinyspeck.slackmacgap ".to_string(),
                    String::new(),
                    "com.tinyspeck.slackmacgap".to_string(),
                    "com.apple.mail".to_string(),
                ],
            },
        )?;
        assert!(saved.enabled);
        assert_eq!(
            saved.excluded_apps,
            vec![
                "com.tinyspeck.slackmacgap".to_string(),
                "com.apple.mail".to_string()
            ]
        );
        assert_eq!(GrammarWatchRepo::get(&conn)?, saved);
        Ok(())
    }

    #[test]
    fn normalize_rejects_oversized_input() {
        let long = "a".repeat(MAX_BUNDLE_ID_CHARS + 1);
        assert!(normalize_excluded_apps(&[long]).is_err());
        let many: Vec<String> = (0..=MAX_EXCLUDED_APPS)
            .map(|i| format!("app.{i}"))
            .collect();
        assert!(normalize_excluded_apps(&many).is_err());
    }

    #[test]
    fn corrupt_json_reads_as_empty_list() {
        assert!(parse_excluded_apps("not json").is_empty());
    }
}
