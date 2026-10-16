// ============================================================
// LEXORA — Settings Repository
// ============================================================

use crate::commands::settings::AppSettings;
use crate::error::AppError;
use rusqlite::{params, Connection};

fn parse_sticker_sources(raw: String) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(&raw)
        .ok()
        .unwrap_or_else(|| vec!["all".to_string()])
}

fn serialize_sticker_sources(sources: &[String]) -> String {
    serde_json::to_string(sources).unwrap_or_else(|_| "[\"all\"]".to_string())
}

pub struct SettingsRepo;

impl SettingsRepo {
    /// Load user settings from SQLite database.
    pub fn get(conn: &Connection) -> Result<AppSettings, AppError> {
        let settings = conn.query_row(
            "SELECT primary_language, interface_language, ai_provider, ai_model,
                    tts_voice, sticker_count, sticker_opacity,
                    quiet_hours_start, quiet_hours_end, offline_mode,
                    custom_base_url, cloudflare_account_id,
                    hotkey_translate, hotkey_stickers,
                    fallback_ai_provider, fallback_ai_model, fallback_enabled,
                    writing_privacy_mode, writing_auto_check, sticker_sources,
                    image_model, fallback_image_model,
                    setup_profile, tts_engine, model_package
             FROM user_settings WHERE id = 1",
            [],
            |row| {
                Ok(AppSettings {
                    primary_language: row.get(0)?,
                    interface_language: row.get(1)?,
                    ai_provider: row.get(2)?,
                    ai_model: row.get(3)?,
                    tts_voice: row.get(4)?,
                    sticker_count: row.get(5)?,
                    sticker_opacity: row.get(6)?,
                    quiet_hours_start: row.get(7)?,
                    quiet_hours_end: row.get(8)?,
                    offline_mode: row.get::<_, i64>(9)? != 0,
                    custom_base_url: row.get(10).ok(),
                    cloudflare_account_id: row.get(11).ok(),
                    hotkey_translate: row.get(12)?,
                    hotkey_stickers: row.get(13)?,
                    fallback_ai_provider: row.get(14).ok(),
                    fallback_ai_model: row.get(15).ok(),
                    fallback_enabled: row
                        .get::<_, Option<i64>>(16)
                        .unwrap_or(Some(1))
                        .unwrap_or(1)
                        != 0,
                    writing_privacy_mode: row.get::<_, i64>(17)? != 0,
                    writing_auto_check: row.get::<_, i64>(18)? != 0,
                    sticker_sources: parse_sticker_sources(row.get(19)?),
                    image_model: row
                        .get::<_, Option<String>>(20)
                        .ok()
                        .flatten()
                        .filter(|s| !s.trim().is_empty())
                        .unwrap_or_else(|| {
                            "cloudflare:@cf/black-forest-labs/flux-1-schnell".to_string()
                        }),
                    fallback_image_model: row
                        .get::<_, Option<String>>(21)
                        .ok()
                        .flatten()
                        .filter(|s| !s.trim().is_empty())
                        .unwrap_or_else(|| "gemini:gemini-3.1-flash-image".to_string()),
                    setup_profile: row.get(22).ok().flatten(),
                    tts_engine: row
                        .get::<_, Option<String>>(23)
                        .ok()
                        .flatten()
                        .filter(|s| !s.trim().is_empty())
                        .unwrap_or_else(|| "system".to_string()),
                    model_package: row
                        .get::<_, Option<String>>(24)
                        .ok()
                        .flatten()
                        .filter(|s| !s.trim().is_empty()),
                })
            },
        )?;

        Ok(settings)
    }

