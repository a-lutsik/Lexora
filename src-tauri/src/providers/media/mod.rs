// ============================================================
// LEXORA — Media Provider Trait & Cache
// ============================================================

pub mod associate;
pub mod giphy;
pub mod image_gen;
pub mod mnemonic;
pub mod prefetch;
pub mod seed_image;
pub mod unsplash;
pub mod wikimedia;

use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

/// Wikimedia requires a descriptive User-Agent; Unsplash accepts the same.
pub const MEDIA_USER_AGENT: &str = "Lexora/0.1 (language-learning desktop app; local media cache)";

#[derive(Debug, Serialize, Clone)]
pub struct MediaItem {
    pub url: String,
    pub thumbnail_url: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub width: u32,
    pub height: u32,
}

#[async_trait]
pub trait MediaProvider: Send + Sync {
    /// Search images/GIFs for a word/phrase
    async fn search(&self, query: &str, limit: u8) -> Result<Vec<MediaItem>, AppError>;

    /// Download and cache media file by URL (immutable SHA-256 hash)
    async fn download_and_cache(&self, url: &str, cache_dir: &Path) -> Result<PathBuf, AppError>;

    fn provider_name(&self) -> &'static str;
}

pub fn media_http_client() -> Client {
    Client::builder()
        .user_agent(MEDIA_USER_AGENT)
        .build()
        .unwrap_or_else(|_| Client::new())
}

/// Download `url` into `cache_dir` under a hash filename. Reuses an existing file.
pub async fn download_url_to_cache(
    client: &Client,
    url: &str,
    cache_dir: &Path,
) -> Result<PathBuf, AppError> {
    let filename = media_cache_filename(url);
    let dest = cache_dir.join(&filename);

    if dest.exists() {
        return Ok(dest);
    }

    std::fs::create_dir_all(cache_dir)?;

    let bytes = client.get(url).send().await?.bytes().await?;
    std::fs::write(&dest, &bytes)?;
    Ok(dest)
}

/// Compute immutable SHA-256 cache filename for a media URL
pub fn media_cache_filename(url: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    let hash = format!("{:x}", hasher.finalize());
    let ext = extension_from_url(url);
    format!("{hash}.{ext}")
}

fn extension_from_url(url: &str) -> &'static str {
    let path = url.split('?').next().unwrap_or(url).to_ascii_lowercase();
    if path.ends_with(".png") {
        "png"
    } else if path.ends_with(".webp") {
        "webp"
    } else if path.ends_with(".gif") {
        "gif"
    } else {
        "jpg"
    }
}

#[cfg(test)]
mod tests {
    use super::media_cache_filename;

    #[test]
    fn cache_filename_is_stable_and_uses_url_extension() {
        let a =
            media_cache_filename("https://upload.wikimedia.org/wikipedia/commons/a/a0/Apple.png");
        let b =
            media_cache_filename("https://upload.wikimedia.org/wikipedia/commons/a/a0/Apple.png");
        assert_eq!(a, b);
        assert!(a.ends_with(".png"), "{a}");
        let gif = media_cache_filename("https://media.giphy.com/media/x.gif?cid=1");
        assert!(gif.ends_with(".gif"), "{gif}");
    }
}
