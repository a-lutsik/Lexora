// ============================================================
// LEXORA — Translation Commands
// Local-first: SQLite lookup first; LLM only on cache miss.
// ============================================================

use crate::commands::settings::AppSettings;
use crate::commands::vocabulary::resolve_target_language;
use crate::db::repos::lexeme::LexemeRepo;
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::rate_limit::is_rate_limited;
use crate::providers::ai::{AIProvider, EnrichRequest, ProviderRegistry, TranslateRequest};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};

/// Event name for progressive card enrichment (example + image).
pub const CARD_ENRICH_EVENT: &str = "lexora:card-enrich";

/// A word that entered the vocabulary without a gloss finally got one.
pub const TRANSLATION_BACKFILLED_EVENT: &str = "lexora:translation-backfilled";

/// Total attempts for a background translate. Free-tier models answer 429 to a
/// whole burst of words, and a word added without a gloss stays mute forever.
const BACKGROUND_TRANSLATE_ATTEMPTS: u32 = 4;
const BACKGROUND_RETRY_BASE_DELAY: Duration = Duration::from_secs(5);
const BACKGROUND_RETRY_MAX_DELAY: Duration = Duration::from_secs(60);

/// Cards resurface every minute — do not re-ask a failing provider that often.
const BACKFILL_COOLDOWN: Duration = Duration::from_secs(15 * 60);

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateInput {
    pub text: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub context_sentence: Option<String>,
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TranslationResult {
    pub text: String,
    pub source_language: String,
    pub target_language: String,
    pub main_translation: String,
    pub alternatives: Vec<String>,
    pub source_synonyms: Vec<String>,
    pub part_of_speech: Option<String>,
    pub phonetic: Option<String>,
    pub usage_note: Option<String>,
    pub example_sentence: Option<String>,
    pub example_sentence_2: Option<String>,
    pub frequency_hint: Option<String>,
    pub from_cache: bool,
    /// true when the result is the local offline stub, not a live AI translation.
    /// Lets the frontend distinguish a real translation from the fallback.
    pub is_offline_fallback: bool,
    pub lexeme_id: Option<i64>,
    pub image_path: Option<String>,
    /// Domain actually used for this gloss (`general` | `it` | …).
    #[serde(default)]
    pub detected_lexical_domain: Option<String>,
    /// Domain the caller requested (`auto` | `general` | …).
    #[serde(default)]
    pub requested_lexical_domain: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CardEnrichPayload {
    pub lexeme_id: i64,
    pub usage_note: Option<String>,
    pub example_sentence: Option<String>,
    pub example_sentence_2: Option<String>,
    pub image_path: Option<String>,
    /// False while associated-image generation is still running.
    pub complete: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TranslationBackfilledPayload {
    pub lexeme_id: i64,
}

#[tauri::command]
pub async fn translate_text(
    input: TranslateInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<TranslationResult, AppError> {
    translate_text_inner(input, db.inner().clone(), app).await
}

/// Whether a live translation also starts card enrichment (examples + picture).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum EnrichMode {
    Background,
    /// Pack loading: thousands of words must not spawn thousands of LLM/image jobs.
    Skip,
}

/// Shared translate path for IPC and bulk background queue.
pub(crate) async fn translate_text_inner(
    input: TranslateInput,
    pool: Arc<DbPool>,
    app: AppHandle,
) -> Result<TranslationResult, AppError> {
    translate_text_with(input, pool, app, EnrichMode::Background).await
}

pub(crate) async fn translate_text_with(
    input: TranslateInput,
    pool: Arc<DbPool>,
    app: AppHandle,
    enrich: EnrichMode,
) -> Result<TranslationResult, AppError> {
    let text = input.text.trim().to_string();
    if text.is_empty() {
        return Err(AppError::Validation(
            "Text to translate is empty".to_string(),
        ));
    }

    // None / "auto" → auto-detect via AI. Never coerce to English.
    let requested_source = input
        .source_language
        .as_deref()
        .and_then(LexemeRepo::normalize_lang_code);
    let target_lang = LexemeRepo::normalize_lang_code(&input.target_language)
        .unwrap_or_else(|| input.target_language.trim().to_lowercase());

    // ── 1. SQLite cache lookup (only when source is known AND domain is forced)
    let requested_domain =
        crate::providers::ai::lexical_domain::normalize_requested_domain(
            input.lexical_domain.as_deref(),
        );
    let forced_domain = crate::providers::ai::lexical_domain::resolve_domain_for_request(
        &requested_domain,
        &text,
        input.context_sentence.as_deref(),
    );

    if let (Some(ref source_lang), Some(ref domain)) = (&requested_source, &forced_domain) {
        let cached = {
            let conn = pool.get()?;
            lookup_card(&conn, &text, source_lang, &target_lang, domain)?
        };

        if let Some(mut result) = cached {
            result.from_cache = true;
            result.requested_lexical_domain = Some(requested_domain.clone());
            result.detected_lexical_domain = Some(domain.clone());
            if let (Some(lexeme_id), EnrichMode::Background) = (result.lexeme_id, enrich) {
                let needs_enrich = {
                    let conn = pool.get()?;
                    let example_count = LexemeRepo::get_examples(&conn, lexeme_id)?.len();
                    !LexemeRepo::is_enriched(&conn, lexeme_id)?
                        || example_count < 2
                        || LexemeRepo::needs_associated_image(&conn, lexeme_id)?
                };
                if needs_enrich {
                    spawn_enrich(
                        app.clone(),
                        pool.clone(),
                        lexeme_id,
                        text.clone(),
                        source_lang.clone(),
                        target_lang.clone(),
                        result.main_translation.clone(),
                    );
                }
            }
            return Ok(result);
        }
    }

    // ── 2. Live AI translation (cache miss) ────────────────
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Translation"));
    }

    let registry = match crate::providers::models::router::registry_for_role(
        &app,
        &pool,
        &settings,
        crate::providers::models::roles::ModelRole::TextFast,
    ) {
        Ok(registry) => registry,
        Err(e) => {
            log::warn!("No AI provider configured: {e}");
            return Err(e);
        }
    };

    let req = TranslateRequest {
        text: text.clone(),
        source_language: requested_source.clone(),
        target_language: target_lang.clone(),
        context_sentence: input.context_sentence.clone(),
        lexical_domain: Some(requested_domain.clone()),
    };

    let gloss = match registry.translate(req).await {
        Ok(res) => res,
        Err(e) => {
            // Provider was configured — surface the real failure (429, empty Gemini
            // thought-only reply, invalid model) instead of a fake offline stub.
            // Offline stubs skip persist/enrich, so pictures never load either.
            log::warn!("Live AI translation failed: {e}");
            return Err(e);
        }
    };

    // Prefer AI-detected source; fall back to requested; never invent "en".
    let source_lang = LexemeRepo::normalize_lang_code(&gloss.source_language)
        .or_else(|| requested_source.clone())
        .ok_or_else(|| {
            AppError::Provider(
                "Could not detect source language; please select Source explicitly".to_string(),
            )
        })?;

    // ── 3. Persist gloss in a transaction ──────────────────
    let lexeme_id = {
        let mut conn = pool.get()?;
        let tx = conn.transaction()?;
        let source_lang_id = LexemeRepo::ensure_language(&tx, &source_lang)?;
        let target_lang_id = LexemeRepo::ensure_language(&tx, &target_lang)?;

        let lexeme_id = LexemeRepo::find_or_create(
            &tx,
            source_lang_id,
            &text,
            gloss.part_of_speech.as_deref(),
            gloss.phonetic.as_deref(),
            None,
        )?;

        let domain = gloss
            .detected_lexical_domain
            .clone()
            .unwrap_or_else(|| "general".to_string());

        LexemeRepo::upsert_translation(
            &tx,
            lexeme_id,
            target_lang_id,
            &gloss.main_translation,
            None,
            Some("ai"),
            Some(0.95),
            &domain,
        )?;

        for alt in &gloss.alternatives {
            LexemeRepo::upsert_translation(
                &tx,
                lexeme_id,
                target_lang_id,
                alt,
                Some("alternative"),
                Some("ai"),
                Some(0.7),
                &domain,
            )?;
        }

        for syn in &gloss.source_synonyms {
            LexemeRepo::upsert_synonym(&tx, lexeme_id, source_lang_id, syn, Some("ai"))?;
        }
        // Target-language alternatives also as synonyms for UI consistency
        for alt in &gloss.alternatives {
            LexemeRepo::upsert_synonym(&tx, lexeme_id, target_lang_id, alt, Some("ai"))?;
        }

        tx.commit()?;
        lexeme_id
    };

    let mut result = gloss;
    result.text = text.clone();
    result.source_language = source_lang.clone();
    result.target_language = target_lang.clone();
    result.from_cache = false;
    // Live provider answered — explicitly mark as a real (non-stub) translation.
    result.is_offline_fallback = false;
    result.lexeme_id = Some(lexeme_id);
    result.image_path = None;
    result.frequency_hint = None;

    if enrich == EnrichMode::Background {
        spawn_enrich(
            app,
            pool,
            lexeme_id,
            text,
            source_lang,
            target_lang,
            result.main_translation.clone(),
        );
    }

    Ok(result)
}

/// Build the primary AI provider from settings.
/// Returns None when the provider is not configured (missing API key / account id).
fn build_configured_provider(
    app: &AppHandle,
    settings: &AppSettings,
) -> Option<Arc<dyn AIProvider>> {
    match crate::providers::ai::create_provider(
        app,
        &settings.ai_provider,
        &settings.ai_model,
        settings,
    ) {
        Ok(provider) => Some(provider),
        Err(e) => {
            log::warn!(
                "AI provider '{}' is not configured: {e}",
                settings.ai_provider
            );
            None
        }
    }
}

/// Provider chain of a role, or None when no model is configured for it.
pub(crate) fn build_configured_registry(
    app: &AppHandle,
    pool: &DbPool,
    settings: &AppSettings,
    role: crate::providers::models::roles::ModelRole,
) -> Option<ProviderRegistry> {
    crate::providers::models::router::registry_for_role(app, pool, settings, role)
        .map_err(|e| log::warn!("{} is not configured: {e}", role.as_str()))
        .ok()
}

/// Load a full card from SQLite when a target translation exists for the domain.
fn lookup_card(
    conn: &rusqlite::Connection,
    text: &str,
    source_lang: &str,
    target_lang: &str,
    lexical_domain: &str,
) -> Result<Option<TranslationResult>, AppError> {
    let source_lang_id = match LexemeRepo::language_id_by_code(conn, source_lang) {
        Ok(id) => id,
        Err(_) => return Ok(None),
    };
    let target_lang_id = match LexemeRepo::language_id_by_code(conn, target_lang) {
        Ok(id) => id,
        Err(_) => return Ok(None),
    };

    let Some(lexeme) = LexemeRepo::find_by_normalized(conn, source_lang_id, text)? else {
        return Ok(None);
    };

    let translations = LexemeRepo::get_translations_for_domain(
        conn,
        lexeme.id,
        Some(target_lang_id),
        Some(lexical_domain),
    )?;
    if translations.is_empty() {
        return Ok(None);
    }

    let main = translations[0].translated_text.clone();
    let alternatives: Vec<String> = translations
        .iter()
        .skip(1)
        .map(|t| t.translated_text.clone())
        .collect();

    let source_synonyms = LexemeRepo::get_synonyms(conn, lexeme.id, source_lang_id)?;

    let target_synonyms = LexemeRepo::get_synonyms(conn, lexeme.id, target_lang_id)?;
    let alternatives = if alternatives.is_empty() && !target_synonyms.is_empty() {
        target_synonyms.into_iter().filter(|s| s != &main).collect()
    } else {
        alternatives
    };

    let examples = LexemeRepo::get_examples(conn, lexeme.id)?;
    let example_sentence = examples.first().map(|e| e.sentence.clone());
    let example_sentence_2 = examples.get(1).map(|e| e.sentence.clone());
    let usage_note = translations[0].sense.clone();
    let image_path = LexemeRepo::get_image_path(conn, lexeme.id)?;

    let frequency_hint = lexeme.frequency_rank.map(|r| {
        if r <= 1000 {
            "top-1000".to_string()
        } else if r <= 5000 {
            "top-5000".to_string()
        } else {
            format!("rank-{r}")
        }
    });

    Ok(Some(TranslationResult {
        text: lexeme.text,
        source_language: source_lang.to_string(),
        target_language: target_lang.to_string(),
        main_translation: main,
        alternatives,
        source_synonyms,
        part_of_speech: lexeme.part_of_speech,
        phonetic: lexeme.phonetic,
        usage_note,
        example_sentence,
        example_sentence_2,
        frequency_hint,
        from_cache: true,
        is_offline_fallback: false,
        lexeme_id: Some(lexeme.id),
        image_path,
        detected_lexical_domain: Some(lexical_domain.to_string()),
        requested_lexical_domain: None,
    }))
}

/// Exponential backoff between background translate attempts.
fn background_retry_delay(attempt: u32) -> Duration {
    let factor = 1u32 << attempt.saturating_sub(1).min(16);
    BACKGROUND_RETRY_BASE_DELAY
        .saturating_mul(factor)
        .min(BACKGROUND_RETRY_MAX_DELAY)
}

/// Worth another attempt? Rate limits and server hiccups are; a missing API key
/// or an invalid word will fail the same way no matter how long we wait.
fn is_transient_translate_error(err: &AppError) -> bool {
    if is_rate_limited(err) {
        return true;
    }
    match err {
        AppError::Http(_) => true,
        AppError::Provider(msg) => {
            let lower = msg.to_ascii_lowercase();
            [
                "error 500",
                "error 502",
                "error 503",
                "error 504",
                "timeout",
                "timed out",
                "overloaded",
                "unavailable",
                "connection",
            ]
            .iter()
            .any(|marker| lower.contains(marker))
        }
        _ => false,
    }
}

/// Translate off the UI thread, surviving a provider hiccup.
pub(crate) async fn translate_in_background(
    input: TranslateInput,
    pool: Arc<DbPool>,
    app: AppHandle,
) -> Result<TranslationResult, AppError> {
    let mut attempt = 1;
    loop {
        match translate_text_inner(input.clone(), pool.clone(), app.clone()).await {
            Ok(result) => return Ok(result),
            Err(e) => {
                if attempt >= BACKGROUND_TRANSLATE_ATTEMPTS || !is_transient_translate_error(&e) {
                    return Err(e);
                }
                let delay = background_retry_delay(attempt);
                log::warn!(
                    "Background translate for '{}' failed (attempt {attempt}/{BACKGROUND_TRANSLATE_ATTEMPTS}), retrying in {delay:?}: {e}",
                    input.text
                );
                tokio::time::sleep(delay).await;
                attempt += 1;
            }
        }
    }
}

fn backfill_attempts() -> &'static Mutex<HashMap<i64, Instant>> {
    static ATTEMPTS: OnceLock<Mutex<HashMap<i64, Instant>>> = OnceLock::new();
    ATTEMPTS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// One backfill per lexeme at a time, and no faster than the cooldown.
fn claim_backfill(lexeme_id: i64) -> bool {
    let Ok(mut attempts) = backfill_attempts().lock() else {
        return false;
    };
    let now = Instant::now();
    if let Some(last) = attempts.get(&lexeme_id) {
        if now.duration_since(*last) < BACKFILL_COOLDOWN {
            return false;
        }
    }
    attempts.insert(lexeme_id, now);
    true
}

/// The word reached the vocabulary but its gloss never persisted (provider was
/// down or rate limited). Repair it the next time the word is shown.
pub(crate) fn spawn_translation_backfill(
    app: AppHandle,
    pool: Arc<DbPool>,
    lexeme_id: i64,
    text: String,
    source_language: String,
) {
    if !claim_backfill(lexeme_id) {
        return;
    }
    tauri::async_runtime::spawn(async move {
        match run_translation_backfill(&app, &pool, lexeme_id, &text, &source_language).await {
            Ok(true) => {
                let _ = app.emit(
                    TRANSLATION_BACKFILLED_EVENT,
                    &TranslationBackfilledPayload { lexeme_id },
                );
            }
            Ok(false) => {}
            Err(e) => log::warn!("Translation backfill failed for '{text}': {e}"),
        }
    });
}

/// Ok(true) when a gloss was written, Ok(false) when there was nothing to do.
async fn run_translation_backfill(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    lexeme_id: i64,
    text: &str,
    source_language: &str,
) -> Result<bool, AppError> {
    let (settings, missing) = {
        let conn = pool.get()?;
        (
            SettingsRepo::get(&conn).unwrap_or_default(),
            LexemeRepo::get_translations(&conn, lexeme_id, None)?.is_empty(),
        )
    };
    if !missing {
        return Ok(false);
    }
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Ok(false);
    }

    let input = TranslateInput {
        text: text.to_string(),
        source_language: Some(source_language.to_string()),
        target_language: resolve_target_language(&settings.interface_language, source_language),
        context_sentence: None,
        lexical_domain: None,
    };
    translate_in_background(input, pool.clone(), app.clone()).await?;

    let conn = pool.get()?;
    Ok(!LexemeRepo::get_translations(&conn, lexeme_id, None)?.is_empty())
}

/// At most this many cards are enriched at once (LLM + picture per card);
/// bulk adds queue instead of firing every request simultaneously.
const ENRICH_CONCURRENCY: usize = 2;

fn enrich_limit() -> &'static tokio::sync::Semaphore {
    static LIMIT: OnceLock<tokio::sync::Semaphore> = OnceLock::new();
    LIMIT.get_or_init(|| tokio::sync::Semaphore::new(ENRICH_CONCURRENCY))
}

