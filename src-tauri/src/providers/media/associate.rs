// ============================================================
// LEXORA — Concrete associated-photo selection
// Photos of the real referent, never abstract art / textures.
// ============================================================

use super::{
    media_cache_filename, unsplash::UnsplashProvider, wikimedia::WikimediaProvider, MediaItem,
    MediaProvider,
};
use crate::error::AppError;
use std::path::{Path, PathBuf};

/// Markers that usually mean illustration, texture, or brand art — not a study photo.
const ABSTRACT_MARKERS: &[&str] = &[
    "abstract",
    "illustration",
    "vector art",
    "digital art",
    "concept art",
    "3d render",
    "cgi",
    "texture",
    "pattern",
    "wallpaper",
    "logo",
    "icon",
    "typography",
    "lettering",
    "gradient",
    "geometric shapes",
];

#[derive(Debug, Clone)]
pub struct CachedPhoto {
    pub local_path: PathBuf,
    pub source_url: String,
    pub provider: &'static str,
    pub content_hash: String,
}

pub fn looks_abstract(text: &str) -> bool {
    let lower = text.to_lowercase();
    ABSTRACT_MARKERS.iter().any(|marker| lower.contains(marker))
}

/// First search result that looks like a real photograph of something.
pub fn pick_concrete_item(items: &[MediaItem]) -> Option<&MediaItem> {
    pick_next_concrete_item(items, &[])
}

pub fn is_concrete_item(item: &MediaItem) -> bool {
    if item.url.trim().is_empty() {
        return false;
    }
    let haystack = format!("{} {}", item.title.as_deref().unwrap_or(""), item.url);
    !looks_abstract(&haystack)
}

/// Next concrete photo that is not already associated with the lexeme.
pub fn pick_next_concrete_item<'a>(
    items: &'a [MediaItem],
    exclude_urls: &[String],
) -> Option<&'a MediaItem> {
    let mut skip = 0usize;
    next_concrete_after_skip(items, exclude_urls, &mut skip)
}

/// Next concrete item after consuming `skip_remaining` unused candidates.
/// Skip is global across pages/queries — do not reset it per query.
pub fn next_concrete_after_skip<'a>(
    items: &'a [MediaItem],
    exclude_urls: &[String],
    skip_remaining: &mut usize,
) -> Option<&'a MediaItem> {
    for item in items
        .iter()
        .filter(|item| is_concrete_item(item) && !exclude_urls.iter().any(|url| url == &item.url))
    {
        if *skip_remaining > 0 {
            *skip_remaining -= 1;
            continue;
        }
        return Some(item);
    }
    None
}

fn push_unique(out: &mut Vec<String>, value: &str) {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return;
    }
    if out
        .iter()
        .any(|existing| existing.eq_ignore_ascii_case(trimmed))
    {
        return;
    }
    out.push(trimmed.to_string());
}

fn looks_photographic(query: &str) -> bool {
    let lower = query.to_lowercase();
    lower.contains("photo") || lower.contains("photograph")
}

