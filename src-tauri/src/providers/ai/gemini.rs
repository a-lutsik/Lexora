// ============================================================
// LEXORA — Google Gemini Provider
// Implements AIProvider using Google Generative Language API.
// ============================================================

use super::{
    articulation_tip_from_json, audio_translation_from_json, check_writing_from_json,
    dialogue_turn_from_json, doc_chunk_from_json, enrich_from_json, evaluation_from_json,
    exercises_from_json, extract_json, gloss_from_json, image_translation_from_json,
    mnemonic_concepts_from_json, mnemonic_rank_from_json, pronunciation_from_json,
    render_articulation_tip_prompt, render_check_writing_prompt, render_dialogue_turn_prompt,
    render_enrich_prompt, render_evaluate_prompt, render_evaluate_pronunciation_prompt,
    render_explain_prompt, render_generate_exercises_prompt, render_mnemonic_concepts_prompt,
    render_mnemonic_rank_prompt, render_rewrite_prompt, render_translate_audio_prompt,
    render_translate_document_prompt, render_translate_image_prompt, render_translate_prompt,
    render_transcribe_audio_prompt, rewrite_from_json, transcription_from_json, AIProvider, ArticulationTipRequest, ArticulationTipResult,
    AudioTranslationResult, CheckWritingRequest, CheckWritingResult, DialogueTurnRequest,
    DialogueTurnResult, DocChunkTranslationResult, EnrichRequest, EnrichResult,
    EvaluatePronunciationRequest, EvaluateRequest, ExplainRequest, GenerateExercisesRequest,
    ImageTranslationResult, MnemonicConceptsRequest, MnemonicConceptsResult, MnemonicRankRequest,
    MnemonicRankResult, PronunciationEvaluationResult, RewriteRequest, RewriteResult,
    TranscribeAudioRequest, TranscriptionResult, TranslateAudioRequest, TranslateDocChunkRequest,
    TranslateImageRequest, TranslateRequest, WritingExerciseRaw,
};
use crate::commands::study::EvaluationResult;
use crate::commands::translate::TranslationResult;
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

/// Build the generateContent endpoint URL (pure — no network).
fn build_request_url(model: &str, api_key: &str) -> String {
    format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    )
}

/// JSON-mode generationConfig for the given Gemini model (pure — no network).
/// Gemini 3 thinks by default; without a token cap / minimal thinking the
/// first part is often a thought (or empty) and translate/enrich hang or fail.
fn json_generation_config(model: &str) -> serde_json::Value {
    let lower = model.to_ascii_lowercase();
    let mut cfg = serde_json::Map::new();
    cfg.insert("responseMimeType".into(), json!("application/json"));
    cfg.insert("maxOutputTokens".into(), json!(4096));

    if lower.contains("gemini-3") {
        cfg.insert(
            "thinkingConfig".into(),
            json!({ "thinkingLevel": "minimal" }),
        );
    } else if lower.contains("2.5-pro") {
        cfg.insert("temperature".into(), json!(0.2));
        cfg.insert("thinkingConfig".into(), json!({ "thinkingBudget": 128 }));
    } else if lower.contains("2.5") {
        cfg.insert("temperature".into(), json!(0.2));
        cfg.insert("thinkingConfig".into(), json!({ "thinkingBudget": 0 }));
    } else {
        cfg.insert("temperature".into(), json!(0.2));
    }

    serde_json::Value::Object(cfg)
}

/// Build the generateContent request body (pure — no network).
fn build_request_body(prompt: &str, model: &str) -> serde_json::Value {
    json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": json_generation_config(model)
    })
}