    /// Update user settings.
    pub fn update(conn: &Connection, settings: &AppSettings) -> Result<AppSettings, AppError> {
        conn.execute(
            "UPDATE user_settings SET
                primary_language = ?1,
                interface_language = ?2,
                ai_provider = ?3,
                ai_model = ?4,
                tts_voice = ?5,
                sticker_count = ?6,
                sticker_opacity = ?7,
                quiet_hours_start = ?8,
                quiet_hours_end = ?9,
                offline_mode = ?10,
                custom_base_url = ?11,
                cloudflare_account_id = ?12,
                hotkey_translate = ?13,
                hotkey_stickers = ?14,
                fallback_ai_provider = ?15,
                fallback_ai_model = ?16,
                fallback_enabled = ?17,
                writing_privacy_mode = ?18,
                writing_auto_check = ?19,
                sticker_sources = ?20,
                image_model = ?21,
                fallback_image_model = ?22,
                setup_profile = ?23,
                tts_engine = ?24,
                model_package = ?25,
                updated_at = unixepoch()
             WHERE id = 1",
            params![
                settings.primary_language,
                settings.interface_language,
                settings.ai_provider,
                settings.ai_model,
                settings.tts_voice,
                settings.sticker_count,
                settings.sticker_opacity,
                settings.quiet_hours_start,
                settings.quiet_hours_end,
                if settings.offline_mode { 1 } else { 0 },
                settings.custom_base_url,
                settings.cloudflare_account_id,
                settings.hotkey_translate,
                settings.hotkey_stickers,
                settings.fallback_ai_provider,
                settings.fallback_ai_model,
                if settings.fallback_enabled { 1 } else { 0 },
                if settings.writing_privacy_mode { 1 } else { 0 },
                if settings.writing_auto_check { 1 } else { 0 },
                serialize_sticker_sources(&settings.sticker_sources),
                settings.image_model,
                settings.fallback_image_model,
                settings.setup_profile,
                settings.tts_engine,
                settings.model_package,
            ],
        )?;

        Self::get(conn)
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
    fn get_returns_schema_defaults_after_migration() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let settings = SettingsRepo::get(&conn).expect("get settings");

        // Defaults from V001, V020 superseded by V023 (Gemini package)
        assert_eq!(settings.primary_language, "en");
        assert_eq!(settings.interface_language, "en");
        assert_eq!(settings.ai_provider, "gemini");
        assert_eq!(settings.ai_model, "gemini-3.8-flash");
        assert_eq!(settings.model_package.as_deref(), Some("gemini"));
        assert_eq!(settings.tts_voice, "default");
        assert_eq!(settings.sticker_count, 2);
        assert!((settings.sticker_opacity - 0.9).abs() < f64::EPSILON);
        assert!(!settings.offline_mode);
        assert_eq!(settings.quiet_hours_start, None);
        assert_eq!(settings.quiet_hours_end, None);
        assert_eq!(settings.custom_base_url, None);
        assert_eq!(settings.cloudflare_account_id, None);
        assert_eq!(settings.hotkey_translate, "CmdOrCtrl+Shift+L");
        assert_eq!(settings.hotkey_stickers, "CmdOrCtrl+Shift+S");
        assert_eq!(settings.fallback_ai_provider.as_deref(), Some("gemini"));
        assert_eq!(
            settings.fallback_ai_model.as_deref(),
            Some("gemini-3.5-flash-lite")
        );
        assert!(settings.fallback_enabled);
        assert!(!settings.writing_privacy_mode);
        assert!(!settings.writing_auto_check);
        assert_eq!(settings.sticker_sources, vec!["all".to_string()]);
        assert_eq!(
            settings.image_model,
            "cloudflare:@cf/black-forest-labs/flux-1-schnell"
        );
        assert_eq!(
            settings.fallback_image_model,
            "gemini:gemini-3.1-flash-image"
        );
        assert_eq!(settings.setup_profile, None);
        assert_eq!(settings.tts_engine, "system");
    }

    #[test]
    fn update_roundtrip_persists_all_fields() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let mut settings = SettingsRepo::get(&conn).expect("get defaults");
        settings.primary_language = "de".to_string();
        settings.interface_language = "ru".to_string();
        settings.ai_provider = "gemini".to_string();
        settings.ai_model = "gemini-2.0-flash".to_string();
        settings.tts_voice = "alloy".to_string();
        settings.sticker_count = 5;
        settings.sticker_opacity = 0.5;
        settings.quiet_hours_start = Some("22:00".to_string());
        settings.quiet_hours_end = Some("07:00".to_string());
        settings.offline_mode = true;
        settings.custom_base_url = Some("https://llm.example.com".to_string());
        settings.cloudflare_account_id = Some("cf-acc-123".to_string());
        settings.hotkey_translate = "CmdOrCtrl+Shift+T".to_string();
        settings.hotkey_stickers = "CmdOrCtrl+Shift+K".to_string();
        settings.fallback_ai_provider = Some("groq".to_string());
        settings.fallback_ai_model = Some("openai/gpt-oss-120b".to_string());
        settings.fallback_enabled = false;
        settings.writing_privacy_mode = true;
        settings.writing_auto_check = true;
        settings.sticker_sources = vec!["mine".to_string(), "c:3".to_string()];
        settings.image_model = "openai:gpt-image-1".to_string();
        settings.fallback_image_model = "gemini:gemini-2.5-flash-image".to_string();
        settings.setup_profile = Some("paid-openai".to_string());
        settings.tts_engine = "openai".to_string();

        let returned = SettingsRepo::update(&conn, &settings).expect("update");

