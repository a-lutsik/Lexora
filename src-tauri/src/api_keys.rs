// ============================================================
// LEXORA — API Keys Storage
// Ключи AI-провайдеров сохраняются через tauri-plugin-store
// (файл api-keys.json) и дублируются в env-переменные процесса,
// откуда их читают провайдеры (commands/translate.rs).
// ============================================================

use crate::error::AppError;
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

/// Store file name (managed by tauri-plugin-store in the app config dir)
const STORE_FILE: &str = "api-keys.json";

/// Provider name → environment variable read by AI providers
const PROVIDER_ENV_VARS: &[(&str, &str)] = &[
    ("openai", "OPENAI_API_KEY"),
    ("gemini", "GEMINI_API_KEY"),
    ("cloudflare", "CLOUDFLARE_API_KEY"),
    ("openrouter", "OPENROUTER_API_KEY"),
    ("groq", "GROQ_API_KEY"),
    ("custom", "CUSTOM_API_KEY"),
    ("unsplash", "UNSPLASH_ACCESS_KEY"),
];

/// Map provider name to its environment variable.
pub fn env_var_for_provider(provider: &str) -> Option<&'static str> {
    PROVIDER_ENV_VARS
        .iter()
        .find(|(name, _)| *name == provider)
        .map(|(_, env_var)| *env_var)
}

/// Persist an API key in the store and set the env var for immediate effect.
pub fn save_api_key(app: &AppHandle, provider: &str, key: &str) -> Result<(), AppError> {
    let trimmed = key.trim();
    if let Some(env_var) = env_var_for_provider(provider) {
        std::env::set_var(env_var, trimmed);
    }

    let store = app
        .store(STORE_FILE)
        .map_err(|e| AppError::Io(format!("Failed to open API keys store: {e}")))?;
    store.set(format!("api_keys.{provider}"), serde_json::json!(trimmed));
    store
        .save()
        .map_err(|e| AppError::Io(format!("Failed to save API keys store: {e}")))?;

    Ok(())
}

/// Retrieve an API key for a provider, checking process environment first, then the store.
pub fn get_api_key(app: &AppHandle, provider: &str) -> Option<String> {
    if let Some(env_var) = env_var_for_provider(provider) {
        if let Ok(val) = std::env::var(env_var) {
            let trimmed = val.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }

    if let Ok(store) = app.store(STORE_FILE) {
        if let Some(value) = store.get(format!("api_keys.{provider}")) {
            if let Some(key) = value.as_str() {
                let trimmed = key.trim();
                if !trimmed.is_empty() {
                    if let Some(env_var) = env_var_for_provider(provider) {
                        std::env::set_var(env_var, trimmed);
                    }
                    return Some(trimmed.to_string());
                }
            }
        }
    }

    None
}

/// Check if a provider has an API key configured.
pub fn has_api_key(app: &AppHandle, provider: &str) -> bool {
    get_api_key(app, provider).is_some()
}

/// Returns a map of provider_name -> bool indicating whether an API key is saved.
pub fn get_all_keys_status(app: &AppHandle) -> HashMap<String, bool> {
    let mut status = HashMap::new();
    for (provider, _) in PROVIDER_ENV_VARS {
        status.insert(provider.to_string(), has_api_key(app, provider));
    }
    status
}

/// Load all persisted API keys from the store into env variables.
/// Called once on startup so providers work without re-entering keys.
pub fn load_api_keys_into_env(app: &AppHandle) -> Result<(), AppError> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| AppError::Io(format!("Failed to open API keys store: {e}")))?;

    let mut loaded = 0;
    for (provider, env_var) in PROVIDER_ENV_VARS {
        if let Some(value) = store.get(format!("api_keys.{provider}")) {
            if let Some(key) = value.as_str() {
                let trimmed = key.trim();
                if !trimmed.is_empty() {
                    std::env::set_var(env_var, trimmed);
                    loaded += 1;
                }
            }
        }
    }

    log::info!("Loaded {loaded} API key(s) from store into environment");
    Ok(())
}
