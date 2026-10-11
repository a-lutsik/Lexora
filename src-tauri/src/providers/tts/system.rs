// ============================================================
// LEXORA — System TTS Provider (macOS `say` / cross-platform)
// Zero latency, works offline without API keys.
// ============================================================

use super::spoken::spoken_form;
use super::voices::resolve_system_voice;
use super::TTSProvider;
use crate::error::AppError;
use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct SystemTTSProvider;

impl SystemTTSProvider {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SystemTTSProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TTSProvider for SystemTTSProvider {
    fn provider_name(&self) -> &'static str {
        "SystemTTS"
    }

    async fn synthesize(
        &self,
        text: &str,
        language: &str,
        voice: &str,
        cache_dir: &Path,
    ) -> Result<PathBuf, AppError> {
        let spoken = spoken_form(text, language);
        let resolved_voice = resolve_system_voice(language, voice);
        let cache_voice = resolved_voice.as_deref().unwrap_or("system");
        let filename = super::tts_cache_key(&spoken, language, cache_voice);
        let output_path = cache_dir.join(&filename);

        if output_path.exists() {
            return Ok(output_path);
        }

        std::fs::create_dir_all(cache_dir)?;

        #[cfg(target_os = "macos")]
        {
            let mut cmd = Command::new("say");
            apply_say_voice(&mut cmd, resolved_voice.as_deref());
            let status = cmd
                .arg("-o")
                .arg(&output_path)
                .arg("--")
                .arg(&spoken)
                .status()
                .map_err(|e| AppError::Io(e.to_string()))?;

            if !status.success() {
                return Err(AppError::Provider(
                    "System TTS synthesis failed".to_string(),
                ));
            }
        }

        Ok(output_path)
    }

    async fn speak(&self, text: &str, language: &str, voice: &str) -> Result<(), AppError> {
        let spoken = spoken_form(text, language);
        let language = language.to_string();
        let voice = voice.to_string();

        tokio::task::spawn_blocking(move || speak_blocking(&spoken, &language, &voice))
            .await
            .map_err(|e| AppError::Io(e.to_string()))?
    }
}

/// Run a speech command to completion (no fire-and-forget spawn).
pub fn wait_for_speech_command(cmd: &mut Command) -> Result<(), AppError> {
    let status = cmd.status().map_err(|e| AppError::Io(e.to_string()))?;
    if !status.success() {
        return Err(AppError::Provider("System TTS playback failed".to_string()));
    }
    Ok(())
}

pub fn say_playback_args(text: &str, voice: Option<&str>) -> Vec<String> {
    let mut args = Vec::new();
    if let Some(name) = voice {
        args.push("-v".to_string());
        args.push(name.to_string());
    }
    args.push("--".to_string());
    args.push(text.to_string());
    args
}

#[cfg(target_os = "macos")]
fn apply_say_voice(cmd: &mut Command, voice: Option<&str>) {
    if let Some(name) = voice {
        cmd.arg("-v").arg(name);
    }
}

fn speak_blocking(text: &str, language: &str, voice: &str) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        let resolved = resolve_system_voice(language, voice);
        let mut cmd = Command::new("say");
        for arg in say_playback_args(text, resolved.as_deref()) {
            cmd.arg(arg);
        }
        if wait_for_speech_command(&mut cmd).is_err() && resolved.is_some() {
            // Voice missing or not downloaded — fall back to default `say`.
            wait_for_speech_command(Command::new("say").arg("--").arg(text))?;
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (text, language, voice);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    #[test]
    fn wait_for_speech_command_blocks_until_the_process_exits() {
        let start = Instant::now();
        wait_for_speech_command(Command::new("sleep").arg("0.12")).expect("sleep should succeed");
        assert!(
            start.elapsed() >= Duration::from_millis(100),
            "speak must wait for the process instead of spawning and returning"
        );
    }

    #[test]
    fn say_playback_args_pin_voice_and_protect_text() {
        assert_eq!(
            say_playback_args("okay", Some("Samantha")),
            vec!["-v", "Samantha", "--", "okay"]
        );
        assert_eq!(say_playback_args("okay", None), vec!["--", "okay"]);
    }
}
