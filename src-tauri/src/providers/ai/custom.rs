// ============================================================
// LEXORA — Custom OpenAI-Compatible Provider
// Works with Groq, OpenRouter, Ollama, LM Studio, Together, etc.
// ============================================================

use super::{
    articulation_tip_from_json, check_writing_from_json, dialogue_turn_from_json,
    doc_chunk_from_json, enrich_from_json, evaluation_from_json, exercises_from_json, extract_json,
    gloss_from_json, image_translation_from_json, mnemonic_concepts_from_json,
    mnemonic_rank_from_json, pronunciation_from_json, render_articulation_tip_prompt,
    render_check_writing_prompt, render_dialogue_turn_prompt, render_enrich_prompt,
    render_evaluate_prompt, render_evaluate_pronunciation_prompt, render_explain_prompt,
    render_generate_exercises_prompt, render_mnemonic_concepts_prompt, render_mnemonic_rank_prompt,
    render_rewrite_prompt, render_translate_document_prompt, render_translate_image_prompt,
    render_translate_prompt, render_translate_audio_prompt, render_transcribe_audio_prompt,
    rewrite_from_json, transcription_from_json, audio_translation_from_json, AIProvider, ArticulationTipRequest,
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

/// Resolve the chat-completions endpoint from a base URL (pure — no network).
fn build_endpoint(base_url: &str) -> String {
    if base_url.ends_with("/chat/completions") {
        base_url.to_string()
    } else {
        format!("{base_url}/chat/completions")
    }
}

fn transcriptions_endpoint(base_url: &str) -> String {
    let base = base_url
        .trim_end_matches('/')
        .trim_end_matches("/chat/completions");
    format!("{base}/audio/transcriptions")
}

fn supports_audio_transcription(base_url: &str, provider_title: &str) -> bool {
    let url = base_url.to_ascii_lowercase();
    url.contains("groq.com")
        || url.contains("api.openai.com")
        || provider_title.eq_ignore_ascii_case("Groq")
}

fn whisper_model_for(base_url: &str) -> &'static str {
    if base_url.to_ascii_lowercase().contains("groq.com") {
        "whisper-large-v3-turbo"
    } else {
        "whisper-1"
    }
}

/// OpenRouter `input_audio.format` for a MIME type (pure — no network).
fn input_audio_format(mime: &str) -> String {
    let base = mime
        .split(';')
        .next()
        .unwrap_or(mime)
        .trim()
        .to_ascii_lowercase();
    match base.as_str() {
        "audio/wav" | "audio/x-wav" | "audio/wave" => "wav".to_string(),
        "audio/mpeg" | "audio/mp3" => "mp3".to_string(),
        "audio/mp4" | "audio/m4a" | "audio/x-m4a" => "m4a".to_string(),
        "audio/x-aiff" | "audio/aiff" => "aiff".to_string(),
        other => other
            .strip_prefix("audio/")
            .filter(|s| !s.is_empty())
            .unwrap_or("wav")
            .to_string(),
    }
}

/// Chat-completions body with an `input_audio` part (pure — no network).
fn build_audio_request_body(
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    audio_b64: &str,
    mime: &str,
) -> serde_json::Value {
    json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system_prompt },
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": user_prompt },
                    {
                        "type": "input_audio",
                        "input_audio": { "data": audio_b64, "format": input_audio_format(mime) }
                    }
                ]
            }
        ],
        "temperature": 0.1
    })
}

/// Build the OpenAI-compatible request body (pure — no network).
fn build_request_body(model: &str, system_prompt: &str, user_prompt: &str) -> serde_json::Value {
    json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": format!("{system_prompt} Respond ONLY with a valid, raw JSON object. Do not include introductory text, explanations, or codeblock formatting outside the JSON.")
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "temperature": 0.2
    })
}

/// Extract message content from an OpenAI-compatible response (pure — no network).
fn extract_content(
    json_resp: &serde_json::Value,
    provider_title: &str,
) -> Result<String, AppError> {
    json_resp["choices"][0]["message"]["content"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| {
            AppError::Provider(format!(
                "{provider_title}: empty message content in response"
            ))
        })
}

pub struct CustomOpenAIProvider {
    client: Client,
    base_url: String,
    api_key: Option<String>,
    model: String,
    provider_title: String,
}

