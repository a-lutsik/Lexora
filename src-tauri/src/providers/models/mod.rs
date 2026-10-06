// ============================================================
// LEXORA — Per-role model routing
// roles     — what an AI call is for
// catalog   — what each known model can do
// packages  — one-key presets that fill every role
// router    — builds provider chains for a role, role statuses
// usage     — counts AI calls per role and model (Settings panel)
// ============================================================

pub mod catalog;
pub mod packages;
pub mod roles;
pub mod router;
pub mod usage;

use crate::commands::settings::AppSettings;
use crate::db::repos::model_route::{ModelRouteRepo, RoleRoutes};
use crate::db::repos::settings::SettingsRepo;
use crate::error::AppError;
use catalog::{support, Capability, Support};
use packages::{package_routes, PackageId, PackageOptions, RouteTarget};
use roles::ModelRole;
use rusqlite::Connection;

/// Image model id used in legacy columns when illustrations are off.
pub const NO_IMAGE_MODEL: &str = "none";

fn push_unique(chain: &mut Vec<RouteTarget>, provider: &str, model: &str) {
    let provider = provider.trim();
    let model = model.trim();
    if provider.is_empty() || model.is_empty() {
        return;
    }
    if !chain
        .iter()
        .any(|t| t.provider == provider && t.model == model)
    {
        chain.push(RouteTarget::new(provider, model));
    }
}

fn parse_image_route(raw: &str) -> Option<RouteTarget> {
    let trimmed = raw.trim();
    if trimmed.is_empty() || trimmed.eq_ignore_ascii_case(NO_IMAGE_MODEL) {
        return None;
    }
    let (provider, model) = trimmed.split_once(':')?;
    Some(RouteTarget::new(provider, model))
}

/// Dedicated transcription model of providers whose chat models cannot hear.
fn speech_model_for(provider: &str) -> Option<&'static str> {
    match provider {
        "openai" => Some("gpt-transcribe"),
        "groq" => Some("whisper-large-v3-turbo"),
        _ => None,
    }
}

/// Routes derived from pre-V023 settings columns (users with their own choices).
pub fn legacy_routes(settings: &AppSettings) -> Vec<(ModelRole, Vec<RouteTarget>)> {
    let mut text: Vec<RouteTarget> = Vec::new();
    if settings.offline_mode || settings.ai_provider == "offline" {
        push_unique(&mut text, "offline", "offline-built-in");
    } else {
        push_unique(&mut text, &settings.ai_provider, &settings.ai_model);
        if settings.fallback_enabled {
            if let (Some(provider), Some(model)) = (
                settings.fallback_ai_provider.as_deref(),
                settings.fallback_ai_model.as_deref(),
            ) {
                push_unique(&mut text, provider, model);
            }
        }
    }

    let vision: Vec<RouteTarget> = text
        .iter()
        .filter(|t| t.provider != "offline")
        .filter(|t| support(&t.provider, &t.model, Capability::Vision) != Support::No)
        .cloned()
        .collect();

    let mut speech: Vec<RouteTarget> = Vec::new();
    let mut live_gemini = false;
    for target in &text {
        if target.provider == "gemini" {
            live_gemini = true;
            if support("gemini", &target.model, Capability::Transcription) == Support::Yes {
                push_unique(&mut speech, "gemini", &target.model);
            }
        } else if let Some(model) = speech_model_for(&target.provider) {
            push_unique(&mut speech, &target.provider, model);
        }
    }

    let (realtime, interpreter) = if live_gemini {
        (
            vec![RouteTarget::new("gemini", "gemini-3.8-live")],
            vec![RouteTarget::new("gemini", "gemini-3.5-live-translate-preview")],
        )
    } else {
        (Vec::new(), Vec::new())
    };

    let tts = match settings.tts_engine.as_str() {
        "openai" => vec![
            RouteTarget::new("openai", "gpt-4o-mini-tts"),
            RouteTarget::new("system", "say"),
        ],
        "gemini" => vec![
            RouteTarget::new("gemini", "gemini-3.8-flash-lite-tts"),
            RouteTarget::new("system", "say"),
        ],
        _ => vec![RouteTarget::new("system", "say")],
    };

    let mut images: Vec<RouteTarget> = Vec::new();
    for raw in [&settings.image_model, &settings.fallback_image_model] {
        if let Some(target) = parse_image_route(raw) {
            push_unique(&mut images, &target.provider, &target.model);
        }
    }

    vec![
        (ModelRole::TextFast, text.clone()),
        (ModelRole::TextQuality, text),
        (ModelRole::Vision, vision),
        (ModelRole::SpeechToText, speech),
        (ModelRole::RealtimeVoice, realtime),
        (ModelRole::LiveInterpreter, interpreter),
        (ModelRole::Tts, tts),
        (ModelRole::ImageGen, images),
    ]
}

