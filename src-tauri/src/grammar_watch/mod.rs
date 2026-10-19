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
#[cfg(any(target_os = "macos", target_os = "windows"))]
mod marks;
#[cfg(target_os = "windows")]
mod win;

#[cfg(target_os = "macos")]
use macos as platform;
#[cfg(target_os = "windows")]
use win as platform;

use crate::db::repos::grammar_watch::{GrammarWatchRepo, GrammarWatchSettings};
use crate::db::DbPool;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
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

/// Underline window (as large as the watched field) and the hover card.
pub const MARKS_LABEL: &str = "grammar-marks";
pub const CARD_LABEL: &str = "grammar-card";
/// Underline rectangles for the underline window (`MarksPayload`).
pub const MARKS_EVENT: &str = "lexora:grammar-marks";
/// The suggestion shown in the hover card (`MarkInput` or null).
pub const CARD_EVENT: &str = "lexora:grammar-card";
/// A button was pressed in the hover card.
pub const MARK_ACTION_EVENT: &str = "lexora:grammar-mark-action";
/// Hover card size in points; keep in sync with `src/grammar/grammar.css`.
pub const CARD_WIDTH: f64 = 340.0;
pub const CARD_HEIGHT: f64 = 200.0;
pub use logic::CARD_GAP;
/// Most underlines drawn at once; a longer text is cut by the check anyway.
pub const MAX_MARKS: usize = 32;

/// Red under a mistake, yellow under a phrase that reads better another way.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MarkKind {
    Error,
    Improvement,
}

/// One suggestion to underline. `start`/`end` are UTF-16 offsets into the
/// checked text (JavaScript string indices).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MarkInput {
    pub id: i64,
    pub start: usize,
    pub end: usize,
    pub kind: MarkKind,
    pub title: String,
    pub original: String,
    pub suggestion: String,
    pub explanation: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetMarksInput {
    pub field_id: u64,
    /// The checked (trimmed) text the offsets refer to.
    pub text: String,
    pub marks: Vec<MarkInput>,
}

/// Rectangle in CSS pixels, relative to the underline window.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub struct MarkRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct MarkRegion {
    pub id: i64,
    pub kind: MarkKind,
    pub rects: Vec<MarkRect>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct MarksPayload {
    pub regions: Vec<MarkRegion>,
}

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
#[cfg_attr(not(any(target_os = "macos", target_os = "windows")), allow(dead_code))]
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
#[cfg_attr(not(any(target_os = "macos", target_os = "windows")), allow(dead_code))]
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
    /// The platform can watch other apps' text fields (macOS and Windows).
    pub supported: bool,
    pub accessibility_trusted: bool,
    pub activity: WatchActivity,
}

pub fn is_supported() -> bool {
    cfg!(any(target_os = "macos", target_os = "windows"))
}

pub fn status(app: &AppHandle) -> GrammarWatchStatus {
    let activity = app
        .try_state::<GrammarWatchState>()
        .and_then(|state| state.activity.lock().ok().map(|a| a.clone()))
        .unwrap_or_default();
    GrammarWatchStatus {
        supported: is_supported(),
        // Windows needs no permission to read other apps' fields.
        accessibility_trusted: cfg!(target_os = "windows") || crate::hotkeys::accessibility_trusted(),
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
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        platform::spawn_watcher(app.clone());
        marks::spawn_hover(app.clone());
    }
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
    clear_marks(app);
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    platform::reset(app);
    publish(app, FieldPayload::Hidden);
}

pub fn config_snapshot(app: &AppHandle) -> WatchConfig {
    read_config(app).unwrap_or_default()
}

// ── Platform dispatch for IPC commands ───────────────────

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn unsupported() -> AppError {
    AppError::Validation("Writing check in other apps is available on macOS and Windows only".to_string())
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
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        platform::apply_fix(app, field_id, checked, corrected)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (app, field_id, checked);
        Err(unsupported())
    }
}

pub fn set_panel_open(app: &AppHandle, open: bool) -> Result<(), AppError> {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        platform::set_panel_open(app, open)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (app, open);
        Err(unsupported())
    }
}

