use crate::db::repos::category::CategoryRepo;
use crate::db::DbPool;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

pub const CATEGORIES_CHANGED_EVENT: &str = "lexora:categories-changed";

pub(crate) fn notify_categories_changed(app: &AppHandle) {
    let _ = app.emit(CATEGORIES_CHANGED_EVENT, ());
    let _ = app.emit(crate::stickers::STICKER_FILTER_CHANGED_EVENT, ());
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDto {
    pub id: i64,
    pub name: String,
    pub language_id: i64,
    pub is_general: bool,
    pub word_count: i64,
}

#[tauri::command]
pub async fn list_categories(
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<CategoryDto>, AppError> {
    let conn = db.get()?;
    CategoryRepo::list(&conn, language_id)
}

#[tauri::command]
pub async fn create_category(
    name: String,
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<CategoryDto, AppError> {
    let mut conn = db.get()?;
    let result = CategoryRepo::create(&mut conn, language_id, &name)?;
    notify_categories_changed(&app);
    Ok(result)
}

#[tauri::command]
pub async fn rename_category(
    id: i64,
    name: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<CategoryDto, AppError> {
    let mut conn = db.get()?;
    let result = CategoryRepo::rename(&mut conn, id, &name)?;
    notify_categories_changed(&app);
    Ok(result)
}

#[tauri::command]
pub async fn delete_category(
    id: i64,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<(), AppError> {
    let mut conn = db.get()?;
    CategoryRepo::delete(&mut conn, id)?;
    notify_categories_changed(&app);
    Ok(())
}

#[tauri::command]
pub async fn move_vocabulary_to_category(
    ids: Vec<i64>,
    category_id: i64,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<(), AppError> {
    let mut conn = db.get()?;
    CategoryRepo::move_entries(&mut conn, &ids, category_id)?;
    notify_categories_changed(&app);
    Ok(())
}