/// Paid guided-setup profiles include AI illustrations.
fn profile_has_illustrations(profile: Option<&str>) -> bool {
    matches!(profile, Some("paid-gemini") | Some("paid-openai"))
}

/// Routes for an explicit guided-setup choice (legacy `apply_setup_preset`):
/// the profile's package when it has one, otherwise the given columns.
pub fn preset_routes(settings: &AppSettings) -> (PackageId, Vec<(ModelRole, Vec<RouteTarget>)>) {
    let profile = settings.setup_profile.as_deref();
    match profile.and_then(PackageId::from_setup_profile) {
        Some(package) => (
            package,
            package_routes(
                package,
                PackageOptions {
                    illustrations: profile_has_illustrations(profile),
                },
            ),
        ),
        None => (PackageId::Custom, legacy_routes(settings)),
    }
}

/// First routes for a database: explicit package, then the guided-setup
/// profile, then the legacy columns.
pub fn initial_routes(settings: &AppSettings) -> Vec<(ModelRole, Vec<RouteTarget>)> {
    let package = settings
        .model_package
        .as_deref()
        .and_then(PackageId::parse)
        .filter(|p| *p != PackageId::Custom)
        .or_else(|| {
            settings
                .setup_profile
                .as_deref()
                .and_then(PackageId::from_setup_profile)
        });
    match package {
        Some(package) => package_routes(
            package,
            PackageOptions {
                illustrations: profile_has_illustrations(settings.setup_profile.as_deref()),
            },
        ),
        None => legacy_routes(settings),
    }
}

/// Seed `model_route` once (first start after V023) and mirror the routes
/// into the legacy settings columns, in one transaction. Idempotent.
/// Returns true when routes were seeded.
pub fn ensure_routes(conn: &mut Connection) -> Result<bool, AppError> {
    if !ModelRouteRepo::is_empty(conn)? {
        return Ok(false);
    }
    let tx = conn.transaction()?;
    let mut settings = SettingsRepo::get(&tx)?;
    let routes = initial_routes(&settings);
    ModelRouteRepo::write_all(&tx, &routes)?;
    let saved = ModelRouteRepo::load(&tx)?;
    mirror_into_settings(&mut settings, &saved);
    SettingsRepo::update(&tx, &settings)?;
    tx.commit()?;
    log::info!("Seeded AI model routes for {} roles", routes.len());
    Ok(true)
}

/// AI columns of settings about to be saved always mirror the stored routes,
/// so a window holding stale settings cannot change models behind the router.
pub fn align_with_routes(conn: &Connection, settings: &mut AppSettings) -> Result<(), AppError> {
    if ModelRouteRepo::is_empty(conn)? {
        return Ok(());
    }
    let routes = ModelRouteRepo::load(conn)?;
    mirror_into_settings(settings, &routes);
    Ok(())
}

