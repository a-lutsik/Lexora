// ============================================================
// LEXORA — AI image generation (OpenAI Images / Gemini Imagen)
// ============================================================

use super::media_http_client;
use crate::error::AppError;
use crate::providers::ai::rate_limit::is_rate_limited;
use base64::Engine;
use reqwest::Client;
use serde_json::json;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const GEMINI_IMAGE_COOLDOWN: Duration = Duration::from_secs(90);

fn gemini_image_cooldown_until() -> &'static Mutex<Option<Instant>> {
    static UNTIL: OnceLock<Mutex<Option<Instant>>> = OnceLock::new();
    UNTIL.get_or_init(|| Mutex::new(None))
}

pub fn mark_gemini_image_rate_limited() {
    if let Ok(mut until) = gemini_image_cooldown_until().lock() {
        *until = Some(Instant::now() + GEMINI_IMAGE_COOLDOWN);
    }
}

/// Seconds left before Gemini Image may be called again.
pub fn gemini_image_cooldown_secs() -> Option<u64> {
    let guard = gemini_image_cooldown_until().lock().ok()?;
    let until = (*guard)?;
    let remaining = until.saturating_duration_since(Instant::now());
    if remaining.is_zero() {
        None
    } else {
        Some(remaining.as_secs().max(1))
    }
}

pub const PROVIDER_OPENAI_IMAGE: &str = "openai-image";
pub const PROVIDER_GEMINI_IMAGEN: &str = "gemini-imagen";
pub const PROVIDER_CLOUDFLARE_IMAGE: &str = "cloudflare-image";

pub const DEFAULT_IMAGE_MODEL: &str = "cloudflare:@cf/black-forest-labs/flux-1-schnell";
pub const DEFAULT_FALLBACK_IMAGE_MODEL: &str = "gemini:gemini-3.1-flash-image";

const OPENAI_IMAGES_URL: &str = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODEL: &str = "gpt-image-1";
const CLOUDFLARE_FLUX_STEPS: u8 = 4;
const CLOUDFLARE_FLUX_PROMPT_MAX: usize = 2048;
/// Native Gemini image models (Imagen `:predict` shut down 2026-08-17).
const GEMINI_IMAGE_MODELS: &[&str] = &["gemini-3.1-flash-image", "gemini-2.5-flash-image"];

#[derive(Debug, Clone)]
pub struct GeneratedImage {
    pub local_path: PathBuf,
    pub content_hash: String,
    pub provider: &'static str,
}

fn is_image_capable_provider(name: &str) -> bool {
    matches!(
        name.trim().to_ascii_lowercase().as_str(),
        "openai" | "gemini"
    )
}

