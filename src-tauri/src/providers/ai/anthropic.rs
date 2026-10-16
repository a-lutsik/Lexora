// ============================================================
// LEXORA — Anthropic Claude Provider
// Implements AIProvider using Claude Messages API.
// ============================================================

use super::{
    collocations_from_json, render_collocations_prompt, CollocationsRequest, CollocationsResult,
    generated_scenario_from_json, render_generate_scenario_prompt, GenerateScenarioRequest,
    GeneratedScenario,
    articulation_tip_from_json, check_writing_from_json, dialogue_turn_from_json,
    doc_chunk_from_json, enrich_from_json, evaluation_from_json, exercises_from_json,
    extract_json, gloss_from_json, image_translation_from_json, mnemonic_concepts_from_json,
    mnemonic_rank_from_json, pronunciation_from_json, render_articulation_tip_prompt,
    render_check_writing_prompt, render_dialogue_turn_prompt, render_enrich_prompt,
    render_evaluate_prompt, render_evaluate_pronunciation_prompt, render_explain_prompt,
    render_generate_exercises_prompt, render_mnemonic_concepts_prompt,
    render_mnemonic_rank_prompt, render_rewrite_prompt, render_translate_document_prompt,
    render_translate_image_prompt, render_translate_prompt, rewrite_from_json, AIProvider,
    ArticulationTipRequest, ArticulationTipResult, AudioTranslationResult, CheckWritingRequest,
    CheckWritingResult, DialogueTurnRequest, DialogueTurnResult, DocChunkTranslationResult,
    EnrichRequest, EnrichResult, EvaluatePronunciationRequest, EvaluateRequest, ExplainRequest,
    GenerateExercisesRequest, ImageTranslationResult, MnemonicConceptsRequest,
    MnemonicConceptsResult, MnemonicRankRequest, MnemonicRankResult,
    PronunciationEvaluationResult, RewriteRequest, RewriteResult, TranslateAudioRequest,
    TranslateDocChunkRequest, TranslateImageRequest, TranslateRequest, WritingExerciseRaw,
};
use crate::commands::study::EvaluationResult;
use crate::commands::translate::TranslationResult;
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

pub struct AnthropicProvider {
    api_key: String,
    model: String,
    client: Client,
}

impl AnthropicProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            api_key,
            model: model.unwrap_or_else(|| "claude-sonnet-5".to_string()),
            client: Client::new(),
        }
    }

    async fn send_message(&self, prompt: &str) -> Result<String, AppError> {
        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": self.model,
                "max_tokens": 16000,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            }))
            .send()
            .await
            .map_err(|e| AppError::Provider(format!("Anthropic API request failed: {e}")))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_body = response.text().await.unwrap_or_default();
            return Err(AppError::Provider(format!(
                "Anthropic API error {status}: {error_body}"
            )));
        }

        let json_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::Provider(format!("Failed to parse Anthropic response: {e}")))?;

        let text = json_response["content"][0]["text"]
            .as_str()
            .ok_or_else(|| AppError::Provider("No text in Anthropic response".to_string()))?;

        Ok(text.to_string())
    }

    async fn send_message_with_image(
        &self,
        prompt: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<String, AppError> {
        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": self.model,
                "max_tokens": 16000,
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }]
            }))
            .send()
            .await
            .map_err(|e| AppError::Provider(format!("Anthropic API request failed: {e}")))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_body = response.text().await.unwrap_or_default();
            return Err(AppError::Provider(format!(
                "Anthropic API error {status}: {error_body}"
            )));
        }

        let json_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::Provider(format!("Failed to parse Anthropic response: {e}")))?;

        let text = json_response["content"][0]["text"]
            .as_str()
            .ok_or_else(|| AppError::Provider("No text in Anthropic response".to_string()))?;

        Ok(text.to_string())
    }
}

