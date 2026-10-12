// ============================================================
// LEXORA — Settings Commands
// ============================================================

use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Emitter, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub primary_language: String,
    pub interface_language: String,
    pub ai_provider: String,
    pub ai_model: String,
    pub custom_base_url: Option<String>,
    pub cloudflare_account_id: Option<String>,
    pub tts_voice: String,
    pub sticker_count: i64,
    pub sticker_opacity: f64,
    pub quiet_hours_start: Option<String>,
    pub quiet_hours_end: Option<String>,
    pub offline_mode: bool,
    pub hotkey_translate: String,
    pub hotkey_stickers: String,
    pub fallback_ai_provider: Option<String>,
    pub fallback_ai_model: Option<String>,
    pub fallback_enabled: bool,
    pub writing_privacy_mode: bool,
    pub writing_auto_check: bool,
    #[serde(default = "default_sticker_sources")]
    pub sticker_sources: Vec<String>,
    #[serde(default = "default_image_model")]
    pub image_model: String,
    #[serde(default = "default_fallback_image_model")]
    pub fallback_image_model: String,
    // V022__setup_profile.sql: сценарий быстрой настройки + движок TTS
    #[serde(default)]
    pub setup_profile: Option<String>,
    #[serde(default = "default_tts_engine")]
    pub tts_engine: String,
    /// V023: active model package (`gemini` | `openai` | `local` | `offline` | `cloudflare` | `custom`).
    #[serde(default)]
    pub model_package: Option<String>,
}

fn default_sticker_sources() -> Vec<String> {
    vec!["all".to_string()]
}

fn default_image_model() -> String {
    "cloudflare:@cf/black-forest-labs/flux-1-schnell".to_string()
}

fn default_fallback_image_model() -> String {
    "gemini:gemini-3.1-flash-image".to_string()
}

fn default_tts_engine() -> String {
    "system".to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            primary_language: "en".to_string(),
            interface_language: "en".to_string(),
            ai_provider: "gemini".to_string(),
            ai_model: "gemini-3.8-flash".to_string(),
            custom_base_url: None,
            cloudflare_account_id: None,
            tts_voice: "default".to_string(),
            sticker_count: 2,
            sticker_opacity: 0.9,
            quiet_hours_start: None,
            quiet_hours_end: None,
            offline_mode: false,
            hotkey_translate: crate::hotkeys::TRANSLATE_SHORTCUT.to_string(),
            hotkey_stickers: crate::hotkeys::STICKERS_SHORTCUT.to_string(),
            fallback_ai_provider: Some("gemini".to_string()),
            fallback_ai_model: Some("gemini-3.5-flash-lite".to_string()),
            fallback_enabled: true,
            writing_privacy_mode: false,
            writing_auto_check: false,
            sticker_sources: default_sticker_sources(),
            image_model: default_image_model(),
            fallback_image_model: default_fallback_image_model(),
            setup_profile: None,
            tts_engine: "system".to_string(),
            model_package: Some("gemini".to_string()),
        }
    }
}

#[tauri::command]
pub async fn get_settings(db: State<'_, Arc<DbPool>>) -> Result<AppSettings, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    SettingsRepo::get(&conn)
}

