// ============================================================
// LEXORA — Model packages
// A package fills every role with models of one provider so the
// user needs a single key. "custom" = per-role overrides (advanced).
// ============================================================

use serde::{Deserialize, Serialize};

use super::roles::ModelRole;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PackageId {
    Gemini,
    Openai,
    Local,
    Offline,
    Cloudflare,
    Custom,
}

impl PackageId {
    pub fn as_str(self) -> &'static str {
        match self {
            PackageId::Gemini => "gemini",
            PackageId::Openai => "openai",
            PackageId::Local => "local",
            PackageId::Offline => "offline",
            PackageId::Cloudflare => "cloudflare",
            PackageId::Custom => "custom",
        }
    }

    pub fn parse(raw: &str) -> Option<PackageId> {
        match raw.trim() {
            "gemini" => Some(PackageId::Gemini),
            "openai" => Some(PackageId::Openai),
            "local" => Some(PackageId::Local),
            "offline" => Some(PackageId::Offline),
            "cloudflare" => Some(PackageId::Cloudflare),
            "custom" => Some(PackageId::Custom),
            _ => None,
        }
    }

    /// Provider whose API key the package needs (None = no key).
    pub fn key_provider(self) -> Option<&'static str> {
        match self {
            PackageId::Gemini => Some("gemini"),
            PackageId::Openai => Some("openai"),
            PackageId::Cloudflare => Some("cloudflare"),
            PackageId::Local | PackageId::Offline | PackageId::Custom => None,
        }
    }

    /// Package implied by the legacy guided-setup profile (V022).
    pub fn from_setup_profile(profile: &str) -> Option<PackageId> {
        match profile {
            "gemini-free" | "paid-gemini" => Some(PackageId::Gemini),
            "paid-openai" => Some(PackageId::Openai),
            "free-cloudflare" => Some(PackageId::Cloudflare),
            "zero" => Some(PackageId::Offline),
            "local" => Some(PackageId::Local),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RouteTarget {
    pub provider: String,
    pub model: String,
}

impl RouteTarget {
    pub fn new(provider: &str, model: &str) -> Self {
        Self {
            provider: provider.to_string(),
            model: model.to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageOptions {
    /// Generate illustrations with a paid image model (off by default).
    #[serde(default)]
    pub illustrations: bool,
}

fn chain(targets: &[(&str, &str)]) -> Vec<RouteTarget> {
    targets
        .iter()
        .map(|(provider, model)| RouteTarget::new(provider, model))
        .collect()
}

/// Routes for a package; roles the package cannot serve get an empty chain.
pub fn package_routes(package: PackageId, options: PackageOptions) -> Vec<(ModelRole, Vec<RouteTarget>)> {
    let system_voice = ("system", "say");
    let routes: Vec<(ModelRole, Vec<RouteTarget>)> = match package {
        PackageId::Gemini => vec![
            (
                ModelRole::TextFast,
                chain(&[("gemini", "gemini-3.5-flash-lite"), ("gemini", "gemini-3.8-flash")]),
            ),
            (
                ModelRole::TextQuality,
                chain(&[("gemini", "gemini-3.8-flash"), ("gemini", "gemini-3.5-flash-lite")]),
            ),
            (
                ModelRole::Vision,
                chain(&[("gemini", "gemini-3.8-flash"), ("gemini", "gemini-3.5-flash-lite")]),
            ),
            (
                ModelRole::SpeechToText,
                chain(&[("gemini", "gemini-3.8-flash"), ("gemini", "gemini-3.5-flash-lite")]),
            ),
            (ModelRole::RealtimeVoice, chain(&[("gemini", "gemini-3.8-live")])),
            (
                ModelRole::LiveInterpreter,
                chain(&[("gemini", "gemini-3.5-live-translate-preview")]),
            ),
            (
                ModelRole::Tts,
                chain(&[("gemini", "gemini-3.8-flash-lite-tts"), system_voice]),
            ),
            (
                ModelRole::ImageGen,
                if options.illustrations {
                    chain(&[("gemini", "gemini-3.1-flash-lite-image")])
                } else {
                    Vec::new()
                },
            ),
        ],
        PackageId::Openai => vec![
            (ModelRole::TextFast, chain(&[("openai", "gpt-6-luna")])),
            (
                ModelRole::TextQuality,
                chain(&[("openai", "gpt-6.1-sol"), ("openai", "gpt-6-luna")]),
            ),
            (ModelRole::Vision, chain(&[("openai", "gpt-6-luna")])),
            (ModelRole::SpeechToText, chain(&[("openai", "gpt-transcribe")])),
            (ModelRole::RealtimeVoice, chain(&[("openai", "gpt-realtime-2.1-mini")])),
            (
                ModelRole::LiveInterpreter,
                chain(&[("openai", "gpt-realtime-translate")]),
            ),
            (ModelRole::Tts, chain(&[("openai", "gpt-4o-mini-tts"), system_voice])),
            (
                ModelRole::ImageGen,
                if options.illustrations {
                    chain(&[("openai", "gpt-image-2.5-flare")])
                } else {
                    Vec::new()
                },
            ),
        ],
        PackageId::Local => vec![
            (ModelRole::TextFast, chain(&[("custom", "gemma4")])),
            (ModelRole::TextQuality, chain(&[("custom", "gemma4")])),
            (ModelRole::Vision, chain(&[("custom", "gemma4")])),
            (ModelRole::SpeechToText, Vec::new()),
            (ModelRole::RealtimeVoice, Vec::new()),
            (ModelRole::LiveInterpreter, Vec::new()),
            (ModelRole::Tts, chain(&[system_voice])),
            (ModelRole::ImageGen, Vec::new()),
        ],
        PackageId::Cloudflare => vec![
            (
                ModelRole::TextFast,
                chain(&[("cloudflare", "@cf/meta/llama-3.1-8b-instruct")]),
            ),
            (
                ModelRole::TextQuality,
                chain(&[("cloudflare", "@cf/meta/llama-3.1-8b-instruct")]),
            ),
            (ModelRole::Vision, Vec::new()),
            (ModelRole::SpeechToText, Vec::new()),
            (ModelRole::RealtimeVoice, Vec::new()),
            (ModelRole::LiveInterpreter, Vec::new()),
            (ModelRole::Tts, chain(&[system_voice])),
            (
                ModelRole::ImageGen,
                chain(&[("cloudflare", "@cf/black-forest-labs/flux-1-schnell")]),
            ),
        ],
        PackageId::Offline | PackageId::Custom => vec![
            (ModelRole::TextFast, chain(&[("offline", "offline-built-in")])),
            (ModelRole::TextQuality, chain(&[("offline", "offline-built-in")])),
            (ModelRole::Vision, Vec::new()),
            (ModelRole::SpeechToText, Vec::new()),
            (ModelRole::RealtimeVoice, Vec::new()),
            (ModelRole::LiveInterpreter, Vec::new()),
            (ModelRole::Tts, chain(&[system_voice])),
            (ModelRole::ImageGen, Vec::new()),
        ],
    };
    routes
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::models::catalog::{support, Support};

    #[test]
    fn every_package_covers_every_role_once() {
        for package in [
            PackageId::Gemini,
            PackageId::Openai,
            PackageId::Local,
            PackageId::Offline,
            PackageId::Cloudflare,
        ] {
            let routes = package_routes(package, PackageOptions::default());
            for role in ModelRole::ALL {
                assert_eq!(
                    routes.iter().filter(|(r, _)| *r == role).count(),
                    1,
                    "{package:?} must define {role:?} exactly once"
                );
            }
        }
    }

    #[test]
    fn package_models_have_the_capability_of_their_role() {
        let options = PackageOptions { illustrations: true };
        for package in [PackageId::Gemini, PackageId::Openai, PackageId::Cloudflare] {
            for (role, targets) in package_routes(package, options) {
                for target in targets {
                    assert_eq!(
                        support(&target.provider, &target.model, role.capability()),
                        Support::Yes,
                        "{package:?}: {}:{} cannot serve {role:?}",
                        target.provider,
                        target.model
                    );
                }
            }
        }
    }

    #[test]
    fn gemini_illustrations_are_opt_in() {
        let off = package_routes(PackageId::Gemini, PackageOptions::default());
        let image_off = off.iter().find(|(r, _)| *r == ModelRole::ImageGen).map(|(_, t)| t.len());
        assert_eq!(image_off, Some(0));

        let on = package_routes(PackageId::Gemini, PackageOptions { illustrations: true });
        let image_on = on.iter().find(|(r, _)| *r == ModelRole::ImageGen).map(|(_, t)| t.clone());
        assert_eq!(
            image_on,
            Some(vec![RouteTarget::new("gemini", "gemini-3.1-flash-lite-image")])
        );
    }

    #[test]
    fn legacy_setup_profiles_map_to_packages() {
        assert_eq!(PackageId::from_setup_profile("paid-gemini"), Some(PackageId::Gemini));
        assert_eq!(PackageId::from_setup_profile("gemini-free"), Some(PackageId::Gemini));
        assert_eq!(PackageId::from_setup_profile("zero"), Some(PackageId::Offline));
        assert_eq!(PackageId::from_setup_profile("advanced"), None);
    }
}
