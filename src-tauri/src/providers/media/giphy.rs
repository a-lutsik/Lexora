// ============================================================
// LEXORA — Giphy GIF Provider
// ============================================================

use super::{download_url_to_cache, media_http_client, MediaItem, MediaProvider};
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use std::path::{Path, PathBuf};

pub struct GiphyProvider {
    client: Client,
    api_key: Option<String>,
}

impl GiphyProvider {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            client: media_http_client(),
            api_key,
        }
    }
}

#[async_trait]
impl MediaProvider for GiphyProvider {
    fn provider_name(&self) -> &'static str {
        "Giphy"
    }

    async fn search(&self, query: &str, limit: u8) -> Result<Vec<MediaItem>, AppError> {
        let key = match &self.api_key {
            Some(k) => k,
            None => return Ok(vec![]),
        };

        let encoded: String = url::form_urlencoded::byte_serialize(query.as_bytes()).collect();
        let url = format!(
            "https://api.giphy.com/v1/gifs/search?api_key={}&q={}&limit={}&rating=g",
            key, encoded, limit
        );

        let resp = self.client.get(&url).send().await?;
        if !resp.status().is_success() {
            return Ok(vec![]);
        }

        let json: serde_json::Value = resp.json().await?;
        let results = json["data"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .map(|item| MediaItem {
                        url: item["images"]["original"]["url"]
                            .as_str()
                            .unwrap_or("")
                            .to_string(),
                        thumbnail_url: item["images"]["fixed_height_small"]["url"]
                            .as_str()
                            .unwrap_or("")
                            .to_string(),
                        title: item["title"].as_str().map(String::from),
                        author: item["username"].as_str().map(String::from),
                        width: item["images"]["original"]["width"]
                            .as_str()
                            .and_then(|w| w.parse().ok())
                            .unwrap_or(480),
                        height: item["images"]["original"]["height"]
                            .as_str()
                            .and_then(|h| h.parse().ok())
                            .unwrap_or(360),
                    })
                    .collect()
            })
            .unwrap_or_default();

        Ok(results)
    }

    async fn download_and_cache(&self, url: &str, cache_dir: &Path) -> Result<PathBuf, AppError> {
        download_url_to_cache(&self.client, url, cache_dir).await
    }
}