pub(crate) fn spawn_enrich(
    app: AppHandle,
    pool: Arc<DbPool>,
    lexeme_id: i64,
    text: String,
    source_lang: String,
    target_lang: String,
    main_translation: String,
) {
    tauri::async_runtime::spawn(async move {
        let Ok(_permit) = enrich_limit().acquire().await else {
            return;
        };
        if let Err(e) = run_enrich(
            &app,
            &pool,
            lexeme_id,
            &text,
            &source_lang,
            &target_lang,
            &main_translation,
        )
        .await
        {
            log::warn!("Card enrich failed for lexeme {lexeme_id}: {e}");
        }
    });
}

async fn run_enrich(
    app: &AppHandle,
    pool: &Arc<DbPool>,
    lexeme_id: i64,
    text: &str,
    source_lang: &str,
    target_lang: &str,
    main_translation: &str,
) -> Result<(), AppError> {
    let (already_enriched, existing_image, existing_examples, needs_image) = {
        let conn = pool.get()?;
        let examples = LexemeRepo::get_examples(&conn, lexeme_id)?;
        (
            LexemeRepo::is_enriched(&conn, lexeme_id)?,
            LexemeRepo::get_image_path(&conn, lexeme_id)?,
            examples,
            LexemeRepo::needs_associated_image(&conn, lexeme_id)?,
        )
    };
    let example_count = existing_examples.len();
    if already_enriched && !needs_image && example_count >= 2 {
        let payload = CardEnrichPayload {
            lexeme_id,
            usage_note: None,
            example_sentence: existing_examples.first().map(|e| e.sentence.clone()),
            example_sentence_2: existing_examples.get(1).map(|e| e.sentence.clone()),
            image_path: existing_image,
            complete: true,
        };
        let _ = app.emit(CARD_ENRICH_EVENT, &payload);
        return Ok(());
    }

    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };

    let mut usage_note: Option<String> = None;
    let mut example_sentence = existing_examples.first().map(|e| e.sentence.clone());
    let mut example_sentence_2 = existing_examples.get(1).map(|e| e.sentence.clone());

    let registry = if !settings.offline_mode && settings.ai_provider != "offline" {
        crate::providers::models::router::registry_for_role(
            app,
            pool,
            &settings,
            crate::providers::models::roles::ModelRole::TextFast,
        )
        .ok()
    } else {
        None
    };

    let needs_llm = !already_enriched || example_count < 2;
    if needs_llm {
        if let Some(ref registry) = registry {
            let enrich_req = EnrichRequest {
                text: text.to_string(),
                source_language: source_lang.to_string(),
                target_language: target_lang.to_string(),
                main_translation: main_translation.to_string(),
            };
            match registry.enrich(enrich_req).await {
                Ok(res) => {
                    usage_note = res.usage_note;
                    if res.example_sentence.is_some() {
                        example_sentence = res.example_sentence;
                    }
                    if res.example_sentence_2.is_some() {
                        example_sentence_2 = res.example_sentence_2;
                    }
                }
                Err(e) => log::warn!("Enrich LLM failed: {e}"),
            }
        }
    }

    // Persist examples/notes before image so mnemonic can use example as context.
    {
        let conn = pool.get()?;
        if let Some(ref sentence) = example_sentence {
            LexemeRepo::upsert_example(&conn, lexeme_id, sentence, None, Some("ai"), Some(1))?;
        }
        if let Some(ref sentence) = example_sentence_2 {
            LexemeRepo::upsert_example(&conn, lexeme_id, sentence, None, Some("ai"), Some(2))?;
        }
        if let Some(ref note) = usage_note {
            let target_lang_id = LexemeRepo::language_id_by_code(&conn, target_lang)?;
            let _ = conn.execute(
                "UPDATE translation SET sense = COALESCE(sense, ?1)
                 WHERE lexeme_id = ?2 AND target_language_id = ?3
                   AND id = (
                     SELECT id FROM translation
                     WHERE lexeme_id = ?2 AND target_language_id = ?3
                     ORDER BY confidence DESC, id ASC LIMIT 1
                   )",
                rusqlite::params![note, lexeme_id, target_lang_id],
            );
        }
    }

    // Don't wait for photo generation — examples should appear as soon as the LLM returns.
    if example_sentence.is_some() || example_sentence_2.is_some() || usage_note.is_some() {
        let _ = app.emit(
            CARD_ENRICH_EVENT,
            &CardEnrichPayload {
                lexeme_id,
                usage_note: usage_note.clone(),
                example_sentence: example_sentence.clone(),
                example_sentence_2: example_sentence_2.clone(),
                image_path: if needs_image {
                    None
                } else {
                    existing_image.clone()
                },
                complete: !needs_image,
            },
        );
        if !needs_image {
            let conn = pool.get()?;
            LexemeRepo::mark_enriched(&conn, lexeme_id)?;
            return Ok(());
        }
    }

    let context = example_sentence.clone().unwrap_or_else(|| {
        let conn = pool.get().ok();
        conn.and_then(|c| {
            LexemeRepo::get_examples(&c, lexeme_id)
                .ok()
                .and_then(|ex| ex.into_iter().next().map(|e| e.sentence))
        })
        .unwrap_or_default()
    });

    // Visual mnemonic → generate (OpenAI/Gemini) or Unsplash/Wiki fallback.
    // Seed SVGs do not count — generate and persist a real photo on the lexeme.
    let mut image_path = existing_image.clone();
    if needs_image {
        if let Ok(path) = crate::commands::media::ensure_lexeme_image(
            app,
            pool,
            lexeme_id,
            text,
            main_translation,
            &context,
            &settings,
            registry.as_ref(),
        )
        .await
        {
            if path.is_some() {
                image_path = path;
            }
        }
    }

    {
        let conn = pool.get()?;
        LexemeRepo::mark_enriched(&conn, lexeme_id)?;
        if image_path.is_none() {
            image_path = LexemeRepo::get_image_path(&conn, lexeme_id)?;
        }
    }

    let payload = CardEnrichPayload {
        lexeme_id,
        usage_note,
        example_sentence,
        example_sentence_2,
        image_path,
        complete: true,
    };
    let _ = app.emit(CARD_ENRICH_EVENT, &payload);
    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestProviderInput {
    pub provider: String,
    pub model: String,
    pub account_id: Option<String>,
    pub custom_url: Option<String>,
}