/// Underline the suggestions in the watched field; `None` clears them.
/// Measuring words talks to the other app: call off the async runtime.
pub fn set_marks(app: &AppHandle, input: Option<SetMarksInput>) -> Result<(), AppError> {
    if let Some(input) = input.as_ref() {
        validate_marks(input)?;
    }
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        marks::set(app, input)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (app, input);
        Ok(())
    }
}

fn validate_marks(input: &SetMarksInput) -> Result<(), AppError> {
    if input.marks.len() > MAX_MARKS {
        return Err(AppError::Validation(format!(
            "At most {MAX_MARKS} underlines at once"
        )));
    }
    if input.text.chars().count() > logic::MAX_CHECK_CHARS {
        return Err(AppError::Validation("Text is too long to underline".to_string()));
    }
    let units = input.text.encode_utf16().count();
    for mark in &input.marks {
        if mark.start >= mark.end || mark.end > units {
            return Err(AppError::Validation(format!(
                "Underline {} is outside the text",
                mark.id
            )));
        }
    }
    Ok(())
}

/// Remove underlines and the hover card.
pub(crate) fn clear_marks(app: &AppHandle) {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    marks::clear(app);
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let _ = app;
}

pub fn last_marks() -> MarksPayload {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        marks::last_payload()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        MarksPayload::default()
    }
}

pub fn last_card() -> Option<MarkInput> {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        marks::last_card()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        None
    }
}

/// A button of the hover card (`apply` / `dismiss` / `open`).
pub fn card_action(app: &AppHandle, issue_id: i64, action: &str) -> Result<(), AppError> {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        marks::card_action(app, issue_id, action)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = (app, issue_id, action);
        Ok(())
    }
}

pub fn snooze(app: &AppHandle, field_id: u64) {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    platform::snooze(app, field_id);
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
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

    #[test]
    fn marks_payload_serializes_for_the_underline_window() -> Result<(), serde_json::Error> {
        let payload = MarksPayload {
            regions: vec![MarkRegion {
                id: 3,
                kind: MarkKind::Improvement,
                rects: vec![MarkRect {
                    x: 1.0,
                    y: 2.0,
                    width: 30.0,
                    height: 18.0,
                }],
            }],
        };
        assert_eq!(
            serde_json::to_value(payload)?,
            serde_json::json!({
                "regions": [{
                    "id": 3,
                    "kind": "improvement",
                    "rects": [{ "x": 1.0, "y": 2.0, "width": 30.0, "height": 18.0 }]
                }]
            })
        );
        Ok(())
    }

    fn mark(id: i64, start: usize, end: usize) -> MarkInput {
        MarkInput {
            id,
            start,
            end,
            kind: MarkKind::Error,
            title: "Grammar".to_string(),
            original: "of".to_string(),
            suggestion: "to".to_string(),
            explanation: String::new(),
        }
    }

    #[test]
    fn set_marks_input_reads_the_frontend_shape() -> Result<(), serde_json::Error> {
        let input: SetMarksInput = serde_json::from_value(serde_json::json!({
            "fieldId": 7,
            "text": "access of rtvn",
            "marks": [{
                "id": 1, "start": 7, "end": 9, "kind": "error", "title": "Grammar",
                "original": "of", "suggestion": "to", "explanation": ""
            }]
        }))?;
        assert_eq!(input.field_id, 7);
        assert_eq!(input.marks, vec![mark(1, 7, 9)]);
        Ok(())
    }

    #[test]
    fn marks_are_validated_against_the_text() {
        let ok = SetMarksInput {
            field_id: 1,
            text: "a😀 dont".to_string(),
            marks: vec![mark(1, 4, 8)],
        };
        assert!(validate_marks(&ok).is_ok());

        let outside = SetMarksInput {
            marks: vec![mark(1, 4, 9)],
            ..ok.clone()
        };
        assert!(validate_marks(&outside).is_err());

        let empty_span = SetMarksInput {
            marks: vec![mark(1, 4, 4)],
            ..ok.clone()
        };
        assert!(validate_marks(&empty_span).is_err());

        let too_many = SetMarksInput {
            marks: (0..=MAX_MARKS as i64).map(|id| mark(id, 4, 8)).collect(),
            ..ok
        };
        assert!(validate_marks(&too_many).is_err());
    }
}
