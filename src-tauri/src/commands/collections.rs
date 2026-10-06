// ============================================================
// LEXORA — Collections Commands
// ============================================================

use crate::db::packs::{ensure_system_packs, spawn_load_system_pack};
use crate::db::repos::collection::CollectionRepo;
use crate::db::DbPool;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CollectionDto {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub collection_type: String,
    pub language_id: i64,
    pub word_count: i64,
    pub is_active: bool,
    pub pack_key: Option<String>,
    pub load_status: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PackLoadProgress {
    pub collection_id: i64,
    pub done: i64,
    pub total: i64,
    pub phase: String,
    pub text: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn list_collections(
    language_id: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<CollectionDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    if let Some(lang_id) = language_id {
        let _ = ensure_system_packs(&conn, lang_id);
    }
    CollectionRepo::list(&conn, language_id)
}

#[tauri::command]
pub async fn ensure_system_packs_cmd(
    language_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<CollectionDto>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    ensure_system_packs(&conn, language_id)?;
    CollectionRepo::list(&conn, Some(language_id))
}

#[tauri::command]
pub async fn load_system_pack(
    collection_id: i64,
    with_images: Option<bool>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<(), AppError> {
    let pool = db.inner().clone();
    spawn_load_system_pack(app, pool, collection_id, with_images.unwrap_or(true))
}

#[tauri::command]
pub async fn toggle_collection(
    id: i64,
    active: bool,
    db: State<'_, Arc<DbPool>>,
) -> Result<CollectionDto, AppError> {
    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    CollectionRepo::toggle(&mut conn, id, active)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCollectionInput {
    pub name: String,
    pub description: Option<String>,
    pub language_id: i64,
}

#[tauri::command]
pub async fn create_collection(
    input: CreateCollectionInput,
    db: State<'_, Arc<DbPool>>,
) -> Result<CollectionDto, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    CollectionRepo::create(
        &conn,
        &input.name,
        input.description.as_deref(),
        input.language_id,
    )
}
