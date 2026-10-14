// ============================================================
// LEXORA — Visual mnemonic pipeline + lexeme image association
// word+context → 3 concepts → rank → image prompt → gen|stock
// ============================================================

use crate::providers::models::roles::ModelRole;
use crate::providers::models::usage::UsageSink;
use super::associate::{
    fetch_concrete_photo, resolve_photo_query, unsplash_photo_queries, wiki_search_queries,
    FetchPhotoRequest,
};
use super::image_gen::{
    gemini_image_cooldown_secs, mark_gemini_image_rate_limited,
    select_image_gen_backends_configured, GeneratedImage, ImageGenBackend, ImageGenCredentials,
};
use super::unsplash::UnsplashProvider;
use super::wikimedia::WikimediaProvider;
use crate::db::repos::lexeme::LexemeRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::rate_limit::is_rate_limited;
use crate::providers::ai::{MnemonicConceptsRequest, MnemonicRankRequest, ProviderRegistry};
use rusqlite::Connection;
use std::path::Path;
use std::sync::Arc;

pub const DEFAULT_LEARNER_LEVEL: &str = "A2";
const IMAGE_GEN_HASH_RETRIES: u8 = 3;

/// Collect previously used mnemonic fields so regenerate invents a new scene.
pub fn avoid_scenes_from_row(row: &crate::db::repos::lexeme::VisualMnemonicRow) -> Vec<String> {
    [
        row.association.as_deref(),
        row.image_prompt.as_deref(),
        row.photo_query.as_deref(),
    ]
    .into_iter()
    .flatten()
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .map(ToOwned::to_owned)
    .collect()
}

/// Stock-search fallback prompt when the mnemonic LLM is unavailable.
pub fn fallback_image_prompt(word: &str, translation: &str, context: &str) -> String {
    let mut prompt = format!(
        "Educational illustration of the meaning of \"{}\"",
        word.trim()
    );
    let translation = translation.trim();
    if !translation.is_empty() {
        prompt.push_str(&format!(" (meaning: {translation})"));
    }
    prompt.push_str(
        ". Show the meaning as a clear everyday situation with people (or animal characters) acting it out — not a still life of an unrelated object, animal, or insect. ",
    );
    let context = context.trim();
    if !context.is_empty() {
        prompt.push_str(&format!("Use this situation as the scene: {context}. "));
    }
    prompt.push_str(
        "Simple composition, 1–3 characters, strong facial expressions, clean expressive educational illustration style. No text, no captions, no labels.",
    );
    prompt
}

/// Append a regenerate variation so image APIs do not return a cached duplicate.
pub fn compose_image_prompt(base: &str, variation: Option<&str>, attempt: u8) -> String {
    let mut prompt = base.trim().to_string();
    if let Some(v) = variation.map(str::trim).filter(|s| !s.is_empty()) {
        prompt.push_str("\n\nMake a clearly different picture (variation ");
        prompt.push_str(v);
        prompt.push_str("): change the people, setting, clothing, and camera angle.");
    }
    if attempt > 0 {
        prompt.push_str(&format!(
            "\nRetry {attempt}: use a different composition and characters."
        ));
    }
    if !prompt.to_lowercase().contains("no text") {
        prompt.push_str(" No text, no captions, no labels.");
    }
    prompt
}

#[derive(Debug, Clone)]
pub struct VisualMnemonic {
    pub sense: String,
    pub association: String,
    pub memory_hook: String,
    pub image_prompt: String,
    pub photo_search_query: String,
}

/// Run concepts → rank and assemble the winning mnemonic payload.
pub async fn build_visual_mnemonic(
    registry: &ProviderRegistry,
    word: &str,
    translation: &str,
    context: &str,
    level: &str,
    avoid_scenes: &[String],
) -> Result<VisualMnemonic, AppError> {
    let concepts = registry
        .mnemonic_concepts(MnemonicConceptsRequest {
            word: word.trim().to_string(),
            translation: translation.trim().to_string(),
            context: context.trim().to_string(),
            level: if level.trim().is_empty() {
                DEFAULT_LEARNER_LEVEL.to_string()
            } else {
                level.trim().to_string()
            },
            avoid_scenes: avoid_scenes.to_vec(),
        })
        .await?;

    if let Some(image_prompt) = concepts
        .image_prompt
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
    {
        let selected = concepts.associations.first();
        return Ok(VisualMnemonic {
            sense: concepts.sense.clone(),
            association: selected
                .map(|a| a.association.clone())
                .unwrap_or_else(|| image_prompt.clone()),
            memory_hook: selected
                .map(|a| a.memory_hook.clone())
                .unwrap_or(concepts.sense),
            image_prompt,
            photo_search_query: String::new(),
        });
    }

    let rank = registry
        .mnemonic_rank(MnemonicRankRequest {
            word: word.trim().to_string(),
            sense: concepts.sense.clone(),
            associations: concepts.associations.clone(),
            avoid_scenes: avoid_scenes.to_vec(),
        })
        .await?;

    let selected = concepts
        .associations
        .iter()
        .find(|a| a.id.eq_ignore_ascii_case(&rank.selected_id))
        .or_else(|| concepts.associations.first())
        .ok_or_else(|| AppError::Provider("No mnemonic association available".to_string()))?;

    Ok(VisualMnemonic {
        sense: concepts.sense,
        association: selected.association.clone(),
        memory_hook: selected.memory_hook.clone(),
        image_prompt: rank.image_prompt,
        photo_search_query: rank.photo_search_query,
    })
}

