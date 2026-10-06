// ============================================================
// LEXORA — Role router
// Builds the provider chain for a role from `model_route`,
// skipping models that cannot serve it, and reports per-role
// readiness for the Settings UI.
// ============================================================

use super::catalog::{find, support, ModelStatus, Support};
use super::packages::RouteTarget;
use super::roles::{ModelRole, RoleGroup};
use super::usage::{ChainUsage, UsageSink};
use crate::commands::settings::AppSettings;
use crate::db::repos::model_route::{ModelRouteRepo, RoleRoutes};
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{create_provider, ProviderRegistry};
use rusqlite::Connection;
use serde::Serialize;
use tauri::AppHandle;

/// Can Lexora drive this provider for the role (independent of the model)?
pub fn engine_supports(provider: &str, role: ModelRole) -> bool {
    match role {
        ModelRole::TextFast | ModelRole::TextQuality => matches!(
            provider,
            "gemini" | "openai" | "anthropic" | "openrouter" | "groq" | "cloudflare" | "custom"
        ),
        ModelRole::Vision => {
            matches!(provider, "gemini" | "openai" | "anthropic" | "openrouter" | "custom")
        }
        ModelRole::SpeechToText => {
            matches!(provider, "gemini" | "openai" | "groq" | "openrouter" | "custom")
        }
        ModelRole::RealtimeVoice | ModelRole::LiveInterpreter => provider == "gemini",
        ModelRole::Tts => matches!(provider, "system" | "gemini" | "openai"),
        ModelRole::ImageGen => matches!(provider, "gemini" | "openai" | "cloudflare"),
    }
}

/// Providers that need an API key in the key store.
pub fn needs_key(provider: &str) -> bool {
    matches!(
        provider,
        "gemini" | "openai" | "anthropic" | "openrouter" | "groq" | "cloudflare"
    )
}

/// Saved routes; a never-seeded table (tests, very old DB) derives them on the fly.
pub fn load_routes(conn: &Connection, settings: &AppSettings) -> Result<RoleRoutes, AppError> {
    if ModelRouteRepo::is_empty(conn)? {
        return Ok(super::initial_routes(settings)
            .into_iter()
            .filter(|(_, chain)| !chain.is_empty())
            .collect());
    }
    ModelRouteRepo::load(conn)
}

fn target_usable(target: &RouteTarget, role: ModelRole) -> bool {
    target.provider != "offline"
        && engine_supports(&target.provider, role)
        && support(&target.provider, &target.model, role.capability()) != Support::No
}

/// Chain targets of a role that Lexora can actually call, in order.
pub fn usable_targets(routes: &RoleRoutes, role: ModelRole) -> Vec<RouteTarget> {
    routes
        .get(&role)
        .map(|chain| {
            chain
                .iter()
                .filter(|t| target_usable(t, role))
                .cloned()
                .collect()
        })
        .unwrap_or_default()
}

/// Provider chain for an `AIProvider` role (text, vision, speech-to-text).
pub fn registry_for_role(
    app: &AppHandle,
    pool: &DbPool,
    settings: &AppSettings,
    role: ModelRole,
) -> Result<ProviderRegistry, AppError> {
    if settings.offline_mode {
        return Err(AppError::ai_not_connected(role.label_en()));
    }
    let routes = {
        let conn = pool.get()?;
        load_routes(&conn, settings)?
    };
    let mut chain = Vec::new();
    let mut targets = Vec::new();
    let mut last_err: Option<AppError> = None;
    for target in usable_targets(&routes, role) {
        match create_provider(app, &target.provider, &target.model, settings) {
            Ok(provider) => {
                chain.push(provider);
                targets.push(target);
            }
            Err(e) => {
                log::warn!(
                    "{} model {}:{} is not configured: {e}",
                    role.as_str(),
                    target.provider,
                    target.model
                );
                last_err = Some(e);
            }
        }
    }
    if chain.is_empty() {
        return Err(last_err.unwrap_or_else(|| AppError::ai_not_connected(role.label_en())));
    }
    Ok(
        ProviderRegistry::from_chain(chain, Some(role.attempt_timeout())).with_usage(ChainUsage {
            sink: UsageSink::new(pool.clone(), role),
            targets,
        }),
    )
}

