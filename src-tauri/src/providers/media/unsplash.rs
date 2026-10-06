// ============================================================
// LEXORA — Unsplash Image Provider
// ============================================================

use super::{download_url_to_cache, media_http_client, MediaItem, MediaProvider};
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use std::path::{Path, PathBuf};

pub struct UnsplashProvider {
    client: Client,
    access_key: Option<String>,
}

impl UnsplashProvider {
    pub fn new(access_key: Option<String>) -> Self {
        let access_key = access_key
            .map(|k| k.trim().to_string())
            .filter(|k| !k.is_empty());
        Self {
            client: media_http_client(),
            access_key,
        }
    }

    pub fn search_url(query: &str, limit: u8) -> String {
        format!(
            "https://api.unsplash.com/search/photos?query={}&per_page={}&content_filter=high",
            urlencoding_encode(query),
            limit.clamp(1, 30)
        )
    }
}

#[async_trait]
impl MediaProvider for UnsplashProvider {
    fn provider_name(&self) -> &'static str {
        "Unsplash"
    }

    async fn search(&self, query: &str, limit: u8) -> Result<Vec<MediaItem>, AppError> {
        let key = match &self.access_key {
            Some(k) => k,
            None => {
                return Ok(vec![]);
            }
        };

        let url = Self::search_url(query, limit);

        let resp = self
            .client
            .get(&url)
            .header("Authorization", format!("Client-ID {key}"))
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !resp.status().is_success() {
            return Ok(vec![]);
        }

        let json: serde_json::Value = resp.json().await?;
        let results = json["results"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|item| {
                        let url = item["urls"]["regular"].as_str().unwrap_or("").to_string();
                        if url.is_empty() {
                            return None;
                        }
                        Some(MediaItem {
                            url,
                            thumbnail_url: item["urls"]["small"].as_str().unwrap_or("").to_string(),
                            title: item["alt_description"].as_str().map(String::from),
                            author: item["user"]["name"].as_str().map(String::from),
                            width: item["width"].as_u64().unwrap_or(800) as u32,
                            height: item["height"].as_u64().unwrap_or(600) as u32,
                        })
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

fn urlencoding_encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

#[cfg(test)]
mod tests {
    use super::UnsplashProvider;

    #[test]
    fn search_url_asks_for_high_content_filter_and_several_results() {
        let url = UnsplashProvider::search_url("red apple fruit", 1);
        assert!(url.contains("content_filter=high"), "{url}");
        assert!(
            url.contains("per_page=1") || url.contains("per_page=8"),
            "{url}"
        );
        assert!(
            url.contains("red+apple+fruit") || url.contains("red%20apple"),
            "{url}"
        );
        assert!(
            !url.contains("orientation="),
            "portrait object photos should not be excluded"
        );
    }
}
