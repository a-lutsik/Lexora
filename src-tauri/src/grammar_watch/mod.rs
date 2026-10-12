// ============================================================
// LEXORA — System-wide writing check («Grammarly mode»)
// Watches the focused text field in other apps (macOS
// Accessibility), shows a small badge next to it after a typing
// pause and writes accepted fixes back into the same field.
//
// Opt-in (V025): typed text goes to the AI provider. Password
// fields and excluded apps are never read; checks are ephemeral
// (nothing is stored in the DB).
// ============================================================

pub mod logic;
#[cfg(target_os = "macos")]
mod macos;

use crate::db::repos::grammar_watch::{GrammarWatchRepo, GrammarWatchSettings};
use crate::db::DbPool;
use crate::error::AppError;
use serde::Serialize;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Emitter, Manager};

pub const GRAMMAR_LABEL: &str = "grammar";
/// Field state for the badge window (`FieldPayload`).
pub const FIELD_EVENT: &str = "lexora:grammar-field";
/// The panel was collapsed from the backend (focus went back to the app).
pub const PANEL_EVENT: &str = "lexora:grammar-panel";

/// Badge window and panel sizes in points; keep in sync with
/// `src/grammar/grammar.css`. The badge window is a 44×44 hit target
/// (AGENTS.md §10) around a smaller visible circle.
pub const BADGE_SIZE: f64 = 44.0;
pub const PANEL_WIDTH: f64 = 400.0;
pub const PANEL_HEIGHT: f64 = 460.0;

/// What the badge window shows.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FieldPayload {
    /// No badge.
    Hidden,
    /// The user is typing again — the last result is stale.
    #[serde(rename_all = "camelCase")]
    Pending { field_id: u64 },
    /// Check this text (the trimmed field value).
    #[serde(rename_all = "camelCase")]
    Check {
        field_id: u64,
        text: String,
        app_name: Option<String>,
        bundle_id: Option<String>,
    },
}

#[derive(Debug, Clone, Default)]
pub struct WatchConfig {
    pub enabled: bool,
    pub excluded_apps: Vec<String>,
    /// Learning language: texts in another script are not checked.
    pub language: String,
}

/// What the watcher saw last — shown in Settings so the user can tell why
/// no badge appears (no access, excluded app, text too short, …).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize)]
#[serde(rename_all = "snake_case")]
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub enum ActivityCode {
    #[default]
    Starting,
    Disabled,
    NoAccess,
    NoField,
    ExcludedApp,
    UnsupportedField,
    FieldTooLong,
    Waiting,
    TooShort,
    OtherLanguage,
    Shown,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchActivity {
    pub code: ActivityCode,
    pub app_name: Option<String>,
    /// Field role for `UnsupportedField`, language for `OtherLanguage`.
    pub detail: Option<String>,
    /// Unix seconds when this was observed.
    pub at: i64,
}

impl WatchActivity {
    pub fn new(code: ActivityCode, app_name: Option<String>, detail: Option<String>) -> Self {
        let at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX))
            .unwrap_or(0);
        Self {
            code,
            app_name,
            detail,
            at,
        }
    }
}

/// Managed state shared by the watcher thread and the IPC commands.
pub struct GrammarWatchState {
    pub config: RwLock<WatchConfig>,
    /// Last payload sent to the badge window — read on window mount.
    pub last_payload: Mutex<FieldPayload>,
    pub activity: Mutex<WatchActivity>,
}

impl Default for GrammarWatchState {
    fn default() -> Self {
        Self {
            config: RwLock::new(WatchConfig::default()),
            last_payload: Mutex::new(FieldPayload::Hidden),
            activity: Mutex::new(WatchActivity::default()),
        }
    }
}