        // update() returns the re-read row
        assert_eq!(returned.primary_language, "de");
        assert_eq!(returned.interface_language, "ru");
        assert_eq!(returned.ai_provider, "gemini");
        assert_eq!(returned.ai_model, "gemini-2.0-flash");
        assert_eq!(returned.tts_voice, "alloy");
        assert_eq!(returned.sticker_count, 5);
        assert!((returned.sticker_opacity - 0.5).abs() < f64::EPSILON);
        assert_eq!(returned.quiet_hours_start.as_deref(), Some("22:00"));
        assert_eq!(returned.quiet_hours_end.as_deref(), Some("07:00"));
        assert!(returned.offline_mode);
        assert_eq!(
            returned.custom_base_url.as_deref(),
            Some("https://llm.example.com")
        );
        assert_eq!(
            returned.cloudflare_account_id.as_deref(),
            Some("cf-acc-123")
        );
        assert_eq!(returned.hotkey_translate, "CmdOrCtrl+Shift+T");
        assert_eq!(returned.hotkey_stickers, "CmdOrCtrl+Shift+K");
        assert_eq!(returned.fallback_ai_provider.as_deref(), Some("groq"));
        assert_eq!(
            returned.fallback_ai_model.as_deref(),
            Some("openai/gpt-oss-120b")
        );
        assert!(!returned.fallback_enabled);
        assert!(returned.writing_privacy_mode);
        assert!(returned.writing_auto_check);
        assert_eq!(
            returned.sticker_sources,
            vec!["mine".to_string(), "c:3".to_string()]
        );
        assert_eq!(returned.image_model, "openai:gpt-image-1");
        assert_eq!(
            returned.fallback_image_model,
            "gemini:gemini-2.5-flash-image"
        );
        assert_eq!(returned.setup_profile.as_deref(), Some("paid-openai"));
        assert_eq!(returned.tts_engine, "openai");

        // A fresh get() sees the same persisted values
        let reread = SettingsRepo::get(&conn).expect("re-read");
        assert_eq!(reread.primary_language, "de");
        assert!(reread.offline_mode);
        assert_eq!(reread.cloudflare_account_id.as_deref(), Some("cf-acc-123"));
        assert_eq!(reread.hotkey_translate, "CmdOrCtrl+Shift+T");
        assert_eq!(reread.fallback_ai_provider.as_deref(), Some("groq"));
        assert!(!reread.fallback_enabled);
        assert!(reread.writing_privacy_mode);
        assert!(reread.writing_auto_check);
        assert_eq!(
            reread.sticker_sources,
            vec!["mine".to_string(), "c:3".to_string()]
        );
        assert_eq!(reread.image_model, "openai:gpt-image-1");
        assert_eq!(reread.fallback_image_model, "gemini:gemini-2.5-flash-image");
        assert_eq!(reread.setup_profile.as_deref(), Some("paid-openai"));
        assert_eq!(reread.tts_engine, "openai");
    }

    #[test]
    fn update_can_clear_optional_fields_back_to_none() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let mut settings = SettingsRepo::get(&conn).expect("get defaults");
        settings.quiet_hours_start = Some("23:00".to_string());
        SettingsRepo::update(&conn, &settings).expect("set quiet hours");

        settings.quiet_hours_start = None;
        let updated = SettingsRepo::update(&conn, &settings).expect("clear quiet hours");
        assert_eq!(updated.quiet_hours_start, None);
    }

    #[test]
    fn update_roundtrips_setup_profile_to_none_and_back() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let mut settings = SettingsRepo::get(&conn).expect("get defaults");
        assert_eq!(settings.setup_profile, None);

        settings.setup_profile = Some("advanced".to_string());
        let setp = SettingsRepo::update(&conn, &settings).expect("set profile");
        assert_eq!(setp.setup_profile.as_deref(), Some("advanced"));

        settings.setup_profile = None;
        let cleared = SettingsRepo::update(&conn, &settings).expect("clear profile");
        assert_eq!(cleared.setup_profile, None);
    }

    #[test]
    fn update_toggles_fallback_enabled_both_ways() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // V005 declares fallback_enabled NOT NULL DEFAULT 1, so the column
        // can only hold 0/1 — verify both directions round-trip.
        let mut settings = SettingsRepo::get(&conn).expect("get defaults");
        assert!(settings.fallback_enabled);

        settings.fallback_enabled = false;
        let off = SettingsRepo::update(&conn, &settings).expect("disable");
        assert!(!off.fallback_enabled);

        settings.fallback_enabled = true;
        let on = SettingsRepo::update(&conn, &settings).expect("re-enable");
        assert!(on.fallback_enabled);
    }
}

#[cfg(test)]
mod sticker_source_tests {
    use super::*;
    #[test]
    fn explicit_empty_sources_survive_settings_round_trip() {
        assert!(parse_sticker_sources(serialize_sticker_sources(&[])).is_empty());
        assert_eq!(parse_sticker_sources("invalid".into()), vec!["all"]);
        assert_eq!(parse_sticker_sources("[\"cat:2\"]".into()), vec!["cat:2"]);
    }
}
