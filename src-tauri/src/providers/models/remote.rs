// ============================================================
// LEXORA — Remote model lists (Settings → Продвинутый режим)
// Asks a provider which models the saved key can use, so any
// model can be picked per role without typing its id by hand.
// Parsing is pure and tested; only `fetch_models` hits the network.
// ============================================================

use super::catalog::{find, Capability};
use crate::error::AppError;
use reqwest::{Client, RequestBuilder};
use serde::Serialize;
use serde_json::Value;
use std::time::Duration;

const LIST_TIMEOUT: Duration = Duration::from_secs(15);

/// One model reported by the provider. Empty `capabilities` = unknown.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteModelDto {
    pub id: String,
    pub label: Option<String>,
    pub capabilities: Vec<Capability>,
}

/// Where to ask for the list, and how to authenticate.
pub struct ListSource {
    pub provider: String,
    pub api_key: Option<String>,
    /// OpenAI-compatible base URL (`custom`) or Cloudflare account id.
    pub base: Option<String>,
}

/// Ids that never serve a Lexora role (embeddings, moderation, search…).
fn is_unusable(id: &str) -> bool {
    const SKIP: &[&str] = &["embed", "moderation", "rerank", "guard", "search", "similarity"];
    let lower = id.to_ascii_lowercase();
    SKIP.iter().any(|s| lower.contains(s))
}

/// Best guess from the model id when the provider does not say.
fn infer_from_id(provider: &str, id: &str) -> Vec<Capability> {
    use Capability::*;
    let lower = id.to_ascii_lowercase();
    let has = |needle: &str| lower.contains(needle);
    if has("whisper") || has("transcribe") {
        return vec![Transcription];
    }
    if has("tts") {
        return vec![Speech];
    }
    if has("realtime") || has("live") || has("native-audio") {
        return vec![RealtimeVoice];
    }
    if has("dall-e") || has("image") || has("flux") || has("diffusion") {
        return vec![ImageGeneration];
    }
    match provider {
        "anthropic" => vec![Text, Vision],
        "gemini" if has("gemini") => vec![Text, Vision, AudioInput, Transcription],
        "openai" if ["gpt-4o", "gpt-4.1", "gpt-5", "gpt-6", "o3", "o4"].iter().any(|p| has(p)) => {
            vec![Text, Vision]
        }
        _ if has("vision") || has("-vl") || has("llava") => vec![Text, Vision],
        _ => vec![Text],
    }
}

fn model(provider: &str, id: &str, label: Option<String>, inferred: Vec<Capability>) -> RemoteModelDto {
    let capabilities = find(provider, id)
        .map(|spec| spec.capabilities.to_vec())
        .unwrap_or(inferred);
    RemoteModelDto {
        id: id.to_string(),
        label: label.filter(|l| !l.trim().is_empty() && l != id),
        capabilities,
    }
}

fn sorted(mut models: Vec<RemoteModelDto>) -> Vec<RemoteModelDto> {
    models.sort_by(|a, b| a.id.cmp(&b.id));
    models.dedup_by(|a, b| a.id == b.id);
    models
}

/// `{"data":[{"id":…}]}` — OpenAI, Groq, DeepSeek, Ollama, LM Studio, Anthropic.
pub fn parse_openai_list(provider: &str, body: &Value) -> Vec<RemoteModelDto> {
    let items = body["data"].as_array().cloned().unwrap_or_default();
    sorted(
        items
            .iter()
            .filter_map(|item| {
                let id = item["id"].as_str()?.trim();
                if id.is_empty() || is_unusable(id) {
                    return None;
                }
                let label = item["display_name"].as_str().map(str::to_string);
                Some(model(provider, id, label, infer_from_id(provider, id)))
            })
            .collect(),
    )
}

/// OpenRouter reports modalities, so capabilities are exact.
pub fn parse_openrouter_list(body: &Value) -> Vec<RemoteModelDto> {
    use Capability::*;
    let items = body["data"].as_array().cloned().unwrap_or_default();
    sorted(
        items
            .iter()
            .filter_map(|item| {
                let id = item["id"].as_str()?.trim();
                if id.is_empty() || is_unusable(id) {
                    return None;
                }
                let modalities = |key: &str| -> Vec<String> {
                    item["architecture"][key]
                        .as_array()
                        .map(|list| list.iter().filter_map(|m| m.as_str().map(str::to_string)).collect())
                        .unwrap_or_default()
                };
                let input = modalities("input_modalities");
                let output = modalities("output_modalities");
                let mut caps = Vec::new();
                if output.is_empty() || output.iter().any(|m| m == "text") {
                    caps.push(Text);
                }
                if input.iter().any(|m| m == "image") {
                    caps.push(Vision);
                }
                if input.iter().any(|m| m == "audio") {
                    caps.extend([AudioInput, Transcription]);
                }
                if output.iter().any(|m| m == "image") {
                    caps.push(ImageGeneration);
                }
                let label = item["name"].as_str().map(str::to_string);
                Some(model("openrouter", id, label, caps))
            })
            .collect(),
    )
}

