use crate::error::AppError;
use tauri::AppHandle;

#[tauri::command]
pub fn set_interface_locale(app: AppHandle, locale: String) -> Result<(), AppError> {
    crate::i18n::set_locale(&app, &locale)
}
