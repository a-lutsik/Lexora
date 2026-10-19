// ============================================================
// LEXORA — AI model routing commands
// Catalog, per-role routes and readiness, one-key packages,
// advanced per-role overrides and per-role connection tests.
// ============================================================

use crate::db::repos::ai_usage::{AiUsageRepo, AiUsageRow};
use crate::commands::settings::{persist_and_apply_side_effects, AppSettings};
use crate::commands::translate::TestConnectionResult;
use crate::db::repos::model_route::{ModelRouteRepo, RoleRoutes};
use crate::db::repos::settings::SettingsRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{
    TranscribeAudioRequest, TranslateImageRequest, TranslateRequest,
};
use crate::providers::models::catalog::{find, support, ModelSpec, ModelStatus, Support, CATALOG};
use crate::providers::models::packages::{package_routes, PackageId, PackageOptions, RouteTarget};
use crate::providers::models::roles::ModelRole;
use crate::providers::models::router::{
    engine_supports, load_routes, registry_for_role, role_status, RoleStatus,
};
use crate::providers::models::mirror_into_settings;
use crate::providers::models::remote::{fetch_models, ListSource, RemoteModelDto};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, State};

const ROLE_TEST_TIMEOUT: Duration = Duration::from_secs(25);

/// 1×1 white PNG — enough to prove a vision model accepts images.
const TEST_IMAGE_PNG_B64: &str =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelRoutesDto {
    pub package: Option<String>,
    pub illustrations: bool,
    pub roles: Vec<RoleStatus>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelSetupDto {
    pub routes: ModelRoutesDto,
    pub settings: AppSettings,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyPackageInput {
    pub package: String,
    #[serde(default)]
    pub api_key: Option<String>,
    #[serde(default)]
    pub illustrations: bool,
    #[serde(default)]
    pub cloudflare_account_id: Option<String>,
    #[serde(default)]
    pub custom_base_url: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetRoleRouteInput {
    pub role: String,
    pub targets: Vec<RouteTarget>,
}

fn has_key_for(app: &AppHandle, settings: &AppSettings, provider: &str) -> bool {
    let key = crate::api_keys::has_api_key(app, provider);
    if provider == "cloudflare" {
        return key
            && settings
                .cloudflare_account_id
                .as_deref()
                .is_some_and(|id| !id.trim().is_empty());
    }
    key
}

fn routes_dto(app: &AppHandle, settings: &AppSettings, routes: &RoleRoutes) -> ModelRoutesDto {
    let has_key = |provider: &str| has_key_for(app, settings, provider);
    ModelRoutesDto {
        package: settings.model_package.clone(),
        illustrations: routes
            .get(&ModelRole::ImageGen)
            .is_some_and(|chain| !chain.is_empty()),
        roles: ModelRole::ALL
            .into_iter()
            .map(|role| role_status(routes, role, settings.offline_mode, &has_key))
            .collect(),
    }
}

/// Guided-setup profile that matches a package (stops the first-run wizard).
fn setup_profile_for(package: PackageId, illustrations: bool) -> &'static str {
    match package {
        PackageId::Gemini if illustrations => "paid-gemini",
        PackageId::Gemini => "gemini-free",
        PackageId::Openai => "paid-openai",
        PackageId::Cloudflare => "free-cloudflare",
        PackageId::Offline => "zero",
        PackageId::Local => "local",
        PackageId::Custom => "advanced",
    }
}

/// Reject targets Lexora cannot use for the role (unknown custom names pass).
pub(crate) fn validate_targets(role: ModelRole, targets: &[RouteTarget]) -> Result<(), AppError> {
    for target in targets {
        let provider = target.provider.trim();
        let model = target.model.trim();
        if provider.is_empty() || model.is_empty() {
            return Err(AppError::Validation("Choose a provider and a model".into()));
        }
        if !engine_supports(provider, role) {
            return Err(AppError::Validation(format!(
                "{provider} cannot be used for {} yet",
                role.label_en().to_lowercase()
            )));
        }
        if let Some(spec) = find(provider, model) {
            if spec.status == ModelStatus::Retired {
                return Err(AppError::Validation(format!(
                    "{} is no longer served by the provider",
                    spec.label
                )));
            }
        }
        if support(provider, model, role.capability()) == Support::No {
            return Err(AppError::Validation(format!(
                "{model} cannot do {}",
                role.label_en().to_lowercase()
            )));
        }
    }
    Ok(())
}

/// Settings «Продвинутый режим»: every model the saved key of `provider` can use.
#[tauri::command]
pub async fn list_provider_models(
    provider: String,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<RemoteModelDto>, AppError> {
    let provider = provider.trim().to_string();
    let settings = {
        let conn = db.inner().get()?;
        SettingsRepo::get(&conn)?
    };
    let base = match provider.as_str() {
        "custom" => Some(
            settings
                .custom_base_url
                .clone()
                .unwrap_or_else(|| "http://localhost:11434/v1".to_string()),
        ),
        "cloudflare" => settings.cloudflare_account_id.clone(),
        _ => None,
    };
    let source = ListSource {
        api_key: crate::api_keys::get_api_key(&app, &provider),
        provider,
        base,
    };
    fetch_models(&source).await
}

#[tauri::command]
pub fn get_model_catalog() -> Vec<ModelSpec> {
    CATALOG.to_vec()
}

#[tauri::command]
pub async fn get_model_routes(
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<ModelRoutesDto, AppError> {
    let conn = db.get()?;
    let settings = SettingsRepo::get(&conn)?;
    let routes = load_routes(&conn, &settings)?;
    Ok(routes_dto(&app, &settings, &routes))
}

#[tauri::command]
pub async fn apply_model_package(
    input: ApplyPackageInput,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<ModelSetupDto, AppError> {
    let package = PackageId::parse(&input.package)
        .filter(|p| *p != PackageId::Custom)
        .ok_or_else(|| AppError::Validation(format!("Unknown package '{}'", input.package)))?;

    if let (Some(key), Some(provider)) = (
        input.api_key.as_deref().map(str::trim).filter(|k| !k.is_empty()),
        package.key_provider(),
    ) {
        crate::api_keys::save_api_key(&app, provider, key)?;
    }

    let routes = package_routes(
        package,
        PackageOptions {
            illustrations: input.illustrations,
        },
    );

    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    ModelRouteRepo::write_all(&tx, &routes)?;
    let saved = ModelRouteRepo::load(&tx)?;

    let mut settings = SettingsRepo::get(&tx)?;
    settings.model_package = Some(package.as_str().to_string());
    settings.offline_mode = false;
    settings.setup_profile = Some(setup_profile_for(package, input.illustrations).to_string());
    if let Some(account) = input
        .cloudflare_account_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        settings.cloudflare_account_id = Some(account.to_string());
    }
    if let Some(url) = input
        .custom_base_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        settings.custom_base_url = Some(url.to_string());
    }
    mirror_into_settings(&mut settings, &saved);
    let settings = persist_and_apply_side_effects(&app, &tx, &settings)?;
    tx.commit()?;

    Ok(ModelSetupDto {
        routes: routes_dto(&app, &settings, &saved),
        settings,
    })
}

/// Settings «Расходы AI»: totals per role and model for the last `days` days.
#[tauri::command]
pub async fn get_ai_usage(
    days: Option<u32>,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<AiUsageRow>, AppError> {
    let conn = db.inner().get()?;
    AiUsageRepo::summary(&conn, days.unwrap_or(30).clamp(1, 365))
}

#[tauri::command]
pub async fn set_role_route(
    input: SetRoleRouteInput,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<ModelSetupDto, AppError> {
    let role = ModelRole::parse(&input.role)
        .ok_or_else(|| AppError::Validation(format!("Unknown role '{}'", input.role)))?;
    let targets: Vec<RouteTarget> = input
        .targets
        .into_iter()
        .map(|t| RouteTarget::new(t.provider.trim(), t.model.trim()))
        .collect();
    validate_targets(role, &targets)?;

    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    {
        // Make sure every other role is persisted before switching to "custom".
        if ModelRouteRepo::is_empty(&tx)? {
            let settings = SettingsRepo::get(&tx)?;
            ModelRouteRepo::write_all(&tx, &crate::providers::models::initial_routes(&settings))?;
        }
    }
    ModelRouteRepo::write_role(&tx, role, &targets)?;
    let saved = ModelRouteRepo::load(&tx)?;
    // A per-role model is an advanced choice: keep its editors visible.
    SettingsRepo::set_advanced_models(&tx, true)?;

    let mut settings = SettingsRepo::get(&tx)?;
    settings.model_package = Some(PackageId::Custom.as_str().to_string());
    mirror_into_settings(&mut settings, &saved);
    let settings = persist_and_apply_side_effects(&app, &tx, &settings)?;
    tx.commit()?;

    Ok(ModelSetupDto {
        routes: routes_dto(&app, &settings, &saved),
        settings,
    })
}

/// Settings «Продвинутый режим»: show or hide per-role model editors.
/// Routes stay as they are — switching off never changes the models silently.
#[tauri::command]
pub async fn set_advanced_models(
    enabled: bool,
    db: State<'_, Arc<DbPool>>,
) -> Result<AppSettings, AppError> {
    let conn = db.inner().get()?;
    SettingsRepo::set_advanced_models(&conn, enabled)?;
    SettingsRepo::get(&conn)
}

/// 0.5 s of silence as a 16 kHz mono WAV, base64.
fn silent_wav_base64() -> String {
    use base64::Engine;
    let samples: u32 = 8_000;
    let data_len = samples * 2;
    let mut wav = Vec::with_capacity(44 + data_len as usize);
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&(36 + data_len).to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16u32.to_le_bytes());
    wav.extend_from_slice(&1u16.to_le_bytes()); // PCM
    wav.extend_from_slice(&1u16.to_le_bytes()); // mono
    wav.extend_from_slice(&16_000u32.to_le_bytes());
    wav.extend_from_slice(&32_000u32.to_le_bytes()); // byte rate
    wav.extend_from_slice(&2u16.to_le_bytes()); // block align
    wav.extend_from_slice(&16u16.to_le_bytes()); // bits per sample
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&data_len.to_le_bytes());
    wav.resize(44 + data_len as usize, 0);
    base64::engine::general_purpose::STANDARD.encode(wav)
}

/// A model that answered "nothing was said" for silence is reachable and working.
fn is_no_speech_error(err: &AppError) -> bool {
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("no speech") || msg.contains("empty transcription")
}

fn test_result(ok: bool, started: Instant, message: String, sample: Option<String>) -> TestConnectionResult {
    TestConnectionResult {
        ok,
        latency_ms: started.elapsed().as_millis() as u64,
        message,
        sample_translation: sample,
    }
}

#[tauri::command]
pub async fn test_model_role(
    role: String,
    app: AppHandle,
    db: State<'_, Arc<DbPool>>,
) -> Result<TestConnectionResult, AppError> {
    let role = ModelRole::parse(&role)
        .ok_or_else(|| AppError::Validation(format!("Unknown role '{role}'")))?;
    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };
    let started = Instant::now();

    match role {
        ModelRole::TextFast | ModelRole::TextQuality | ModelRole::Vision | ModelRole::SpeechToText => {
            let registry = match registry_for_role(&app, &pool, &settings, role) {
                Ok(registry) => registry,
                Err(e) => return Ok(test_result(false, started, e.to_string(), None)),
            };
            let outcome = match role {
                ModelRole::Vision => tokio::time::timeout(
                    ROLE_TEST_TIMEOUT,
                    registry.translate_image(TranslateImageRequest {
                        image_base64: TEST_IMAGE_PNG_B64.to_string(),
                        mime_type: "image/png".to_string(),
                        source_language: None,
                        target_language: "ru".to_string(),
                        lexical_domain: None,
                    }),
                )
                .await
                .map(|r| r.map(|_| None)),
                ModelRole::SpeechToText => tokio::time::timeout(
                    ROLE_TEST_TIMEOUT,
                    registry.transcribe_audio(TranscribeAudioRequest {
                        audio_base64: silent_wav_base64(),
                        mime_type: "audio/wav".to_string(),
                        language: Some("en".to_string()),
                        prompt: None,
                    }),
                )
                .await
                .map(|r| match r {
                    Ok(t) => Ok(Some(t.text)),
                    Err(e) if is_no_speech_error(&e) => Ok(None),
                    Err(e) => Err(e),
                }),
                _ => tokio::time::timeout(
                    ROLE_TEST_TIMEOUT,
                    registry.translate(TranslateRequest {
                        text: "serendipity".to_string(),
                        source_language: Some("en".to_string()),
                        target_language: "ru".to_string(),
                        context_sentence: Some(
                            "Finding this bookstore was pure serendipity.".to_string(),
                        ),
                        lexical_domain: None,
                    }),
                )
                .await
                .map(|r| r.map(|res| Some(res.main_translation))),
            };
            Ok(match outcome {
                Ok(Ok(sample)) => test_result(true, started, "Модель отвечает".to_string(), sample),
                Ok(Err(e)) => test_result(false, started, e.to_string(), None),
                Err(_) => test_result(
                    false,
                    started,
                    format!("Нет ответа за {} с", ROLE_TEST_TIMEOUT.as_secs()),
                    None,
                ),
            })
        }
        ModelRole::ImageGen => {
            let target = crate::providers::models::router::primary_target(&pool, &settings, role)?;
            let Some(target) = target else {
                return Ok(test_result(
                    false,
                    started,
                    "Иллюстрации выключены".to_string(),
                    None,
                ));
            };
            let model_id = format!("{}:{}", target.provider, target.model);
            let image = crate::commands::media::run_image_connection_test(&app, &settings, &model_id).await?;
            Ok(test_result(image.ok, started, image.message, image.sample_image_path))
        }
        ModelRole::Tts => crate::commands::media::test_tts_role(&app, &pool, &settings).await,
        ModelRole::RealtimeVoice | ModelRole::LiveInterpreter => {
            crate::commands::realtime::test_realtime_role(&app, &pool, &settings, role).await
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_targets_rejects_capability_mismatch_and_retired_models() {
        let err = validate_targets(
            ModelRole::Vision,
            &[RouteTarget::new("groq", "openai/gpt-oss-120b")],
        );
        assert!(matches!(err, Err(AppError::Validation(_))));

        let err = validate_targets(
            ModelRole::TextFast,
            &[RouteTarget::new("openrouter", "minimax/minimax-m3:free")],
        );
        assert!(matches!(err, Err(AppError::Validation(_))));

        let err = validate_targets(
            ModelRole::RealtimeVoice,
            &[RouteTarget::new("anthropic", "claude-sonnet-5-5")],
        );
        assert!(matches!(err, Err(AppError::Validation(_))));
    }

    #[test]
    fn validate_targets_accepts_mixed_providers_and_custom_names() {
        validate_targets(
            ModelRole::TextFast,
            &[
                RouteTarget::new("gemini", "gemini-3.5-flash-lite"),
                RouteTarget::new("openai", "gpt-6-luna"),
                RouteTarget::new("custom", "my-ollama-model"),
            ],
        )
        .expect("mixing providers is allowed in advanced mode");
    }

    #[test]
    fn silent_wav_has_valid_header() {
        use base64::Engine;
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(silent_wav_base64())
            .expect("base64");
        assert_eq!(&bytes[0..4], b"RIFF");
        assert_eq!(&bytes[8..12], b"WAVE");
        assert_eq!(u32::from_le_bytes([bytes[24], bytes[25], bytes[26], bytes[27]]), 16_000);
        assert_eq!(bytes.len(), 44 + 16_000);
    }

    #[test]
    fn setup_profiles_match_packages() {
        assert_eq!(setup_profile_for(PackageId::Gemini, false), "gemini-free");
        assert_eq!(setup_profile_for(PackageId::Gemini, true), "paid-gemini");
        assert_eq!(setup_profile_for(PackageId::Offline, false), "zero");
    }
}
