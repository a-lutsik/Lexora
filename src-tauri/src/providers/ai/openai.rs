// ============================================================
// LEXORA — OpenAI Provider
// Implements AIProvider using OpenAI chat completions API.
// ============================================================

use super::{
    generated_scenario_from_json, render_generate_scenario_prompt, GenerateScenarioRequest,
    GeneratedScenario,
    articulation_tip_from_json, check_writing_from_json, dialogue_turn_from_json,
    doc_chunk_from_json, enrich_from_json, evaluation_from_json, exercises_from_json, extract_json,
    gloss_from_json, image_translation_from_json, mnemonic_concepts_from_json,
    mnemonic_rank_from_json, pronunciation_from_json, render_articulation_tip_prompt,
    render_check_writing_prompt, render_dialogue_turn_prompt, render_enrich_prompt,
    render_evaluate_prompt, render_evaluate_pronunciation_prompt, render_explain_prompt,
    render_generate_exercises_prompt, render_mnemonic_concepts_prompt, render_mnemonic_rank_prompt,
    render_rewrite_prompt, render_translate_document_prompt, render_translate_image_prompt,
    render_translate_prompt, rewrite_from_json, AIProvider, ArticulationTipRequest,
    ArticulationTipResult, AudioTranslationResult, CheckWritingRequest, CheckWritingResult,
    DialogueTurnRequest, DialogueTurnResult, DocChunkTranslationResult, EnrichRequest,
    EnrichResult, EvaluatePronunciationRequest, EvaluateRequest, ExplainRequest,
    GenerateExercisesRequest, ImageTranslationResult, MnemonicConceptsRequest,
    MnemonicConceptsResult, MnemonicRankRequest, MnemonicRankResult, PronunciationEvaluationResult,
    RewriteRequest, RewriteResult, TranscribeAudioRequest, TranscriptionResult, TranslateAudioRequest, TranslateDocChunkRequest,
    TranslateImageRequest, TranslateRequest, WritingExerciseRaw,
};
use crate::commands::study::EvaluationResult;
use crate::commands::translate::TranslationResult;
use crate::error::AppError;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

const API_URL: &str = "https://api.openai.com/v1/chat/completions";

fn audio_filename_for_mime(mime: &str) -> &'static str {
    match mime {
        "audio/wav" | "audio/x-wav" | "audio/wave" => "recording.wav",
        "audio/mp4" | "audio/m4a" | "audio/x-m4a" => "recording.m4a",
        "audio/mpeg" | "audio/mp3" => "recording.mp3",
        "audio/ogg" | "audio/ogg;codecs=opus" => "recording.ogg",
        _ => "recording.webm",
    }
}

/// Build the chat-completions request body (pure — no network).
fn build_request_body(model: &str, system_prompt: &str, user_prompt: &str) -> serde_json::Value {
    json!({
        "model": model,
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_prompt }
        ],
        "temperature": 0.3
    })
}

/// Extract message content from an OpenAI chat-completions response (pure — no network).
fn extract_content(json_resp: &serde_json::Value) -> Result<String, AppError> {
    json_resp["choices"][0]["message"]["content"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| AppError::Provider("Empty response from OpenAI".to_string()))
}

