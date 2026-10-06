// ============================================================
// LEXORA — macOS `say` voice selection by language
// ============================================================

use std::sync::OnceLock;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InstalledVoice {
    pub name: String,
    pub locale: String,
}

pub fn is_placeholder_voice(voice: &str) -> bool {
    let v = voice.trim().to_lowercase();
    v.is_empty() || v == "default" || v == "alloy" || v == "system"
}

/// Prefer natural compact/premium voices over novelty ones (Albert, Bells, …).
pub fn preferred_voice_names(language_base: &str) -> &'static [&'static str] {
    match language_base {
        "en" => &[
            "Samantha", "Alex", "Allison", "Ava", "Tom", "Daniel", "Fred", "Kathy", "Karen",
            "Moira", "Tessa",
        ],
        "ru" => &["Milena", "Yuri", "Katya"],
        "de" => &["Anna", "Helena", "Markus", "Petra"],
        "fr" => &["Thomas", "Amelie", "Audrey"],
        "es" => &["Monica", "Jorge", "Paulina", "Juan"],
        "it" => &["Alice", "Luca"],
        "pt" => &["Luciana", "Joana"],
        "zh" => &["Ting-Ting", "Tingting", "Meijia", "Sin-ji"],
        "ja" => &["Kyoko", "Otoya"],
        "ko" => &["Yuna"],
        "pl" => &["Zosia", "Ewa"],
        "uk" => &["Lesya"],
        "nl" => &["Xander", "Claire", "Ellen"],
        "sv" => &["Alva"],
        "tr" => &["Yelda"],
        "ar" => &["Maged"],
        "hi" => &["Lekha"],
        "th" => &["Kanya"],
        "vi" => &["Linh"],
        "el" => &["Melina"],
        "he" => &["Carmit"],
        "id" => &["Damayanti"],
        "ro" => &["Ioana"],
        "hu" => &["Mariska"],
        "sk" => &["Laura"],
        "hr" => &["Lana"],
        "bg" => &["Daria"],
        _ => &[],
    }
}

pub fn parse_say_voice_list(output: &str) -> Vec<InstalledVoice> {
    output
        .lines()
        .filter_map(|line| {
            let without_comment = line.split(" #").next().unwrap_or(line).trim();
            if without_comment.is_empty() {
                return None;
            }
            let (name, locale) = without_comment.rsplit_once(char::is_whitespace)?;
            let locale = locale.trim();
            if !is_locale_tag(locale) {
                return None;
            }
            Some(InstalledVoice {
                name: name.trim().to_string(),
                locale: locale.to_string(),
            })
        })
        .collect()
}

pub fn pick_voice(language: &str, requested: &str, voices: &[InstalledVoice]) -> Option<String> {
    if !is_placeholder_voice(requested) {
        let requested_trim = requested.trim();
        if voices
            .iter()
            .any(|v| v.name.eq_ignore_ascii_case(requested_trim))
        {
            return Some(requested_trim.to_string());
        }
    }

    let base = super::spoken::language_base(language);
    if base.is_empty() {
        return None;
    }
    let region = super::spoken::language_region(language);

    let matching: Vec<&InstalledVoice> = voices
        .iter()
        .filter(|v| locale_base(&v.locale) == base)
        .collect();
    if matching.is_empty() {
        return None;
    }

    let preferred = preferred_voice_names(&base);
    if let Some(region) = region.as_deref() {
        for name in preferred {
            if let Some(voice) = matching.iter().find(|v| {
                v.name.eq_ignore_ascii_case(name)
                    && locale_region(&v.locale).as_deref() == Some(region)
            }) {
                return Some(voice.name.clone());
            }
        }
    }
    for name in preferred {
        if let Some(voice) = matching.iter().find(|v| v.name.eq_ignore_ascii_case(name)) {
            return Some(voice.name.clone());
        }
    }
    if let Some(region) = region.as_deref() {
        if let Some(voice) = matching
            .iter()
            .find(|v| locale_region(&v.locale).as_deref() == Some(region))
        {
            return Some(voice.name.clone());
        }
    }
    matching.first().map(|v| v.name.clone())
}

#[cfg(target_os = "macos")]
pub fn installed_macos_voices() -> &'static [InstalledVoice] {
    static VOICES: OnceLock<Vec<InstalledVoice>> = OnceLock::new();
    VOICES.get_or_init(|| {
        let output = std::process::Command::new("say")
            .arg("-v")
            .arg("?")
            .output();
        match output {
            Ok(out) => parse_say_voice_list(&String::from_utf8_lossy(&out.stdout)),
            Err(_) => Vec::new(),
        }
    })
}

#[cfg(not(target_os = "macos"))]
pub fn installed_macos_voices() -> &'static [InstalledVoice] {
    static EMPTY: OnceLock<Vec<InstalledVoice>> = OnceLock::new();
    EMPTY.get_or_init(Vec::new)
}

pub fn resolve_system_voice(language: &str, requested: &str) -> Option<String> {
    pick_voice(language, requested, installed_macos_voices())
}

fn is_locale_tag(s: &str) -> bool {
    let mut parts = s.split(['_', '-']);
    let Some(lang) = parts.next() else {
        return false;
    };
    if lang.len() < 2 || lang.len() > 3 || !lang.chars().all(|c| c.is_ascii_alphabetic()) {
        return false;
    }
    true
}

fn locale_base(locale: &str) -> String {
    locale.split(['_', '-']).next().unwrap_or("").to_lowercase()
}

fn locale_region(locale: &str) -> Option<String> {
    locale
        .split(['_', '-'])
        .nth(1)
        .map(str::to_lowercase)
        .filter(|s| !s.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_voices() -> Vec<InstalledVoice> {
        parse_say_voice_list(
            "Albert              en_US    # Hello! My name is Albert.\n\
             Bad News            en_US    # Hello! My name is Bad News.\n\
             Daniel              en_GB    # Hi my name is Daniel\n\
             Fred                en_US    # Hello! My name is Fred.\n\
             Milena              ru_RU    # Hi my name is Milena\n\
             Samantha            en_US    # Hi my name is Samantha\n\
             Maged               ar_001  # Hi my name is Maged\n",
        )
    }

    #[test]
    fn parse_handles_spaced_voice_names_and_locales() {
        let voices = sample_voices();
        assert!(voices
            .iter()
            .any(|v| v.name == "Bad News" && v.locale == "en_US"));
        assert!(voices
            .iter()
            .any(|v| v.name == "Samantha" && v.locale == "en_US"));
        assert!(voices
            .iter()
            .any(|v| v.name == "Maged" && v.locale == "ar_001"));
    }

    #[test]
    fn pick_prefers_samantha_over_novelty_english_voices() {
        let voices = sample_voices();
        assert_eq!(
            pick_voice("en", "default", &voices).as_deref(),
            Some("Samantha")
        );
        assert_eq!(
            pick_voice("en-GB", "default", &voices).as_deref(),
            Some("Daniel")
        );
        assert_eq!(
            pick_voice("ru", "default", &voices).as_deref(),
            Some("Milena")
        );
    }

    #[test]
    fn pick_honors_an_installed_requested_voice() {
        let voices = sample_voices();
        assert_eq!(pick_voice("en", "Fred", &voices).as_deref(), Some("Fred"));
        assert_eq!(
            pick_voice("en", "alloy", &voices).as_deref(),
            Some("Samantha")
        );
    }
}
