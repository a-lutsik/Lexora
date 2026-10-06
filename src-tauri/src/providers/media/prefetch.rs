// ============================================================
// LEXORA — Background stock-photo upgrade for seed SVGs
// Wikimedia first (no API key). Never calls paid image generation.
// ============================================================

use super::associate::looks_like_concrete_headword;
use super::mnemonic::{associate_lexeme_image, AssociateImageRequest, DEFAULT_LEARNER_LEVEL};
use super::seed_image::lexemes_pending_photo_upgrade;
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;

const PREFETCH_GAP: Duration = Duration::from_millis(350);

/// Upgrade seed-svg cards to Wikimedia/Unsplash photos after launch.
pub fn spawn_prefetch_stock_images(app: AppHandle, pool: Arc<DbPool>, cache_dir: PathBuf) {
    tauri::async_runtime::spawn(async move {
        if let Err(e) = prefetch_stock_images(&app, &pool, cache_dir).await {
            log::warn!("Associative image prefetch stopped: {e}");
        }
    });
}

async fn prefetch_stock_images(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    cache_dir: PathBuf,
) -> Result<(), AppError> {
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    if settings.offline_mode {
        log::info!("Skip stock image prefetch (offline mode)");
        return Ok(());
    }

    let pending = lexemes_pending_photo_upgrade(pool)?;
    let concrete: Vec<_> = pending
        .into_iter()
        .filter(|(_, text, _, _)| looks_like_concrete_headword(text))
        .collect();
    if concrete.is_empty() {
        return Ok(());
    }

    log::info!(
        "Prefetching associative photos for {} concrete lexemes",
        concrete.len()
    );
    let unsplash_key = crate::api_keys::get_api_key(app, "unsplash");
    if let Err(e) = std::fs::create_dir_all(&cache_dir) {
        return Err(AppError::Io(e.to_string()));
    }

    let mut upgraded = 0usize;
    for (lexeme_id, text, photo_query, translation) in concrete {
        let translation = translation.unwrap_or_default();
        match associate_lexeme_image(
            pool,
            AssociateImageRequest {
                lexeme_id,
                word: &text,
                translation: &translation,
                context: "",
                level: DEFAULT_LEARNER_LEVEL,
                active_ai_provider: "offline",
                fallback_ai_provider: None,
                openai_key: None,
                gemini_key: None,
                cloudflare_token: None,
                cloudflare_account_id: None,
                image_model: None,
                fallback_image_model: None,
                unsplash_key: unsplash_key.clone(),
                cache_dir: &cache_dir,
                exclude_urls: &[],
                exclude_hashes: &[],
                search_limit: 8,
                skip_offset: 0,
                registry: None,
                photo_query_override: Some(photo_query.as_str()),
                avoid_scenes: &[],
                prompt_variation: None,
                exclude_stock_hashes: false,
            },
        )
        .await
        {
            Ok(Some(_)) => upgraded += 1,
            Ok(None) => {}
            Err(e) => log::debug!("Prefetch skipped for '{text}': {e}"),
        }
        tokio::time::sleep(PREFETCH_GAP).await;
    }
    log::info!("Associative photo prefetch finished ({upgraded} upgraded)");
    Ok(())
}
