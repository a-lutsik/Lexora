// ============================================================
// LEXORA — Media Commands
// ============================================================

use crate::commands::settings::AppSettings;
use crate::db::repos::lexeme::LexemeRepo;
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::rate_limit::is_rate_limited;
use crate::providers::ai::ProviderRegistry;
use crate::providers::media::associate::{
    fetch_concrete_photo, resolve_photo_query, unsplash_photo_queries, wiki_search_queries,
    FetchPhotoRequest,
};
use crate::providers::media::image_gen::{
    backend_for_model_id, gemini_image_cooldown_secs, image_fallback_provider, ImageGenCredentials,
};
use crate::providers::media::mnemonic::{
    associate_lexeme_image, avoid_scenes_from_row, if_new_image_path, AssociateImageRequest,
    DEFAULT_LEARNER_LEVEL,
};
use crate::providers::media::unsplash::UnsplashProvider;
use crate::providers::media::wikimedia::WikimediaProvider;
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::{load_routes, primary_target, usable_targets};
use crate::providers::tts::gemini_tts::GeminiTTSProvider;
use crate::providers::tts::openai_tts::OpenAITTSProvider;
use crate::providers::tts::system::SystemTTSProvider;
use crate::providers::tts::TTSProvider;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

const REGENERATE_SEARCH_LIMIT: u8 = 20;
const PAIR_IMAGE_SEARCH_LIMIT: u8 = 8;

/// Trim + lowercase for stable pair-image cache keys.
pub fn normalize_word_image_key(word: &str) -> String {
    word.trim().to_lowercase()
}

/// Filesystem-safe stem: `{lang}_{normalized}` with unsafe chars → `_`.
pub fn pairs_cache_stem(language: &str, normalized: &str) -> String {
    let lang: String = language
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let word: String = normalized
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '\'' {
                c
            } else {
                '_'
            }
        })
        .collect();
    format!("{lang}_{word}")
}

/// First file in `dir` whose name starts with `{stem}.`.
pub fn find_cached_pair_image(dir: &Path, stem: &str) -> Option<PathBuf> {
    if stem.is_empty() || !dir.is_dir() {
        return None;
    }
    let prefix = format!("{stem}.");
    let mut matches: Vec<PathBuf> = std::fs::read_dir(dir)
        .ok()?
        .flatten()
        .filter_map(|entry| {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.starts_with(&prefix) && entry.path().is_file() {
                Some(entry.path())
            } else {
                None
            }
        })
        .collect();
    matches.sort();
    matches.into_iter().next()
}

fn extension_from_path(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .as_deref()
    {
        Some("png") => "png",
        Some("webp") => "webp",
        Some("gif") => "gif",
        _ => "jpg",
    }
}

#[tauri::command]
pub async fn get_audio_path(
    lexeme_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Option<String>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;

    let path: Option<String> = conn
        .query_row(
            "SELECT local_path FROM media WHERE lexeme_id = ?1 AND media_type = 'audio'",
            params![lexeme_id],
            |row| row.get(0),
        )
        .ok();

    Ok(path)
}

#[tauri::command]
pub async fn get_image_path(
    lexeme_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<Option<String>, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    LexemeRepo::get_image_path(&conn, lexeme_id)
}