/// Primary usable target of a role for engines outside `AIProvider` (TTS, live voice).
pub fn primary_target(
    pool: &DbPool,
    settings: &AppSettings,
    role: ModelRole,
) -> Result<Option<RouteTarget>, AppError> {
    let conn = pool.get()?;
    let routes = load_routes(&conn, settings)?;
    Ok(usable_targets(&routes, role).into_iter().next())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RoleState {
    Ready,
    NeedsKey,
    Unavailable,
    Unsupported,
    Off,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleStatus {
    pub role: ModelRole,
    pub group: RoleGroup,
    pub state: RoleState,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub model_label: Option<String>,
    /// Short Russian explanation for the Settings UI.
    pub message: String,
    /// True when the ready model is a fallback, not the primary.
    pub using_fallback: bool,
    pub chain: Vec<RouteTarget>,
}

fn provider_title(provider: &str) -> &str {
    match provider {
        "gemini" => "Google Gemini",
        "openai" => "OpenAI",
        "anthropic" => "Anthropic",
        "openrouter" => "OpenRouter",
        "groq" => "Groq",
        "cloudflare" => "Cloudflare",
        "custom" => "локальной модели",
        "system" => "системного голоса",
        other => other,
    }
}

fn target_state(target: &RouteTarget, role: ModelRole, has_key: &dyn Fn(&str) -> bool) -> (RoleState, String) {
    if target.provider == "offline" {
        return (RoleState::Off, "Встроенный словарь, без AI".to_string());
    }
    if let Some(spec) = find(&target.provider, &target.model) {
        if spec.status == ModelStatus::Retired {
            return (
                RoleState::Unavailable,
                format!("Модель {} больше не обслуживается", spec.label),
            );
        }
    }
    if !engine_supports(&target.provider, role) {
        return (
            RoleState::Unsupported,
            format!("{} пока не поддерживается для этой функции", provider_title(&target.provider)),
        );
    }
    if support(&target.provider, &target.model, role.capability()) == Support::No {
        return (
            RoleState::Unsupported,
            format!("Модель {} не умеет эту задачу", target.model),
        );
    }
    if needs_key(&target.provider) && !has_key(&target.provider) {
        return (
            RoleState::NeedsKey,
            format!("Нужен ключ {}", provider_title(&target.provider)),
        );
    }
    let label = find(&target.provider, &target.model)
        .map(|spec| spec.label.to_string())
        .unwrap_or_else(|| target.model.clone());
    let note = match find(&target.provider, &target.model).map(|s| s.status) {
        Some(ModelStatus::Deprecated { shutdown }) => format!(" (отключение {shutdown})"),
        Some(ModelStatus::Preview) => " (preview)".to_string(),
        _ => String::new(),
    };
    (RoleState::Ready, format!("{label}{note}"))
}

/// Readiness of one role: the first ready model of the chain, otherwise the primary's problem.
pub fn role_status(
    routes: &RoleRoutes,
    role: ModelRole,
    offline_mode: bool,
    has_key: &dyn Fn(&str) -> bool,
) -> RoleStatus {
    let chain = routes.get(&role).cloned().unwrap_or_default();
    let mut status = RoleStatus {
        role,
        group: role.group(),
        state: RoleState::Off,
        provider: None,
        model: None,
        model_label: None,
        message: String::new(),
        using_fallback: false,
        chain: chain.clone(),
    };
    if offline_mode && role != ModelRole::Tts {
        status.message = "Офлайн-режим: AI выключен".to_string();
        return status;
    }
    if chain.is_empty() {
        status.message = match role {
            ModelRole::ImageGen => "Выключено — используются бесплатные фото Wikimedia".to_string(),
            _ => "Не настроено в текущем пакете".to_string(),
        };
        return status;
    }

    let mut first_problem: Option<(RoleState, String, &RouteTarget)> = None;
    for (index, target) in chain.iter().enumerate() {
        let (state, message) = target_state(target, role, has_key);
        if state == RoleState::Ready {
            status.state = RoleState::Ready;
            status.provider = Some(target.provider.clone());
            status.model = Some(target.model.clone());
            status.model_label = Some(message.clone());
            status.using_fallback = index > 0;
            status.message = if index > 0 {
                format!("{message} — резервная модель")
            } else {
                message
            };
            return status;
        }
        if first_problem.is_none() {
            first_problem = Some((state, message, target));
        }
    }
    if let Some((state, message, target)) = first_problem {
        status.state = state;
        status.provider = Some(target.provider.clone());
        status.model = Some(target.model.clone());
        status.message = message;
    }
    status
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::models::packages::{package_routes, PackageId, PackageOptions};

    fn routes(package: PackageId) -> RoleRoutes {
        package_routes(package, PackageOptions::default())
            .into_iter()
            .filter(|(_, c)| !c.is_empty())
            .collect()
    }

    #[test]
    fn usable_targets_skip_models_without_the_capability() {
        let mut map = RoleRoutes::new();
        map.insert(
            ModelRole::Vision,
            vec![
                RouteTarget::new("groq", "openai/gpt-oss-120b"),
                RouteTarget::new("cloudflare", "@cf/meta/llama-3.1-8b-instruct"),
                RouteTarget::new("gemini", "gemini-3.8-flash"),
            ],
        );
        assert_eq!(
            usable_targets(&map, ModelRole::Vision),
            vec![RouteTarget::new("gemini", "gemini-3.8-flash")]
        );
    }

    #[test]
    fn gemini_package_without_key_needs_key() {
        let status = role_status(&routes(PackageId::Gemini), ModelRole::TextFast, false, &|_| false);
        assert_eq!(status.state, RoleState::NeedsKey);
        assert_eq!(status.message, "Нужен ключ Google Gemini");
    }

    #[test]
    fn gemini_package_with_key_is_ready_on_every_voice_role() {
        let map = routes(PackageId::Gemini);
        for role in [ModelRole::SpeechToText, ModelRole::RealtimeVoice, ModelRole::LiveInterpreter, ModelRole::Tts] {
            let status = role_status(&map, role, false, &|p| p == "gemini");
            assert_eq!(status.state, RoleState::Ready, "{role:?}");
        }
        let images = role_status(&map, ModelRole::ImageGen, false, &|p| p == "gemini");
        assert_eq!(images.state, RoleState::Off);
    }

    #[test]
    fn tts_falls_back_to_system_voice_without_a_key() {
        let status = role_status(&routes(PackageId::Gemini), ModelRole::Tts, false, &|_| false);
        assert_eq!(status.state, RoleState::Ready);
        assert!(status.using_fallback);
        assert_eq!(status.provider.as_deref(), Some("system"));
    }

    #[test]
    fn openai_realtime_is_reported_as_unsupported_for_now() {
        let status = role_status(&routes(PackageId::Openai), ModelRole::RealtimeVoice, false, &|_| true);
        assert_eq!(status.state, RoleState::Unsupported);
    }

    #[test]
    fn retired_model_is_unavailable() {
        let mut map = RoleRoutes::new();
        map.insert(
            ModelRole::TextFast,
            vec![RouteTarget::new("openrouter", "minimax/minimax-m3:free")],
        );
        let status = role_status(&map, ModelRole::TextFast, false, &|_| true);
        assert_eq!(status.state, RoleState::Unavailable);
    }

    #[test]
    fn offline_mode_turns_ai_roles_off_but_keeps_tts() {
        let map = routes(PackageId::Gemini);
        assert_eq!(role_status(&map, ModelRole::Vision, true, &|_| true).state, RoleState::Off);
        assert_eq!(role_status(&map, ModelRole::Tts, true, &|_| true).state, RoleState::Ready);
    }
}