/// Keep legacy columns in sync for code paths that still read them.
pub fn mirror_into_settings(settings: &mut AppSettings, routes: &RoleRoutes) {
    let text = routes.get(&ModelRole::TextQuality);
    if let Some(primary) = text.and_then(|chain| chain.first()) {
        settings.ai_provider = primary.provider.clone();
        settings.ai_model = primary.model.clone();
    }
    match text.and_then(|chain| chain.get(1)) {
        Some(fallback) => {
            settings.fallback_ai_provider = Some(fallback.provider.clone());
            settings.fallback_ai_model = Some(fallback.model.clone());
            settings.fallback_enabled = true;
        }
        None => settings.fallback_enabled = false,
    }

    let images = routes.get(&ModelRole::ImageGen);
    let image_id = |index: usize| {
        images
            .and_then(|chain| chain.get(index))
            .map(|t| format!("{}:{}", t.provider, t.model))
            .unwrap_or_else(|| NO_IMAGE_MODEL.to_string())
    };
    settings.image_model = image_id(0);
    settings.fallback_image_model = image_id(1);

    settings.tts_engine = match routes
        .get(&ModelRole::Tts)
        .and_then(|chain| chain.first())
        .map(|t| t.provider.as_str())
    {
        Some("openai") => "openai".to_string(),
        Some("gemini") => "gemini".to_string(),
        _ => "system".to_string(),
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    fn routes_map(routes: Vec<(ModelRole, Vec<RouteTarget>)>) -> RoleRoutes {
        routes.into_iter().filter(|(_, c)| !c.is_empty()).collect()
    }

    fn legacy_openai() -> AppSettings {
        AppSettings {
            ai_provider: "openai".into(),
            ai_model: "gpt-4o-mini".into(),
            fallback_ai_provider: Some("groq".into()),
            fallback_ai_model: Some("openai/gpt-oss-120b".into()),
            fallback_enabled: true,
            model_package: None,
            setup_profile: Some("advanced".into()),
            image_model: "cloudflare:@cf/black-forest-labs/flux-1-schnell".into(),
            fallback_image_model: "none".into(),
            tts_engine: "openai".into(),
            ..AppSettings::default()
        }
    }

    #[test]
    fn legacy_settings_keep_user_choice_per_role() {
        let routes = routes_map(legacy_routes(&legacy_openai()));
        assert_eq!(
            routes[&ModelRole::TextQuality],
            vec![
                RouteTarget::new("openai", "gpt-4o-mini"),
                RouteTarget::new("groq", "openai/gpt-oss-120b"),
            ]
        );
        // Text-only Groq model cannot read images.
        assert_eq!(
            routes[&ModelRole::Vision],
            vec![RouteTarget::new("openai", "gpt-4o-mini")]
        );
        // Chat models do not transcribe — speech uses the provider's ASR model.
        assert_eq!(
            routes[&ModelRole::SpeechToText],
            vec![
                RouteTarget::new("openai", "gpt-transcribe"),
                RouteTarget::new("groq", "whisper-large-v3-turbo"),
            ]
        );
        assert!(!routes.contains_key(&ModelRole::RealtimeVoice));
        assert_eq!(
            routes[&ModelRole::ImageGen],
            vec![RouteTarget::new("cloudflare", "@cf/black-forest-labs/flux-1-schnell")]
        );
        assert_eq!(routes[&ModelRole::Tts][0], RouteTarget::new("openai", "gpt-4o-mini-tts"));
    }

    #[test]
    fn explicit_package_wins_over_legacy_columns() {
        let settings = AppSettings {
            model_package: Some("gemini".into()),
            ..legacy_openai()
        };
        let routes = routes_map(initial_routes(&settings));
        assert_eq!(
            routes[&ModelRole::TextFast][0],
            RouteTarget::new("gemini", "gemini-3.5-flash-lite")
        );
        assert!(
            !routes.contains_key(&ModelRole::ImageGen),
            "Gemini illustrations are opt-in"
        );
    }

    #[test]
    fn paid_setup_profile_enables_illustrations() {
        let settings = AppSettings {
            model_package: None,
            setup_profile: Some("paid-gemini".into()),
            ..AppSettings::default()
        };
        let routes = routes_map(initial_routes(&settings));
        assert_eq!(
            routes[&ModelRole::ImageGen],
            vec![RouteTarget::new("gemini", "gemini-3.1-flash-lite-image")]
        );
    }

    #[test]
    fn mirror_writes_primary_fallback_images_and_tts() {
        let mut settings = AppSettings::default();
        let routes = routes_map(package_routes(PackageId::Openai, PackageOptions::default()));
        mirror_into_settings(&mut settings, &routes);
        assert_eq!(settings.ai_provider, "openai");
        assert_eq!(settings.ai_model, "gpt-6.1-sol");
        assert_eq!(settings.fallback_ai_model.as_deref(), Some("gpt-6-luna"));
        assert!(settings.fallback_enabled);
        assert_eq!(settings.image_model, NO_IMAGE_MODEL);
        assert_eq!(settings.fallback_image_model, NO_IMAGE_MODEL);
        assert_eq!(settings.tts_engine, "openai");
    }

    #[test]
    fn ensure_routes_seeds_once() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let mut conn = pool.get()?;

        assert!(ensure_routes(&mut conn)?);
        let first = ModelRouteRepo::load(&conn)?;
        let mirrored = SettingsRepo::get(&conn)?;
        assert_eq!(mirrored.image_model, NO_IMAGE_MODEL, "illustrations mirrored as off");
        assert_eq!(mirrored.tts_engine, "gemini");
        assert_eq!(
            first[&ModelRole::RealtimeVoice],
            vec![RouteTarget::new("gemini", "gemini-3.8-live")]
        );

        ModelRouteRepo::replace_role(&mut conn, ModelRole::Vision, &[RouteTarget::new("openai", "gpt-6-luna")])?;
        assert!(!ensure_routes(&mut conn)?);
        let second = ModelRouteRepo::load(&conn)?;
        assert_eq!(
            second[&ModelRole::Vision],
            vec![RouteTarget::new("openai", "gpt-6-luna")],
            "seeding must not overwrite user routes"
        );
        Ok(())
    }
    #[test]
    fn stale_ai_columns_are_replaced_by_route_mirror() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let mut conn = pool.get()?;
        ensure_routes(&mut conn)?;

        // A sticker window saves settings it loaded before the package changed.
        let mut stale = SettingsRepo::get(&conn)?;
        stale.ai_provider = "openrouter".to_string();
        stale.ai_model = "minimax/minimax-m3:free".to_string();
        stale.image_model = "openai:gpt-image-1".to_string();
        stale.tts_engine = "openai".to_string();
        stale.sticker_count = 4;
        align_with_routes(&conn, &mut stale)?;

        assert_eq!(stale.ai_provider, "gemini");
        assert_eq!(stale.ai_model, "gemini-3.8-flash");
        assert_eq!(stale.image_model, NO_IMAGE_MODEL);
        assert_eq!(stale.tts_engine, "gemini");
        assert_eq!(stale.sticker_count, 4, "non-AI fields are kept");
        Ok(())
    }

    #[test]
    fn align_is_a_no_op_before_routes_exist() -> Result<(), AppError> {
        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let conn = pool.get()?;
        let mut settings = SettingsRepo::get(&conn)?;
        settings.ai_provider = "groq".to_string();
        align_with_routes(&conn, &mut settings)?;
        assert_eq!(settings.ai_provider, "groq");
        Ok(())
    }

    #[test]
    fn preset_routes_use_profile_package_or_columns() {
        let mut settings = legacy_openai();
        settings.setup_profile = Some("paid-gemini".to_string());
        let (package, routes) = preset_routes(&settings);
        assert_eq!(package, PackageId::Gemini);
        let routes = routes_map(routes);
        assert_eq!(
            routes[&ModelRole::ImageGen],
            vec![RouteTarget::new("gemini", "gemini-3.1-flash-lite-image")],
            "paid profile includes illustrations"
        );

        settings.setup_profile = Some("advanced".to_string());
        let (package, routes) = preset_routes(&settings);
        assert_eq!(package, PackageId::Custom);
        assert_eq!(routes_map(routes)[&ModelRole::TextQuality][0].provider, "openai");
    }
}
