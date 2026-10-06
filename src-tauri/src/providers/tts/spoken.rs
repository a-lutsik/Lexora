// ============================================================
// LEXORA — Spoken forms for TTS + default IPA
// Homographs/acronyms the system voice otherwise reads as letters.
// ============================================================

/// Whole-token models: (normalized key, spoken form, IPA).
/// Keys are lowercase alphanumeric only (`ok` matches OK / O.K. / Ok).
const ENGLISH_TOKEN_MODELS: &[(&str, &str, &str)] = &[
    ("ok", "okay", "/oʊˈkeɪ/"),
    ("okay", "okay", "/oʊˈkeɪ/"),
    ("tv", "tee vee", "/ˌtiːˈviː/"),
    ("usa", "U S A", "/ˌjuːˌɛsˈeɪ/"),
    ("diy", "D I Y", "/ˌdiːaɪˈwaɪ/"),
    ("faq", "F A Q", "/ˌɛfeɪˈkjuː/"),
];

pub fn is_english(language: &str) -> bool {
    language_base(language) == "en"
}

pub fn language_base(language: &str) -> String {
    language
        .trim()
        .to_lowercase()
        .replace('_', "-")
        .split('-')
        .next()
        .unwrap_or("")
        .to_string()
}

pub fn language_region(language: &str) -> Option<String> {
    let normalized = language.trim().to_lowercase().replace('_', "-");
    let mut parts = normalized.split('-');
    let _base = parts.next()?;
    parts.next().filter(|s| !s.is_empty()).map(str::to_string)
}

/// Expand acronyms so TTS says "okay" instead of spelling or using a foreign reading.
pub fn spoken_form(text: &str, language: &str) -> String {
    if !is_english(language) {
        return text.to_string();
    }
    text.split_inclusive(char::is_whitespace)
        .map(expand_english_piece)
        .collect()
}

/// IPA to use when the learner left transcription empty.
pub fn canonical_ipa(text: &str, language: &str) -> Option<String> {
    if !is_english(language) {
        return None;
    }
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return None;
    }
    if let Some((_, _, ipa)) = lookup_model(&normalize_key(trimmed)) {
        return Some((*ipa).to_string());
    }
    let mut tokens = trimmed.split_whitespace();
    let first = tokens.next()?;
    if tokens.next().is_some() {
        return None;
    }
    let (_, core, _) = split_affixes(first);
    lookup_model(&normalize_key(core)).map(|(_, _, ipa)| (*ipa).to_string())
}

fn expand_english_piece(piece: &str) -> String {
    if piece.trim().is_empty() {
        return piece.to_string();
    }
    let (prefix, core, suffix) = split_affixes(piece);
    if core.is_empty() {
        return piece.to_string();
    }
    match lookup_model(&normalize_key(core)) {
        Some((_, spoken, _)) => format!("{prefix}{spoken}{suffix}"),
        None => piece.to_string(),
    }
}

fn lookup_model(key: &str) -> Option<(&'static str, &'static str, &'static str)> {
    ENGLISH_TOKEN_MODELS
        .iter()
        .copied()
        .find(|(k, _, _)| *k == key)
}

fn normalize_key(raw: &str) -> String {
    raw.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .flat_map(|c| c.to_lowercase())
        .collect()
}

fn split_affixes(token: &str) -> (&str, &str, &str) {
    let start = token
        .char_indices()
        .find(|(_, c)| c.is_alphanumeric())
        .map(|(i, _)| i)
        .unwrap_or(token.len());
    let end = token
        .char_indices()
        .rev()
        .find(|(_, c)| c.is_alphanumeric())
        .map(|(i, c)| i + c.len_utf8())
        .unwrap_or(start);
    if start >= end {
        return ("", token, "");
    }
    (&token[..start], &token[start..end], &token[end..])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spoken_form_expands_ok_for_english() {
        assert_eq!(spoken_form("OK", "en"), "okay");
        assert_eq!(spoken_form("Ok", "en-US"), "okay");
        assert_eq!(spoken_form("ok", "en_GB"), "okay");
        assert_eq!(spoken_form("O.K.", "en"), "okay.");
        assert_eq!(spoken_form("It's OK!", "en"), "It's okay!");
        assert_eq!(spoken_form("Say OK now", "en"), "Say okay now");
    }

    #[test]
    fn spoken_form_leaves_non_english_unchanged() {
        assert_eq!(spoken_form("OK", "ru"), "OK");
        assert_eq!(spoken_form("think", "en"), "think");
    }

    #[test]
    fn canonical_ipa_for_ok() {
        assert_eq!(canonical_ipa("OK", "en").as_deref(), Some("/oʊˈkeɪ/"));
        assert_eq!(canonical_ipa("  ok! ", "en").as_deref(), Some("/oʊˈkeɪ/"));
        assert_eq!(canonical_ipa("think", "en"), None);
        assert_eq!(canonical_ipa("OK", "ru"), None);
        assert_eq!(canonical_ipa("Say OK", "en"), None);
    }
}