fn strip_photo_words(query: &str) -> String {
    query
        .split_whitespace()
        .filter(|word| {
            let lower = word.to_ascii_lowercase();
            lower != "photo"
                && lower != "photograph"
                && lower != "photography"
                && lower != "photorealistic"
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Closed-class / quantifier tokens. Searching Wikipedia for these yields
/// random Commons hits (portraits, hospitals) instead of the meaning.
const NON_CONCRETE_HEADWORDS: &[&str] = &[
    "a",
    "about",
    "after",
    "all",
    "already",
    "also",
    "always",
    "am",
    "among",
    "an",
    "and",
    "another",
    "any",
    "are",
    "around",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "between",
    "both",
    "but",
    "by",
    "can",
    "certain",
    "could",
    "did",
    "different",
    "do",
    "does",
    "during",
    "each",
    "either",
    "enough",
    "even",
    "every",
    "few",
    "for",
    "from",
    "get",
    "go",
    "had",
    "has",
    "have",
    "he",
    "her",
    "him",
    "his",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "least",
    "less",
    "like",
    "many",
    "may",
    "me",
    "might",
    "more",
    "most",
    "much",
    "multiple",
    "must",
    "my",
    "neither",
    "never",
    "no",
    "nor",
    "not",
    "numerous",
    "of",
    "often",
    "on",
    "only",
    "or",
    "other",
    "our",
    "out",
    "over",
    "own",
    "same",
    "several",
    "shall",
    "she",
    "should",
    "so",
    "some",
    "sometimes",
    "still",
    "such",
    "than",
    "that",
    "the",
    "their",
    "them",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "us",
    "various",
    "very",
    "was",
    "we",
    "were",
    "what",
    "which",
    "while",
    "who",
    "whom",
    "whose",
    "will",
    "with",
    "without",
    "would",
    "yet",
    "you",
    "your",
];

fn is_non_concrete_headword(word: &str) -> bool {
    NON_CONCRETE_HEADWORDS.binary_search(&word).is_ok()
}

/// Single-token concrete headword (apple), not a phrase or function word.
pub fn looks_like_concrete_headword(text: &str) -> bool {
    let t = text.trim();
    if t.is_empty() || t.contains(char::is_whitespace) {
        return false;
    }
    let lower = t.to_ascii_lowercase();
    if is_non_concrete_headword(&lower) {
        return false;
    }
    t.chars()
        .all(|c| c.is_ascii_alphabetic() || c == '\'' || c == '-')
}

/// Visual scene to search when the headword itself is not a photographable thing.
/// Prefer a short canned scene so Wikipedia/Commons stay usable without an API key.
pub fn fallback_scene_query(word: &str, translation: &str, context: &str) -> Option<String> {
    let scene = match word.trim().to_ascii_lowercase().as_str() {
        "several" | "some" | "various" | "multiple" | "few" => Some("group of apples"),
        "many" | "numerous" => Some("crowd of people"),
        "both" => Some("two matching objects"),
        "all" => Some("complete set of items"),
        "any" | "either" => Some("person choosing one item"),
        _ => None,
    };
    if let Some(scene) = scene {
        return Some(scene.to_string());
    }
    let context = context.trim();
    if context.split_whitespace().count() >= 3 {
        let shortened = context
            .split_whitespace()
            .take(10)
            .collect::<Vec<_>>()
            .join(" ");
        return Some(shortened);
    }
    let translation = translation.trim();
    if looks_like_concrete_headword(translation) {
        return Some(translation.to_string());
    }
    None
}

/// Prefer an LLM photo query; otherwise a meaning-scene, never the raw abstract word.
pub fn resolve_photo_query(
    llm_or_override: Option<&str>,
    word: &str,
    translation: &str,
    context: &str,
) -> Option<String> {
    llm_or_override
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
        .or_else(|| fallback_scene_query(word, translation, context))
}

/// Unsplash queries biased toward a concrete photograph of the meaning.
pub fn unsplash_photo_queries(
    text: &str,
    translation: &str,
    llm_query: Option<&str>,
) -> Vec<String> {
    let mut out = Vec::new();
    if let Some(q) = llm_query.map(str::trim).filter(|s| !s.is_empty()) {
        push_unique(&mut out, q);
        if !looks_photographic(q) {
            push_unique(&mut out, &format!("{q} photograph"));
        }
    }
    let text = text.trim();
    let translation = translation.trim();
    if looks_like_concrete_headword(text) {
        if !translation.is_empty() {
            push_unique(&mut out, &format!("{text} {translation} photograph"));
        }
        push_unique(&mut out, &format!("{text} photograph"));
        push_unique(&mut out, text);
    }
    out
}

/// Wikipedia/Commons want a short entity or scene, never a raw quantifier.
pub fn wiki_search_queries(text: &str, translation: &str, llm_query: Option<&str>) -> Vec<String> {
    let mut out = Vec::new();
    if looks_like_concrete_headword(text) {
        push_unique(&mut out, text);
        push_unique(&mut out, translation);
    }
    if let Some(q) = llm_query.map(str::trim).filter(|s| !s.is_empty()) {
        let stripped = strip_photo_words(q);
        // Long sentences dump unrelated Commons files; keep short scene queries.
        if stripped.split_whitespace().count() <= 4 {
            push_unique(&mut out, &stripped);
        }
    }
    out
}

#[allow(clippy::too_many_arguments)]
async fn first_concrete_from_provider<P: MediaProvider>(
    provider: &P,
    cache_dir: &Path,
    queries: &[String],
    provider_label: &'static str,
    exclude_urls: &[String],
    exclude_hashes: &[String],
    search_limit: u8,
    skip_remaining: &mut usize,
) -> Result<Option<CachedPhoto>, AppError> {
    for query in queries {
        match provider.search(query, search_limit).await {
            Ok(items) => {
                for item in items.iter().filter(|item| {
                    is_concrete_item(item) && !exclude_urls.iter().any(|url| url == &item.url)
                }) {
                    if *skip_remaining > 0 {
                        *skip_remaining -= 1;
                        continue;
                    }
                    match provider.download_and_cache(&item.url, cache_dir).await {
                        Ok(dest) => {
                            let hash = media_cache_filename(&item.url);
                            let content_hash = hash.split('.').next().unwrap_or(&hash).to_string();
                            if exclude_hashes
                                .iter()
                                .any(|existing| existing == &content_hash)
                            {
                                continue;
                            }
                            return Ok(Some(CachedPhoto {
                                local_path: dest,
                                source_url: item.url.clone(),
                                provider: provider_label,
                                content_hash,
                            }));
                        }
                        Err(e) => {
                            log::warn!(
                                "{} download failed for query '{query}': {e}",
                                provider.provider_name()
                            );
                        }
                    }
                }
            }
            Err(e) => {
                log::warn!(
                    "{} search failed for query '{query}': {e}",
                    provider.provider_name()
                );
            }
        }
    }
    Ok(None)
}

pub struct FetchPhotoRequest<'a> {
    pub unsplash_queries: &'a [String],
    pub wiki_queries: &'a [String],
    pub exclude_urls: &'a [String],
    pub exclude_hashes: &'a [String],
    pub search_limit: u8,
    pub skip_offset: usize,
}

/// Unsplash (if keyed) then Wikimedia Commons / Wikipedia — no API key required.
pub async fn fetch_concrete_photo(
    unsplash: &UnsplashProvider,
    wiki: &WikimediaProvider,
    cache_dir: &Path,
    req: FetchPhotoRequest<'_>,
) -> Result<Option<CachedPhoto>, AppError> {
    let mut skip_remaining = req.skip_offset;
    if let Some(photo) = first_concrete_from_provider(
        unsplash,
        cache_dir,
        req.unsplash_queries,
        "unsplash",
        req.exclude_urls,
        req.exclude_hashes,
        req.search_limit,
        &mut skip_remaining,
    )
    .await?
    {
        return Ok(Some(photo));
    }
    first_concrete_from_provider(
        wiki,
        cache_dir,
        req.wiki_queries,
        "wikimedia",
        req.exclude_urls,
        req.exclude_hashes,
        req.search_limit,
        &mut skip_remaining,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(url: &str, title: &str) -> MediaItem {
        MediaItem {
            url: url.to_string(),
            thumbnail_url: url.to_string(),
            title: Some(title.to_string()),
            author: None,
            width: 800,
            height: 600,
        }
    }

    #[test]
    fn looks_abstract_detects_illustration_not_fruit() {
        assert!(looks_abstract("Abstract geometric wallpaper"));
        assert!(looks_abstract("Digital illustration of motion"));
        assert!(!looks_abstract("Red apple fruit on a wooden table"));
    }

    #[test]
    fn pick_concrete_item_skips_abstract_then_empty() {
        let items = vec![
            item("https://images.unsplash.com/abstract.jpg", "Abstract waves"),
            item("", "Red apple"),
            item(
                "https://images.unsplash.com/apple.jpg",
                "Red apple on a table",
            ),
        ];
        let picked = pick_concrete_item(&items).expect("concrete");
        assert!(picked.url.contains("apple.jpg"));
    }

    #[test]
    fn pick_next_skips_already_used_urls() {
        let items = vec![
            item("https://images.unsplash.com/apple-1.jpg", "Red apple"),
            item("https://images.unsplash.com/apple-2.jpg", "Green apple"),
        ];
        let exclude = vec!["https://images.unsplash.com/apple-1.jpg".to_string()];
        let picked = pick_next_concrete_item(&items, &exclude).expect("next");
        assert!(picked.url.contains("apple-2.jpg"));
    }

    #[test]
    fn skip_offset_is_global_across_query_pages() {
        let page1 = vec![item("https://images.unsplash.com/a.jpg", "Red apple")];
        let page2 = vec![item("https://images.unsplash.com/b.jpg", "Green apple")];
        let mut skip = 1usize;
        assert!(next_concrete_after_skip(&page1, &[], &mut skip).is_none());
        assert_eq!(skip, 0);
        let picked = next_concrete_after_skip(&page2, &[], &mut skip).expect("second page");
        assert!(picked.url.contains("b.jpg"));
    }

    #[test]
    fn pick_concrete_item_returns_none_when_only_abstract() {
        let items = vec![item(
            "https://images.unsplash.com/x.jpg",
            "Abstract 3d render texture",
        )];
        assert!(pick_concrete_item(&items).is_none());
    }

    #[test]
    fn unsplash_queries_prefer_llm_then_bilingual_photo() {
        let q = unsplash_photo_queries("apple", "яблоко", Some("red apple fruit"));
        assert_eq!(q[0], "red apple fruit");
        assert!(q.iter().any(|s| s == "red apple fruit photograph"));
        assert!(q.iter().any(|s| s == "apple яблоко photograph"));
        assert!(q.iter().any(|s| s == "apple photograph"));
    }

    #[test]
    fn stock_queries_skip_raw_phrase_without_scene() {
        let unsplash = unsplash_photo_queries("be pesky", "быть назойливым", None);
        assert!(unsplash.is_empty(), "{unsplash:?}");
        let wiki = wiki_search_queries("be pesky", "быть назойливым", None);
        assert!(wiki.is_empty(), "{wiki:?}");
        let with_scene = unsplash_photo_queries(
            "be pesky",
            "быть назойливым",
            Some("child repeatedly asking parent same question"),
        );
        assert_eq!(
            with_scene[0],
            "child repeatedly asking parent same question"
        );
        assert!(!with_scene.iter().any(|s| s.contains("be pesky")));
    }

    #[test]
    fn wiki_queries_drop_photograph_and_keep_entity_names() {
        let q = wiki_search_queries("apple", "яблоко", Some("red apple fruit photograph"));
        assert_eq!(q[0], "apple");
        assert_eq!(q[1], "яблоко");
        assert!(q.iter().any(|s| s == "red apple fruit"));
        assert!(!q.iter().any(|s| s.contains("photograph")));
    }

    #[test]
    fn several_is_not_a_concrete_headword() {
        assert!(!looks_like_concrete_headword("several"));
        assert!(!looks_like_concrete_headword("Some"));
        assert!(!looks_like_concrete_headword("various"));
        assert!(looks_like_concrete_headword("apple"));
        assert!(looks_like_concrete_headword("sheep"));
    }

    #[test]
    fn abstract_quantifiers_do_not_search_the_raw_word() {
        let unsplash = unsplash_photo_queries("several", "несколько", None);
        assert!(unsplash.is_empty(), "{unsplash:?}");
        let wiki = wiki_search_queries("several", "несколько", None);
        assert!(wiki.is_empty(), "{wiki:?}");

        let scene = fallback_scene_query("several", "несколько", "").expect("scene");
        assert_eq!(scene, "group of apples");
        assert!(!scene.contains("several"));

        let wiki_scene = wiki_search_queries("several", "несколько", Some(&scene));
        assert_eq!(wiki_scene, vec!["group of apples"]);
        assert!(!wiki_scene.iter().any(|q| q == "several"));
    }

    #[test]
    fn fallback_scene_keeps_quantifiers_short_for_wiki() {
        let scene = fallback_scene_query(
            "several",
            "несколько",
            "She bought several books at the shop.",
        )
        .expect("scene");
        assert_eq!(scene, "group of apples");
        assert!(scene.split_whitespace().count() <= 4);
    }

    #[test]
    fn fallback_scene_uses_example_when_word_has_no_canned_scene() {
        let scene = fallback_scene_query(
            "pesky",
            "назойливый",
            "Don't be pesky and keep asking me the same question.",
        )
        .expect("scene");
        assert!(scene.to_lowercase().contains("pesky"));
    }

    #[test]
    fn resolve_photo_query_keeps_llm_then_scene() {
        assert_eq!(
            resolve_photo_query(Some("child asking a question"), "pesky", "", ""),
            Some("child asking a question".to_string())
        );
        assert_eq!(
            resolve_photo_query(None, "several", "несколько", ""),
            Some("group of apples".to_string())
        );
        assert_eq!(resolve_photo_query(None, "happy", "", ""), None);
    }

    #[test]
    fn non_concrete_list_is_sorted_for_binary_search() {
        let mut sorted = NON_CONCRETE_HEADWORDS.to_vec();
        sorted.sort_unstable();
        assert_eq!(sorted, NON_CONCRETE_HEADWORDS);
    }
}
