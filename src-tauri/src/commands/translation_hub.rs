// ============================================================
// LEXORA — Translation Hub IPC Commands
// Stage 4: Multimodal translation commands for Text, Image/OCR,
// Document parsing & Audio/Speech translation.
// ============================================================

use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::translation_hub::{TranslationHistoryDto, TranslationHubRepo};
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{
    AudioTranslationResult, DocChunkTranslationResult, ImageTranslationResult, ProviderRegistry,
    TranscribeAudioRequest, TranscriptionResult, TranslateAudioRequest, TranslateDocChunkRequest,
    TranslateImageRequest, TranslateRequest,
};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::{primary_target, registry_for_role};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, State};

fn hub_registry(
    app: &AppHandle,
    db: &Arc<DbPool>,
    role: ModelRole,
) -> Result<ProviderRegistry, AppError> {
    let settings = {
        let conn = db.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected(role.label_en()));
    }
    registry_for_role(app, db, &settings, role).map_err(|e| {
        log::warn!("No AI model configured for {}: {e}", role.as_str());
        e
    })
}

/// Recorded speech → transcript (+ translation). Native audio models (Gemini,
/// audio models on OpenRouter) do both in one call; ASR-only models
/// (Whisper / gpt-transcribe) transcribe and the text role translates.
async fn translate_speech(
    app: &AppHandle,
    db: &Arc<DbPool>,
    req: TranslateAudioRequest,
) -> Result<AudioTranslationResult, AppError> {
    let settings = {
        let conn = db.get()?;
        SettingsRepo::get(&conn).unwrap_or_default()
    };
    let speech = hub_registry(app, db, ModelRole::SpeechToText)?;
    let native = primary_target(db, &settings, ModelRole::SpeechToText)?
        .is_some_and(|t| matches!(t.provider.as_str(), "gemini" | "openrouter"));
    if native {
        return speech.translate_audio(req).await;
    }

    let transcript = speech
        .transcribe_audio(TranscribeAudioRequest {
            audio_base64: req.audio_base64.clone(),
            mime_type: req.mime_type.clone(),
            language: req.source_language.clone(),
            prompt: None,
        })
        .await?;
    let text = hub_registry(app, db, ModelRole::TextQuality)?;
    let translated = text
        .translate_document_chunk(TranslateDocChunkRequest {
            doc_name: "speech".to_string(),
            source_language: transcript.language.clone().or(req.source_language.clone()),
            target_language: req.target_language.clone(),
            content: transcript.text.clone(),
            tone: None,
            glossary: None,
            lexical_domain: req.lexical_domain.clone(),
        })
        .await?;
    Ok(AudioTranslationResult {
        source_language: transcript
            .language
            .or(req.source_language)
            .unwrap_or_else(|| translated.source_language.clone()),
        target_language: req.target_language,
        transcribed_text: transcript.text,
        translated_text: translated.translated_content,
        segments: Vec::new(),
        detected_lexical_domain: translated.detected_lexical_domain,
        requested_lexical_domain: translated.requested_lexical_domain,
    })
}

