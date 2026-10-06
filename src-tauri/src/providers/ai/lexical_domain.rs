// ============================================================
// LEXORA — Lexical domain helpers (subject lexicon)
// ============================================================

/// Domains the model may return / we may store (excludes `auto`).
pub const RESOLVED_DOMAINS: &[&str] = &[
    "general",
    "it",
    "medicine",
    "legal",
    "finance",
    "business",
];

pub fn normalize_requested_domain(raw: Option<&str>) -> String {
    let trimmed = raw.unwrap_or("auto").trim().to_ascii_lowercase();
    if trimmed.is_empty() || trimmed == "auto" {
        return "auto".to_string();
    }
    if RESOLVED_DOMAINS.contains(&trimmed.as_str()) {
        trimmed
    } else {
        "auto".to_string()
    }
}

pub fn parse_resolved_domain(raw: Option<&str>) -> Option<String> {
    let trimmed = raw?.trim().to_ascii_lowercase();
    if RESOLVED_DOMAINS.contains(&trimmed.as_str()) {
        Some(trimmed)
    } else {
        None
    }
}

/// Single token without surrounding context → cannot reliably detect domain.
pub fn is_single_word_without_context(text: &str, context_sentence: Option<&str>) -> bool {
    if context_sentence.map(str::trim).is_some_and(|c| !c.is_empty()) {
        return false;
    }
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return true;
    }
    !trimmed.chars().any(char::is_whitespace)
}

/// Domain forced before the AI call.
/// `None` means Auto should ask the model to detect (phrases / context).
pub fn resolve_domain_for_request(
    selected: &str,
    text: &str,
    context_sentence: Option<&str>,
) -> Option<String> {
    let selected = normalize_requested_domain(Some(selected));
    if selected != "auto" {
        return Some(selected);
    }
    if is_single_word_without_context(text, context_sentence) {
        return Some("general".to_string());
    }
    None
}

/// Value written into prompts: concrete domain or `auto`.
pub fn domain_for_prompt(forced: Option<&str>) -> &str {
    forced.unwrap_or("auto")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_word_auto_forces_general() {
        assert_eq!(
            resolve_domain_for_request("auto", "Bug", None).as_deref(),
            Some("general")
        );
        assert_eq!(
            resolve_domain_for_request("auto", "  bug  ", None).as_deref(),
            Some("general")
        );
    }

    #[test]
    fn phrase_auto_defers_to_model() {
        assert_eq!(
            resolve_domain_for_request("auto", "We found a bug in the code", None),
            None
        );
        assert_eq!(
            resolve_domain_for_request("auto", "Bug", Some("fix the app")).as_deref(),
            None
        );
    }

    #[test]
    fn manual_domain_always_wins() {
        assert_eq!(
            resolve_domain_for_request("it", "Bug", None).as_deref(),
            Some("it")
        );
        assert_eq!(
            resolve_domain_for_request("medicine", "cold", None).as_deref(),
            Some("medicine")
        );
    }

    #[test]
    fn normalize_rejects_unknown() {
        assert_eq!(normalize_requested_domain(Some("sports")), "auto");
        assert_eq!(normalize_requested_domain(Some("IT")), "it");
        assert_eq!(normalize_requested_domain(None), "auto");
    }
}
