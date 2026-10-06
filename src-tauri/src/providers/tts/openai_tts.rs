// ============================================================
// LEXORA — OpenAI TTS Provider
// High quality neural text-to-speech with local audio caching.
// ============================================================

use super::TTSProvider;
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;
use std::path::{Path, PathBuf};

pub struct OpenAITTSProvider {
    client: Client,
    api_key: String,
    model: String,
}

/// Voices accepted by OpenAI speech models (2026-10).
pub const OPENAI_VOICES: &[&str] = &[
    "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer",
    "verse", "marin", "cedar",
];

/// Use the requested voice when OpenAI knows it; macOS voice names fall back to `alloy`.
pub fn openai_voice_for(requested: &str) -> &'static str {
    OPENAI_VOICES
        .iter()
        .copied()
        .find(|v| v.eq_ignore_ascii_case(requested.trim()))
        .unwrap_or("alloy")
}

impl OpenAITTSProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            // tts-1 shuts down 2027-01-06.
            model: model.unwrap_or_else(|| "gpt-4o-mini-tts".to_string()),
        }
    }
}

#[async_trait]
impl TTSProvider for OpenAITTSProvider {
    fn provider_name(&self) -> &'static str {
        "OpenAI TTS"
    }

    async fn synthesize(
        &self,
        text: &str,
        language: &str,
        voice: &str,
        cache_dir: &Path,
    ) -> Result<PathBuf, AppError> {
        let filename = super::tts_cache_key(text, language, voice);
        let output_path = cache_dir.join(&filename);

        // Immutable cache hit
        if output_path.exists() {
            return Ok(output_path);
        }

        std::fs::create_dir_all(cache_dir)?;

        let body = json!({
            "model": self.model,
            "input": text,
            "voice": openai_voice_for(voice),
            "response_format": "mp3"
        });

        let resp = self
            .client
            .post("https://api.openai.com/v1/audio/speech")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Http(e.without_url().to_string()))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err = resp.text().await.unwrap_or_default();
            return Err(AppError::Provider(format!(
                "OpenAI TTS error {status}: {err}"
            )));
        }

        let bytes = resp
            .bytes()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        std::fs::write(&output_path, &bytes)?;

        Ok(output_path)
    }

    async fn speak(&self, text: &str, language: &str, voice: &str) -> Result<(), AppError> {
        let temp_dir = std::env::temp_dir().join("lexora_audio");
        let path = self.synthesize(text, language, voice, &temp_dir).await?;

        super::play_audio_file(path).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mac_voice_names_map_to_an_openai_voice() {
        assert_eq!(openai_voice_for("Samantha"), "alloy");
        assert_eq!(openai_voice_for("Nova"), "nova");
        assert_eq!(openai_voice_for("default"), "alloy");
    }

    #[test]
    fn default_model_is_not_the_retiring_tts_1() {
        let provider = OpenAITTSProvider::new("sk-test".into(), None);
        assert_eq!(provider.model, "gpt-4o-mini-tts");
    }
}