#[tauri::command]
pub async fn test_provider_connection(
    input: TestProviderInput,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<TranslationResult, AppError> {
    let pool = db.inner().clone();
    let conn = pool.get()?;
    let mut settings = SettingsRepo::get(&conn).unwrap_or_default();

    if let Some(acc) = input.account_id {
        if !acc.trim().is_empty() {
            settings.cloudflare_account_id = Some(acc);
        }
    }
    if let Some(url) = input.custom_url {
        if !url.trim().is_empty() {
            settings.custom_base_url = Some(url);
        }
    }

    let provider =
        crate::providers::ai::create_provider(&app, &input.provider, &input.model, &settings)?;
    let req = TranslateRequest {
        text: "serendipity".to_string(),
        source_language: Some("en".to_string()),
        target_language: "ru".to_string(),
        context_sentence: Some("Finding this bookstore was pure serendipity.".to_string()),
            lexical_domain: None,
        };

    let mut result = provider.translate(req).await?;
    result.from_cache = false;
    result.is_offline_fallback = false;
    result.lexeme_id = None;
    result.image_path = None;
    if result.frequency_hint.is_none() {
        result.frequency_hint = None;
    }
    Ok(result)
}

/// Result of the "Test AI Connection" settings action.
/// Structural answer, never an IPC error: the real provider failure
/// (401 / 404 / invalid account id) must be visible to the user in `message`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResult {
    pub ok: bool,
    pub latency_ms: u64,
    pub message: String,
    pub sample_translation: Option<String>,
}