/// Generate (or stock-search) a photo for a lexeme and persist it on the media row.
/// Seed SVGs are placeholders — they do not skip generation.
pub(crate) async fn ensure_lexeme_image(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    lexeme_id: i64,
    word: &str,
    translation: &str,
    context: &str,
    settings: &AppSettings,
    registry: Option<&ProviderRegistry>,
) -> Result<Option<String>, AppError> {
    {
        let conn = pool.get()?;
        if !LexemeRepo::needs_associated_image(&conn, lexeme_id)? {
            return LexemeRepo::get_image_path(&conn, lexeme_id);
        }
    }
    if settings.offline_mode {
        let conn = pool.get()?;
        return LexemeRepo::get_image_path(&conn, lexeme_id);
    }

    let app_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            log::warn!("Media cache dir unavailable: {e}");
            let conn = pool.get()?;
            return LexemeRepo::get_image_path(&conn, lexeme_id);
        }
    };
    let cache_dir = app_dir.join("media");
    if let Err(e) = std::fs::create_dir_all(&cache_dir) {
        log::warn!("Media cache dir failed: {e}");
        let conn = pool.get()?;
        return LexemeRepo::get_image_path(&conn, lexeme_id);
    }

    match associate_lexeme_image(
        pool,
        AssociateImageRequest {
            lexeme_id,
            word,
            translation,
            context,
            level: DEFAULT_LEARNER_LEVEL,
            active_ai_provider: &settings.ai_provider,
            fallback_ai_provider: image_fallback_provider(
                settings.fallback_enabled,
                settings.fallback_ai_provider.as_deref(),
            ),
            openai_key: crate::api_keys::get_api_key(app, "openai"),
            gemini_key: crate::api_keys::get_api_key(app, "gemini"),
            cloudflare_token: crate::api_keys::get_api_key(app, "cloudflare"),
            cloudflare_account_id: settings.cloudflare_account_id.as_deref(),
            image_model: Some(settings.image_model.as_str()),
            fallback_image_model: Some(settings.fallback_image_model.as_str()),
            unsplash_key: crate::api_keys::get_api_key(app, "unsplash"),
            cache_dir: &cache_dir,
            exclude_urls: &[],
            exclude_hashes: &[],
            search_limit: 8,
            skip_offset: 0,
            registry,
            photo_query_override: None,
            avoid_scenes: &[],
            prompt_variation: None,
            exclude_stock_hashes: true,
        },
    )
    .await
    {
        Ok(Some(img)) => Ok(Some(img.local_path)),
        Ok(None) => {
            let conn = pool.get()?;
            LexemeRepo::get_image_path(&conn, lexeme_id)
        }
        Err(e) => {
            log::warn!("Associated image pipeline failed for lexeme {lexeme_id}: {e}");
            let conn = pool.get()?;
            LexemeRepo::get_image_path(&conn, lexeme_id)
        }
    }
}

/// Language for `say`: explicit request, else Settings learning language.
/// Voice comes from Settings (`tts_voice`); placeholders like `default` are
/// resolved to an installed voice for that language.
pub fn resolve_tts_language_and_voice(
    requested_language: Option<&str>,
    primary_language: &str,
    tts_voice: &str,
) -> (String, String) {
    let from_request = requested_language.map(str::trim).filter(|s| !s.is_empty());
    let from_settings = primary_language.trim();
    let language = from_request.unwrap_or(from_settings).to_string();
    let language = if language.is_empty() {
        "en".to_string()
    } else {
        language
    };
    let voice = tts_voice.trim();
    let voice = if voice.is_empty() {
        "default".to_string()
    } else {
        voice.to_string()
    };
    (language, voice)
}

