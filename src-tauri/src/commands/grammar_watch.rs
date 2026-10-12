// ============================================================
// LEXORA — System-wide writing check commands («Grammarly mode»)
// Thin adapters over `crate::grammar_watch`.
// ============================================================

use crate::db::repos::grammar_watch::{GrammarWatchRepo, GrammarWatchSettings};
use crate::db::DbPool;
use crate::error::AppError;
use crate::grammar_watch::{self, FieldPayload, GrammarWatchStatus};
use serde::Deserialize;
use std::sync::Arc;
use tauri::{AppHandle, State};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyGrammarFixInput {
    pub field_id: u64,
    /// Text the check ran on (must still be in the field).
    pub checked_text: String,
    pub corrected_text: String,
}

#[tauri::command]
pub async fn get_grammar_watch_settings(
    db: State<'_, Arc<DbPool>>,
) -> Result<GrammarWatchSettings, AppError> {
    let conn = db.inner().get()?;
    GrammarWatchRepo::get(&conn)
}

#[tauri::command]
pub async fn update_grammar_watch_settings(
    settings: GrammarWatchSettings,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<GrammarWatchSettings, AppError> {
    let mut conn = db.inner().get()?;
    let saved = GrammarWatchRepo::update(&mut conn, &settings)?;
    grammar_watch::apply_settings(&app, &saved);
    Ok(saved)
}

#[tauri::command]
pub fn get_grammar_watch_status(app: AppHandle) -> GrammarWatchStatus {
    grammar_watch::status(&app)
}

/// Show the macOS Accessibility prompt (once per launch).
#[tauri::command]
pub fn request_grammar_watch_access(app: AppHandle) {
    #[cfg(target_os = "macos")]
    crate::hotkeys::prompt_accessibility_if_needed(&app);
    #[cfg(not(target_os = "macos"))]
    let _ = app;
}

/// Current field for a freshly mounted badge window.
#[tauri::command]
pub fn get_grammar_field(app: AppHandle) -> FieldPayload {
    grammar_watch::last_payload(&app)
}

#[tauri::command]
pub async fn apply_grammar_fix(
    input: ApplyGrammarFixInput,
    app: AppHandle,
) -> Result<(), AppError> {
    // Accessibility writes block for up to a few hundred ms — keep them
    // off the async runtime threads.
    tokio::task::spawn_blocking(move || {
        grammar_watch::apply_fix(
            &app,
            input.field_id,
            &input.checked_text,
            &input.corrected_text,
        )
    })
    .await
    .map_err(|e| AppError::Io(format!("Applying the fix was interrupted: {e}")))?
}

#[tauri::command]
pub fn set_grammar_panel_open(open: bool, app: AppHandle) -> Result<(), AppError> {
    grammar_watch::set_panel_open(&app, open)
}

#[tauri::command]
pub fn snooze_grammar_field(field_id: u64, app: AppHandle) {
    grammar_watch::snooze(&app, field_id);
}

/// «Don't check in this app»: add the bundle id to the exclusion list.
#[tauri::command]
pub async fn exclude_grammar_app(
    bundle_id: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<GrammarWatchSettings, AppError> {
    let bundle_id = bundle_id.trim().to_string();
    if bundle_id.is_empty() {
        return Err(AppError::Validation("App id is empty".to_string()));
    }
    let mut conn = db.inner().get()?;
    let mut settings = GrammarWatchRepo::get(&conn)?;
    settings.excluded_apps.push(bundle_id);
    let saved = GrammarWatchRepo::update(&mut conn, &settings)?;
    grammar_watch::apply_settings(&app, &saved);
    grammar_watch::hide(&app);
    Ok(saved)
}