pub fn persist_visual_mnemonic(
    conn: &Connection,
    lexeme_id: i64,
    mnemonic: &VisualMnemonic,
) -> Result<(), AppError> {
    LexemeRepo::upsert_visual_mnemonic(
        conn,
        lexeme_id,
        &mnemonic.sense,
        &mnemonic.association,
        &mnemonic.memory_hook,
        &mnemonic.image_prompt,
        &mnemonic.photo_search_query,
    )
}

#[derive(Debug, Clone)]
pub struct AssociateImageResult {
    pub local_path: String,
    pub provider: String,
}

pub struct AssociateImageRequest<'a> {
    pub lexeme_id: i64,
    pub word: &'a str,
    pub translation: &'a str,
    pub context: &'a str,
    pub level: &'a str,
    pub active_ai_provider: &'a str,
    /// Settings fallback (OpenAI / Gemini) tried after the primary image API.
    pub fallback_ai_provider: Option<&'a str>,
    pub openai_key: Option<String>,
    pub gemini_key: Option<String>,
    pub cloudflare_token: Option<String>,
    pub cloudflare_account_id: Option<&'a str>,
    /// Explicit Settings image model (`cloudflare:…` / `gemini:…` / `openai:…`).
    pub image_model: Option<&'a str>,
    /// Explicit Settings fallback image model, or `none`.
    pub fallback_image_model: Option<&'a str>,
    pub unsplash_key: Option<String>,
    pub cache_dir: &'a Path,
    pub exclude_urls: &'a [String],
    pub exclude_hashes: &'a [String],
    pub search_limit: u8,
    pub skip_offset: usize,
    /// When None, stock search only (no mnemonic LLM). Prefer Some(registry).
    pub registry: Option<&'a ProviderRegistry>,
    /// Optional stock-search query when skipping mnemonic LLM (e.g. regenerate rotation).
    pub photo_query_override: Option<&'a str>,
    /// Previously used scenes so regenerate invents a different mnemonic.
    pub avoid_scenes: &'a [String],
    /// Extra prompt salt so image APIs return a new picture each refresh.
    pub prompt_variation: Option<&'a str>,
    /// When false, stock rotation may reuse hashes (skip_offset picks the next hit).
    /// Image generation still uses `exclude_hashes`.
    pub exclude_stock_hashes: bool,
}

async fn generate_unique_image(
    backends: &[ImageGenBackend],
    base_prompt: &str,
    cache_dir: &Path,
    exclude_hashes: &[String],
    variation: Option<&str>,
    usage: &UsageSink,
) -> Result<Option<GeneratedImage>, AppError> {
    let usable: Vec<&ImageGenBackend> = backends
        .iter()
        .filter(|backend| {
            !matches!(backend, ImageGenBackend::Gemini { .. })
                || gemini_image_cooldown_secs().is_none()
        })
        .collect();

    if usable.is_empty() {
        // Do not fail the pipeline — stock / scene search can still return a picture.
        log::info!(
            "Skipping Gemini image generation (cooldown {}s)",
            gemini_image_cooldown_secs().unwrap_or(90)
        );
        return Ok(None);
    }

    let mut last_err: Option<AppError> = None;
    for backend in usable {
        for attempt in 0..IMAGE_GEN_HASH_RETRIES {
            let prompt = compose_image_prompt(base_prompt, variation, attempt);
            let outcome = backend.generate(&prompt, cache_dir).await;
            // Every generated picture is billed, duplicates included.
            usage.record_amount(&backend.route_target(), outcome.is_ok(), 0.0, i64::from(outcome.is_ok()));
            match outcome {
                Ok(image) => {
                    if !exclude_hashes.iter().any(|h| h == &image.content_hash) {
                        return Ok(Some(image));
                    }
                    log::info!(
                        "Generated image matched a previous hash; retrying ({}/{})",
                        attempt + 1,
                        IMAGE_GEN_HASH_RETRIES
                    );
                }
                Err(e) => {
                    if is_rate_limited(&e) && matches!(backend, ImageGenBackend::Gemini { .. }) {
                        mark_gemini_image_rate_limited();
                    }
                    log::warn!("Image generation ({}) failed: {e}", backend.provider_name());
                    last_err = Some(e);
                    break;
                }
            }
        }
    }
    if let Some(e) = last_err {
        return Err(e);
    }
    Ok(None)
}