#[tauri::command]
pub async fn play_tts(
    text: String,
    language: Option<String>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<(), AppError> {
    let settings = {
        let pool = db.inner().clone();
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    let (language, voice) = resolve_tts_language_and_voice(
        language.as_deref(),
        &settings.primary_language,
        &settings.tts_voice,
    );
    let pool = db.inner().clone();
    let chain = tts_chain(&app, &pool, &settings);
    speak_with_chain(chain, &text, &language, &voice).await
}

/// TTS engines of the role chain; the system voice always closes the chain
/// so playback still works offline or when a cloud voice fails.
pub(crate) fn tts_chain(
    app: &AppHandle,
    pool: &DbPool,
    settings: &AppSettings,
) -> Vec<Box<dyn TTSProvider>> {
    let mut chain: Vec<Box<dyn TTSProvider>> = Vec::new();
    let mut has_system = false;
    if !settings.offline_mode {
        let routes = pool
            .get()
            .ok()
            .and_then(|conn| load_routes(&conn, settings).ok())
            .unwrap_or_default();
        for target in usable_targets(&routes, ModelRole::Tts) {
            match target.provider.as_str() {
                "system" => {
                    chain.push(Box::new(SystemTTSProvider));
                    has_system = true;
                }
                "gemini" => {
                    if let Some(key) = crate::api_keys::get_api_key(app, "gemini") {
                        chain.push(Box::new(GeminiTTSProvider::new(key, target.model.clone())));
                    }
                }
                "openai" => {
                    if let Some(key) = crate::api_keys::get_api_key(app, "openai") {
                        chain.push(Box::new(OpenAITTSProvider::new(key, Some(target.model.clone()))));
                    }
                }
                _ => {}
            }
        }
    }
    if !has_system {
        chain.push(Box::new(SystemTTSProvider));
    }
    chain
}

/// Speak with the first engine that works.
pub(crate) async fn speak_with_chain(
    chain: Vec<Box<dyn TTSProvider>>,
    text: &str,
    language: &str,
    voice: &str,
) -> Result<(), AppError> {
    let mut last_err: Option<AppError> = None;
    for provider in chain {
        match provider.speak(text, language, voice).await {
            Ok(()) => return Ok(()),
            Err(e) => {
                log::warn!("{} failed: {e}. Trying next voice...", provider.provider_name());
                last_err = Some(e);
            }
        }
    }
    Err(last_err.unwrap_or_else(|| AppError::Provider("No speech engine available".to_string())))
}

/// Settings «Проверить» for the TTS role: synthesize a short phrase with the primary engine.
pub(crate) async fn test_tts_role(
    app: &AppHandle,
    pool: &DbPool,
    settings: &AppSettings,
) -> Result<crate::commands::translate::TestConnectionResult, AppError> {
    use crate::commands::translate::TestConnectionResult;
    let started = std::time::Instant::now();
    let done = |ok: bool, message: String| TestConnectionResult {
        ok,
        latency_ms: started.elapsed().as_millis() as u64,
        message,
        sample_translation: None,
    };
    let Some(target) = primary_target(pool, settings, ModelRole::Tts)? else {
        return Ok(done(false, "Озвучка не настроена".to_string()));
    };
    let provider: Box<dyn TTSProvider> = match target.provider.as_str() {
        "system" => return Ok(done(true, "Системный голос macOS".to_string())),
        "gemini" => match crate::api_keys::get_api_key(app, "gemini") {
            Some(key) => Box::new(GeminiTTSProvider::new(key, target.model.clone())),
            None => return Ok(done(false, "Нужен ключ Google Gemini".to_string())),
        },
        "openai" => match crate::api_keys::get_api_key(app, "openai") {
            Some(key) => Box::new(OpenAITTSProvider::new(key, Some(target.model.clone()))),
            None => return Ok(done(false, "Нужен ключ OpenAI".to_string())),
        },
        other => return Ok(done(false, format!("{other} не поддерживается для озвучки"))),
    };
    // A unique phrase bypasses the audio cache so the check really calls the API.
    let phrase = format!("Lexora voice check {}.", chrono::Utc::now().timestamp());
    let dir = std::env::temp_dir().join("lexora_audio_check");
    let outcome = tokio::time::timeout(
        Duration::from_secs(30),
        provider.synthesize(&phrase, "en", &settings.tts_voice, &dir),
    )
    .await;
    Ok(match outcome {
        Ok(Ok(path)) => {
            let _ = std::fs::remove_file(path);
            done(true, format!("{} отвечает", provider.provider_name()))
        }
        Ok(Err(e)) => done(false, e.to_string()),
        Err(_) => done(false, "Нет ответа за 30 с".to_string()),
    })
}

/// Regenerate associated image: new mnemonic → unique AI generate → stock rotation.
/// Always returns a different file path than the one currently shown, or an error.
#[tauri::command]
pub async fn regenerate_lexeme_image(
    lexeme_id: i64,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<String, AppError> {
    if lexeme_id <= 0 {
        return Err(AppError::Validation("Invalid lexeme".to_string()));
    }

    let pool = db.inner().clone();
    let (text, translation, context, exclude_urls, exclude_hashes, avoid_scenes, current_path) = {
        let conn = pool.get()?;
        let lexeme = LexemeRepo::get_by_id(&conn, lexeme_id)?
            .ok_or_else(|| AppError::NotFound(format!("Lexeme {lexeme_id} not found")))?;
        let translation = LexemeRepo::get_translations(&conn, lexeme_id, None)?
            .into_iter()
            .next()
            .map(|row| row.translated_text)
            .unwrap_or_default();
        let context = LexemeRepo::get_examples(&conn, lexeme_id)?
            .into_iter()
            .next()
            .map(|e| e.sentence)
            .unwrap_or_default();
        let exclude_urls = LexemeRepo::list_image_source_urls(&conn, lexeme_id)?;
        let exclude_hashes = LexemeRepo::list_image_content_hashes(&conn, lexeme_id)?;
        let previous = LexemeRepo::get_visual_mnemonic(&conn, lexeme_id)?;
        let avoid_scenes = previous
            .as_ref()
            .map(avoid_scenes_from_row)
            .unwrap_or_default();
        let current_path = LexemeRepo::get_image_path(&conn, lexeme_id)?;
        (
            lexeme.text,
            translation,
            context,
            exclude_urls,
            exclude_hashes,
            avoid_scenes,
            current_path,
        )
    };

    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    if settings.offline_mode {
        return Err(AppError::Validation(
            "Pictures need a network connection. Turn off offline mode in Settings.".to_string(),
        ));
    }

    let registry = if settings.ai_provider != "offline" {
        crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextFast).ok()
    } else {
        None
    };

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to resolve app data directory: {e}")))?;
    let cache_dir = app_dir.join("media");
    std::fs::create_dir_all(&cache_dir)?;

    let openai_key = crate::api_keys::get_api_key(&app, "openai");
    let gemini_key = crate::api_keys::get_api_key(&app, "gemini");
    let unsplash_key = crate::api_keys::get_api_key(&app, "unsplash");
    let image_fallback = image_fallback_provider(
        settings.fallback_enabled,
        settings.fallback_ai_provider.as_deref(),
    );
    let gemini_cooling = gemini_image_cooldown_secs().is_some();
    let current = current_path.as_deref();

    let variation_a = uuid::Uuid::new_v4().to_string();
    match associate_lexeme_image(
        &pool,
        AssociateImageRequest {
            lexeme_id,
            word: &text,
            translation: &translation,
            context: &context,
            level: DEFAULT_LEARNER_LEVEL,
            active_ai_provider: &settings.ai_provider,
            fallback_ai_provider: image_fallback,
            openai_key: openai_key.clone(),
            gemini_key: if gemini_cooling {
                None
            } else {
                gemini_key.clone()
            },
            cloudflare_token: crate::api_keys::get_api_key(&app, "cloudflare"),
            cloudflare_account_id: settings.cloudflare_account_id.as_deref(),
            image_model: Some(settings.image_model.as_str()),
            fallback_image_model: Some(settings.fallback_image_model.as_str()),
            unsplash_key: unsplash_key.clone(),
            cache_dir: &cache_dir,
            exclude_urls: &exclude_urls,
            exclude_hashes: &exclude_hashes,
            search_limit: REGENERATE_SEARCH_LIMIT,
            skip_offset: 0,
            registry: registry.as_ref(),
            photo_query_override: None,
            avoid_scenes: &avoid_scenes,
            prompt_variation: Some(&variation_a),
            exclude_stock_hashes: true,
        },
    )
    .await
    {
        Ok(Some(img)) => {
            if let Some(path) = if_new_image_path(img.local_path, current) {
                return Ok(path);
            }
        }
        Ok(None) => {}
        Err(e) if is_rate_limited(&e) => {
            log::warn!("Image regenerate hit a rate limit, falling back to stock: {e}");
        }
        Err(e) => return Err(e),
    }

    let stored_query = {
        let conn = pool.get()?;
        LexemeRepo::get_visual_mnemonic(&conn, lexeme_id)?.and_then(|row| row.photo_query)
    };
    let scene_query = resolve_photo_query(stored_query.as_deref(), &text, &translation, &context);

    // Stock-only rotation: do not send image API keys or we will burn Gemini quota.
    if let Some(path) = associate_lexeme_image(
        &pool,
        AssociateImageRequest {
            lexeme_id,
            word: &text,
            translation: &translation,
            context: &context,
            level: DEFAULT_LEARNER_LEVEL,
            active_ai_provider: &settings.ai_provider,
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
            exclude_hashes: &exclude_hashes,
            search_limit: REGENERATE_SEARCH_LIMIT,
            skip_offset: exclude_hashes.len().max(1),
            registry: None,
            photo_query_override: scene_query.as_deref(),
            avoid_scenes: &[],
            prompt_variation: None,
            exclude_stock_hashes: false,
        },
    )
    .await?
    .and_then(|img| if_new_image_path(img.local_path, current))
    {
        return Ok(path);
    }

    let current_only: Vec<String> = exclude_urls.last().cloned().into_iter().collect();
    if let Some(path) = associate_lexeme_image(
        &pool,
        AssociateImageRequest {
            lexeme_id,
            word: &text,
            translation: &translation,
            context: &context,
            level: DEFAULT_LEARNER_LEVEL,
            active_ai_provider: &settings.ai_provider,
            fallback_ai_provider: None,
            openai_key: None,
            gemini_key: None,
            cloudflare_token: None,
            cloudflare_account_id: None,
            image_model: None,
            fallback_image_model: None,
            unsplash_key,
            cache_dir: &cache_dir,
            exclude_urls: &current_only,
            exclude_hashes: &[],
            search_limit: REGENERATE_SEARCH_LIMIT,
            skip_offset: 0,
            registry: None,
            photo_query_override: scene_query.as_deref(),
            avoid_scenes: &[],
            prompt_variation: None,
            exclude_stock_hashes: false,
        },
    )
    .await?
    .and_then(|img| if_new_image_path(img.local_path, current))
    {
        return Ok(path);
    }

    if let Some(wait) = gemini_image_cooldown_secs() {
        return Err(AppError::Provider(format!(
            "Gemini Image is rate-limited. Wait about {wait} seconds, then tap refresh once. Or pick Cloudflare FLUX / OpenAI in Settings → Image generation."
        )));
    }

    Err(AppError::Provider(
        "No other stock photo for this word. Pick an image model in Settings (Cloudflare FLUX is free daily) to generate more pictures.".to_string(),
    ))
}

/// Resolve a concrete stock photo for a bare word (minimal pairs). Local-first cache under
/// `media/pairs/{lang}_{word}.{ext}`. Never fails the UI on network errors — returns `None`.
#[tauri::command]
pub async fn resolve_word_image(
    word: String,
    language: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<Option<String>, AppError> {
    let normalized = normalize_word_image_key(&word);
    if normalized.is_empty() {
        return Ok(None);
    }
    let lang = language.trim().to_lowercase();
    if lang.is_empty() {
        return Ok(None);
    }

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Failed to resolve app data directory: {e}")))?;
    let pairs_dir = app_dir.join("media").join("pairs");
    std::fs::create_dir_all(&pairs_dir)?;

    let stem = pairs_cache_stem(&lang, &normalized);
    if let Some(cached) = find_cached_pair_image(&pairs_dir, &stem) {
        return Ok(Some(cached.to_string_lossy().into_owned()));
    }

    let offline = {
        let pool = db.inner().clone();
        let conn = pool.get()?;
        SettingsRepo::get(&conn)
            .map(|s| s.offline_mode)
            .unwrap_or(false)
    };
    if offline {
        return Ok(None);
    }

    let unsplash_key = crate::api_keys::get_api_key(&app, "unsplash");
    let unsplash = UnsplashProvider::new(unsplash_key);
    let wiki = WikimediaProvider::new();
    let unsplash_queries = unsplash_photo_queries(&normalized, "", None);
    let wiki_queries = wiki_search_queries(&normalized, "", None);

    let photo = match fetch_concrete_photo(
        &unsplash,
        &wiki,
        &pairs_dir,
        FetchPhotoRequest {
            unsplash_queries: &unsplash_queries,
            wiki_queries: &wiki_queries,
            exclude_urls: &[],
            exclude_hashes: &[],
            search_limit: PAIR_IMAGE_SEARCH_LIMIT,
            skip_offset: 0,
        },
    )
    .await
    {
        Ok(photo) => photo,
        Err(e) => {
            log::warn!("resolve_word_image fetch failed for '{normalized}': {e}");
            return Ok(None);
        }
    };

    let Some(photo) = photo else {
        return Ok(None);
    };

    let ext = extension_from_path(&photo.local_path);
    let stable = pairs_dir.join(format!("{stem}.{ext}"));
    if photo.local_path != stable {
        if let Err(e) = std::fs::copy(&photo.local_path, &stable) {
            log::warn!("resolve_word_image cache copy failed: {e}");
            return Ok(Some(photo.local_path.to_string_lossy().into_owned()));
        }
    }
    Ok(Some(stable.to_string_lossy().into_owned()))
}

const IMAGE_CONNECTION_TEST_PROMPT: &str =
    "a simple red apple, white background, no text, illustration";
const IMAGE_CONNECTION_TEST_TIMEOUT: Duration = Duration::from_secs(45);

/// Result of the "Test Image Connection" settings action.
/// Structural answer, never an IPC error: the real provider failure
/// (401 / 404 / missing key) must be visible to the user in `message`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestImageConnectionResult {
    pub ok: bool,
    pub latency_ms: u64,
    pub message: String,
    pub provider: Option<String>,
    pub sample_image_path: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestImageConnectionInput {
    pub model_id: String,
}

#[tauri::command]
pub async fn test_image_connection(
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
    input: TestImageConnectionInput,
) -> Result<TestImageConnectionResult, AppError> {
    let settings = {
        let pool = db.inner().clone();
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    run_image_connection_test(&app, &settings, &input.model_id).await
}

/// Generate one tiny sample image with `model_id` (`provider:model`).
pub(crate) async fn run_image_connection_test(
    app: &AppHandle,
    settings: &AppSettings,
    model_id: &str,
) -> Result<TestImageConnectionResult, AppError> {
    let app = app.clone();
    let input = TestImageConnectionInput {
        model_id: model_id.to_string(),
    };
    let creds = ImageGenCredentials {
        openai_key: crate::api_keys::get_api_key(&app, "openai"),
        gemini_key: crate::api_keys::get_api_key(&app, "gemini"),
        cloudflare_token: crate::api_keys::get_api_key(&app, "cloudflare"),
        cloudflare_account_id: settings.cloudflare_account_id.clone(),
    };

    let backend = match backend_for_model_id(&input.model_id, &creds) {
        Ok(backend) => backend,
        Err(e) => {
            return Ok(TestImageConnectionResult {
                ok: false,
                latency_ms: 0,
                message: e.to_string(),
                provider: None,
                sample_image_path: None,
            });
        }
    };

    let app_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            return Ok(TestImageConnectionResult {
                ok: false,
                latency_ms: 0,
                message: format!("Could not open media cache: {e}"),
                provider: Some(backend.provider_name().to_string()),
                sample_image_path: None,
            });
        }
    };
    let cache_dir = app_dir.join("media");
    if let Err(e) = std::fs::create_dir_all(&cache_dir) {
        return Ok(TestImageConnectionResult {
            ok: false,
            latency_ms: 0,
            message: format!("Could not create media cache: {e}"),
            provider: Some(backend.provider_name().to_string()),
            sample_image_path: None,
        });
    }

    let started = std::time::Instant::now();
    let outcome = tokio::time::timeout(
        IMAGE_CONNECTION_TEST_TIMEOUT,
        backend.generate(IMAGE_CONNECTION_TEST_PROMPT, &cache_dir),
    )
    .await;
    let latency_ms = started.elapsed().as_millis() as u64;

    match outcome {
        Ok(Ok(image)) => Ok(TestImageConnectionResult {
            ok: true,
            latency_ms,
            message: format!(
                "Connection to '{}' ({}) successful",
                backend.provider_name(),
                backend.model_name()
            ),
            provider: Some(backend.provider_name().to_string()),
            sample_image_path: Some(image.local_path.to_string_lossy().into_owned()),
        }),
        Ok(Err(e)) => Ok(TestImageConnectionResult {
            ok: false,
            latency_ms,
            message: e.to_string(),
            provider: Some(backend.provider_name().to_string()),
            sample_image_path: None,
        }),
        Err(_) => Ok(TestImageConnectionResult {
            ok: false,
            latency_ms,
            message: "Image model did not respond within 45s (timeout)".to_string(),
            provider: Some(backend.provider_name().to_string()),
            sample_image_path: None,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        find_cached_pair_image, normalize_word_image_key, pairs_cache_stem,
        resolve_tts_language_and_voice,
    };
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(label: &str) -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("lexora_pairs_{label}_{nanos}"));
        fs::create_dir_all(&dir).expect("mkdir");
        dir
    }

    #[test]
    fn normalize_trims_and_lowercases() {
        assert_eq!(normalize_word_image_key("  Sheep "), "sheep");
        assert_eq!(normalize_word_image_key(""), "");
    }

    #[test]
    fn pairs_stem_is_filesystem_safe() {
        assert_eq!(pairs_cache_stem("en", "sheep"), "en_sheep");
        assert_eq!(pairs_cache_stem("EN", "ship"), "en_ship");
        assert_eq!(pairs_cache_stem("en", "don't"), "en_don't");
        assert_eq!(pairs_cache_stem("en", "a b"), "en_a_b");
    }

    #[test]
    fn find_cached_pair_image_returns_existing_file() {
        let dir = temp_dir("hit");
        let path = dir.join("en_sheep.jpg");
        fs::write(&path, b"fake").expect("write");
        let found = find_cached_pair_image(&dir, "en_sheep").expect("cached");
        assert_eq!(found, path);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn find_cached_pair_image_misses_when_empty() {
        let dir = temp_dir("miss");
        assert!(find_cached_pair_image(&dir, "en_sheep").is_none());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn tts_uses_requested_language_and_settings_voice() {
        assert_eq!(
            resolve_tts_language_and_voice(Some("es"), "en", "Samantha"),
            ("es".to_string(), "Samantha".to_string())
        );
    }

    #[test]
    fn tts_falls_back_to_settings_learning_language() {
        assert_eq!(
            resolve_tts_language_and_voice(None, "de", "default"),
            ("de".to_string(), "default".to_string())
        );
        assert_eq!(
            resolve_tts_language_and_voice(Some("  "), "ru", ""),
            ("ru".to_string(), "default".to_string())
        );
    }
}