/// Extract answer text from a Gemini generateContent response (pure — no network).
/// Skips thought parts so Gemini 3 thinking models still yield the JSON payload.
fn extract_response_text(json_resp: &serde_json::Value) -> Result<String, AppError> {
    if let Some(reason) = json_resp["promptFeedback"]["blockReason"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return Err(AppError::Provider(format!(
            "Gemini blocked the prompt ({reason})"
        )));
    }

    let mut texts: Vec<&str> = Vec::new();
    if let Some(parts) = json_resp["candidates"][0]["content"]["parts"].as_array() {
        for part in parts {
            if part["thought"].as_bool() == Some(true) {
                continue;
            }
            if let Some(text) = part["text"]
                .as_str()
                .map(str::trim)
                .filter(|s| !s.is_empty())
            {
                texts.push(text);
            }
        }
    }
    if !texts.is_empty() {
        return Ok(texts.join("\n"));
    }

    let finish = json_resp["candidates"][0]["finishReason"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    Err(AppError::Provider(match finish {
        Some(reason) => format!("Empty response from Gemini (finishReason: {reason})"),
        None => "Empty response from Gemini".to_string(),
    }))
}

fn gemini_audio_mime(mime: &str) -> String {
    let base = mime
        .split(';')
        .next()
        .unwrap_or(mime)
        .trim()
        .to_ascii_lowercase();
    match base.as_str() {
        "audio/x-wav" | "audio/wave" => "audio/wav".into(),
        "audio/mpeg" | "audio/mp3" => "audio/mp3".into(),
        "audio/m4a" | "audio/x-m4a" | "audio/mp4" => "audio/m4a".into(),
        other => other.into(),
    }
}

fn build_request_body_with_audio(
    prompt: &str,
    mime: &str,
    data_b64: &str,
    model: &str,
) -> serde_json::Value {
    json!({
        "contents": [{
            "parts": [
                { "inline_data": { "mime_type": mime, "data": data_b64 } },
                { "text": prompt }
            ]
        }],
        "generationConfig": json_generation_config(model)
    })
}

pub struct GeminiProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl GeminiProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            model: model.unwrap_or_else(|| "gemini-3.6-flash".to_string()),
        }
    }

    async fn send_content(&self, prompt: &str) -> Result<String, AppError> {
        use super::rate_limit::{
            check_response_rate_limit, RateLimitOutcome, RATE_LIMIT_MAX_RETRIES,
        };

        let url = build_request_url(&self.model, &self.api_key);
        let body = build_request_body(prompt, &self.model);
        let mut attempt = 0u32;
        loop {
            let resp = self
                .client
                .post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| AppError::Http(e.to_string()))?;

            match check_response_rate_limit("Gemini", resp, attempt).await {
                RateLimitOutcome::Ok(resp) => {
                    let json_resp: serde_json::Value = resp
                        .json()
                        .await
                        .map_err(|e| AppError::Serialization(e.to_string()))?;
                    return extract_response_text(&json_resp);
                }
                RateLimitOutcome::Retry => {
                    attempt += 1;
                    if attempt > RATE_LIMIT_MAX_RETRIES {
                        return Err(super::rate_limit::rate_limit_error("Gemini"));
                    }
                }
                RateLimitOutcome::Err(e) => return Err(e),
            }
        }
    }

    async fn send_json_body(&self, body: serde_json::Value) -> Result<String, AppError> {
        use super::rate_limit::{
            check_response_rate_limit, RateLimitOutcome, RATE_LIMIT_MAX_RETRIES,
        };

        let url = build_request_url(&self.model, &self.api_key);
        let mut attempt = 0u32;
        loop {
            let resp = self
                .client
                .post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| AppError::Http(e.to_string()))?;

            match check_response_rate_limit("Gemini", resp, attempt).await {
                RateLimitOutcome::Ok(resp) => {
                    let json_resp: serde_json::Value = resp
                        .json()
                        .await
                        .map_err(|e| AppError::Serialization(e.to_string()))?;
                    return extract_response_text(&json_resp);
                }
                RateLimitOutcome::Retry => {
                    attempt += 1;
                    if attempt > RATE_LIMIT_MAX_RETRIES {
                        return Err(super::rate_limit::rate_limit_error("Gemini"));
                    }
                }
                RateLimitOutcome::Err(e) => return Err(e),
            }
        }
    }
}