#[async_trait]
impl AIProvider for AnthropicProvider {
    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        let prompt = render_translate_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(gloss_from_json(&req, &parsed))
    }

    async fn enrich(&self, req: EnrichRequest) -> Result<EnrichResult, AppError> {
        let prompt = render_enrich_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(enrich_from_json(&parsed))
    }

    async fn collocations(
        &self,
        req: CollocationsRequest,
    ) -> Result<CollocationsResult, AppError> {
        let prompt = render_collocations_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        collocations_from_json(&parsed, &req.text)
    }

    async fn mnemonic_concepts(
        &self,
        req: MnemonicConceptsRequest,
    ) -> Result<MnemonicConceptsResult, AppError> {
        let prompt = render_mnemonic_concepts_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        mnemonic_concepts_from_json(&parsed)
    }

    async fn mnemonic_rank(
        &self,
        req: MnemonicRankRequest,
    ) -> Result<MnemonicRankResult, AppError> {
        let prompt = render_mnemonic_rank_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        mnemonic_rank_from_json(&parsed)
    }

    async fn evaluate_answer(&self, req: EvaluateRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_evaluate_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn explain_error(&self, req: ExplainRequest) -> Result<EvaluationResult, AppError> {
        let prompt = render_explain_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(evaluation_from_json(&parsed, &req.target_text))
    }

    async fn check_writing(
        &self,
        req: CheckWritingRequest,
    ) -> Result<CheckWritingResult, AppError> {
        let prompt = render_check_writing_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(check_writing_from_json(&parsed))
    }

    async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError> {
        let prompt = render_rewrite_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        rewrite_from_json(&parsed)
    }

    async fn evaluate_pronunciation(
        &self,
        req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        let prompt = render_evaluate_pronunciation_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(pronunciation_from_json(&parsed, &req))
    }

    async fn get_articulation_tip(
        &self,
        req: ArticulationTipRequest,
    ) -> Result<ArticulationTipResult, AppError> {
        let prompt = render_articulation_tip_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(articulation_tip_from_json(&parsed, &req.phoneme))
    }

    async fn generate_exercises(
        &self,
        req: GenerateExercisesRequest,
    ) -> Result<Vec<WritingExerciseRaw>, AppError> {
        let prompt = render_generate_exercises_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(exercises_from_json(&parsed))
    }

    async fn translate_image(
        &self,
        req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError> {
        let prompt = render_translate_image_prompt(&req);
        let content = self
            .send_message_with_image(&prompt, &req.image_base64, &req.mime_type)
            .await?;
        let parsed = extract_json(&content)?;
        Ok(image_translation_from_json(&parsed, &req))
    }

    async fn translate_document_chunk(
        &self,
        req: TranslateDocChunkRequest,
    ) -> Result<DocChunkTranslationResult, AppError> {
        let prompt = render_translate_document_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(doc_chunk_from_json(&parsed, &req))
    }

    async fn translate_audio(
        &self,
        _req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError> {
        Err(AppError::Provider(
            "Claude does not support native audio processing. Please use OpenAI or Gemini for audio translation.".to_string()
        ))
    }

    async fn dialogue_turn(
        &self,
        req: DialogueTurnRequest,
    ) -> Result<DialogueTurnResult, AppError> {
        let prompt = render_dialogue_turn_prompt(&req);
        let content = self.send_message(&prompt).await?;
        let parsed = extract_json(&content)?;
        Ok(dialogue_turn_from_json(&parsed))
    }

    async fn generate_scenario(
        &self,
        req: GenerateScenarioRequest,
    ) -> Result<GeneratedScenario, AppError> {
        let prompt = render_generate_scenario_prompt(&req);
        let content = self.send_message(&prompt).await?;
        generated_scenario_from_json(&extract_json(&content)?)
    }

    fn provider_name(&self) -> &'static str {
        "Anthropic Claude"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_model_is_claude_sonnet_5() {
        let p = AnthropicProvider::new("key".to_string(), None);
        assert_eq!(p.model, "claude-sonnet-5");
    }

    #[test]
    fn custom_model_overrides_default() {
        let p = AnthropicProvider::new("key".to_string(), Some("claude-opus-5".to_string()));
        assert_eq!(p.model, "claude-opus-5");
    }

    #[test]
    fn provider_name_is_anthropic_claude() {
        let p = AnthropicProvider::new("key".to_string(), None);
        assert_eq!(p.provider_name(), "Anthropic Claude");
    }
}