pub struct OpenAIProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl OpenAIProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            model: model.unwrap_or_else(|| "gpt-4o-mini".to_string()),
        }
    }

    async fn send_completion(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<String, AppError> {
        use super::rate_limit::{
            check_response_rate_limit, RateLimitOutcome, RATE_LIMIT_MAX_RETRIES,
        };

        let body = build_request_body(&self.model, system_prompt, user_prompt);
        let mut attempt = 0u32;
        loop {
            let resp = self
                .client
                .post(API_URL)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .json(&body)
                .send()
                .await
                .map_err(|e| AppError::Http(e.to_string()))?;

            match check_response_rate_limit("OpenAI", resp, attempt).await {
                RateLimitOutcome::Ok(resp) => {
                    let json_resp: serde_json::Value = resp
                        .json()
                        .await
                        .map_err(|e| AppError::Serialization(e.to_string()))?;
                    return extract_content(&json_resp);
                }
                RateLimitOutcome::Retry => {
                    attempt += 1;
                    if attempt > RATE_LIMIT_MAX_RETRIES {
                        return Err(super::rate_limit::rate_limit_error("OpenAI"));
                    }
                }
                RateLimitOutcome::Err(e) => return Err(e),
            }
        }
    }

    /// Dedicated speech model: the configured one when it can transcribe,
    /// otherwise `gpt-transcribe` (whisper-1 shuts down 2027-02-26).
    fn transcription_model(&self) -> &str {
        let model = self.model.as_str();
        if model.contains("transcribe") || model.starts_with("whisper") {
            model
        } else {
            "gpt-transcribe"
        }
    }

    async fn transcribe_file(
        &self,
        path: &str,
        language: &str,
        prompt: Option<&str>,
    ) -> Result<String, AppError> {
        let path = std::path::Path::new(path);
        if !path.is_file() {
            return Err(AppError::NotFound(format!(
                "Audio file not found: {}",
                path.display()
            )));
        }
        let bytes = std::fs::read(path)?;
        let mime = crate::pronunciation::audio_cache::mime_from_path(path);
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("recording.webm");
        self.transcribe_bytes(bytes, mime, filename, Some(language), prompt)
            .await
    }

    async fn transcribe_bytes(
        &self,
        bytes: Vec<u8>,
        mime: &str,
        filename: &str,
        language: Option<&str>,
        prompt: Option<&str>,
    ) -> Result<String, AppError> {
        if bytes.is_empty() {
            return Err(AppError::Validation("Audio file is empty".to_string()));
        }
        let mime = mime.split(';').next().unwrap_or(mime).trim();
        let part = reqwest::multipart::Part::bytes(bytes)
            .file_name(filename.to_string())
            .mime_str(mime)
            .map_err(|e| AppError::Validation(e.to_string()))?;
        let mut form = reqwest::multipart::Form::new()
            .part("file", part)
            .text("model", self.transcription_model().to_string())
            .text("response_format", "json");
        // Whisper hallucinates stock phrases ("Thank you.") on short/quiet
        // clips — a context hint anchors it to the drill's target phrase.
        if let Some(hint) = prompt.filter(|p| !p.trim().is_empty()) {
            form = form.text("prompt", hint.to_string());
        }
        let form = match language {
            Some(lang) => {
                let code = lang.chars().take(2).collect::<String>().to_lowercase();
                if code.len() == 2 && code != "au" {
                    form.text("language", code)
                } else {
                    form
                }
            }
            None => form,
        };

        let resp = self
            .client
            .post("https://api.openai.com/v1/audio/transcriptions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        use super::rate_limit::{
            check_response_rate_limit, RateLimitOutcome, RATE_LIMIT_MAX_RETRIES,
        };
        let resp =
            match check_response_rate_limit("OpenAI Whisper", resp, RATE_LIMIT_MAX_RETRIES).await {
                RateLimitOutcome::Ok(r) => r,
                RateLimitOutcome::Retry => {
                    return Err(super::rate_limit::rate_limit_error("OpenAI Whisper"));
                }
                RateLimitOutcome::Err(e) => return Err(e),
            };

        let json_resp: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Serialization(e.to_string()))?;
        json_resp["text"]
            .as_str()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| AppError::Provider("Empty transcription from Whisper".to_string()))
    }
}