/// Record what the watcher sees (cheap; called on every poll).
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
pub(crate) fn report(
    app: &AppHandle,
    code: ActivityCode,
    app_name: Option<&str>,
    detail: Option<&str>,
) {
    let Some(state) = app.try_state::<GrammarWatchState>() else {
        return;
    };
    let Ok(mut activity) = state.activity.lock() else {
        return;
    };
    // Same observation: keep its first timestamp ("since …").
    if activity.code == code
        && activity.app_name.as_deref() == app_name
        && activity.detail.as_deref() == detail
    {
        return;
    }
    *activity = WatchActivity::new(
        code,
        app_name.map(str::to_string),
        detail.map(str::to_string),
    );
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GrammarWatchStatus {
    /// The platform can watch other apps' text fields (macOS only for now).
    pub supported: bool,
    pub accessibility_trusted: bool,
    pub activity: WatchActivity,
}

pub fn is_supported() -> bool {
    cfg!(target_os = "macos")
}

pub fn status(app: &AppHandle) -> GrammarWatchStatus {
    let activity = app
        .try_state::<GrammarWatchState>()
        .and_then(|state| state.activity.lock().ok().map(|a| a.clone()))
        .unwrap_or_default();
    GrammarWatchStatus {
        supported: is_supported(),
        accessibility_trusted: crate::hotkeys::accessibility_trusted(),
        activity,
    }
}

fn read_config(app: &AppHandle) -> Option<WatchConfig> {
    let state = app.try_state::<GrammarWatchState>()?;
    let config = state.config.read().ok()?;
    Some(config.clone())
}

fn write_config(app: &AppHandle, update: impl FnOnce(&mut WatchConfig)) {
    if let Some(state) = app.try_state::<GrammarWatchState>() {
        if let Ok(mut config) = state.config.write() {
            update(&mut config);
        }
    }
}

/// Send the payload to the badge window and remember it for a late mount.
pub(crate) fn publish(app: &AppHandle, payload: FieldPayload) {
    if let Some(state) = app.try_state::<GrammarWatchState>() {
        if let Ok(mut last) = state.last_payload.lock() {
            *last = payload.clone();
        }
    }
    if let Some(window) = app.get_webview_window(GRAMMAR_LABEL) {
        if let Err(e) = window.emit(FIELD_EVENT, &payload) {
            log::debug!("Grammar field event not delivered: {e}");
        }
    }
}

pub fn last_payload(app: &AppHandle) -> FieldPayload {
    app.try_state::<GrammarWatchState>()
        .and_then(|state| state.last_payload.lock().ok().map(|last| last.clone()))
        .unwrap_or(FieldPayload::Hidden)
}

fn load_language(pool: &DbPool) -> Option<String> {
    let conn = pool.get().ok()?;
    crate::db::repos::settings::SettingsRepo::get(&conn)
        .ok()
        .map(|settings| settings.primary_language)
}

/// Re-read the learning language (it can change in Settings at any time).
pub(crate) fn refresh_language(app: &AppHandle) {
    let Some(pool) = app.try_state::<Arc<DbPool>>() else {
        return;
    };
    if let Some(language) = load_language(&pool) {
        write_config(app, |config| config.language = language);
    }
}

/// Called once from `setup`: load settings and start the watcher thread.
pub fn start(app: &AppHandle) {
    app.manage(GrammarWatchState::default());
    let settings = app.try_state::<Arc<DbPool>>().and_then(|pool| {
        let conn = pool.get().ok()?;
        GrammarWatchRepo::get(&conn).ok()
    });
    if let Some(settings) = settings {
        apply_settings(app, &settings);
    }
    refresh_language(app);
    #[cfg(target_os = "macos")]
    macos::spawn_watcher(app.clone());
}

/// Apply saved settings to the running watcher. Turning it off hides the badge.
pub fn apply_settings(app: &AppHandle, settings: &GrammarWatchSettings) {
    write_config(app, |config| {
        config.enabled = settings.enabled;
        config.excluded_apps = settings.excluded_apps.clone();
    });
    if !settings.enabled {
        hide(app);
    }
}

/// Hide the badge/panel (feature off, app excluded, …).
pub fn hide(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    macos::reset(app);
    publish(app, FieldPayload::Hidden);
}

pub fn config_snapshot(app: &AppHandle) -> WatchConfig {
    read_config(app).unwrap_or_default()
}

// ── Platform dispatch for IPC commands ───────────────────

#[cfg(not(target_os = "macos"))]
fn unsupported() -> AppError {
    AppError::Validation("Writing check in other apps is available on macOS only".to_string())
}

/// Write the corrected text into the watched field. `checked` is the text
/// the check ran on; it must still be in the field (no silent overwrite of
/// what the user typed meanwhile).
pub fn apply_fix(
    app: &AppHandle,
    field_id: u64,
    checked: &str,
    corrected: &str,
) -> Result<(), AppError> {
    if corrected.trim().is_empty() {
        return Err(AppError::Validation("Corrected text is empty".to_string()));
    }
    #[cfg(target_os = "macos")]
    {
        macos::apply_fix(app, field_id, checked, corrected)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, field_id, checked);
        Err(unsupported())
    }
}

pub fn set_panel_open(app: &AppHandle, open: bool) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        macos::set_panel_open(app, open)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, open);
        Err(unsupported())
    }
}

pub fn snooze(app: &AppHandle, field_id: u64) {
    #[cfg(target_os = "macos")]
    macos::snooze(app, field_id);
    #[cfg(not(target_os = "macos"))]
    let _ = (app, field_id);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn payload_serializes_with_kind_tag() -> Result<(), serde_json::Error> {
        assert_eq!(
            serde_json::to_value(FieldPayload::Hidden)?,
            serde_json::json!({ "kind": "hidden" })
        );
        assert_eq!(
            serde_json::to_value(FieldPayload::Pending { field_id: 3 })?,
            serde_json::json!({ "kind": "pending", "fieldId": 3 })
        );
        assert_eq!(
            serde_json::to_value(FieldPayload::Check {
                field_id: 4,
                text: "She dont like it".to_string(),
                app_name: Some("Mail".to_string()),
                bundle_id: None,
            })?,
            serde_json::json!({
                "kind": "check",
                "fieldId": 4,
                "text": "She dont like it",
                "appName": "Mail",
                "bundleId": null
            })
        );
        Ok(())
    }

    #[test]
    fn activity_serializes_for_the_settings_status_line() -> Result<(), serde_json::Error> {
        let activity = WatchActivity {
            code: ActivityCode::OtherLanguage,
            app_name: Some("Telegram".to_string()),
            detail: Some("en".to_string()),
            at: 5,
        };
        assert_eq!(
            serde_json::to_value(activity)?,
            serde_json::json!({
                "code": "other_language",
                "appName": "Telegram",
                "detail": "en",
                "at": 5
            })
        );
        Ok(())
    }
}