/// `{"models":[{"name":"models/…","displayName":…,"supportedGenerationMethods":[…]}]}`.
pub fn parse_gemini_list(body: &Value) -> Vec<RemoteModelDto> {
    let items = body["models"].as_array().cloned().unwrap_or_default();
    sorted(
        items
            .iter()
            .filter_map(|item| {
                let id = item["name"].as_str()?.trim().trim_start_matches("models/");
                let methods: Vec<&str> = item["supportedGenerationMethods"]
                    .as_array()
                    .map(|m| m.iter().filter_map(Value::as_str).collect())
                    .unwrap_or_default();
                let generates = methods
                    .iter()
                    .any(|m| *m == "generateContent" || *m == "bidiGenerateContent" || *m == "predict");
                if id.is_empty() || is_unusable(id) || !generates {
                    return None;
                }
                let mut caps = infer_from_id("gemini", id);
                if methods.contains(&"bidiGenerateContent") && !caps.contains(&Capability::RealtimeVoice) {
                    caps = vec![Capability::RealtimeVoice];
                }
                let label = item["displayName"].as_str().map(str::to_string);
                Some(model("gemini", id, label, caps))
            })
            .collect(),
    )
}

/// `{"result":[{"name":"@cf/…","task":{"name":"Text Generation"}}]}`.
pub fn parse_cloudflare_list(body: &Value) -> Vec<RemoteModelDto> {
    use Capability::*;
    let items = body["result"].as_array().cloned().unwrap_or_default();
    sorted(
        items
            .iter()
            .filter_map(|item| {
                let id = item["name"].as_str()?.trim();
                let caps = match item["task"]["name"].as_str().unwrap_or_default() {
                    "Text Generation" => vec![Text],
                    "Text-to-Image" => vec![ImageGeneration],
                    "Automatic Speech Recognition" => vec![Transcription],
                    "Text-to-Speech" => vec![Speech],
                    "Image-to-Text" => vec![Text, Vision],
                    _ => return None,
                };
                Some(model("cloudflare", id, None, caps))
            })
            .collect(),
    )
}

fn openai_compatible_base(provider: &str, base: Option<&str>) -> Option<String> {
    let url = match provider {
        "openai" => "https://api.openai.com/v1",
        "groq" => "https://api.groq.com/openai/v1",
        "deepseek" => "https://api.deepseek.com/v1",
        "openrouter" => "https://openrouter.ai/api/v1",
        "anthropic" => "https://api.anthropic.com/v1",
        "custom" => base?,
        _ => return None,
    };
    Some(url.trim_end_matches('/').trim_end_matches("/chat/completions").to_string())
}

async fn get_json(provider: &str, request: RequestBuilder) -> Result<Value, AppError> {
    // reqwest errors never carry the key: it travels in headers only.
    let resp = request
        .timeout(LIST_TIMEOUT)
        .send()
        .await
        .map_err(|e| AppError::Http(format!("{provider}: model list unavailable: {e}")))?;
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        let snippet: String = body.chars().take(200).collect();
        return Err(AppError::Provider(format!("{provider} API error {status}: {snippet}")));
    }
    serde_json::from_str(&body)
        .map_err(|e| AppError::Serialization(format!("{provider}: unexpected model list: {e}")))
}

/// Ask the provider which models the key can use.
pub async fn fetch_models(source: &ListSource) -> Result<Vec<RemoteModelDto>, AppError> {
    let client = Client::new();
    let provider = source.provider.as_str();
    let key = source.api_key.as_deref().filter(|k| !k.trim().is_empty());
    match provider {
        "gemini" => {
            let key = key.ok_or_else(|| missing_key(provider))?;
            let request = client
                .get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000")
                .header("x-goog-api-key", key);
            Ok(parse_gemini_list(&get_json(provider, request).await?))
        }
        "cloudflare" => {
            let key = key.ok_or_else(|| missing_key(provider))?;
            let account = source
                .base
                .as_deref()
                .filter(|a| !a.trim().is_empty())
                .ok_or_else(|| AppError::Validation("Cloudflare Account ID is missing".into()))?;
            let url = format!(
                "https://api.cloudflare.com/client/v4/accounts/{}/ai/models/search?per_page=500",
                account.trim()
            );
            let request = client.get(url).bearer_auth(key);
            Ok(parse_cloudflare_list(&get_json(provider, request).await?))
        }
        _ => {
            let base = openai_compatible_base(provider, source.base.as_deref()).ok_or_else(|| {
                AppError::Validation(format!("{provider} does not publish a model list"))
            })?;
            let mut request = client.get(format!("{base}/models"));
            request = match (provider, key) {
                ("anthropic", Some(k)) => request
                    .header("x-api-key", k)
                    .header("anthropic-version", "2023-06-01"),
                (_, Some(k)) => request.bearer_auth(k),
                // OpenRouter and local servers answer without a key.
                ("openrouter" | "custom", None) => request,
                (_, None) => return Err(missing_key(provider)),
            };
            let body = get_json(provider, request).await?;
            Ok(if provider == "openrouter" {
                parse_openrouter_list(&body)
            } else {
                parse_openai_list(provider, &body)
            })
        }
    }
}