/// Settings fallback used for images when enabled and not offline.
pub fn image_fallback_provider(enabled: bool, fallback: Option<&str>) -> Option<&str> {
    if !enabled {
        return None;
    }
    fallback
        .map(str::trim)
        .filter(|s| !s.is_empty() && !s.eq_ignore_ascii_case("offline"))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedImageModel {
    pub provider: String,
    pub model: String,
}

/// Parse `cloudflare:…` / `gemini:…` / `openai:…` (or a bare known model id).
pub fn parse_image_model_id(raw: &str) -> Option<ParsedImageModel> {
    let trimmed = raw.trim();
    if trimmed.is_empty() || trimmed.eq_ignore_ascii_case("none") {
        return None;
    }
    if let Some((provider, model)) = trimmed.split_once(':') {
        let provider = provider.trim().to_ascii_lowercase();
        let model = model.trim();
        if !model.is_empty() && matches!(provider.as_str(), "openai" | "gemini" | "cloudflare") {
            return Some(ParsedImageModel {
                provider,
                model: model.to_string(),
            });
        }
    }
    if trimmed.starts_with("@cf/") {
        return Some(ParsedImageModel {
            provider: "cloudflare".to_string(),
            model: trimmed.to_string(),
        });
    }
    let lower = trimmed.to_ascii_lowercase();
    if lower.contains("gemini") && lower.contains("image") {
        return Some(ParsedImageModel {
            provider: "gemini".to_string(),
            model: trimmed.to_string(),
        });
    }
    if lower.starts_with("gpt-image") || lower.starts_with("dall-e") {
        return Some(ParsedImageModel {
            provider: "openai".to_string(),
            model: trimmed.to_string(),
        });
    }
    None
}

#[derive(Debug, Clone, Default)]
pub struct ImageGenCredentials {
    pub openai_key: Option<String>,
    pub gemini_key: Option<String>,
    pub cloudflare_token: Option<String>,
    pub cloudflare_account_id: Option<String>,
}

fn push_unique_spec(specs: &mut Vec<ParsedImageModel>, spec: ParsedImageModel) {
    if !specs
        .iter()
        .any(|existing| existing.provider == spec.provider && existing.model == spec.model)
    {
        specs.push(spec);
    }
}

fn has_secret(value: Option<&str>) -> bool {
    value.map(str::trim).filter(|s| !s.is_empty()).is_some()
}

/// Resolve a Settings image-model id to a live backend, with a specific
/// missing-credentials message (used by the Settings connection test).
pub fn backend_for_model_id(
    model_id: &str,
    creds: &ImageGenCredentials,
) -> Result<ImageGenBackend, AppError> {
    let spec = parse_image_model_id(model_id).ok_or_else(|| {
        AppError::Validation(format!(
            "Unknown image model '{model_id}'. Pick Cloudflare FLUX, Gemini, or OpenAI."
        ))
    })?;
    match spec.provider.as_str() {
        "cloudflare" => {
            if !has_secret(creds.cloudflare_token.as_deref()) {
                return Err(AppError::Validation(
                    "Cloudflare API token is missing. Paste it in Settings.".into(),
                ));
            }
            if !has_secret(creds.cloudflare_account_id.as_deref()) {
                return Err(AppError::Validation(
                    "Cloudflare Account ID is missing. Enter the 32-character ID from the dashboard URL.".into(),
                ));
            }
        }
        "gemini" => {
            if !has_secret(creds.gemini_key.as_deref()) {
                return Err(AppError::Validation(
                    "Gemini API key is missing. Paste it in Settings.".into(),
                ));
            }
        }
        "openai" => {
            if !has_secret(creds.openai_key.as_deref()) {
                return Err(AppError::Validation(
                    "OpenAI API key is missing. Paste it in Settings.".into(),
                ));
            }
        }
        other => {
            return Err(AppError::Validation(format!(
                "Unknown image provider '{other}'."
            )));
        }
    }
    backend_from_spec(&spec, creds)
        .ok_or_else(|| AppError::Validation(format!("{} credentials are missing.", spec.provider)))
}

fn backend_from_spec(
    spec: &ParsedImageModel,
    creds: &ImageGenCredentials,
) -> Option<ImageGenBackend> {
    match spec.provider.as_str() {
        "openai" => creds
            .openai_key
            .clone()
            .filter(|k| !k.trim().is_empty())
            .map(|api_key| ImageGenBackend::OpenAI {
                api_key,
                model: spec.model.clone(),
            }),
        "gemini" => creds
            .gemini_key
            .clone()
            .filter(|k| !k.trim().is_empty())
            .map(|api_key| ImageGenBackend::Gemini {
                api_key,
                model: spec.model.clone(),
            }),
        "cloudflare" => {
            let token = creds
                .cloudflare_token
                .as_deref()
                .map(str::trim)
                .filter(|k| !k.is_empty())?;
            let account_id = creds
                .cloudflare_account_id
                .as_deref()
                .map(str::trim)
                .filter(|k| !k.is_empty())?;
            Some(ImageGenBackend::Cloudflare {
                account_id: account_id.to_string(),
                api_token: token.to_string(),
                model: spec.model.clone(),
            })
        }
        _ => None,
    }
}

/// Prefer explicit Settings image model → fallback model.
/// If neither is set, fall back to translation-provider heuristics.
pub fn select_image_gen_backends_configured(
    image_model: Option<&str>,
    fallback_image_model: Option<&str>,
    creds: &ImageGenCredentials,
    active_ai_provider: &str,
    fallback_ai_provider: Option<&str>,
) -> Vec<ImageGenBackend> {
    // An explicit "none" primary means illustrations are off (paid generation
    // must be opt-in); only an unset model keeps the legacy auto-selection.
    if image_model.is_some_and(|m| m.trim().eq_ignore_ascii_case("none")) {
        return Vec::new();
    }
    let mut specs = Vec::new();
    if let Some(spec) = image_model.and_then(parse_image_model_id) {
        push_unique_spec(&mut specs, spec);
    }
    if let Some(spec) = fallback_image_model.and_then(parse_image_model_id) {
        push_unique_spec(&mut specs, spec);
    }
    if !specs.is_empty() {
        return specs
            .iter()
            .filter_map(|spec| backend_from_spec(spec, creds))
            .collect();
    }
    select_image_gen_backends(
        active_ai_provider,
        fallback_ai_provider,
        creds.openai_key.clone(),
        creds.gemini_key.clone(),
    )
}

/// Ordered image backends: primary → Settings fallback → any remaining keyed API.
/// Wikimedia / Unsplash are the last resort after these (see associate_lexeme_image).
pub fn select_image_gen_backends(
    active_ai_provider: &str,
    fallback_ai_provider: Option<&str>,
    openai_key: Option<String>,
    gemini_key: Option<String>,
) -> Vec<ImageGenBackend> {
    let openai = openai_key.filter(|k| !k.trim().is_empty());
    let gemini = gemini_key.filter(|k| !k.trim().is_empty());

    let mut names: Vec<String> = Vec::new();
    let mut push_name = |raw: &str| {
        let name = raw.trim().to_ascii_lowercase();
        if is_image_capable_provider(&name) && !names.iter().any(|existing| existing == &name) {
            names.push(name);
        }
    };
    push_name(active_ai_provider);
    if let Some(fallback) = fallback_ai_provider {
        push_name(fallback);
    }
    if openai.is_some() {
        push_name("openai");
    }
    if gemini.is_some() {
        push_name("gemini");
    }

    let mut out = Vec::new();
    for name in names {
        match name.as_str() {
            "openai" => {
                if let Some(api_key) = openai.clone() {
                    out.push(ImageGenBackend::OpenAI {
                        api_key,
                        model: OPENAI_IMAGE_MODEL.to_string(),
                    });
                }
            }
            "gemini" => {
                if let Some(api_key) = gemini.clone() {
                    for model in GEMINI_IMAGE_MODELS {
                        out.push(ImageGenBackend::Gemini {
                            api_key: api_key.clone(),
                            model: (*model).to_string(),
                        });
                    }
                }
            }
            _ => {}
        }
    }
    out
}

/// Prefer image API matching active AI provider; else any available openai/gemini key.
pub fn select_image_gen_backend(
    active_ai_provider: &str,
    openai_key: Option<String>,
    gemini_key: Option<String>,
) -> Option<ImageGenBackend> {
    select_image_gen_backends(active_ai_provider, None, openai_key, gemini_key)
        .into_iter()
        .next()
}

#[derive(Debug, Clone)]
pub enum ImageGenBackend {
    OpenAI {
        api_key: String,
        model: String,
    },
    Gemini {
        api_key: String,
        model: String,
    },
    Cloudflare {
        account_id: String,
        api_token: String,
        model: String,
    },
}

impl ImageGenBackend {
    pub fn provider_name(&self) -> &'static str {
        match self {
            Self::OpenAI { .. } => PROVIDER_OPENAI_IMAGE,
            Self::Gemini { .. } => PROVIDER_GEMINI_IMAGEN,
            Self::Cloudflare { .. } => PROVIDER_CLOUDFLARE_IMAGE,
        }
    }

    /// `provider:model` as used by model routes and usage counters.
    pub fn route_target(&self) -> crate::providers::models::packages::RouteTarget {
        let provider = match self {
            Self::OpenAI { .. } => "openai",
            Self::Gemini { .. } => "gemini",
            Self::Cloudflare { .. } => "cloudflare",
        };
        crate::providers::models::packages::RouteTarget::new(provider, self.model_name())
    }

    pub fn model_name(&self) -> &str {
        match self {
            Self::OpenAI { model, .. }
            | Self::Gemini { model, .. }
            | Self::Cloudflare { model, .. } => model,
        }
    }

    pub async fn generate(
        &self,
        prompt: &str,
        cache_dir: &Path,
    ) -> Result<GeneratedImage, AppError> {
        let client = media_http_client();
        match self {
            Self::OpenAI { api_key, model } => {
                generate_openai_image(&client, api_key, model, prompt, cache_dir).await
            }
            Self::Gemini { api_key, model } => {
                generate_gemini_image_with_model(
                    &client,
                    api_key,
                    model,
                    &gemini_imagen_request_body(prompt),
                    cache_dir,
                )
                .await
            }
            Self::Cloudflare {
                account_id,
                api_token,
                model,
            } => {
                generate_cloudflare_image(&client, account_id, api_token, model, prompt, cache_dir)
                    .await
            }
        }
    }
}