#[tauri::command]
pub async fn test_ai_connection(
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<TestConnectionResult, AppError> {
    let settings = {
        let pool = db.inner().clone();
        let conn = pool.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Ok(TestConnectionResult {
            ok: false,
            latency_ms: 0,
            message: AppError::ai_not_connected("Connection test").to_string(),
            sample_translation: None,
        });
    }

    let Some(provider) = build_configured_provider(&app, &settings) else {
        return Ok(TestConnectionResult {
            ok: false,
            latency_ms: 0,
            message: AppError::ai_not_connected("Connection test").to_string(),
            sample_translation: None,
        });
    };

    let req = TranslateRequest {
        text: "serendipity".to_string(),
        source_language: Some("en".to_string()),
        target_language: "ru".to_string(),
        context_sentence: Some("Finding this bookstore was pure serendipity.".to_string()),
            lexical_domain: None,
        };

    let started = std::time::Instant::now();
    let outcome =
        tokio::time::timeout(std::time::Duration::from_secs(15), provider.translate(req)).await;
    let latency_ms = started.elapsed().as_millis() as u64;

    match outcome {
        Ok(Ok(res)) => Ok(TestConnectionResult {
            ok: true,
            latency_ms,
            message: format!("Connection to '{}' successful", provider.provider_name()),
            sample_translation: Some(res.main_translation),
        }),
        Ok(Err(e)) => Ok(TestConnectionResult {
            ok: false,
            latency_ms,
            // Provider error verbatim — the user must see 401/404/invalid account id.
            message: e.to_string(),
            sample_translation: None,
        }),
        Err(_) => Ok(TestConnectionResult {
            ok: false,
            latency_ms,
            message: "Provider did not respond within 15s (timeout)".to_string(),
            sample_translation: None,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations};

    #[test]
    fn background_retry_backs_off_and_caps() {
        assert_eq!(background_retry_delay(1), BACKGROUND_RETRY_BASE_DELAY);
        assert_eq!(background_retry_delay(2), Duration::from_secs(10));
        assert_eq!(background_retry_delay(3), Duration::from_secs(20));
        assert_eq!(background_retry_delay(9), BACKGROUND_RETRY_MAX_DELAY);
    }

    #[test]
    fn rate_limits_and_server_hiccups_are_retried() {
        assert!(is_transient_translate_error(&AppError::Provider(
            "OpenRouter: Too many requests (429)".into()
        )));
        assert!(is_transient_translate_error(&AppError::Http(
            "connection reset".into()
        )));
        assert!(is_transient_translate_error(&AppError::Provider(
            "Gemini API error 503: model overloaded".into()
        )));
    }

    #[test]
    fn misconfiguration_is_not_retried() {
        assert!(!is_transient_translate_error(&AppError::ai_not_connected(
            "Translation"
        )));
        assert!(!is_transient_translate_error(&AppError::Provider(
            "OpenAI API error 401: invalid api key".into()
        )));
        assert!(!is_transient_translate_error(&AppError::Validation(
            "Text to translate is empty".into()
        )));
    }

    #[test]
    fn backfill_is_claimed_once_per_cooldown() {
        // Ids unique to this test — the claim map is process-wide.
        assert!(claim_backfill(-9_001));
        assert!(!claim_backfill(-9_001));
        assert!(claim_backfill(-9_002));
    }

    #[test]
    fn normalize_lang_code_strips_region() {
        assert_eq!(
            LexemeRepo::normalize_lang_code("pt-BR").as_deref(),
            Some("pt")
        );
        assert_eq!(LexemeRepo::normalize_lang_code("auto"), None);
        assert_eq!(LexemeRepo::normalize_lang_code(""), None);
    }

    #[test]
    fn ensure_language_inserts_unknown_code() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let conn = pool.get().expect("conn");
        let id = LexemeRepo::ensure_language(&conn, "xx").expect("ensure");
        assert!(id > 0);
        let again = LexemeRepo::ensure_language(&conn, "xx").expect("again");
        assert_eq!(id, again);
    }

    #[test]
    fn lookup_card_hit_after_persist() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let conn = pool.get().expect("conn");

        let source_id = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        let target_id = LexemeRepo::language_id_by_code(&conn, "ru").expect("ru");
        let lexeme_id = LexemeRepo::find_or_create(
            &conn,
            source_id,
            "zztlookup",
            Some("noun"),
            Some("/z/"),
            None,
        )
        .expect("lex");
        LexemeRepo::upsert_translation(
            &conn,
            lexeme_id,
            target_id,
            "ззтлукап",
            None,
            Some("test"),
            Some(0.9),
            "general",
        )
        .expect("tr");
        LexemeRepo::upsert_synonym(&conn, lexeme_id, source_id, "zzt-alt", Some("test"))
            .expect("syn");

        let card = lookup_card(&conn, " ZztLookup ", "en", "ru", "general")
            .expect("lookup")
            .expect("hit");
        assert_eq!(card.main_translation, "ззтлукап");
        assert_eq!(card.source_synonyms, vec!["zzt-alt".to_string()]);
        assert_eq!(card.lexeme_id, Some(lexeme_id));
        assert!(card.from_cache);
    }

    #[test]
    fn lookup_card_miss_without_translation() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let conn = pool.get().expect("conn");
        let source_id = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        LexemeRepo::find_or_create(&conn, source_id, "zztnologo", None, None, None).expect("lex");
        let miss = lookup_card(&conn, "zztnologo", "en", "ru", "general").expect("lookup");
        assert!(miss.is_none());
    }

    #[test]
    fn lookup_card_separates_domains() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let conn = pool.get().expect("conn");
        let source_id = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        let target_id = LexemeRepo::language_id_by_code(&conn, "ru").expect("ru");
        let lexeme_id =
            LexemeRepo::find_or_create(&conn, source_id, "bug", Some("noun"), None, None)
                .expect("lex");
        LexemeRepo::upsert_translation(
            &conn,
            lexeme_id,
            target_id,
            "жук",
            None,
            Some("ai"),
            Some(0.95),
            "general",
        )
        .expect("general");
        LexemeRepo::upsert_translation(
            &conn,
            lexeme_id,
            target_id,
            "ошибка",
            None,
            Some("ai"),
            Some(0.95),
            "it",
        )
        .expect("it");

        let general = lookup_card(&conn, "bug", "en", "ru", "general")
            .expect("lookup")
            .expect("hit");
        let it = lookup_card(&conn, "bug", "en", "ru", "it")
            .expect("lookup")
            .expect("hit");
        assert_eq!(general.main_translation, "жук");
        assert_eq!(it.main_translation, "ошибка");
    }

    #[test]
    fn persist_gloss_fields_then_second_lookup_hits() {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrate");
        let mut conn = pool.get().expect("conn");
        {
            let tx = conn.transaction().expect("tx");

            let source_id = LexemeRepo::language_id_by_code(&tx, "en").expect("en");
            let target_id = LexemeRepo::language_id_by_code(&tx, "ru").expect("ru");
            let lexeme_id = LexemeRepo::find_or_create(
                &tx,
                source_id,
                "zzgloss",
                Some("verb"),
                Some("/g/"),
                None,
            )
            .expect("lex");
            LexemeRepo::upsert_translation(
                &tx,
                lexeme_id,
                target_id,
                "глянцевать",
                None,
                Some("ai"),
                Some(0.95),
                "general",
            )
            .expect("main");
            LexemeRepo::upsert_translation(
                &tx,
                lexeme_id,
                target_id,
                "лощить",
                None,
                Some("ai"),
                Some(0.8),
                "general",
            )
            .expect("alt");
            LexemeRepo::upsert_synonym(&tx, lexeme_id, source_id, "polish", Some("ai"))
                .expect("syn");
            LexemeRepo::upsert_synonym(&tx, lexeme_id, target_id, "лощить", Some("ai"))
                .expect("tsyn");
            tx.commit().expect("commit");
        }

        let card = lookup_card(&conn, "ZzGloss", "en", "ru", "general")
            .expect("lookup")
            .expect("hit");
        assert_eq!(card.main_translation, "глянцевать");
        assert!(card.alternatives.contains(&"лощить".to_string()));
        assert_eq!(card.source_synonyms, vec!["polish".to_string()]);
        assert_eq!(card.part_of_speech.as_deref(), Some("verb"));
        assert!(card.from_cache);
    }
}