fn missing_key(provider: &str) -> AppError {
    AppError::Validation(format!("Save the {provider} API key first to load its models"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use Capability::*;

    #[test]
    fn openai_list_skips_embeddings_and_guesses_capabilities() {
        let body = json!({"data": [
            {"id": "gpt-6-luna"},
            {"id": "text-embedding-3-large"},
            {"id": "whisper-1"},
            {"id": "gpt-4o-mini-tts"},
            {"id": "gpt-4.1-mini"},
            {"id": "omni-moderation-latest"}
        ]});
        let models = parse_openai_list("openai", &body);
        let ids: Vec<&str> = models.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(ids, vec!["gpt-4.1-mini", "gpt-4o-mini-tts", "gpt-6-luna", "whisper-1"]);
        let caps = |id: &str| models.iter().find(|m| m.id == id).map(|m| m.capabilities.clone());
        assert_eq!(caps("gpt-4.1-mini"), Some(vec![Text, Vision]));
        assert_eq!(caps("whisper-1"), Some(vec![Transcription]));
        assert_eq!(caps("gpt-4o-mini-tts"), Some(vec![Speech]));
    }

    #[test]
    fn known_models_take_capabilities_from_the_catalog() {
        let body = json!({"data": [{"id": "deepseek-chat"}, {"id": "deepseek-v5"}]});
        let models = parse_openai_list("deepseek", &body);
        assert_eq!(models[0].capabilities, vec![Text]);
        assert_eq!(models[1].id, "deepseek-v5");
        assert_eq!(models[1].capabilities, vec![Text]);
    }

    #[test]
    fn anthropic_list_keeps_display_names() {
        let body = json!({"data": [{"id": "claude-opus-5-5", "display_name": "Claude Opus 5.5"}]});
        let models = parse_openai_list("anthropic", &body);
        assert_eq!(models[0].label.as_deref(), Some("Claude Opus 5.5"));
        assert_eq!(models[0].capabilities, vec![Text, Vision]);
    }

    #[test]
    fn openrouter_list_reads_modalities() {
        let body = json!({"data": [
            {"id": "qwen/qwen3-vl", "name": "Qwen3 VL",
             "architecture": {"input_modalities": ["text", "image"], "output_modalities": ["text"]}},
            {"id": "google/gemini-x", "name": "Gemini X",
             "architecture": {"input_modalities": ["text", "audio"], "output_modalities": ["text"]}},
            {"id": "black-forest/flux", "name": "Flux",
             "architecture": {"input_modalities": ["text"], "output_modalities": ["image"]}}
        ]});
        let models = parse_openrouter_list(&body);
        assert_eq!(models[0].id, "black-forest/flux");
        assert_eq!(models[0].capabilities, vec![ImageGeneration]);
        assert_eq!(models[1].capabilities, vec![Text, AudioInput, Transcription]);
        assert_eq!(models[2].capabilities, vec![Text, Vision]);
    }

    #[test]
    fn gemini_list_strips_prefix_and_skips_non_generating_models() {
        let body = json!({"models": [
            {"name": "models/gemini-4-flash", "displayName": "Gemini 4 Flash",
             "supportedGenerationMethods": ["generateContent", "countTokens"]},
            {"name": "models/text-embedding-005", "supportedGenerationMethods": ["embedContent"]},
            {"name": "models/gemini-4-flash-live", "supportedGenerationMethods": ["bidiGenerateContent"]},
            {"name": "models/aqa", "supportedGenerationMethods": ["generateAnswer"]}
        ]});
        let models = parse_gemini_list(&body);
        let ids: Vec<&str> = models.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(ids, vec!["gemini-4-flash", "gemini-4-flash-live"]);
        assert_eq!(models[0].capabilities, vec![Text, Vision, AudioInput, Transcription]);
        assert_eq!(models[1].capabilities, vec![RealtimeVoice]);
    }

    #[test]
    fn cloudflare_list_maps_tasks() {
        let body = json!({"result": [
            {"name": "@cf/meta/llama-4", "task": {"name": "Text Generation"}},
            {"name": "@cf/bge", "task": {"name": "Text Embeddings"}},
            {"name": "@cf/flux-2", "task": {"name": "Text-to-Image"}}
        ]});
        let models = parse_cloudflare_list(&body);
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].capabilities, vec![ImageGeneration]);
        assert_eq!(models[1].capabilities, vec![Text]);
    }

    #[test]
    fn custom_base_url_drops_the_chat_suffix() {
        assert_eq!(
            openai_compatible_base("custom", Some("http://localhost:11434/v1/chat/completions")),
            Some("http://localhost:11434/v1".to_string())
        );
        assert_eq!(openai_compatible_base("custom", None), None);
        assert_eq!(openai_compatible_base("system", None), None);
    }
}
