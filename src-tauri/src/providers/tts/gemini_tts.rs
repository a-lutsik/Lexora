// ============================================================
// LEXORA — Gemini TTS Provider
// gemini-3.8-flash(-lite)-tts via generateContent with AUDIO
// output. The key goes in the x-goog-api-key header (never the URL).
// Audio is cached by hash(text, language, voice) — never requested twice.
// ============================================================

use super::TTSProvider;
use crate::error::AppError;
use async_trait::async_trait;
use base64::Engine;
use reqwest::Client;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::time::Duration;

/// Prebuilt voices shared by Gemini TTS and Live native audio (2026-10).
pub const GEMINI_VOICES: &[&str] = &[
    "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe",
    "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib",
    "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima",
    "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
];

pub const DEFAULT_GEMINI_VOICE: &str = "Kore";

/// Use the requested voice when it is a Gemini voice, else the default.
pub fn gemini_voice_for(requested: &str) -> &'static str {
    GEMINI_VOICES
        .iter()
        .copied()
        .find(|v| v.eq_ignore_ascii_case(requested.trim()))
        .unwrap_or(DEFAULT_GEMINI_VOICE)
}

/// Sample rate from `audio/l16;codec=pcm;rate=24000` (24 kHz when absent).
pub fn pcm_rate_from_mime(mime: &str) -> u32 {
    mime.split(';')
        .filter_map(|part| part.trim().strip_prefix("rate="))
        .find_map(|rate| rate.trim().parse::<u32>().ok())
        .unwrap_or(24_000)
}

/// Build the TTS request body (pure — no network).
pub fn build_tts_body(text: &str, voice: &str) -> serde_json::Value {
    json!({
        "contents": [{ "parts": [{ "text": text }] }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": { "voiceName": voice }
                }
            }
        }
    })
}

/// Turn the response audio part into WAV bytes (pure — no network).
pub fn wav_from_response(json_resp: &serde_json::Value) -> Result<Vec<u8>, AppError> {
    let part = json_resp["candidates"][0]["content"]["parts"]
        .as_array()
        .and_then(|parts| parts.iter().find(|p| p["inlineData"]["data"].is_string()))
        .ok_or_else(|| AppError::Provider("Gemini TTS returned no audio".to_string()))?;
    let data = part["inlineData"]["data"].as_str().unwrap_or_default();
    let mime = part["inlineData"]["mimeType"]
        .as_str()
        .unwrap_or("audio/l16;codec=pcm;rate=24000")
        .to_ascii_lowercase();
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| AppError::Provider(format!("Gemini TTS audio is not base64: {e}")))?;
    if mime.starts_with("audio/wav") || mime.starts_with("audio/x-wav") || bytes.starts_with(b"RIFF") {
        return Ok(bytes);
    }
    Ok(super::wav_from_pcm16(&bytes, pcm_rate_from_mime(&mime)))
}

pub struct GeminiTTSProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl GeminiTTSProvider {
    pub fn new(api_key: String, model: String) -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(45))
                .build()
                .unwrap_or_default(),
            api_key,
            model,
        }
    }
}

#[async_trait]
impl TTSProvider for GeminiTTSProvider {
    fn provider_name(&self) -> &'static str {
        "Gemini TTS"
    }

    async fn synthesize(
        &self,
        text: &str,
        language: &str,
        voice: &str,
        cache_dir: &Path,
    ) -> Result<PathBuf, AppError> {
        let voice = gemini_voice_for(voice);
        let cache_name = super::tts_cache_key(text, language, &format!("{}:{voice}", self.model))
            .replace(".mp3", ".wav");
        let output_path = cache_dir.join(cache_name);
        if output_path.exists() {
            return Ok(output_path);
        }
        std::fs::create_dir_all(cache_dir)?;

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
            self.model
        );
        let resp = self
            .client
            .post(url)
            .header("x-goog-api-key", &self.api_key)
            .json(&build_tts_body(text, voice))
            .send()
            .await
            .map_err(|e| AppError::Http(format!("Gemini TTS: {}", e.without_url())))?;
        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(crate::providers::ai::rate_limit::http_provider_error(
                "Gemini TTS",
                status,
                &body,
            ));
        }
        let json_resp: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Serialization(format!("Gemini TTS: {}", e.without_url())))?;
        let wav = wav_from_response(&json_resp)?;
        std::fs::write(&output_path, wav)?;
        Ok(output_path)
    }

    async fn speak(&self, text: &str, language: &str, voice: &str) -> Result<(), AppError> {
        let cache_dir = std::env::temp_dir().join("lexora_audio");
        let path = self.synthesize(text, language, voice, &cache_dir).await?;
        super::play_audio_file(path).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn voice_mapping_keeps_gemini_voices_and_defaults_others() {
        assert_eq!(gemini_voice_for("puck"), "Puck");
        assert_eq!(gemini_voice_for("Samantha"), DEFAULT_GEMINI_VOICE);
        assert_eq!(gemini_voice_for("default"), DEFAULT_GEMINI_VOICE);
    }

    #[test]
    fn pcm_rate_is_read_from_mime() {
        assert_eq!(pcm_rate_from_mime("audio/l16;codec=pcm;rate=24000"), 24_000);
        assert_eq!(pcm_rate_from_mime("audio/L16; rate=16000"), 16_000);
        assert_eq!(pcm_rate_from_mime("audio/l16"), 24_000);
    }

    #[test]
    fn body_requests_audio_with_voice() {
        let body = build_tts_body("Hello", "Kore");
        assert_eq!(body["generationConfig"]["responseModalities"][0], "AUDIO");
        assert_eq!(
            body["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"],
            "Kore"
        );
        assert_eq!(body["contents"][0]["parts"][0]["text"], "Hello");
    }

    #[test]
    fn raw_pcm_response_is_wrapped_into_wav() {
        let pcm = vec![0u8; 480];
        let data = base64::engine::general_purpose::STANDARD.encode(&pcm);
        let resp = serde_json::json!({
            "candidates": [{ "content": { "parts": [{
                "inlineData": { "mimeType": "audio/L16;codec=pcm;rate=24000", "data": data }
            }]}}]
        });
        let wav = wav_from_response(&resp).expect("wav");
        assert_eq!(&wav[0..4], b"RIFF");
        assert_eq!(u32::from_le_bytes([wav[24], wav[25], wav[26], wav[27]]), 24_000);
        assert_eq!(wav.len(), 44 + 480);
    }

    #[test]
    fn missing_audio_is_an_error() {
        let resp = serde_json::json!({ "candidates": [{ "content": { "parts": [{ "text": "hi" }] } }] });
        assert!(wav_from_response(&resp).is_err());
    }
}
