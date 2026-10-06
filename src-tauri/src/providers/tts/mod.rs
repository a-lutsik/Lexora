// ============================================================
// LEXORA — TTS Provider Trait & Cache
// ============================================================

pub mod gemini_tts;
pub mod openai_tts;
pub mod spoken;
pub mod system;
pub mod voices;

use crate::error::AppError;
use async_trait::async_trait;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

use openai_tts::OpenAITTSProvider;
use system::SystemTTSProvider;

#[async_trait]
pub trait TTSProvider: Send + Sync {
    /// Synthesize speech and save to local path. Returns path to cached audio file.
    async fn synthesize(
        &self,
        text: &str,
        language: &str,
        voice: &str,
        cache_dir: &Path,
    ) -> Result<PathBuf, AppError>;

    /// Play speech directly.
    async fn speak(&self, text: &str, language: &str, voice: &str) -> Result<(), AppError>;

    fn provider_name(&self) -> &'static str;
}

/// Compute immutable SHA-256 cache key for TTS audio
pub fn tts_cache_key(text: &str, language: &str, voice: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.trim().to_lowercase().as_bytes());
    hasher.update(language.as_bytes());
    hasher.update(voice.as_bytes());
    format!("{:x}.mp3", hasher.finalize())
}

/// Wrap mono 16-bit little-endian PCM into a WAV container.
pub fn wav_from_pcm16(pcm: &[u8], sample_rate: u32) -> Vec<u8> {
    let data_len = pcm.len() as u32;
    let mut wav = Vec::with_capacity(44 + pcm.len());
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&(36 + data_len).to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16u32.to_le_bytes());
    wav.extend_from_slice(&1u16.to_le_bytes()); // PCM
    wav.extend_from_slice(&1u16.to_le_bytes()); // mono
    wav.extend_from_slice(&sample_rate.to_le_bytes());
    wav.extend_from_slice(&(sample_rate * 2).to_le_bytes()); // byte rate
    wav.extend_from_slice(&2u16.to_le_bytes()); // block align
    wav.extend_from_slice(&16u16.to_le_bytes()); // bits per sample
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&data_len.to_le_bytes());
    wav.extend_from_slice(pcm);
    wav
}

/// Play an audio file and wait until it finishes (no overlapping voices).
pub async fn play_audio_file(path: PathBuf) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        #[cfg(target_os = "macos")]
        {
            let status = std::process::Command::new("afplay")
                .arg(&path)
                .status()
                .map_err(|e| AppError::Io(e.to_string()))?;
            if !status.success() {
                return Err(AppError::Provider("Audio playback failed".to_string()));
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = path;
            return Err(AppError::Provider(
                "Audio playback is only implemented on macOS".to_string(),
            ));
        }
        #[allow(unreachable_code)]
        Ok(())
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

/// Choose the runtime TTS engine from the persisted `tts_engine` setting.
/// `openai` is honoured only when a non-empty OpenAI API key is configured;
/// otherwise we always fall back to the offline system voice (no key needed).
pub fn provider_for_tts_engine(tts_engine: &str, openai_key: Option<&str>) -> Box<dyn TTSProvider> {
    if tts_engine == "openai" {
        if let Some(key) = openai_key.map(str::trim).filter(|key| !key.is_empty()) {
            return Box::new(OpenAITTSProvider::new(key.to_string(), None));
        }
    }
    Box::new(SystemTTSProvider)
}

#[cfg(test)]
mod tests {
    use super::provider_for_tts_engine;

    #[test]
    fn system_engine_stays_on_system_voice_with_or_without_key() {
        assert_eq!(
            provider_for_tts_engine("system", None).provider_name(),
            "SystemTTS"
        );
        assert_eq!(
            provider_for_tts_engine("system", Some("sk-proj-test")).provider_name(),
            "SystemTTS"
        );
    }

    #[test]
    fn openai_engine_falls_back_to_system_without_a_key() {
        assert_eq!(
            provider_for_tts_engine("openai", None).provider_name(),
            "SystemTTS"
        );
        assert_eq!(
            provider_for_tts_engine("openai", Some("   ")).provider_name(),
            "SystemTTS"
        );
    }

    #[test]
    fn openai_engine_uses_openai_provider_with_a_trimmed_key() {
        let provider = provider_for_tts_engine("openai", Some("  sk-proj-test  "));
        assert_eq!(provider.provider_name(), "OpenAI TTS");
    }

    #[test]
    fn unknown_engine_is_treated_as_system() {
        assert_eq!(
            provider_for_tts_engine("elevenlabs", Some("sk-proj-test")).provider_name(),
            "SystemTTS"
        );
    }
}