/// Build OpenAI images/generations request body (pure — for tests).
pub fn openai_images_request_body(prompt: &str, model: &str) -> serde_json::Value {
    json!({
        "model": model,
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024"
    })
}

/// Build Gemini native image `generateContent` request body (pure — for tests).
pub fn gemini_imagen_request_body(prompt: &str) -> serde_json::Value {
    json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": { "aspectRatio": "1:1" }
        }
    })
}

/// Truncate a FLUX prompt to the Workers AI max length (char boundary).
pub fn truncate_flux_prompt(prompt: &str) -> String {
    if prompt.chars().count() <= CLOUDFLARE_FLUX_PROMPT_MAX {
        return prompt.to_string();
    }
    prompt.chars().take(CLOUDFLARE_FLUX_PROMPT_MAX).collect()
}

/// Build Cloudflare FLUX `/ai/run/{model}` body (pure — for tests).
pub fn cloudflare_flux_request_body(prompt: &str) -> serde_json::Value {
    json!({
        "prompt": truncate_flux_prompt(prompt),
        "steps": CLOUDFLARE_FLUX_STEPS
    })
}

pub fn cloudflare_image_b64_from_response(json_resp: &serde_json::Value) -> Option<&str> {
    json_resp["result"]["image"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

fn cloudflare_image_url(account_id: &str, model: &str) -> String {
    format!("https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}")
}

fn gemini_image_url(model: &str, api_key: &str) -> String {
    format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    )
}

/// First inline image payload from a generateContent response.
pub fn gemini_image_b64_from_response(json_resp: &serde_json::Value) -> Option<&str> {
    let parts = json_resp["candidates"][0]["content"]["parts"].as_array()?;
    for part in parts {
        let data = part["inlineData"]["data"]
            .as_str()
            .or_else(|| part["inline_data"]["data"].as_str())
            .map(str::trim)
            .filter(|s| !s.is_empty());
        if let Some(data) = data {
            return Some(data);
        }
    }
    None
}

/// Write image bytes into cache_dir under SHA-256 filename; reuse if present.
pub fn write_image_bytes_to_cache(
    bytes: &[u8],
    cache_dir: &Path,
    ext: &str,
) -> Result<(PathBuf, String), AppError> {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let hash = format!("{:x}", hasher.finalize());
    let filename = format!("{hash}.{ext}");
    let dest = cache_dir.join(&filename);
    if !dest.exists() {
        std::fs::create_dir_all(cache_dir)?;
        std::fs::write(&dest, bytes)?;
    }
    Ok((dest, hash))
}

fn decode_b64_image(data: &str) -> Result<Vec<u8>, AppError> {
    let trimmed = data.trim();
    let payload = trimmed
        .strip_prefix("data:image/png;base64,")
        .or_else(|| trimmed.strip_prefix("data:image/jpeg;base64,"))
        .or_else(|| trimmed.strip_prefix("data:image/webp;base64,"))
        .unwrap_or(trimmed);
    base64::engine::general_purpose::STANDARD
        .decode(payload)
        .map_err(|e| AppError::Provider(format!("Invalid image base64: {e}")))
}

async fn generate_openai_image(
    client: &Client,
    api_key: &str,
    model: &str,
    prompt: &str,
    cache_dir: &Path,
) -> Result<GeneratedImage, AppError> {
    let body = openai_images_request_body(prompt, model);
    let resp = client
        .post(OPENAI_IMAGES_URL)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::Provider(format!("OpenAI Images request failed: {e}")))?;

    let status = resp.status();
    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Provider(format!("OpenAI Images invalid JSON: {e}")))?;

    if !status.is_success() {
        let msg = json_resp["error"]["message"]
            .as_str()
            .unwrap_or("OpenAI Images API error");
        return Err(crate::providers::ai::rate_limit::http_provider_error(
            "OpenAI Images",
            status,
            msg,
        ));
    }

    let first = json_resp["data"]
        .as_array()
        .and_then(|a| a.first())
        .ok_or_else(|| AppError::Provider("OpenAI Images returned no data".to_string()))?;

    let bytes = if let Some(b64) = first["b64_json"].as_str() {
        decode_b64_image(b64)?
    } else if let Some(url) = first["url"].as_str() {
        client
            .get(url)
            .send()
            .await
            .map_err(|e| AppError::Provider(format!("OpenAI image download failed: {e}")))?
            .bytes()
            .await
            .map_err(|e| AppError::Provider(format!("OpenAI image download body failed: {e}")))?
            .to_vec()
    } else {
        return Err(AppError::Provider(
            "OpenAI Images response missing b64_json and url".to_string(),
        ));
    };

    let (local_path, content_hash) = write_image_bytes_to_cache(&bytes, cache_dir, "png")?;
    Ok(GeneratedImage {
        local_path,
        content_hash,
        provider: PROVIDER_OPENAI_IMAGE,
    })
}

