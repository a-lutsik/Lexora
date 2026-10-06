// ============================================================
// LEXORA — Wikimedia / Wikipedia photo provider (no API key)
// Infobox / Commons photographs of the real-world referent.
// ============================================================

use super::{download_url_to_cache, media_http_client, MediaItem, MediaProvider};
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use std::path::{Path, PathBuf};

pub struct WikimediaProvider {
    client: Client,
}

impl WikimediaProvider {
    pub fn new() -> Self {
        Self {
            client: media_http_client(),
        }
    }
}

impl Default for WikimediaProvider {
    fn default() -> Self {
        Self::new()
    }
}

fn encode_query(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

fn encode_title(title: &str) -> String {
    encode_query(title).replace('+', "%20")
}

/// Biography / redirect pages whose lead image is an unrelated person.
pub fn looks_like_unrelated_wiki_page(description: &str) -> bool {
    let d = description.to_ascii_lowercase();
    d.contains("disambiguation")
        || d.contains("soft redirect")
        || d.contains("was a ")
        || d.contains("was an ")
        || d.contains("politician")
        || d.contains("actor")
        || d.contains("actress")
        || d.contains("singer")
        || d.contains("songwriter")
        || d.contains("footballer")
        || d.contains("cricketer")
        || d.contains("activist")
}

/// Portrait file names that do not depict the queried meaning.
pub fn looks_like_unrelated_portrait(query: &str, title: &str) -> bool {
    let q = query.to_ascii_lowercase();
    if q.contains("portrait") || q.contains("person") || q.contains("man") || q.contains("woman") {
        return false;
    }
    let t = title.to_ascii_lowercase();
    t.contains("portrait") || t.contains("mugshot") || t.contains("headshot")
}

/// Parse Wikipedia REST page summary JSON into a photo candidate.
pub fn item_from_wiki_summary(json: &serde_json::Value) -> Option<MediaItem> {
    let title = json["title"].as_str().unwrap_or("");
    let description = json["description"].as_str().unwrap_or("");
    if looks_like_unrelated_wiki_page(description) {
        return None;
    }
    let url = json["originalimage"]["source"]
        .as_str()
        .or_else(|| json["thumbnail"]["source"].as_str())
        .unwrap_or("")
        .to_string();
    if url.is_empty() || url.to_ascii_lowercase().ends_with(".svg") {
        return None;
    }
    let thumb = json["thumbnail"]["source"]
        .as_str()
        .unwrap_or(&url)
        .to_string();
    Some(MediaItem {
        url,
        thumbnail_url: thumb,
        title: Some(format!("{title} {description}").trim().to_string()),
        author: Some("Wikimedia".to_string()),
        width: json["originalimage"]["width"]
            .as_u64()
            .or_else(|| json["thumbnail"]["width"].as_u64())
            .unwrap_or(800) as u32,
        height: json["originalimage"]["height"]
            .as_u64()
            .or_else(|| json["thumbnail"]["height"].as_u64())
            .unwrap_or(600) as u32,
    })
}

/// Parse MediaWiki `generator=search` Commons response.
pub fn items_from_commons_query(json: &serde_json::Value) -> Vec<MediaItem> {
    let Some(pages) = json["query"]["pages"].as_object() else {
        return Vec::new();
    };
    let mut items = Vec::new();
    for page in pages.values() {
        let Some(info) = page["imageinfo"].as_array().and_then(|arr| arr.first()) else {
            continue;
        };
        let mime = info["mime"].as_str().unwrap_or("").to_ascii_lowercase();
        if !matches!(mime.as_str(), "image/jpeg" | "image/png" | "image/webp") {
            continue;
        }
        let url = info["thumburl"]
            .as_str()
            .or_else(|| info["url"].as_str())
            .unwrap_or("")
            .to_string();
        if url.is_empty() {
            continue;
        }
        let title = page["title"].as_str().unwrap_or("").to_string();
        items.push(MediaItem {
            url: url.clone(),
            thumbnail_url: url,
            title: Some(title),
            author: Some("Wikimedia Commons".to_string()),
            width: info["thumbwidth"]
                .as_u64()
                .or_else(|| info["width"].as_u64())
                .unwrap_or(800) as u32,
            height: info["thumbheight"]
                .as_u64()
                .or_else(|| info["height"].as_u64())
                .unwrap_or(600) as u32,
        });
    }
    items
}

/// OpenSearch JSON: `["query", ["Title", ...], [...], [...]]`
pub fn titles_from_opensearch(json: &serde_json::Value) -> Vec<String> {
    json.as_array()
        .and_then(|arr| arr.get(1))
        .and_then(|v| v.as_array())
        .map(|titles| {
            titles
                .iter()
                .filter_map(|t| t.as_str().map(str::trim).filter(|s| !s.is_empty()))
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

#[async_trait]
impl MediaProvider for WikimediaProvider {
    fn provider_name(&self) -> &'static str {
        "Wikimedia"
    }

    async fn search(&self, query: &str, limit: u8) -> Result<Vec<MediaItem>, AppError> {
        let query = query.trim();
        if query.is_empty() {
            return Ok(vec![]);
        }
        let mut items = Vec::new();

        let opensearch_url = format!(
            "https://en.wikipedia.org/w/api.php?action=opensearch&search={}&limit=3&namespace=0&format=json",
            encode_query(query)
        );
        if let Ok(resp) = self.client.get(&opensearch_url).send().await {
            if resp.status().is_success() {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    for title in titles_from_opensearch(&json) {
                        let summary_url = format!(
                            "https://en.wikipedia.org/api/rest_v1/page/summary/{}",
                            encode_title(&title)
                        );
                        if let Ok(sum_resp) = self.client.get(&summary_url).send().await {
                            if sum_resp.status().is_success() {
                                if let Ok(sum_json) = sum_resp.json::<serde_json::Value>().await {
                                    if let Some(item) = item_from_wiki_summary(&sum_json) {
                                        if looks_like_unrelated_portrait(
                                            query,
                                            item.title.as_deref().unwrap_or(""),
                                        ) {
                                            continue;
                                        }
                                        items.push(item);
                                    }
                                }
                            }
                        }
                        if items.len() >= limit as usize {
                            return Ok(items);
                        }
                    }
                }
            }
        }

        let commons_url = format!(
            "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit={}&gsrsearch={}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1200",
            limit.clamp(1, 20),
            encode_query(query)
        );
        if let Ok(resp) = self.client.get(&commons_url).send().await {
            if resp.status().is_success() {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    for item in items_from_commons_query(&json) {
                        if items.iter().any(|existing| existing.url == item.url) {
                            continue;
                        }
                        if looks_like_unrelated_portrait(query, item.title.as_deref().unwrap_or(""))
                        {
                            continue;
                        }
                        items.push(item);
                        if items.len() >= limit as usize {
                            break;
                        }
                    }
                }
            }
        }

        Ok(items)
    }

    async fn download_and_cache(&self, url: &str, cache_dir: &Path) -> Result<PathBuf, AppError> {
        download_url_to_cache(&self.client, url, cache_dir).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summary_prefers_original_photo_and_skips_svg_and_disambiguation() {
        let apple = serde_json::json!({
            "title": "Apple",
            "description": "Fruit of the apple tree",
            "originalimage": {
                "source": "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg",
                "width": 1200,
                "height": 900
            },
            "thumbnail": {
                "source": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/320px-Red_Apple.jpg",
                "width": 320,
                "height": 240
            }
        });
        let item = item_from_wiki_summary(&apple).expect("photo");
        assert!(item.url.ends_with("Red_Apple.jpg"));

        let svg = serde_json::json!({
            "title": "Flag",
            "originalimage": { "source": "https://upload.wikimedia.org/wikipedia/commons/f.svg" }
        });
        assert!(item_from_wiki_summary(&svg).is_none());

        let dab = serde_json::json!({
            "title": "Apple (disambiguation)",
            "description": "Topics referred to by the same term (disambiguation)",
            "thumbnail": { "source": "https://upload.wikimedia.org/wikipedia/commons/a.jpg" }
        });
        assert!(item_from_wiki_summary(&dab).is_none());

        let redirect = serde_json::json!({
            "title": "Several",
            "description": "Soft redirect to Wiktionary",
            "originalimage": { "source": "https://upload.wikimedia.org/wikipedia/commons/s.jpg" }
        });
        assert!(item_from_wiki_summary(&redirect).is_none());

        let person = serde_json::json!({
            "title": "John Several",
            "description": "American politician",
            "originalimage": { "source": "https://upload.wikimedia.org/wikipedia/commons/p.jpg" }
        });
        assert!(item_from_wiki_summary(&person).is_none());
    }

    #[test]
    fn skips_portrait_files_unless_the_query_is_a_person() {
        assert!(looks_like_unrelated_portrait(
            "several",
            "File:Portrait of a man in a turban.jpg"
        ));
        assert!(!looks_like_unrelated_portrait(
            "portrait",
            "File:Portrait of a man in a turban.jpg"
        ));
        assert!(!looks_like_unrelated_portrait(
            "apple",
            "File:Red apple fruit.jpg"
        ));
    }

    #[test]
    fn commons_skips_svg_and_keeps_jpeg() {
        let json = serde_json::json!({
            "query": {
                "pages": {
                    "1": {
                        "title": "File:Abstract.svg",
                        "imageinfo": [{ "mime": "image/svg+xml", "url": "https://upload.wikimedia.org/a.svg" }]
                    },
                    "2": {
                        "title": "File:Red apple.jpg",
                        "imageinfo": [{
                            "mime": "image/jpeg",
                            "url": "https://upload.wikimedia.org/apple.jpg",
                            "thumburl": "https://upload.wikimedia.org/apple-1200.jpg",
                            "thumbwidth": 1200,
                            "thumbheight": 800
                        }]
                    }
                }
            }
        });
        let items = items_from_commons_query(&json);
        assert_eq!(items.len(), 1);
        assert!(items[0].url.contains("apple"));
    }

    #[test]
    fn opensearch_reads_title_list() {
        let json = serde_json::json!(["apple", ["Apple", "Apple Inc."], ["", ""], ["", ""]]);
        assert_eq!(titles_from_opensearch(&json), vec!["Apple", "Apple Inc."]);
    }
}