impl CustomOpenAIProvider {
    pub fn new(
        base_url: Option<String>,
        api_key: Option<String>,
        model: Option<String>,
        provider_title: Option<String>,
    ) -> Self {
        let clean_base = base_url
            .unwrap_or_else(|| "https://openrouter.ai/api/v1".to_string())
            .trim_end_matches('/')
            .to_string();

        Self {
            client: Client::new(),
            base_url: clean_base,
            api_key: api_key.filter(|k| !k.trim().is_empty()),
            model: model.unwrap_or_else(|| "meta-llama/llama-3.3-70b-instruct:free".to_string()),
            provider_title: provider_title.unwrap_or_else(|| "Custom AI".to_string()),
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

        let endpoint = build_endpoint(&self.base_url);
        let body = build_request_body(&self.model, system_prompt, user_prompt);
        let mut attempt = 0u32;

        loop {
            let mut req = self.client.post(&endpoint).json(&body);

            if let Some(key) = &self.api_key {
                req = req.header("Authorization", format!("Bearer {key}"));
            }

            // Add OpenRouter specific headers if targeting openrouter
            if self.base_url.contains("openrouter.ai") {
                req = req
                    .header("HTTP-Referer", "https://lexora.app")
                    .header("X-Title", "Lexora AI Language Assistant");
            }

            let resp = req.send().await.map_err(|e| {
                AppError::Http(format!("{}: connection error - {}", self.provider_title, e))
            })?;

            match check_response_rate_limit(&self.provider_title, resp, attempt).await {
                RateLimitOutcome::Ok(resp) => {
                    let json_resp: serde_json::Value = resp.json().await.map_err(|e| {
                        AppError::Serialization(format!(
                            "{}: invalid response format - {}",
                            self.provider_title, e
                        ))
                    })?;
                    return extract_content(&json_resp, &self.provider_title);
                }
                RateLimitOutcome::Retry => {
                    attempt += 1;
                    if attempt > RATE_LIMIT_MAX_RETRIES {
                        return Err(super::rate_limit::rate_limit_error(&self.provider_title));
                    }
                }
                RateLimitOutcome::Err(e) => return Err(e),
            }
        }
    }

    /// Whisper model: the configured one when it is a Whisper model, else the host default.
    fn whisper_model(&self) -> String {
        if self.model.starts_with("whisper") {
            self.model.clone()
        } else {
            whisper_model_for(&self.base_url).to_string()
        }
    }

    fn is_openrouter(&self) -> bool {
        self.base_url.contains("openrouter.ai")
    }

    /// POST a prebuilt chat-completions body and return the message text.
    async fn send_body(&self, body: &serde_json::Value) -> Result<String, AppError> {
        use super::rate_limit::{check_response_rate_limit, RateLimitOutcome, RATE_LIMIT_MAX_RETRIES};

        let mut request = self.client.post(build_endpoint(&self.base_url)).json(body);
        if let Some(ref key) = self.api_key {
            request = request.header("Authorization", format!("Bearer {key}"));
        }
        if self.is_openrouter() {
            request = request
                .header("HTTP-Referer", "https://lexora.app")
                .header("X-Title", "Lexora AI Language Assistant");
        }
        let resp = request.send().await.map_err(|e| {
            AppError::Http(format!("{}: connection error - {}", self.provider_title, e.without_url()))
        })?;
        let resp = match check_response_rate_limit(&self.provider_title, resp, RATE_LIMIT_MAX_RETRIES).await {
            RateLimitOutcome::Ok(resp) => resp,
            RateLimitOutcome::Retry => return Err(super::rate_limit::rate_limit_error(&self.provider_title)),
            RateLimitOutcome::Err(e) => return Err(e),
        };
        let json_resp: serde_json::Value = resp.json().await.map_err(|e| {
            AppError::Serialization(format!("{}: invalid response format - {}", self.provider_title, e.without_url()))
        })?;
        extract_content(&json_resp, &self.provider_title)
    }

    async fn whisper_transcribe(
        &self,
        bytes: Vec<u8>,
        mime: &str,
        language: Option<&str>,
        prompt: Option<&str>,
    ) -> Result<String, AppError> {
        if bytes.is_empty() {
            return Err(AppError::Validation("Audio file is empty".to_string()));
        }
        let mime = mime.split(';').next().unwrap_or(mime).trim();
        let ext = crate::pronunciation::audio_cache::extension_for_mime(mime);
        let filename = format!("recording.{ext}");
        let part = reqwest::multipart::Part::bytes(bytes)
            .file_name(filename)
            .mime_str(mime)
            .map_err(|e| AppError::Validation(e.to_string()))?;
        let mut form = reqwest::multipart::Form::new()
            .part("file", part)
            .text("model", self.whisper_model())
            .text("response_format", "json");
        // Whisper hallucinates stock phrases ("Thank you.") on short/quiet
        // clips — a context hint anchors it to the drill's target phrase.
        if let Some(hint) = prompt.filter(|p| !p.trim().is_empty()) {
            form = form.text("prompt", hint.to_string());
        }
        let form = match language.filter(|lang| lang.len() == 2) {
            Some(lang) => form.text("language", lang.to_string()),
            None => form,
        };

        let mut req = self
            .client
            .post(transcriptions_endpoint(&self.base_url))
            .multipart(form);
        if let Some(key) = &self.api_key {
            req = req.header("Authorization", format!("Bearer {key}"));
        }

        let resp = req.send().await.map_err(|e| {
            AppError::Http(format!(
                "{}: transcription connection error - {e}",
                self.provider_title
            ))
        })?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(AppError::Provider(format!(
                "{} Whisper error {status}: {err_text}",
                self.provider_title
            )));
        }

        let json_resp: serde_json::Value = resp.json().await.map_err(|e| {
            AppError::Serialization(format!(
                "{}: invalid transcription response - {e}",
                self.provider_title
            ))
        })?;
        json_resp["text"]
            .as_str()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| {
                AppError::Provider(format!("{}: empty transcription", self.provider_title))
            })
    }
}

