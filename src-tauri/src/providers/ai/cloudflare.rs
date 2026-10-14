// ============================================================
// LEXORA — Cloudflare Workers AI Provider
// Implements AIProvider using Cloudflare Workers AI.
// ============================================================

use super::{
    generated_scenario_from_json, render_generate_scenario_prompt, GenerateScenarioRequest,
    GeneratedScenario,
    articulation_tip_from_json, check_writing_from_json, dialogue_turn_from_json,
    doc_chunk_from_json, enrich_from_json, evaluation_from_json, exercises_from_json, extract_json,
    gloss_from_json, mnemonic_concepts_from_json, mnemonic_rank_from_json, pronunciation_from_json,
    render_articulation_tip_prompt, render_check_writing_prompt, render_dialogue_turn_prompt,
    render_enrich_prompt, render_evaluate_prompt, render_evaluate_pronunciation_prompt,
    render_explain_prompt, render_generate_exercises_prompt, render_mnemonic_concepts_prompt,
    render_mnemonic_rank_prompt, render_rewrite_prompt, render_translate_document_prompt,
    render_translate_prompt, rewrite_from_json, AIProvider, ArticulationTipRequest,
    ArticulationTipResult, AudioTranslationResult, CheckWritingRequest, CheckWritingResult,
    DialogueTurnRequest, DialogueTurnResult, DocChunkTranslationResult, EnrichRequest,
    EnrichResult, EvaluatePronunciationRequest, EvaluateRequest, ExplainRequest,
    GenerateExercisesRequest, ImageTranslationResult, MnemonicConceptsRequest,
    MnemonicConceptsResult, MnemonicRankRequest, MnemonicRankResult, PronunciationEvaluationResult,
    RewriteRequest, RewriteResult, TranslateAudioRequest, TranslateDocChunkRequest,
    TranslateImageRequest, TranslateRequest, WritingExerciseRaw,
};
use crate::commands::study::EvaluationResult;
use crate::commands::translate::TranslationResult;
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

/// Build the Workers AI run endpoint: /ai/run/{model} (pure — no network).
fn build_endpoint(account_id: &str, model: &str) -> String {
    format!("https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}")
}