#[async_trait]
impl AIProvider for OpenAIProvider {
    fn provider_name(&self) -> &'static str {
        "OpenAI"
    }

    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        let prompt = render_translate_prompt(&req);

        let content = self
            .send_completion(
                "You are a translation assistant that outputs strict JSON.",
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
                "You are an educational evaluator that outputs strict JSON.",
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
                "You are a language tutor that outputs strict JSON.",
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
        mut req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        if req
            .recognized_text
            .as_deref()
            .unwrap_or("")
            .trim()
            .is_empty()
        {
            if let Some(path) = req.audio_path.clone() {
                let hint = format!("Pronunciation practice of \"{}\".", req.target_text);
                req.recognized_text = Some(
                    self.transcribe_file(&path, &req.language, Some(&hint))
                        .await?,
                );
            } else {
                return Err(AppError::Validation(
                    "Audio recording or recognized text is required".to_string(),
                ));
            }
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
        req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError> {
        let prompt = render_translate_image_prompt(&req);
        let image_url = format!("data:{};base64,{}", req.mime_type, req.image_base64);

        let body = json!({
            "model": if self.model == "gpt-3.5-turbo" { "gpt-4o-mini" } else { &self.model },
            "response_format": { "type": "json_object" },
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise multilingual OCR and image translation expert."
                },
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": prompt },
                        {
                            "type": "image_url",
                            "image_url": { "url": image_url }
                        }
                    ]
                }
            ],
            "temperature": 0.2
        });

        let resp = self
            .client
            .post(API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Provider(format!("OpenAI vision request failed: {e}")))?;

        use super::rate_limit::{
            check_response_rate_limit, http_provider_error, RateLimitOutcome,
            RATE_LIMIT_MAX_RETRIES,
        };
        let resp = match check_response_rate_limit("OpenAI", resp, RATE_LIMIT_MAX_RETRIES).await {
            RateLimitOutcome::Ok(r) => r,
            RateLimitOutcome::Retry => {
                return Err(super::rate_limit::rate_limit_error("OpenAI"));
            }
            RateLimitOutcome::Err(e) => return Err(e),
        };

        let status = resp.status();
        let json_resp: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::Provider(format!("Failed to parse OpenAI response: {e}")))?;

        if !status.is_success() {
            let msg = json_resp["error"]["message"].as_str().unwrap_or("");
            return Err(http_provider_error(
                "OpenAI",
                status,
                if msg.is_empty() { "Unknown error" } else { msg },
            ));
        }

        let content = extract_content(&json_resp)?;
        let parsed = extract_json(&content)?;
        Ok(image_translation_from_json(&parsed, &req))
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
        req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError> {
        let bytes = crate::pronunciation::audio_cache::decode_audio_payload(&req.audio_base64)?;
        let mime = req
            .mime_type
            .split(';')
            .next()
            .unwrap_or("audio/webm")
            .trim();
        let filename = audio_filename_for_mime(mime);
        let whisper_lang = req
            .source_language
            .as_deref()
            .filter(|lang| lang.len() == 2);
        let transcript = self
            .transcribe_bytes(bytes, mime, filename, whisper_lang, None)
            .await?;

        let gloss = self
            .translate(TranslateRequest {
                text: transcript.clone(),
                source_language: req.source_language.clone(),
                target_language: req.target_language.clone(),
                context_sentence: None,
                lexical_domain: req.lexical_domain.clone(),
            })
            .await?;

        Ok(AudioTranslationResult {
            source_language: gloss.source_language,
            target_language: gloss.target_language,
            transcribed_text: transcript,
            translated_text: gloss.main_translation,
            segments: Vec::new(),
            detected_lexical_domain: gloss.detected_lexical_domain,
            requested_lexical_domain: gloss.requested_lexical_domain,
        })
    }

    async fn transcribe_audio(
        &self,
        req: TranscribeAudioRequest,
    ) -> Result<TranscriptionResult, AppError> {
        let bytes = crate::pronunciation::audio_cache::decode_audio_payload(&req.audio_base64)?;
        let mime = req
            .mime_type
            .split(';')
            .next()
            .unwrap_or("audio/wav")
            .trim()
            .to_string();
        let filename = audio_filename_for_mime(&mime);
        let language = req.language.as_deref().filter(|lang| lang.len() == 2);
        let text = self
            .transcribe_bytes(bytes, &mime, filename, language, req.prompt.as_deref())
            .await?;
        Ok(TranscriptionResult {
            text,
            language: req.language.clone(),
        })
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
    fn default_model_is_gpt_4o_mini() {
        let p = OpenAIProvider::new("key".to_string(), None);
        assert_eq!(p.model, "gpt-4o-mini");
    }

    #[test]
    fn custom_model_overrides_default() {
        let p = OpenAIProvider::new("key".to_string(), Some("gpt-4o".to_string()));
        assert_eq!(p.model, "gpt-4o");
    }

    #[test]
    fn provider_name_is_openai() {
        let p = OpenAIProvider::new("key".to_string(), None);
        assert_eq!(p.provider_name(), "OpenAI");
    }

    #[test]
    fn request_body_contains_model_messages_and_json_format() {
        let body = build_request_body("gpt-4o-mini", "sys", "user");
        assert_eq!(body["model"], "gpt-4o-mini");
        assert_eq!(body["response_format"]["type"], "json_object");
        assert_eq!(body["messages"][0]["role"], "system");
        assert_eq!(body["messages"][0]["content"], "sys");
        assert_eq!(body["messages"][1]["role"], "user");
        assert_eq!(body["messages"][1]["content"], "user");
        assert_eq!(body["temperature"], json!(0.3));
    }

    #[test]
    fn extract_content_reads_first_choice_message() {
        let resp = json!({
            "choices": [{ "message": { "content": "{\"ok\":true}" } }]
        });
        assert_eq!(extract_content(&resp).unwrap(), "{\"ok\":true}");
    }

    #[test]
    fn extract_content_errors_on_missing_choices() {
        let resp = json!({ "choices": [] });
        let err = extract_content(&resp).unwrap_err();
        assert!(matches!(err, AppError::Provider(_)));
    }

    #[test]
    fn extract_content_errors_on_non_string_content() {
        let resp = json!({ "choices": [{ "message": { "content": 42 } }] });
        assert!(extract_content(&resp).is_err());
    }

    #[test]
    fn api_url_is_openai_chat_completions() {
        assert_eq!(API_URL, "https://api.openai.com/v1/chat/completions");
    }

    #[test]
    fn audio_filename_matches_common_mime_types() {
        assert_eq!(audio_filename_for_mime("audio/wav"), "recording.wav");
        assert_eq!(audio_filename_for_mime("audio/webm"), "recording.webm");
        assert_eq!(audio_filename_for_mime("audio/mpeg"), "recording.mp3");
    }
}