/// Сохраняет настройки в БД и применяет побочные эффекты (хоткеи, стикеры).
/// Единый путь записи для `update_settings` и `apply_setup_preset`.
pub(crate) fn persist_and_apply_side_effects(
    app: &tauri::AppHandle,
    conn: &rusqlite::Connection,
    settings: &AppSettings,
) -> Result<AppSettings, AppError> {
    // Валидируем хоткеи ДО сохранения: невалидная комбинация или дубль —
    // AppError::Validation, настройки в БД не пишутся.
    crate::hotkeys::validate_shortcuts(&settings.hotkey_translate, &settings.hotkey_stickers)?;
    crate::stickers::validate_quiet_hours(
        settings.quiet_hours_start.as_deref(),
        settings.quiet_hours_end.as_deref(),
    )?;

    let previous = SettingsRepo::get(conn)?;
    // Older windows/forms do not send `modelPackage`; keep the stored package
    // instead of wiping it (packages change only via apply_model_package).
    let mut settings = settings.clone();
    if settings.model_package.is_none() {
        settings.model_package = previous.model_package.clone();
    }
    // Models change only through routes (apply_model_package / set_role_route).
    crate::providers::models::align_with_routes(conn, &mut settings)?;
    let updated = SettingsRepo::update(conn, &settings)?;

    // Перерегистрируем глобальные хоткеи, только если они изменились
    if previous.hotkey_translate != updated.hotkey_translate
        || previous.hotkey_stickers != updated.hotkey_stickers
    {
        crate::hotkeys::register_shortcuts(
            app,
            &updated.hotkey_translate,
            &updated.hotkey_stickers,
        )?;
    }

    // Сразу применить quiet hours / количество стикеров (не ждать poll).
    if let Err(e) = crate::stickers::apply_sticker_policy(app) {
        log::warn!("Failed to apply sticker policy after settings update: {e}");
    }

    // Фильтр стикеров строится из источников и изучаемого языка.
    if previous.sticker_sources != updated.sticker_sources
        || previous.primary_language != updated.primary_language
    {
        crate::stickers::reset_roster(app);
        let _ = app.emit(crate::stickers::STICKER_FILTER_CHANGED_EVENT, ());
    }

    Ok(updated)
}

#[tauri::command]
pub async fn update_settings(
    settings: AppSettings,
    db: State<'_, Arc<DbPool>>,
    app: tauri::AppHandle,
) -> Result<AppSettings, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    persist_and_apply_side_effects(&app, &conn, &settings)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplySetupPresetInput {
    /// Полный набор настроек, вычисленный пресетом на фронтенде.
    pub settings: AppSettings,
    /// Ключ API для активного провайдера (если выбран облачный/платный сценарий).
    pub api_key: Option<String>,
}

/// Атомарная запись сценария быстрой настройки: ключ (если есть) → настройки.
/// Возвращает сохранённый `AppSettings` — фронтенд пересчитает readiness сам.
#[tauri::command]
pub async fn apply_setup_preset(
    input: ApplySetupPresetInput,
    db: State<'_, Arc<DbPool>>,
    app: tauri::AppHandle,
) -> Result<AppSettings, AppError> {
    // Ключ сохраняем первым: если запись настроек упадёт, пользователь просто
    // повторит действие — ключ уже на месте, ничего не потеряно.
    if let Some(key) = input
        .api_key
        .as_deref()
        .map(str::trim)
        .filter(|k| !k.is_empty())
    {
        let provider = input.settings.ai_provider.clone();
        crate::api_keys::save_api_key(&app, &provider, key)?;
        log::info!("apply_setup_preset: stored API key for provider: {provider}");
    }

    // The preset is an explicit model choice: write its routes first, the
    // settings save then mirrors them into the AI columns.
    let (package, routes) = crate::providers::models::preset_routes(&input.settings);
    let mut settings = input.settings.clone();
    settings.model_package = Some(package.as_str().to_string());

    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    crate::db::repos::model_route::ModelRouteRepo::write_all(&tx, &routes)?;
    let updated = persist_and_apply_side_effects(&app, &tx, &settings)?;
    tx.commit()?;
    Ok(updated)
}

#[tauri::command]
pub async fn set_api_key(
    provider: String,
    key: String,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    crate::api_keys::save_api_key(&app, &provider, &key)?;
    log::info!(
        "Stored API key for provider: {provider} (length: {})",
        key.len()
    );
    Ok(())
}

#[tauri::command]
pub async fn get_api_keys_status(
    app: tauri::AppHandle,
) -> Result<std::collections::HashMap<String, bool>, AppError> {
    Ok(crate::api_keys::get_all_keys_status(&app))
}