/// Build the Workers AI request body (pure — no network).
fn build_request_body(system_prompt: &str, user_prompt: &str) -> serde_json::Value {
    json!({
        "messages": [
            {
                "role": "system",
                "content": format!("{system_prompt} Respond ONLY with valid, clean JSON with no extra commentary or markdown code blocks.")
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "max_tokens": 1024
    })
}

/// Extract joined error messages from a Cloudflare API error body, if present.
fn parse_error_messages(err_text: &str) -> Option<String> {
    let err_json = serde_json::from_str::<serde_json::Value>(err_text).ok()?;
    let msgs: Vec<String> = err_json["errors"]
        .as_array()?
        .iter()
        .filter_map(|e| e["message"].as_str().map(String::from))
        .collect();
    if msgs.is_empty() {
        None
    } else {
        Some(msgs.join(", "))
    }
}

/// Extract generated text from a Workers AI response, supporting both the
/// `result.response` shape and the OpenAI-compatible `choices` shape.
fn extract_content(json_resp: &serde_json::Value) -> Result<String, AppError> {
    if let Some(response_str) = json_resp["result"]["response"].as_str() {
        return Ok(response_str.to_string());
    }

    if let Some(content) = json_resp["choices"][0]["message"]["content"].as_str() {
        return Ok(content.to_string());
    }

    Err(AppError::Provider(format!(
        "Unexpected Cloudflare response format: {json_resp}"
    )))
}

pub struct CloudflareProvider {
    client: Client,
    account_id: String,
    api_token: String,
    model: String,
}

impl CloudflareProvider {
    pub fn new(account_id: String, api_token: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            account_id: account_id.trim().to_string(),
            api_token: api_token.trim().to_string(),
            model: model.unwrap_or_else(|| "@cf/meta/llama-3.1-8b-instruct".to_string()),
        }
    }

    async fn send_completion(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String, AppError> {
        use super::rate_limit::{
            body_looks_rate_limited, is_rate_limit_status, rate_limit_error, wait_for_retry_after,
            RATE_LIMIT_MAX_RETRIES,
        };

        if self.account_id.is_empty() {
            return Err(AppError::Validation(
                "Cloudflare Account ID is missing. Please enter your Account ID in Settings."
                    .to_string(),
            ));
        }

        if self.api_token.is_empty() {
            return Err(AppError::Validation(
                "Cloudflare API Token is missing. Please paste your Cloudflare API Token in Settings.".to_string(),
            ));
        }

        // Direct Cloudflare Workers AI run endpoint: /ai/run/{model}
        let run_endpoint = build_endpoint(&self.account_id, &self.model);
        let run_body = build_request_body(system_prompt, user_prompt);
        let mut attempt = 0u32;

        loop {
            let resp = self
                .client
                .post(&run_endpoint)
                .header("Authorization", format!("Bearer {}", self.api_token))
                .header("Content-Type", "application/json")
                .json(&run_body)
                .send()
                .await
                .map_err(|e| AppError::Http(format!("Cloudflare network error: {e}")))?;

            let status = resp.status();
            if status.is_success() {
                let json_resp: serde_json::Value = resp.json().await.map_err(|e| {
                    AppError::Serialization(format!("Cloudflare JSON decode error: {e}"))
                })?;
                return extract_content(&json_resp);
            }

            let headers = resp.headers().clone();
            let err_text = resp.text().await.unwrap_or_default();
            let rate_limited = is_rate_limit_status(status) || body_looks_rate_limited(&err_text);

            if rate_limited && attempt < RATE_LIMIT_MAX_RETRIES {
                log::warn!(
                    "Cloudflare rate limited, backing off (attempt {})",
                    attempt + 1
                );
                wait_for_retry_after(&headers).await;
                attempt += 1;
                continue;
            }
            if rate_limited {
                return Err(rate_limit_error("Cloudflare"));
            }
            if let Some(msgs) = parse_error_messages(&err_text) {
                return Err(AppError::Provider(format!(
                    "Cloudflare API error ({status}): {msgs}"
                )));
            }
            return Err(AppError::Provider(format!(
                "Cloudflare API error ({status}): {err_text}"
            )));
        }
    }
}

#[async_trait]
impl AIProvider for CloudflareProvider {
    fn provider_name(&self) -> &'static str {
        "Cloudflare Workers AI"
    }

    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        let prompt = render_translate_prompt(&req);

        let content = self
            .send_completion(
                "You are an expert bilingual lexicographer and translator.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        Ok(gloss_from_json(&req, &parsed))
    }

    async fn enrich(&self, req: EnrichRequest) -> Result<EnrichResult, AppError> {
        let prompt = render_enrich_prompt(&req);

        let content = self
            .send_completion(
                "You are a language tutor that outputs strict JSON for word enrichment.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        Ok(enrich_from_json(&parsed))
    }

    async fn mnemonic_concepts(
        &self,
        req: MnemonicConceptsRequest,
    ) -> Result<MnemonicConceptsResult, AppError> {
        let prompt = render_mnemonic_concepts_prompt(&req);
        let content = self
            .send_completion(
                "You are a visual mnemonic designer that outputs strict JSON.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        mnemonic_concepts_from_json(&parsed)
    }

    async fn mnemonic_rank(
        &self,
        req: MnemonicRankRequest,
    ) -> Result<MnemonicRankResult, AppError> {
        let prompt = render_mnemonic_rank_prompt(&req);
        let content = self
            .send_completion(
                "You are a visual mnemonic designer that outputs strict JSON.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        mnemonic_rank_from_json(&parsed)
    }

    async fn evaluate_answer(&self, req: EvaluateRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_evaluate_prompt(&req);

        let content = self
            .send_completion(
                "You are an educational evaluator for language learning exercises.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn explain_error(&self, req: ExplainRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_explain_prompt(&req);

        let content = self
            .send_completion(
                "You are an empathetic language tutor explaining student mistakes.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn check_writing(
        &self,
        req: CheckWritingRequest,
    ) -> Result<CheckWritingResult, AppError> {
        let prompt = render_check_writing_prompt(&req);

        let content = self
            .send_completion(
                "You are a language expert that outputs strict JSON for text analysis.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        Ok(check_writing_from_json(&parsed))
    }

    async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError> {
        let prompt = render_rewrite_prompt(&req);

        let content = self
            .send_completion(
                "You are a writing assistant that outputs strict JSON.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        rewrite_from_json(&parsed)
    }

    async fn evaluate_pronunciation(
        &self,
        req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        if req
            .recognized_text
            .as_deref()
            .unwrap_or("")
            .trim()
            .is_empty()
        {
            return Err(AppError::Provider(
                "Cloudflare Workers AI has no ASR; provide recognized text or use OpenAI/Gemini"
                    .to_string(),
            ));
        }
        let prompt = render_evaluate_pronunciation_prompt(&req);
        let content = self
            .send_completion(
                "You are a pronunciation coach that outputs strict JSON.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        Ok(pronunciation_from_json(&parsed, &req))
    }

    async fn get_articulation_tip(
        &self,
        req: ArticulationTipRequest,
    ) -> Result<ArticulationTipResult, AppError> {
        let prompt = render_articulation_tip_prompt(&req);
        let content = self
            .send_completion(
                "You are an articulatory phonetics tutor that outputs strict JSON.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        Ok(articulation_tip_from_json(&parsed, &req.phoneme))
    }

    async fn generate_exercises(
        &self,
        req: GenerateExercisesRequest,
    ) -> Result<Vec<WritingExerciseRaw>, AppError> {
        let prompt = render_generate_exercises_prompt(&req);

        let content = self
            .send_completion(
                "You are a language tutor that creates practice exercises and outputs strict JSON.",
                &prompt,
            )
            .await?;

        let parsed = extract_json(&content)?;
        Ok(exercises_from_json(&parsed))
    }

    async fn translate_image(
        &self,
        _req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError> {
        Err(AppError::Validation(
            "Cloudflare text models cannot read images (OCR). Choose OpenAI or Gemini in Settings for Image & Photo translation.".into(),
        ))
    }

    async fn translate_document_chunk(
        &self,
        req: TranslateDocChunkRequest,
    ) -> Result<DocChunkTranslationResult, AppError> {
        let prompt = render_translate_document_prompt(&req);
        let content = self
            .send_completion(
                "You are a professional document translator that outputs strict JSON.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        Ok(doc_chunk_from_json(&parsed, &req))
    }

    async fn translate_audio(
        &self,
        _req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError> {
        Err(AppError::Validation(
            "Cloudflare Workers AI cannot transcribe speech. Choose Groq, OpenAI, or Gemini in Settings.".into(),
        ))
    }

    async fn dialogue_turn(
        &self,
        req: DialogueTurnRequest,
    ) -> Result<DialogueTurnResult, AppError> {
        let prompt = render_dialogue_turn_prompt(&req);
        let content = self
            .send_completion(
                "You are a language tutor running role-play dialogue. Output strict JSON only.",
                &prompt,
            )
            .await?;
        let parsed = extract_json(&content)?;
        Ok(dialogue_turn_from_json(&parsed))
    }

    async fn generate_scenario(
        &self,
        req: GenerateScenarioRequest,
    ) -> Result<GeneratedScenario, AppError> {
        let prompt = render_generate_scenario_prompt(&req);
        let content = self
            .send_completion(
                "You design language-learning role-play scenarios. Output strict JSON only.",
                &prompt,
            )
            .await?;
        generated_scenario_from_json(&extract_json(&content)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constructor_trims_credentials_and_sets_default_model() {
        let p = CloudflareProvider::new("  acc-1  ".to_string(), "  tok-1 ".to_string(), None);
        assert_eq!(p.account_id, "acc-1");
        assert_eq!(p.api_token, "tok-1");
        assert_eq!(p.model, "@cf/meta/llama-3.1-8b-instruct");
        assert_eq!(p.provider_name(), "Cloudflare Workers AI");
    }

    #[test]
    fn endpoint_contains_account_and_model() {
        assert_eq!(
            build_endpoint("acc-1", "@cf/meta/llama-3.1-8b-instruct"),
            "https://api.cloudflare.com/client/v4/accounts/acc-1/ai/run/@cf/meta/llama-3.1-8b-instruct"
        );
    }

    #[test]
    fn request_body_contains_messages_and_max_tokens() {
        let body = build_request_body("You are a tutor.", "prompt");
        let system = body["messages"][0]["content"].as_str().unwrap();
        assert!(system.starts_with("You are a tutor."));
        assert!(system.contains("Respond ONLY with valid, clean JSON"));
        assert_eq!(body["messages"][1]["role"], "user");
        assert_eq!(body["messages"][1]["content"], "prompt");
        assert_eq!(body["max_tokens"], 1024);
    }

    #[test]
    fn parse_error_messages_joins_all_messages() {
        let body = r#"{"errors":[{"message":"bad token"},{"message":"rate limited"}]}"#;
        assert_eq!(
            parse_error_messages(body).as_deref(),
            Some("bad token, rate limited")
        );
    }

    #[test]
    fn parse_error_messages_returns_none_for_invalid_or_empty() {
        assert!(parse_error_messages("not json").is_none());
        assert!(parse_error_messages(r#"{"errors":[]}"#).is_none());
        assert!(parse_error_messages(r#"{"errors":[{"code":100}]}"#).is_none());
        assert!(parse_error_messages(r#"{"other":true}"#).is_none());
    }

    #[test]
    fn extract_content_prefers_result_response() {
        let resp = json!({ "result": { "response": "hello" } });
        assert_eq!(extract_content(&resp).unwrap(), "hello");
    }

    #[test]
    fn extract_content_falls_back_to_openai_choices_shape() {
        let resp = json!({ "choices": [{ "message": { "content": "hi" } }] });
        assert_eq!(extract_content(&resp).unwrap(), "hi");
    }

    #[test]
    fn extract_content_errors_on_unexpected_format() {
        let resp = json!({ "result": {} });
        let err = extract_content(&resp).unwrap_err();
        assert!(
            matches!(err, AppError::Provider(ref msg) if msg.contains("Unexpected Cloudflare response format"))
        );
    }
}
