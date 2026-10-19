// ============================================================
// LEXORA — Model catalog (single source of truth for the UI)
// Capabilities, tier and lifecycle of known models. Verified
// against provider docs / OpenRouter catalog on 2026-10-04.
// Unknown (custom) model names are allowed: support = Unknown.
// ============================================================

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Capability {
    Text,
    Vision,
    AudioInput,
    Transcription,
    RealtimeVoice,
    LiveTranslation,
    Speech,
    ImageGeneration,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Tier {
    /// No account limits beyond fair use (local models, system voice).
    Local,
    /// Free model on a shared router (may disappear without notice).
    Free,
    /// Paid model with a free quota on the same key.
    FreeTier,
    Paid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum ModelStatus {
    #[serde(rename = "stable")]
    Stable,
    #[serde(rename = "preview")]
    Preview,
    /// Still served, shutdown announced.
    #[serde(rename = "deprecated")]
    Deprecated { shutdown: &'static str },
    /// No longer served — never route to it.
    #[serde(rename = "retired")]
    Retired,
}

/// What a unit price is charged for (only units Lexora counts exactly).
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PriceUnit {
    Image,
    Minute,
}

/// Published paid-tier price used for the «Расходы AI» estimate.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnitPrice {
    pub unit: PriceUnit,
    pub usd: f64,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelSpec {
    pub provider: &'static str,
    pub id: &'static str,
    pub label: &'static str,
    pub capabilities: &'static [Capability],
    pub tier: Tier,
    pub status: ModelStatus,
    pub price: Option<UnitPrice>,
}

/// Support of a capability by a (provider, model) pair.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Support {
    Yes,
    No,
    Unknown,
}

use Capability::*;

const GEMINI_FLASH: &[Capability] = &[Text, Vision, AudioInput, Transcription];
const TEXT_VISION: &[Capability] = &[Text, Vision];
const TEXT_ONLY: &[Capability] = &[Text];

pub static CATALOG: &[ModelSpec] = &[
    // ── Google Gemini ──────────────────────────────────────
    spec("gemini", "gemini-3.8-flash", "Gemini 3.8 Flash", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-3.6-flash", "Gemini 3.6 Flash", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-2.5-flash", "Gemini 2.5 Flash", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-2.5-flash-lite", "Gemini 2.5 Flash-Lite", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-2.5-pro", "Gemini 2.5 Pro", GEMINI_FLASH, Tier::Paid, ModelStatus::Stable),
    spec("gemini", "gemini-1.5-flash", "Gemini 1.5 Flash", GEMINI_FLASH, Tier::FreeTier, ModelStatus::Retired),
    // Paid tier: audio in $0.005/min (the mic streams all session) + out $0.018/min at most.
    priced(
        spec("gemini", "gemini-3.8-live", "Gemini 3.8 Live", &[RealtimeVoice], Tier::FreeTier, ModelStatus::Stable),
        PriceUnit::Minute,
        0.023,
    ),
    spec("gemini", "gemini-3.5-live-translate-preview", "Gemini 3.5 Live Translate", &[LiveTranslation], Tier::FreeTier, ModelStatus::Preview),
    spec("gemini", "gemini-3.8-flash-lite-tts", "Gemini 3.8 Flash-Lite TTS", &[Speech], Tier::FreeTier, ModelStatus::Stable),
    spec("gemini", "gemini-3.8-flash-tts", "Gemini 3.8 Flash TTS", &[Speech], Tier::FreeTier, ModelStatus::Stable),
    priced(
        spec("gemini", "gemini-3.1-flash-lite-image", "Nano Banana 2 Lite", &[ImageGeneration], Tier::Paid, ModelStatus::Stable),
        PriceUnit::Image,
        0.034,
    ),
    spec("gemini", "gemini-3.1-flash-image", "Nano Banana 2", &[ImageGeneration], Tier::Paid, ModelStatus::Stable),
    spec("gemini", "gemini-3-pro-image", "Nano Banana Pro", &[ImageGeneration], Tier::Paid, ModelStatus::Stable),
    // ── OpenAI ─────────────────────────────────────────────
    spec("openai", "gpt-6-luna", "GPT-6 Luna", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-6.1-sol", "GPT-6.1 Sol", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-4o-mini", "GPT-4o mini", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-4o", "GPT-4o", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-3.5-turbo", "GPT-3.5 Turbo", TEXT_ONLY, Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-transcribe", "GPT Transcribe", &[Transcription], Tier::Paid, ModelStatus::Stable),
    spec("openai", "whisper-1", "Whisper", &[Transcription], Tier::Paid, ModelStatus::Deprecated { shutdown: "2027-02-26" }),
    spec("openai", "gpt-realtime-2.1-mini", "GPT Realtime 2.1 mini", &[RealtimeVoice], Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-realtime-translate", "GPT Realtime Translate", &[LiveTranslation], Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-4o-mini-tts", "GPT-4o mini TTS", &[Speech], Tier::Paid, ModelStatus::Stable),
    spec("openai", "tts-1", "TTS-1", &[Speech], Tier::Paid, ModelStatus::Deprecated { shutdown: "2027-01-06" }),
    spec("openai", "gpt-image-2.5-flare", "GPT Image 2.5 Flare", &[ImageGeneration], Tier::Paid, ModelStatus::Stable),
    spec("openai", "gpt-image-1", "GPT Image 1", &[ImageGeneration], Tier::Paid, ModelStatus::Deprecated { shutdown: "2026-12-01" }),
    // ── OpenRouter ─────────────────────────────────────────
    spec("openrouter", "google/gemma-4-31b-it:free", "Gemma 4 31B (free)", TEXT_VISION, Tier::Free, ModelStatus::Stable),
    spec("openrouter", "qwen/qwen3.8-27b:free", "Qwen 3.8 27B (free)", TEXT_VISION, Tier::Free, ModelStatus::Stable),
    spec("openrouter", "nvidia/nemotron-3.5-lightning:free", "Nemotron 3.5 Lightning (free)", TEXT_ONLY, Tier::Free, ModelStatus::Stable),
    spec("openrouter", "openrouter/free", "OpenRouter Free Router", TEXT_VISION, Tier::Free, ModelStatus::Stable),
    spec("openrouter", "google/gemini-3.6-flash", "Gemini 3.6 Flash (OpenRouter)", &[Text, Vision, AudioInput, Transcription], Tier::Paid, ModelStatus::Stable),
    spec("openrouter", "minimax/minimax-m3", "MiniMax M3", TEXT_ONLY, Tier::Paid, ModelStatus::Stable),
    spec("openrouter", "minimax/minimax-m3:free", "MiniMax M3 (free)", TEXT_ONLY, Tier::Free, ModelStatus::Retired),
    spec("openrouter", "minimax/minimax-m2.7:free", "MiniMax M2.7 (free)", TEXT_ONLY, Tier::Free, ModelStatus::Retired),
    spec("openrouter", "deepseek/deepseek-r1:free", "DeepSeek R1 (free)", TEXT_ONLY, Tier::Free, ModelStatus::Retired),
    spec("openrouter", "google/gemini-2.5-flash:free", "Gemini 2.5 Flash (free)", TEXT_VISION, Tier::Free, ModelStatus::Retired),
    spec("openrouter", "z-ai/glm-5.2:free", "GLM-5.2 (free)", TEXT_ONLY, Tier::Free, ModelStatus::Retired),
    // ── Groq ───────────────────────────────────────────────
    spec("groq", "openai/gpt-oss-120b", "GPT OSS 120B", TEXT_ONLY, Tier::FreeTier, ModelStatus::Stable),
    spec("groq", "openai/gpt-oss-20b", "GPT OSS 20B", TEXT_ONLY, Tier::FreeTier, ModelStatus::Stable),
    spec("groq", "llama-3.3-70b-versatile", "Llama 3.3 70B", TEXT_ONLY, Tier::FreeTier, ModelStatus::Stable),
    spec("groq", "whisper-large-v3-turbo", "Whisper Large v3 Turbo", &[Transcription], Tier::FreeTier, ModelStatus::Stable),
    spec("groq", "qwen/qwen3.6-27b", "Qwen 3.6 27B", TEXT_ONLY, Tier::FreeTier, ModelStatus::Retired),
    // ── DeepSeek ───────────────────────────────────────────
    spec("deepseek", "deepseek-chat", "DeepSeek Chat", TEXT_ONLY, Tier::Paid, ModelStatus::Stable),
    spec("deepseek", "deepseek-reasoner", "DeepSeek Reasoner", TEXT_ONLY, Tier::Paid, ModelStatus::Stable),
    // ── Cloudflare Workers AI ──────────────────────────────
    spec("cloudflare", "@cf/meta/llama-3.1-8b-instruct", "Llama 3.1 8B", TEXT_ONLY, Tier::FreeTier, ModelStatus::Stable),
    spec("cloudflare", "@cf/black-forest-labs/flux-1-schnell", "FLUX.1 Schnell", &[ImageGeneration], Tier::FreeTier, ModelStatus::Stable),
    // ── Anthropic ──────────────────────────────────────────
    spec("anthropic", "claude-sonnet-5-5", "Claude Sonnet 5.5", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    spec("anthropic", "claude-haiku-4-5-20251001", "Claude Haiku 4.5", TEXT_VISION, Tier::Paid, ModelStatus::Stable),
    // ── Local / built-in ───────────────────────────────────
    spec("custom", "gemma4", "Ollama: Gemma 4", TEXT_VISION, Tier::Local, ModelStatus::Stable),
    spec("system", "say", "Системный голос macOS", &[Speech], Tier::Local, ModelStatus::Stable),
    spec("offline", "offline-built-in", "Встроенный словарь", TEXT_ONLY, Tier::Local, ModelStatus::Stable),
];

const fn spec(
    provider: &'static str,
    id: &'static str,
    label: &'static str,
    capabilities: &'static [Capability],
    tier: Tier,
    status: ModelStatus,
) -> ModelSpec {
    ModelSpec {
        provider,
        id,
        label,
        capabilities,
        tier,
        status,
        price: None,
    }
}

const fn priced(mut spec: ModelSpec, unit: PriceUnit, usd: f64) -> ModelSpec {
    spec.price = Some(UnitPrice { unit, usd });
    spec
}

pub fn find(provider: &str, model: &str) -> Option<&'static ModelSpec> {
    CATALOG
        .iter()
        .find(|spec| spec.provider == provider && spec.id == model.trim())
}

/// Does `(provider, model)` have `cap`? Unknown custom names return `Unknown`.
pub fn support(provider: &str, model: &str, cap: Capability) -> Support {
    if let Some(spec) = find(provider, model) {
        if spec.status == ModelStatus::Retired {
            return Support::No;
        }
        return if spec.capabilities.contains(&cap) {
            Support::Yes
        } else {
            Support::No
        };
    }
    match provider {
        "system" => {
            if cap == Speech {
                Support::Yes
            } else {
                Support::No
            }
        }
        "offline" => Support::No,
        _ => Support::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn countable_units_carry_a_price_for_the_estimate() {
        let image = find("gemini", "gemini-3.1-flash-lite-image").and_then(|m| m.price);
        assert_eq!(image, Some(UnitPrice { unit: PriceUnit::Image, usd: 0.034 }));
        let json = serde_json::to_value(find("gemini", "gemini-3.8-live")).expect("serialize");
        assert_eq!(json["price"]["unit"], "minute");
        assert!(find("gemini", "gemini-3.8-flash").is_some_and(|m| m.price.is_none()));
    }

    #[test]
    fn catalog_has_no_duplicate_entries() {
        for (i, a) in CATALOG.iter().enumerate() {
            for b in &CATALOG[i + 1..] {
                assert!(
                    !(a.provider == b.provider && a.id == b.id),
                    "duplicate catalog entry {}:{}",
                    a.provider,
                    a.id
                );
            }
        }
    }

    #[test]
    fn retired_models_never_support_anything() {
        assert_eq!(
            support("openrouter", "minimax/minimax-m3:free", Text),
            Support::No
        );
        assert_eq!(support("gemini", "gemini-1.5-flash", Vision), Support::No);
    }

    #[test]
    fn capabilities_follow_the_catalog() {
        assert_eq!(support("gemini", "gemini-3.8-flash", Vision), Support::Yes);
        assert_eq!(support("gemini", "gemini-3.8-live", Text), Support::No);
        assert_eq!(support("openai", "gpt-transcribe", Transcription), Support::Yes);
        assert_eq!(support("system", "Samantha", Speech), Support::Yes);
        assert_eq!(support("custom", "my-local-model", Vision), Support::Unknown);
        assert_eq!(support("offline", "offline-built-in", Vision), Support::No);
    }

    #[test]
    fn status_serializes_with_kind_tag() {
        let json = serde_json::to_value(ModelStatus::Deprecated { shutdown: "2026-12-01" })
            .expect("serialize");
        assert_eq!(json["kind"], "deprecated");
        assert_eq!(json["shutdown"], "2026-12-01");
        assert_eq!(serde_json::to_value(ModelStatus::Stable).expect("ser")["kind"], "stable");
    }
}