#[async_trait]
impl AIProvider for GeminiProvider {
    fn provider_name(&self) -> &'static str {
        "Gemini"
    }

    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        let prompt = render_translate_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(gloss_from_json(&req, &parsed))
    }

    async fn enrich(&self, req: EnrichRequest) -> Result<EnrichResult, AppError> {
        let prompt = render_enrich_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(enrich_from_json(&parsed))
    }

    async fn mnemonic_concepts(
        &self,
        req: MnemonicConceptsRequest,
    ) -> Result<MnemonicConceptsResult, AppError> {
        let prompt = render_mnemonic_concepts_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        mnemonic_concepts_from_json(&parsed)
    }

    async fn mnemonic_rank(
        &self,
        req: MnemonicRankRequest,
    ) -> Result<MnemonicRankResult, AppError> {
        let prompt = render_mnemonic_rank_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        mnemonic_rank_from_json(&parsed)
    }

    async fn evaluate_answer(&self, req: EvaluateRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_evaluate_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn explain_error(&self, req: ExplainRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_explain_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn check_writing(
        &self,
        req: CheckWritingRequest,
    ) -> Result<CheckWritingResult, AppError> {
        let prompt = render_check_writing_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(check_writing_from_json(&parsed))
    }

    async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError> {
        let prompt = render_rewrite_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        rewrite_from_json(&parsed)
    }

    async fn evaluate_pronunciation(
        &self,
        req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        let prompt = render_evaluate_pronunciation_prompt(&req);
        let content = if let Some(path) = req.audio_path.as_deref() {
            let path = std::path::Path::new(path);
            let bytes = std::fs::read(path)?;
            let mime = crate::pronunciation::audio_cache::mime_from_path(path);
            let b64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &bytes);
            self.send_json_body(build_request_body_with_audio(
                &prompt,
                mime,
                &b64,
                &self.model,
            ))
            .await?
        } else {
            self.send_content(&prompt).await?
        };
        let parsed = extract_json(&content)?;
        Ok(pronunciation_from_json(&parsed, &req))
    }

    async fn get_articulation_tip(
        &self,
        req: ArticulationTipRequest,
    ) -> Result<ArticulationTipResult, AppError> {
        let prompt = render_articulation_tip_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(articulation_tip_from_json(&parsed, &req.phoneme))
    }

    async fn generate_exercises(
        &self,
        req: GenerateExercisesRequest,
    ) -> Result<Vec<WritingExerciseRaw>, AppError> {
        let prompt = render_generate_exercises_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(exercises_from_json(&parsed))
    }

    async fn translate_image(
        &self,
        req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError> {
        let prompt = render_translate_image_prompt(&req);
        let body =
            build_request_body_with_audio(&prompt, &req.mime_type, &req.image_base64, &self.model);
        let content = self.send_json_body(body).await?;
        let parsed = extract_json(&content)?;
        Ok(image_translation_from_json(&parsed, &req))
    }

    async fn translate_document_chunk(
        &self,
        req: TranslateDocChunkRequest,
    ) -> Result<DocChunkTranslationResult, AppError> {
        let prompt = render_translate_document_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(doc_chunk_from_json(&parsed, &req))
    }

    async fn translate_audio(
        &self,
        req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError> {
        let prompt = render_translate_audio_prompt(&req);
        let mime = gemini_audio_mime(&req.mime_type);
        let body = build_request_body_with_audio(&prompt, &mime, &req.audio_base64, &self.model);
        let content = self.send_json_body(body).await?;
        let parsed = extract_json(&content)?;
        Ok(audio_translation_from_json(&parsed, &req))
    }

    async fn transcribe_audio(
        &self,
        req: TranscribeAudioRequest,
    ) -> Result<TranscriptionResult, AppError> {
        let prompt = render_transcribe_audio_prompt(&req);
        let mime = gemini_audio_mime(&req.mime_type);
        let body = build_request_body_with_audio(&prompt, &mime, &req.audio_base64, &self.model);
        let content = self.send_json_body(body).await?;
        let parsed = extract_json(&content)?;
        transcription_from_json(&parsed, &req)
    }

    async fn dialogue_turn(
        &self,
        req: DialogueTurnRequest,
    ) -> Result<DialogueTurnResult, AppError> {
        let prompt = render_dialogue_turn_prompt(&req);
        let content = self.send_content(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(dialogue_turn_from_json(&parsed))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_model_is_gemini_flash() {
        let p = GeminiProvider::new("key".to_string(), None);
        assert_eq!(p.model, "gemini-3.6-flash");
    }

    #[test]
    fn custom_model_overrides_default() {
        let p = GeminiProvider::new("key".to_string(), Some("gemini-pro".to_string()));
        assert_eq!(p.model, "gemini-pro");
    }

    #[test]
    fn provider_name_is_gemini() {
        let p = GeminiProvider::new("key".to_string(), None);
        assert_eq!(p.provider_name(), "Gemini");
    }

    #[test]
    fn request_url_contains_model_and_api_key() {
        let url = build_request_url("gemini-3.6-flash", "secret-key");
        assert_eq!(
            url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=secret-key"
        );
    }

    #[test]
    fn request_body_wraps_prompt_and_forces_json_mime() {
        let body = build_request_body("translate hello", "gemini-3.6-flash");
        assert_eq!(body["contents"][0]["parts"][0]["text"], "translate hello");
        assert_eq!(
            body["generationConfig"]["responseMimeType"],
            "application/json"
        );
        assert_eq!(body["generationConfig"]["maxOutputTokens"], json!(4096));
        assert_eq!(
            body["generationConfig"]["thinkingConfig"]["thinkingLevel"],
            "minimal"
        );
        assert!(body["generationConfig"]["temperature"].is_null());
    }

    #[test]
    fn request_body_disables_thinking_on_gemini_2_5_flash() {
        let body = build_request_body("hi", "gemini-2.5-flash");
        assert_eq!(
            body["generationConfig"]["thinkingConfig"]["thinkingBudget"],
            0
        );
        assert_eq!(body["generationConfig"]["temperature"], json!(0.2));
    }

    #[test]
    fn extract_response_text_reads_first_candidate_part() {
        let resp = json!({
            "candidates": [{ "content": { "parts": [{ "text": "{\"a\":1}" }] } }]
        });
        assert_eq!(extract_response_text(&resp).unwrap(), "{\"a\":1}");
    }

    #[test]
    fn extract_response_text_skips_thought_parts() {
        let resp = json!({
            "candidates": [{
                "content": {
                    "parts": [
                        { "thought": true, "text": "reasoning trace" },
                        { "text": "{\"main_translation\":\"дом\"}" }
                    ]
                }
            }]
        });
        assert_eq!(
            extract_response_text(&resp).unwrap(),
            "{\"main_translation\":\"дом\"}"
        );
    }

    #[test]
    fn extract_response_text_errors_on_empty_candidates() {
        let resp = json!({ "candidates": [] });
        let err = extract_response_text(&resp).unwrap_err();
        assert!(matches!(err, AppError::Provider(_)));
    }

    #[test]
    fn extract_response_text_errors_on_missing_parts() {
        let resp = json!({ "candidates": [{ "content": { "parts": [] } }] });
        assert!(extract_response_text(&resp).is_err());
    }

    #[test]
    fn extract_response_text_includes_finish_reason() {
        let resp = json!({
            "candidates": [{
                "content": { "parts": [{ "thought": true, "text": "..." }] },
                "finishReason": "MAX_TOKENS"
            }]
        });
        let err = extract_response_text(&resp).unwrap_err();
        assert!(err.to_string().contains("MAX_TOKENS"));
    }

    #[test]
    fn audio_mime_strips_codecs_and_normalizes_aliases() {
        assert_eq!(gemini_audio_mime("audio/webm;codecs=opus"), "audio/webm");
        assert_eq!(gemini_audio_mime("audio/x-wav"), "audio/wav");
        assert_eq!(gemini_audio_mime("audio/mpeg"), "audio/mp3");
        assert_eq!(gemini_audio_mime("audio/m4a"), "audio/m4a");
        assert_eq!(gemini_audio_mime("audio/mp4"), "audio/m4a");
    }
}