/// Missing model (404) or rate-limit: try the next configured image backend.
pub fn should_try_next_gemini_image_model(err: &AppError) -> bool {
    gemini_image_model_missing(err) || is_rate_limited(err)
}

fn gemini_image_model_missing(err: &AppError) -> bool {
    if crate::providers::ai::rate_limit::is_rate_limited(err) {
        return false;
    }
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("404") || msg.contains("not found") || msg.contains("is not found")
}

async fn generate_gemini_image_with_model(
    client: &Client,
    api_key: &str,
    model: &str,
    body: &serde_json::Value,
    cache_dir: &Path,
) -> Result<GeneratedImage, AppError> {
    let url = gemini_image_url(model, api_key);
    let resp = client
        .post(&url)
        .json(body)
        .send()
        .await
        .map_err(|e| AppError::Provider(format!("Gemini Image request failed: {e}")))?;

    let status = resp.status();
    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Provider(format!("Gemini Image invalid JSON: {e}")))?;

    if !status.is_success() {
        let msg = json_resp["error"]["message"]
            .as_str()
            .or_else(|| json_resp["error"]["status"].as_str())
            .unwrap_or("Gemini Image API error");
        let err =
            crate::providers::ai::rate_limit::http_provider_error("Gemini Image", status, msg);
        return Err(err);
    }

    let b64 = gemini_image_b64_from_response(&json_resp)
        .ok_or_else(|| AppError::Provider("Gemini Image returned no image bytes".to_string()))?;

    let bytes = decode_b64_image(b64)?;
    let (local_path, content_hash) = write_image_bytes_to_cache(&bytes, cache_dir, "png")?;
    Ok(GeneratedImage {
        local_path,
        content_hash,
        provider: PROVIDER_GEMINI_IMAGEN,
    })
}