fn normalize_image_mime(mime: &str) -> String {
    let trimmed = mime
        .split(';')
        .next()
        .unwrap_or(mime)
        .trim()
        .to_ascii_lowercase();
    match trimmed.as_str() {
        "image/png" | "image/jpeg" | "image/jpg" | "image/webp" | "image/gif" => {
            if trimmed == "image/jpg" {
                "image/jpeg".to_string()
            } else {
                trimmed
            }
        }
        _ => "image/png".to_string(),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextHubTranslationResponse {
    pub translation: crate::commands::translate::TranslationResult,
    pub history_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageHubTranslationResponse {
    pub result: ImageTranslationResult,
    pub history_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioHubTranslationResponse {
    pub result: AudioTranslationResult,
    pub history_id: Option<i64>,
}

#[tauri::command]
pub async fn translate_text_hub(
    req: TranslateRequest,
    save_history: Option<bool>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<TextHubTranslationResponse, AppError> {
    if req.text.trim().is_empty() {
        return Err(AppError::Validation(
            "Text to translate cannot be empty".into(),
        ));
    }

    let providers = hub_registry(&app, db.inner(), ModelRole::TextQuality)?;
    let translation = providers.translate(req.clone()).await?;

    let history_id = if save_history.unwrap_or(true) {
        let conn = db.get()?;
        let id = TranslationHubRepo::create_entry(
            &conn,
            "text",
            &translation.source_language,
            &translation.target_language,
            &translation.text,
            &translation.main_translation,
            None,
        )?;
        Some(id)
    } else {
        None
    };

    Ok(TextHubTranslationResponse {
        translation,
        history_id,
    })
}

#[tauri::command]
pub async fn translate_image_hub(
    req: TranslateImageRequest,
    save_history: Option<bool>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<ImageHubTranslationResponse, AppError> {
    if req.image_base64.trim().is_empty() {
        return Err(AppError::Validation("Image data cannot be empty".into()));
    }

    let mut req = req;
    req.mime_type = normalize_image_mime(&req.mime_type);
    req.image_base64 = req.image_base64.split_whitespace().collect::<String>();

    let providers = hub_registry(&app, db.inner(), ModelRole::Vision)?;
    let result = providers.translate_image(req.clone()).await?;

    let history_id = if save_history.unwrap_or(true) {
        let conn = db.get()?;
        let metadata_json = serde_json::to_string(&result.blocks).ok();
        let orig_text = result
            .blocks
            .iter()
            .map(|b| b.original_text.as_str())
            .collect::<Vec<_>>()
            .join(" ");

        let id = TranslationHubRepo::create_entry(
            &conn,
            "image",
            &result.source_language,
            &result.target_language,
            if orig_text.is_empty() {
                "Image text"
            } else {
                &orig_text
            },
            &result.full_translated_text,
            metadata_json.as_deref(),
        )?;
        Some(id)
    } else {
        None
    };

    Ok(ImageHubTranslationResponse { result, history_id })
}

#[tauri::command]
pub async fn translate_document_chunk_hub(
    req: TranslateDocChunkRequest,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<DocChunkTranslationResult, AppError> {
    if req.content.trim().is_empty() {
        return Err(AppError::Validation(
            "Document chunk content cannot be empty".into(),
        ));
    }

    let providers = hub_registry(&app, db.inner(), ModelRole::TextQuality)?;
    providers.translate_document_chunk(req).await
}

/// Live microphone: transcript only (speech-to-text role). The UI translates
/// finished sentences itself, so cost grows with the speech, not with the
/// whole transcript re-sent every few seconds.
#[tauri::command]
pub async fn transcribe_audio_hub(
    req: TranscribeAudioRequest,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<TranscriptionResult, AppError> {
    if req.audio_base64.trim().is_empty() {
        return Err(AppError::Validation("Audio payload cannot be empty".into()));
    }
    let registry = hub_registry(&app, db.inner(), ModelRole::SpeechToText)?;
    registry.transcribe_audio(req).await
}

#[tauri::command]
pub async fn translate_audio_hub(
    req: TranslateAudioRequest,
    save_history: Option<bool>,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<AudioHubTranslationResponse, AppError> {
    if req.audio_base64.trim().is_empty() {
        return Err(AppError::Validation("Audio payload cannot be empty".into()));
    }

    let result = translate_speech(&app, db.inner(), req.clone()).await?;

    let history_id = if save_history.unwrap_or(true) {
        let conn = db.get()?;
        let metadata_json = serde_json::to_string(&result.segments).ok();
        let id = TranslationHubRepo::create_entry(
            &conn,
            "audio",
            &result.source_language,
            &result.target_language,
            &result.transcribed_text,
            &result.translated_text,
            metadata_json.as_deref(),
        )?;
        Some(id)
    } else {
        None
    };

    Ok(AudioHubTranslationResponse { result, history_id })
}

#[tauri::command]
pub async fn list_translation_history(
    mode: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<TranslationHistoryDto>, AppError> {
    let conn = db.get()?;
    TranslationHubRepo::list_history(
        &conn,
        mode.as_deref(),
        limit.unwrap_or(30),
        offset.unwrap_or(0),
    )
}

#[tauri::command]
pub async fn toggle_translation_history_favorite(
    id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<bool, AppError> {
    let conn = db.get()?;
    TranslationHubRepo::toggle_favorite(&conn, id)
}

#[tauri::command]
pub async fn delete_translation_history_entry(
    id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<(), AppError> {
    let conn = db.get()?;
    TranslationHubRepo::delete_entry(&conn, id)
}

#[tauri::command]
pub async fn clear_translation_history(
    mode: Option<String>,
    db: State<'_, Arc<DbPool>>,
) -> Result<usize, AppError> {
    let conn = db.get()?;
    TranslationHubRepo::clear_history(&conn, mode.as_deref())
}

#[cfg(test)]
mod tests {
    use super::normalize_image_mime;

    #[test]
    fn normalize_image_mime_defaults_unknown_to_png() {
        assert_eq!(normalize_image_mime(""), "image/png");
        assert_eq!(
            normalize_image_mime("application/octet-stream"),
            "image/png"
        );
        assert_eq!(normalize_image_mime("image/jpg"), "image/jpeg");
        assert_eq!(
            normalize_image_mime("image/webp; charset=binary"),
            "image/webp"
        );
    }
}
