// ============================================================
// LEXORA — User pronunciation recording cache
// Files live in app_data_dir/audio_attempts/. Old files rotate.
// ============================================================

use crate::error::AppError;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

pub const ATTEMPTS_DIR_NAME: &str = "audio_attempts";
pub const MAX_CACHED_FILES: usize = 200;
pub const MAX_AGE: Duration = Duration::from_secs(30 * 24 * 60 * 60);
pub const MAX_AUDIO_BYTES: usize = 5 * 1024 * 1024;

pub fn attempts_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(ATTEMPTS_DIR_NAME)
}

pub fn ensure_attempts_dir(app_data_dir: &Path) -> Result<PathBuf, AppError> {
    let dir = attempts_dir(app_data_dir);
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn extension_for_mime(mime: &str) -> &'static str {
    let normalized = mime.trim().to_ascii_lowercase();
    let base = normalized.split(';').next().unwrap_or("").trim();
    match base {
        "audio/wav" | "audio/x-wav" | "audio/wave" => "wav",
        "audio/mpeg" | "audio/mp3" => "mp3",
        "audio/mp4" | "audio/m4a" | "audio/x-m4a" => "m4a",
        "audio/ogg" => "ogg",
        "audio/webm" => "webm",
        _ => "webm",
    }
}

pub fn mime_from_path(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .as_deref()
    {
        Some("wav") => "audio/wav",
        Some("mp3") => "audio/mpeg",
        Some("m4a") | Some("mp4") => "audio/mp4",
        Some("ogg") => "audio/ogg",
        _ => "audio/webm",
    }
}

pub fn decode_audio_payload(raw_base64: &str) -> Result<Vec<u8>, AppError> {
    let payload = raw_base64
        .split(',')
        .next_back()
        .unwrap_or(raw_base64)
        .trim();
    if payload.is_empty() {
        return Err(AppError::Validation("Audio payload is empty".to_string()));
    }
    let bytes = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, payload)
        .or_else(|_| {
            base64::Engine::decode(&base64::engine::general_purpose::STANDARD_NO_PAD, payload)
        })
        .map_err(|e| AppError::Validation(format!("Invalid audio encoding: {e}")))?;
    if bytes.len() > MAX_AUDIO_BYTES {
        return Err(AppError::Validation(format!(
            "Audio is too large (max {} bytes)",
            MAX_AUDIO_BYTES
        )));
    }
    if bytes.is_empty() {
        return Err(AppError::Validation("Decoded audio is empty".to_string()));
    }
    Ok(bytes)
}

/// Write bytes to a unique file and rotate the cache. Returns absolute path.
pub fn save_recording(dir: &Path, bytes: &[u8], mime: &str) -> Result<PathBuf, AppError> {
    if bytes.is_empty() {
        return Err(AppError::Validation("Audio is empty".to_string()));
    }
    if bytes.len() > MAX_AUDIO_BYTES {
        return Err(AppError::Validation(format!(
            "Audio is too large (max {} bytes)",
            MAX_AUDIO_BYTES
        )));
    }
    fs::create_dir_all(dir)?;
    let ext = extension_for_mime(mime);
    let filename = format!("{}.{}", uuid::Uuid::new_v4(), ext);
    let path = dir.join(filename);
    fs::write(&path, bytes)?;
    let _ = rotate_cache(dir, MAX_CACHED_FILES, MAX_AGE);
    Ok(path)
}

/// Delete files older than `max_age`, then the oldest extras beyond `max_files`.
/// Returns the number of deleted files.
pub fn rotate_cache(dir: &Path, max_files: usize, max_age: Duration) -> Result<usize, AppError> {
    if !dir.exists() {
        return Ok(0);
    }

    let now = SystemTime::now();
    let mut entries: Vec<(PathBuf, SystemTime)> = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let modified = entry
            .metadata()?
            .modified()
            .unwrap_or(SystemTime::UNIX_EPOCH);
        entries.push((path, modified));
    }

    let mut deleted = 0;
    let mut kept = Vec::new();
    for (path, modified) in entries {
        let too_old = now
            .duration_since(modified)
            .map(|d| d > max_age)
            .unwrap_or(true);
        if too_old {
            fs::remove_file(&path)?;
            deleted += 1;
        } else {
            kept.push((path, modified));
        }
    }

    kept.sort_by_key(|(_, modified)| *modified);
    if kept.len() > max_files {
        let overflow = kept.len() - max_files;
        for (path, _) in kept.into_iter().take(overflow) {
            fs::remove_file(&path)?;
            deleted += 1;
        }
    }

    Ok(deleted)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("lexora-audio-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn cleanup(dir: &Path) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn extension_maps_known_mimes() {
        assert_eq!(extension_for_mime("audio/wav"), "wav");
        assert_eq!(extension_for_mime("audio/mpeg"), "mp3");
        assert_eq!(extension_for_mime("audio/webm;codecs=opus"), "webm");
        assert_eq!(extension_for_mime("audio/mp4;codecs=mp4a.40.2"), "m4a");
        assert_eq!(extension_for_mime("application/octet-stream"), "webm");
    }

    #[test]
    fn decode_accepts_plain_and_data_url() {
        let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, b"RIFF");
        assert_eq!(decode_audio_payload(&encoded).unwrap(), b"RIFF");
        let data_url = format!("data:audio/wav;base64,{encoded}");
        assert_eq!(decode_audio_payload(&data_url).unwrap(), b"RIFF");
    }

    #[test]
    fn decode_rejects_empty_and_invalid() {
        assert!(decode_audio_payload("").is_err());
        assert!(decode_audio_payload("%%%").is_err());
    }

    #[test]
    fn save_recording_writes_file() {
        let dir = temp_dir();
        let path = save_recording(&dir, b"audio-bytes", "audio/wav").expect("save");
        assert!(path.exists());
        assert_eq!(fs::read(&path).unwrap(), b"audio-bytes");
        assert!(path.extension().and_then(|e| e.to_str()) == Some("wav"));
        cleanup(&dir);
    }

    #[test]
    fn rotate_cache_deletes_overflow() {
        let dir = temp_dir();
        for i in 0..5 {
            fs::write(dir.join(format!("{i}.webm")), [i as u8]).unwrap();
        }
        let deleted = rotate_cache(&dir, 2, MAX_AGE).expect("rotate");
        assert_eq!(deleted, 3);
        let remaining = fs::read_dir(&dir).unwrap().count();
        assert_eq!(remaining, 2);
        cleanup(&dir);
    }

    #[test]
    fn save_recording_rejects_empty() {
        let dir = temp_dir();
        assert!(save_recording(&dir, b"", "audio/webm").is_err());
        cleanup(&dir);
    }
}