async fn generate_cloudflare_image(
    client: &Client,
    account_id: &str,
    api_token: &str,
    model: &str,
    prompt: &str,
    cache_dir: &Path,
) -> Result<GeneratedImage, AppError> {
    let body = cloudflare_flux_request_body(prompt);
    let url = cloudflare_image_url(account_id, model);
    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {api_token}"))
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::Provider(format!("Cloudflare Image request failed: {e}")))?;

    let status = resp.status();
    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Provider(format!("Cloudflare Image invalid JSON: {e}")))?;

    if !status.is_success() {
        let msg = json_resp["errors"]
            .as_array()
            .and_then(|errs| errs.first())
            .and_then(|e| e["message"].as_str())
            .or_else(|| json_resp["error"]["message"].as_str())
            .unwrap_or("Cloudflare Image API error");
        return Err(crate::providers::ai::rate_limit::http_provider_error(
            "Cloudflare Image",
            status,
            msg,
        ));
    }

    let b64 = cloudflare_image_b64_from_response(&json_resp).ok_or_else(|| {
        AppError::Provider("Cloudflare Image returned no image bytes".to_string())
    })?;
    let bytes = decode_b64_image(b64)?;
    let (local_path, content_hash) = write_image_bytes_to_cache(&bytes, cache_dir, "jpg")?;
    Ok(GeneratedImage {
        local_path,
        content_hash,
        provider: PROVIDER_CLOUDFLARE_IMAGE,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;

    #[test]
    fn select_prefers_active_openai() {
        let backend =
            select_image_gen_backend("openai", Some("sk-o".to_string()), Some("gem".to_string()));
        match backend {
            Some(ImageGenBackend::OpenAI { api_key, .. }) => assert_eq!(api_key, "sk-o"),
            other => panic!("expected OpenAI, got {other:?}"),
        }
    }

    #[test]
    fn select_prefers_active_gemini() {
        let backend =
            select_image_gen_backend("gemini", Some("sk-o".to_string()), Some("gem".to_string()));
        match backend {
            Some(ImageGenBackend::Gemini { api_key, model }) => {
                assert_eq!(api_key, "gem");
                assert_eq!(model, "gemini-3.1-flash-image");
            }
            other => panic!("expected Gemini, got {other:?}"),
        }
    }

    #[test]
    fn select_falls_back_to_any_key_for_other_providers() {
        let backend = select_image_gen_backend("groq", None, Some("gem".to_string()));
        assert!(matches!(backend, Some(ImageGenBackend::Gemini { .. })));
        assert!(select_image_gen_backend("offline", None, None).is_none());
    }

    #[test]
    fn select_backends_keeps_openai_as_gemini_fallback() {
        let backends = select_image_gen_backends(
            "gemini",
            None,
            Some("sk-o".to_string()),
            Some("gem".to_string()),
        );
        assert_eq!(backends.len(), 3);
        assert!(matches!(backends[0], ImageGenBackend::Gemini { .. }));
        assert!(matches!(backends[1], ImageGenBackend::Gemini { .. }));
        assert!(matches!(backends[2], ImageGenBackend::OpenAI { .. }));
    }

    #[test]
    fn settings_fallback_is_tried_before_the_other_key() {
        let backends = select_image_gen_backends(
            "groq",
            Some("gemini"),
            Some("sk-o".to_string()),
            Some("gem".to_string()),
        );
        assert_eq!(backends.len(), 3);
        assert!(matches!(backends[0], ImageGenBackend::Gemini { .. }));
        assert!(matches!(backends[1], ImageGenBackend::Gemini { .. }));
        assert!(matches!(backends[2], ImageGenBackend::OpenAI { .. }));
    }

    #[test]
    fn disabled_fallback_still_uses_remaining_image_keys() {
        assert!(image_fallback_provider(false, Some("openai")).is_none());
        assert_eq!(
            image_fallback_provider(true, Some("openai")),
            Some("openai")
        );
        let backends = select_image_gen_backends(
            "gemini",
            image_fallback_provider(false, Some("openai")),
            Some("sk-o".to_string()),
            Some("gem".to_string()),
        );
        assert!(matches!(backends[0], ImageGenBackend::Gemini { .. }));
        assert!(matches!(
            backends.last(),
            Some(ImageGenBackend::OpenAI { .. })
        ));
    }

    #[test]
    fn next_gemini_image_model_after_404_or_429() {
        let missing = crate::providers::ai::rate_limit::http_provider_error(
            "Gemini Image",
            reqwest::StatusCode::NOT_FOUND,
            "model is not found",
        );
        assert!(should_try_next_gemini_image_model(&missing));
        let limited = crate::providers::ai::rate_limit::rate_limit_error("Gemini Image");
        assert!(should_try_next_gemini_image_model(&limited));
        let auth = AppError::Provider("Gemini Image API error 401: invalid key".into());
        assert!(!should_try_next_gemini_image_model(&auth));
    }

    #[test]
    fn openai_request_body_contains_model_and_prompt() {
        let body = openai_images_request_body("a mosquito scene", OPENAI_IMAGE_MODEL);
        assert_eq!(body["model"], OPENAI_IMAGE_MODEL);
        assert_eq!(body["prompt"], "a mosquito scene");
        assert_eq!(body["n"], 1);
    }

    #[test]
    fn gemini_request_body_uses_generate_content() {
        let body = gemini_imagen_request_body("pesky mosquito");
        assert_eq!(body["contents"][0]["parts"][0]["text"], "pesky mosquito");
        assert_eq!(body["generationConfig"]["responseModalities"][0], "TEXT");
        assert_eq!(body["generationConfig"]["responseModalities"][1], "IMAGE");
        assert!(body["instances"].is_null());
    }

    #[test]
    fn gemini_image_b64_reads_inline_data_parts() {
        let json = serde_json::json!({
            "candidates": [{
                "content": {
                    "parts": [
                        { "text": "here you go" },
                        { "inlineData": { "mimeType": "image/png", "data": "abc123" } }
                    ]
                }
            }]
        });
        assert_eq!(gemini_image_b64_from_response(&json), Some("abc123"));
    }

    #[test]
    fn write_image_bytes_to_cache_is_stable() {
        let dir = std::env::temp_dir().join(format!("lexora-img-cache-{}", uuid::Uuid::new_v4()));
        let bytes = b"fake-png-bytes";
        let (path1, hash1) = write_image_bytes_to_cache(bytes, &dir, "png").expect("write1");
        let (path2, hash2) = write_image_bytes_to_cache(bytes, &dir, "png").expect("write2");
        assert_eq!(path1, path2);
        assert_eq!(hash1, hash2);
        assert!(path1.exists());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn decode_b64_image_handles_raw_and_data_url() {
        let raw = base64::engine::general_purpose::STANDARD.encode(b"abc");
        assert_eq!(decode_b64_image(&raw).expect("raw"), b"abc");
        let data_url = format!("data:image/png;base64,{raw}");
        assert_eq!(decode_b64_image(&data_url).expect("data"), b"abc");
    }

    #[test]
    fn parse_image_model_id_reads_prefixed_and_bare_ids() {
        let flux = parse_image_model_id(DEFAULT_IMAGE_MODEL).expect("flux");
        assert_eq!(flux.provider, "cloudflare");
        assert_eq!(flux.model, "@cf/black-forest-labs/flux-1-schnell");
        let gem = parse_image_model_id("gemini:gemini-3.1-flash-image").expect("gem");
        assert_eq!(gem.provider, "gemini");
        assert_eq!(parse_image_model_id("none"), None);
        assert_eq!(
            parse_image_model_id("@cf/black-forest-labs/flux-1-schnell")
                .expect("bare cf")
                .provider,
            "cloudflare"
        );
        assert_eq!(
            parse_image_model_id("gpt-image-1")
                .expect("bare oai")
                .provider,
            "openai"
        );
    }

    #[test]
    fn configured_models_prefer_primary_then_fallback() {
        let creds = ImageGenCredentials {
            openai_key: Some("sk-o".to_string()),
            gemini_key: Some("gem".to_string()),
            cloudflare_token: Some("cf-token".to_string()),
            cloudflare_account_id: Some("acct".to_string()),
        };
        let backends = select_image_gen_backends_configured(
            Some(DEFAULT_IMAGE_MODEL),
            Some(DEFAULT_FALLBACK_IMAGE_MODEL),
            &creds,
            "groq",
            None,
        );
        assert_eq!(backends.len(), 2);
        assert!(matches!(backends[0], ImageGenBackend::Cloudflare { .. }));
        assert!(matches!(backends[1], ImageGenBackend::Gemini { .. }));
    }

    #[test]
    fn backend_for_model_id_reports_missing_credentials() {
        let empty = ImageGenCredentials::default();
        let err = backend_for_model_id(DEFAULT_IMAGE_MODEL, &empty).expect_err("cf");
        assert!(err.to_string().contains("API token"));
        let no_account = ImageGenCredentials {
            cloudflare_token: Some("cf-token".into()),
            ..ImageGenCredentials::default()
        };
        let err = backend_for_model_id(DEFAULT_IMAGE_MODEL, &no_account).expect_err("acct");
        assert!(err.to_string().contains("Account ID"));
        let err = backend_for_model_id("gemini:gemini-3.1-flash-image", &empty).expect_err("gem");
        assert!(err.to_string().contains("Gemini API key"));
        let err = backend_for_model_id("none", &empty).expect_err("none");
        assert!(err.to_string().contains("Unknown image model"));
    }

    #[test]
    fn backend_for_model_id_builds_cloudflare_when_keyed() {
        let creds = ImageGenCredentials {
            cloudflare_token: Some("cf-token".into()),
            cloudflare_account_id: Some("acct".into()),
            ..ImageGenCredentials::default()
        };
        let backend = backend_for_model_id(DEFAULT_IMAGE_MODEL, &creds).expect("backend");
        assert_eq!(backend.provider_name(), PROVIDER_CLOUDFLARE_IMAGE);
        assert_eq!(backend.model_name(), "@cf/black-forest-labs/flux-1-schnell");
    }

    #[test]
    fn configured_skips_backend_without_credentials() {
        let creds = ImageGenCredentials {
            openai_key: Some("sk-o".to_string()),
            gemini_key: None,
            cloudflare_token: None,
            cloudflare_account_id: None,
        };
        let backends = select_image_gen_backends_configured(
            Some(DEFAULT_IMAGE_MODEL),
            Some("openai:gpt-image-1"),
            &creds,
            "offline",
            None,
        );
        assert_eq!(backends.len(), 1);
        assert!(matches!(backends[0], ImageGenBackend::OpenAI { .. }));
    }

    #[test]
    fn explicit_none_turns_illustrations_off_even_with_image_keys() {
        let creds = ImageGenCredentials {
            openai_key: Some("sk-o".to_string()),
            gemini_key: Some("AIza-g".to_string()),
            cloudflare_token: None,
            cloudflare_account_id: None,
        };
        let backends =
            select_image_gen_backends_configured(Some("none"), Some("none"), &creds, "gemini", None);
        assert!(backends.is_empty(), "'none' must not auto-enable paid generation");
    }

    #[test]
    fn unset_models_keep_legacy_auto_selection() {
        let creds = ImageGenCredentials {
            openai_key: None,
            gemini_key: Some("AIza-g".to_string()),
            cloudflare_token: None,
            cloudflare_account_id: None,
        };
        let backends = select_image_gen_backends_configured(None, None, &creds, "gemini", None);
        assert!(!backends.is_empty());
    }

    #[test]
    fn cloudflare_request_truncates_long_prompts() {
        let long = "a".repeat(3000);
        let body = cloudflare_flux_request_body(&long);
        assert_eq!(body["steps"], CLOUDFLARE_FLUX_STEPS);
        assert_eq!(
            body["prompt"].as_str().unwrap().chars().count(),
            CLOUDFLARE_FLUX_PROMPT_MAX
        );
        let json = serde_json::json!({ "result": { "image": "abc" } });
        assert_eq!(cloudflare_image_b64_from_response(&json), Some("abc"));
    }
}