/// Keep a newly associated file only when it is not the picture already on screen.
pub fn if_new_image_path(path: String, current: Option<&str>) -> Option<String> {
    if current.is_some_and(|c| c == path) {
        None
    } else {
        Some(path)
    }
}

/// Full pipeline: mnemonic (if registry) → persist → generate or stock fallback → upsert media.
pub async fn associate_lexeme_image(
    pool: &Arc<DbPool>,
    req: AssociateImageRequest<'_>,
) -> Result<Option<AssociateImageResult>, AppError> {
    let mnemonic = if let Some(registry) = req.registry {
        match build_visual_mnemonic(
            registry,
            req.word,
            req.translation,
            req.context,
            req.level,
            req.avoid_scenes,
        )
        .await
        {
            Ok(m) => Some(m),
            Err(e) => {
                log::warn!(
                    "Visual mnemonic LLM failed for lexeme {}: {e}",
                    req.lexeme_id
                );
                None
            }
        }
    } else {
        None
    };

    if let Some(ref m) = mnemonic {
        let conn = pool.get()?;
        persist_visual_mnemonic(&conn, req.lexeme_id, m)?;
    }

    let photo_query = resolve_photo_query(
        mnemonic
            .as_ref()
            .map(|m| m.photo_search_query.as_str())
            .filter(|s| !s.is_empty())
            .or(req
                .photo_query_override
                .map(str::trim)
                .filter(|s| !s.is_empty())),
        req.word,
        req.translation,
        req.context,
    );

    // 1) Generate an educational illustration from the mnemonic prompt.
    let creds = ImageGenCredentials {
        openai_key: req.openai_key.clone(),
        gemini_key: req.gemini_key.clone(),
        cloudflare_token: req.cloudflare_token.clone(),
        cloudflare_account_id: req.cloudflare_account_id.map(str::to_string),
    };
    let backends = select_image_gen_backends_configured(
        req.image_model,
        req.fallback_image_model,
        &creds,
        req.active_ai_provider,
        req.fallback_ai_provider,
    );
    let mut gen_error: Option<AppError> = None;
    if !backends.is_empty() {
        let base_prompt = mnemonic
            .as_ref()
            .map(|m| m.image_prompt.as_str())
            .filter(|s| !s.is_empty())
            .map(ToOwned::to_owned)
            .unwrap_or_else(|| fallback_image_prompt(req.word, req.translation, req.context));
        match generate_unique_image(
            &backends,
            &base_prompt,
            req.cache_dir,
            req.exclude_hashes,
            req.prompt_variation,
            &UsageSink::new(pool.as_ref().clone(), ModelRole::ImageGen),
        )
        .await
        {
            Ok(Some(GeneratedImage {
                local_path,
                content_hash,
                provider,
            })) => {
                let local = local_path.to_string_lossy().to_string();
                let conn = pool.get()?;
                LexemeRepo::upsert_media(
                    &conn,
                    req.lexeme_id,
                    "image",
                    &local,
                    None,
                    Some(provider),
                    Some(&content_hash),
                )?;
                return Ok(Some(AssociateImageResult {
                    local_path: local,
                    provider: provider.to_string(),
                }));
            }
            Ok(None) => {
                log::warn!(
                    "Image generation returned only previously used hashes for lexeme {}",
                    req.lexeme_id
                );
            }
            Err(e) => {
                log::warn!("Image generation failed for lexeme {}: {e}", req.lexeme_id);
                gen_error = Some(e);
            }
        }
    }

    // 2) Stock photos if generation is unset or failed (429 / quota).
    //    Never search the raw phrase (that yields unrelated landscapes).
    let unsplash = UnsplashProvider::new(req.unsplash_key.clone());
    let wiki = WikimediaProvider::new();
    let photo_queries = unsplash_photo_queries(req.word, req.translation, photo_query.as_deref());
    let wiki_queries = wiki_search_queries(req.word, req.translation, photo_query.as_deref());
    let stock_exclude_hashes: &[String] = if req.exclude_stock_hashes {
        req.exclude_hashes
    } else {
        &[]
    };

    match fetch_concrete_photo(
        &unsplash,
        &wiki,
        req.cache_dir,
        FetchPhotoRequest {
            unsplash_queries: &photo_queries,
            wiki_queries: &wiki_queries,
            exclude_urls: req.exclude_urls,
            exclude_hashes: stock_exclude_hashes,
            search_limit: req.search_limit,
            skip_offset: req.skip_offset,
        },
    )
    .await
    {
        Ok(Some(photo)) => {
            let local = photo.local_path.to_string_lossy().to_string();
            let conn = pool.get()?;
            LexemeRepo::upsert_media(
                &conn,
                req.lexeme_id,
                "image",
                &local,
                Some(&photo.source_url),
                Some(photo.provider),
                Some(&photo.content_hash),
            )?;
            Ok(Some(AssociateImageResult {
                local_path: local,
                provider: photo.provider.to_string(),
            }))
        }
        Ok(None) => {
            if let Some(e) = gen_error {
                return Err(e);
            }
            Ok(None)
        }
        Err(e) => {
            log::warn!("Associated photo fetch failed: {e}");
            if let Some(ge) = gen_error {
                return Err(ge);
            }
            Err(e)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::study::EvaluationResult;
    use crate::commands::translate::TranslationResult;
    use crate::providers::ai::{
        AIProvider, ArticulationTipRequest, ArticulationTipResult, AudioTranslationResult,
        CheckWritingRequest, CheckWritingResult, DialogueTurnRequest, DialogueTurnResult,
        GenerateScenarioRequest, GeneratedScenario,
        DocChunkTranslationResult, EnrichRequest, EnrichResult, EvaluatePronunciationRequest,
        EvaluateRequest, ExplainRequest, GenerateExercisesRequest, ImageTranslationResult,
        MnemonicAssociation, MnemonicConceptsResult, MnemonicRankResult,
        PronunciationEvaluationResult, RewriteRequest, RewriteResult, TranslateAudioRequest,
        TranslateDocChunkRequest, TranslateImageRequest, TranslateRequest, WritingExerciseRaw,
    };
    use async_trait::async_trait;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct MnemonicStub {
        concepts_calls: AtomicUsize,
        rank_calls: AtomicUsize,
    }

    #[async_trait]
    impl AIProvider for MnemonicStub {
        async fn translate(&self, _req: TranslateRequest) -> Result<TranslationResult, AppError> {
            unreachable!()
        }
        async fn enrich(&self, _req: EnrichRequest) -> Result<EnrichResult, AppError> {
            unreachable!()
        }
        async fn mnemonic_concepts(
            &self,
            _req: MnemonicConceptsRequest,
        ) -> Result<MnemonicConceptsResult, AppError> {
            self.concepts_calls.fetch_add(1, Ordering::SeqCst);
            Ok(MnemonicConceptsResult {
                sense: "annoyingly persistent".to_string(),
                associations: vec![MnemonicAssociation {
                    id: "a".to_string(),
                    association: "A child repeatedly tugs a busy adult's sleeve".to_string(),
                    memory_hook: "tugs for attention".to_string(),
                }],
                image_prompt: Some(
                    "Clean expressive educational illustration: a child repeatedly tugs a busy adult's sleeve while the adult looks exasperated. Exaggerated pleading face, simple composition, 1–3 characters, no text, no captions, no labels."
                        .to_string(),
                ),
            })
        }
        async fn mnemonic_rank(
            &self,
            req: MnemonicRankRequest,
        ) -> Result<MnemonicRankResult, AppError> {
            self.rank_calls.fetch_add(1, Ordering::SeqCst);
            let selected = req.associations[0].clone();
            Ok(MnemonicRankResult {
                selected_id: selected.id,
                scores: vec![],
                image_prompt: format!(
                    "Educational illustration: {}. No text, no captions, no labels.",
                    selected.association
                ),
                photo_search_query: "mosquito buzzing around face".to_string(),
            })
        }
        async fn evaluate_answer(
            &self,
            _req: EvaluateRequest,
        ) -> Result<EvaluationResult, AppError> {
            unreachable!()
        }
        async fn explain_error(&self, _req: ExplainRequest) -> Result<EvaluationResult, AppError> {
            unreachable!()
        }
        async fn check_writing(
            &self,
            _req: CheckWritingRequest,
        ) -> Result<CheckWritingResult, AppError> {
            unreachable!()
        }
        async fn rewrite_text(&self, _req: RewriteRequest) -> Result<RewriteResult, AppError> {
            unreachable!()
        }
        async fn evaluate_pronunciation(
            &self,
            _req: EvaluatePronunciationRequest,
        ) -> Result<PronunciationEvaluationResult, AppError> {
            unreachable!()
        }
        async fn get_articulation_tip(
            &self,
            _req: ArticulationTipRequest,
        ) -> Result<ArticulationTipResult, AppError> {
            unreachable!()
        }
        async fn generate_exercises(
            &self,
            _req: GenerateExercisesRequest,
        ) -> Result<Vec<WritingExerciseRaw>, AppError> {
            unreachable!()
        }
        async fn translate_image(
            &self,
            _req: TranslateImageRequest,
        ) -> Result<ImageTranslationResult, AppError> {
            unreachable!()
        }
        async fn translate_document_chunk(
            &self,
            _req: TranslateDocChunkRequest,
        ) -> Result<DocChunkTranslationResult, AppError> {
            unreachable!()
        }
        async fn translate_audio(
            &self,
            _req: TranslateAudioRequest,
        ) -> Result<AudioTranslationResult, AppError> {
            unreachable!()
        }
        async fn dialogue_turn(
            &self,
            _req: DialogueTurnRequest,
        ) -> Result<DialogueTurnResult, AppError> {
            unreachable!()
        }
        async fn generate_scenario(
            &self,
            _req: GenerateScenarioRequest,
        ) -> Result<GeneratedScenario, AppError> {
            unreachable!()
        }
        fn provider_name(&self) -> &'static str {
            "stub"
        }
    }

    #[tokio::test]
    async fn build_visual_mnemonic_picks_ranked_association() {
        let stub = Arc::new(MnemonicStub {
            concepts_calls: AtomicUsize::new(0),
            rank_calls: AtomicUsize::new(0),
        });
        let registry = ProviderRegistry::new(stub.clone(), None);
        let m = build_visual_mnemonic(
            &registry,
            "pesky",
            "назойливый",
            "Stop being so pesky!",
            "A2",
            &[],
        )
        .await
        .expect("mnemonic");
        assert_eq!(stub.concepts_calls.load(Ordering::SeqCst), 1);
        assert_eq!(stub.rank_calls.load(Ordering::SeqCst), 0);
        assert_eq!(m.sense, "annoyingly persistent");
        assert!(m.association.contains("tugs"));
        assert!(m
            .image_prompt
            .to_lowercase()
            .contains("educational illustration"));
        assert!(m.image_prompt.contains("tugs"));
        assert!(!m.image_prompt.to_lowercase().contains("draw the word"));
        assert!(m.photo_search_query.is_empty());
    }

    #[test]
    fn fallback_image_prompt_uses_phrase_and_example() {
        let prompt = fallback_image_prompt(
            "be pesky",
            "быть назойливым",
            "Don't be pesky and keep asking me the same question.",
        );
        assert!(prompt.contains("be pesky"));
        assert!(prompt.contains("быть назойливым"));
        assert!(prompt.contains("keep asking me the same question"));
        assert!(prompt.to_lowercase().contains("not a still life"));
        assert!(prompt.to_lowercase().contains("no text"));
    }

    #[test]
    fn compose_image_prompt_adds_variation_and_retry() {
        let first = compose_image_prompt("A child tugs a sleeve.", Some("2"), 0);
        assert!(first.contains("A child tugs a sleeve."));
        assert!(first.contains("variation 2"));
        assert!(!first.contains("Retry"));
        let retry = compose_image_prompt("A child tugs a sleeve.", Some("2"), 1);
        assert!(retry.contains("Retry 1"));
    }

    #[test]
    fn if_new_image_path_rejects_the_picture_already_shown() {
        assert_eq!(
            if_new_image_path("/tmp/a.png".to_string(), Some("/tmp/a.png")),
            None
        );
        assert_eq!(
            if_new_image_path("/tmp/b.png".to_string(), Some("/tmp/a.png")).as_deref(),
            Some("/tmp/b.png")
        );
        assert_eq!(
            if_new_image_path("/tmp/a.png".to_string(), None).as_deref(),
            Some("/tmp/a.png")
        );
    }
}