#[async_trait]
impl AIProvider for CustomOpenAIProvider {
    fn provider_name(&self) -> &'static str {
        "Custom OpenAI"
    }

    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        let prompt = render_translate_prompt(&req);

        let content = self
            .send_completion(
                "You are an expert language dictionary and translation assistant.",
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
        mut req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        if req
            .recognized_text
            .as_deref()
            .unwrap_or("")
            .trim()
            .is_empty()
        {
            let can_transcribe = supports_audio_transcription(&self.base_url, &self.provider_title);
            match (can_transcribe, req.audio_path.clone()) {
                (true, Some(path)) => {
                    let path = std::path::Path::new(&path);
                    let bytes = std::fs::read(path)?;
                    let mime = crate::pronunciation::audio_cache::mime_from_path(path);
                    let hint = format!("Pronunciation practice of \"{}\".", req.target_text);
                    req.recognized_text = Some(
                        self.whisper_transcribe(bytes, mime, Some(&req.language), Some(&hint))
                            .await?,
                    );
                }
                _ => {
                    return Err(AppError::Provider(
                        "This provider has no ASR; provide recognized text or use OpenAI/Gemini"
                            .to_string(),
                    ));
                }
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
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise multilingual OCR and image translation expert. Output ONLY strict JSON."
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

        let endpoint = build_endpoint(&self.base_url);
        let mut request = self.client.post(&endpoint).json(&body);
        if let Some(ref key) = self.api_key {
            request = request.header("Authorization", format!("Bearer {key}"));
        }

        let resp = request.send().await.map_err(|e| {
            AppError::Provider(format!(
                "{}: vision request failed: {e}",
                self.provider_title
            ))
        })?;

        let status = resp.status();
        let json_resp: serde_json::Value = resp.json().await.map_err(|e| {
            AppError::Provider(format!(
                "{}: failed to parse response JSON: {e}",
                self.provider_title
            ))
        })?;

        if !status.is_success() {
            let msg = json_resp["error"]["message"]
                .as_str()
                .unwrap_or("Unknown error");
            return Err(AppError::Provider(format!(
                "{}: HTTP {status}: {msg}",
                self.provider_title
            )));
        }

        let content = extract_content(&json_resp, &self.provider_title)?;
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
        if self.is_openrouter() {
            // Audio-capable OpenRouter models take `input_audio` in chat completions.
            let body = build_audio_request_body(
                &self.model,
                "You are an expert multilingual speech-to-text and audio translation system. Output strict JSON only.",
                &render_translate_audio_prompt(&req),
                &req.audio_base64,
                &req.mime_type,
            );
            let content = self.send_body(&body).await?;
            let parsed = extract_json(&content)?;
            return Ok(audio_translation_from_json(&parsed, &req));
        }
        if !supports_audio_transcription(&self.base_url, &self.provider_title) {
            return Err(AppError::Validation(format!(
                "{} cannot transcribe speech. Choose Groq, OpenAI, or Gemini in Settings.",
                self.provider_title
            )));
        }

        let bytes = crate::pronunciation::audio_cache::decode_audio_payload(&req.audio_base64)?;
        let mime = req
            .mime_type
            .split(';')
            .next()
            .unwrap_or("audio/wav")
            .trim();
        let transcript = self
            .whisper_transcribe(bytes, mime, req.source_language.as_deref(), None)
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
        if self.is_openrouter() {
            let body = build_audio_request_body(
                &self.model,
                "You are a precise speech recognition system. Output strict JSON only.",
                &render_transcribe_audio_prompt(&req),
                &req.audio_base64,
                &req.mime_type,
            );
            let content = self.send_body(&body).await?;
            let parsed = extract_json(&content)?;
            return transcription_from_json(&parsed, &req);
        }
        if !supports_audio_transcription(&self.base_url, &self.provider_title) {
            return Err(AppError::Validation(format!(
                "{} cannot transcribe speech. Choose Groq, OpenAI, or Gemini in Settings.",
                self.provider_title
            )));
        }
        let bytes = crate::pronunciation::audio_cache::decode_audio_payload(&req.audio_base64)?;
        let mime = req
            .mime_type
            .split(';')
            .next()
            .unwrap_or("audio/wav")
            .trim()
            .to_string();
        let text = self
            .whisper_transcribe(bytes, &mime, req.language.as_deref(), req.prompt.as_deref())
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn input_audio_format_maps_common_mime_types() {
        assert_eq!(input_audio_format("audio/wav"), "wav");
        assert_eq!(input_audio_format("audio/mp4"), "m4a");
        assert_eq!(input_audio_format("audio/mpeg"), "mp3");
        assert_eq!(input_audio_format("audio/ogg;codecs=opus"), "ogg");
        assert_eq!(input_audio_format(""), "wav");
    }

    #[test]
    fn audio_body_carries_input_audio_part() {
        let body = build_audio_request_body("google/gemini-3.6-flash", "sys", "user", "QUJD", "audio/wav");
        let part = &body["messages"][1]["content"][1];
        assert_eq!(part["type"], "input_audio");
        assert_eq!(part["input_audio"]["data"], "QUJD");
        assert_eq!(part["input_audio"]["format"], "wav");
        assert_eq!(body["model"], "google/gemini-3.6-flash");
    }

    #[test]
    fn default_base_url_is_openrouter() {
        let p = CustomOpenAIProvider::new(None, None, None, None);
        assert_eq!(p.base_url, "https://openrouter.ai/api/v1");
        assert_eq!(p.model, "meta-llama/llama-3.3-70b-instruct:free");
        assert_eq!(p.provider_title, "Custom AI");
        assert_eq!(p.provider_name(), "Custom OpenAI");
    }

    #[test]
    fn base_url_trailing_slashes_are_trimmed() {
        let p = CustomOpenAIProvider::new(
            Some("http://localhost:11434/v1/".to_string()),
            None,
            None,
            None,
        );
        assert_eq!(p.base_url, "http://localhost:11434/v1");
    }

    #[test]
    fn empty_api_key_becomes_none() {
        let p = CustomOpenAIProvider::new(None, Some("   ".to_string()), None, None);
        assert!(p.api_key.is_none());

        let p = CustomOpenAIProvider::new(None, Some("real-key".to_string()), None, None);
        assert_eq!(p.api_key.as_deref(), Some("real-key"));
    }

    #[test]
    fn endpoint_appends_chat_completions_to_base() {
        assert_eq!(
            build_endpoint("http://localhost:11434/v1"),
            "http://localhost:11434/v1/chat/completions"
        );
    }

    #[test]
    fn endpoint_not_duplicated_when_already_present() {
        assert_eq!(
            build_endpoint("http://host/v1/chat/completions"),
            "http://host/v1/chat/completions"
        );
    }

    #[test]
    fn transcriptions_endpoint_strips_chat_suffix() {
        assert_eq!(
            transcriptions_endpoint("https://api.groq.com/openai/v1"),
            "https://api.groq.com/openai/v1/audio/transcriptions"
        );
        assert_eq!(
            transcriptions_endpoint("https://api.groq.com/openai/v1/chat/completions"),
            "https://api.groq.com/openai/v1/audio/transcriptions"
        );
    }

    #[test]
    fn groq_uses_whisper_turbo() {
        assert_eq!(
            whisper_model_for("https://api.groq.com/openai/v1"),
            "whisper-large-v3-turbo"
        );
        assert!(supports_audio_transcription(
            "https://api.groq.com/openai/v1",
            "Groq"
        ));
        assert!(!supports_audio_transcription(
            "https://openrouter.ai/api/v1",
            "OpenRouter"
        ));
    }

    #[test]
    fn request_body_contains_model_and_json_instruction() {
        let body = build_request_body("llama-3", "You are a tutor.", "prompt");
        assert_eq!(body["model"], "llama-3");
        let system = body["messages"][0]["content"].as_str().unwrap();
        assert!(system.starts_with("You are a tutor."));
        assert!(system.contains("Respond ONLY with a valid, raw JSON object"));
        assert_eq!(body["messages"][1]["role"], "user");
        assert_eq!(body["messages"][1]["content"], "prompt");
        assert_eq!(body["temperature"], json!(0.2));
    }

    #[test]
    fn extract_content_reads_first_choice_message() {
        let resp = json!({ "choices": [{ "message": { "content": "{}" } }] });
        assert_eq!(extract_content(&resp, "Groq").unwrap(), "{}");
    }

    #[test]
    fn extract_content_error_mentions_provider_title() {
        let resp = json!({ "choices": [] });
        let err = extract_content(&resp, "Groq").unwrap_err();
        assert!(matches!(err, AppError::Provider(ref msg) if msg.contains("Groq")));
    }
}
