// ============================================================
// LEXORA — AI model roles
// Every AI call belongs to a role; each role has its own ordered
// chain of models (primary → fallbacks) in the `model_route` table.
// ============================================================

use serde::{Deserialize, Serialize};
use std::time::Duration;

use super::catalog::Capability;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelRole {
    /// Popup glosses, bulk/pack translation, card enrichment, short tips.
    TextFast,
    /// Documents, paragraphs, writing checks, dialogue turns, explanations.
    TextQuality,
    /// Photo / screenshot OCR and translation.
    Vision,
    /// Recorded speech: transcription, audio translation, pronunciation.
    SpeechToText,
    /// Live spoken conversation with the tutor (speech ↔ speech).
    RealtimeVoice,
    /// Live interpretation: speech in one language → speech in another.
    LiveInterpreter,
    /// Text-to-speech playback.
    Tts,
    /// Optional illustrations for word cards (paid on every cloud provider).
    ImageGen,
}

/// User-facing grouping: the Settings UI shows three roles plus optional illustrations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RoleGroup {
    Text,
    Images,
    Voice,
    Illustrations,
}

impl ModelRole {
    pub const ALL: [ModelRole; 8] = [
        ModelRole::TextFast,
        ModelRole::TextQuality,
        ModelRole::Vision,
        ModelRole::SpeechToText,
        ModelRole::RealtimeVoice,
        ModelRole::LiveInterpreter,
        ModelRole::Tts,
        ModelRole::ImageGen,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            ModelRole::TextFast => "text_fast",
            ModelRole::TextQuality => "text_quality",
            ModelRole::Vision => "vision",
            ModelRole::SpeechToText => "speech_to_text",
            ModelRole::RealtimeVoice => "realtime_voice",
            ModelRole::LiveInterpreter => "live_interpreter",
            ModelRole::Tts => "tts",
            ModelRole::ImageGen => "image_gen",
        }
    }

    pub fn parse(raw: &str) -> Option<ModelRole> {
        ModelRole::ALL
            .into_iter()
            .find(|role| role.as_str() == raw.trim())
    }

    pub fn group(self) -> RoleGroup {
        match self {
            ModelRole::TextFast | ModelRole::TextQuality => RoleGroup::Text,
            ModelRole::Vision => RoleGroup::Images,
            ModelRole::SpeechToText
            | ModelRole::RealtimeVoice
            | ModelRole::LiveInterpreter
            | ModelRole::Tts => RoleGroup::Voice,
            ModelRole::ImageGen => RoleGroup::Illustrations,
        }
    }

    /// Capability a model must have to serve this role.
    pub fn capability(self) -> Capability {
        match self {
            ModelRole::TextFast | ModelRole::TextQuality => Capability::Text,
            ModelRole::Vision => Capability::Vision,
            ModelRole::SpeechToText => Capability::Transcription,
            ModelRole::RealtimeVoice => Capability::RealtimeVoice,
            ModelRole::LiveInterpreter => Capability::LiveTranslation,
            ModelRole::Tts => Capability::Speech,
            ModelRole::ImageGen => Capability::ImageGeneration,
        }
    }

    /// Upper bound for one model attempt before the chain moves on.
    pub fn attempt_timeout(self) -> Duration {
        match self {
            ModelRole::TextFast => Duration::from_secs(30),
            ModelRole::TextQuality => Duration::from_secs(120),
            ModelRole::Vision => Duration::from_secs(90),
            ModelRole::SpeechToText => Duration::from_secs(120),
            ModelRole::RealtimeVoice | ModelRole::LiveInterpreter => Duration::from_secs(15),
            ModelRole::Tts => Duration::from_secs(45),
            ModelRole::ImageGen => Duration::from_secs(90),
        }
    }

    /// English label for backend error messages (consistent with AppError texts).
    pub fn label_en(self) -> &'static str {
        match self {
            ModelRole::TextFast => "Translation",
            ModelRole::TextQuality => "This feature",
            ModelRole::Vision => "Image translation",
            ModelRole::SpeechToText => "Speech recognition",
            ModelRole::RealtimeVoice => "Live dialogue",
            ModelRole::LiveInterpreter => "Live interpretation",
            ModelRole::Tts => "Speech playback",
            ModelRole::ImageGen => "Illustrations",
        }
    }

    /// Russian label for messages shown to the user.
    pub fn label_ru(self) -> &'static str {
        match self {
            ModelRole::TextFast => "Быстрый перевод",
            ModelRole::TextQuality => "Качественный текст",
            ModelRole::Vision => "Перевод картинок",
            ModelRole::SpeechToText => "Распознавание речи",
            ModelRole::RealtimeVoice => "Живой диалог",
            ModelRole::LiveInterpreter => "Синхронный перевод",
            ModelRole::Tts => "Озвучка",
            ModelRole::ImageGen => "Иллюстрации",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn role_names_round_trip() {
        for role in ModelRole::ALL {
            assert_eq!(ModelRole::parse(role.as_str()), Some(role));
            let json = serde_json::to_string(&role).expect("serialize");
            assert_eq!(json, format!("\"{}\"", role.as_str()));
        }
        assert_eq!(ModelRole::parse("unknown"), None);
    }

    #[test]
    fn voice_roles_are_grouped_together() {
        assert_eq!(ModelRole::Tts.group(), RoleGroup::Voice);
        assert_eq!(ModelRole::LiveInterpreter.group(), RoleGroup::Voice);
        assert_eq!(ModelRole::TextFast.group(), RoleGroup::Text);
        assert_eq!(ModelRole::ImageGen.group(), RoleGroup::Illustrations);
    }
}
