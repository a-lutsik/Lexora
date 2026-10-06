// ============================================================
// LEXORA — IPA helpers (offline pronunciation scoring)
// Deterministic: same inputs → same score / alignment.
// ============================================================

/// Longest-first IPA tokens (affricates, diphthongs, long vowels).
const IPA_TOKENS: &[&str] = &[
    "tʃ", "dʒ", "aɪ", "eɪ", "oʊ", "əʊ", "aʊ", "ɔɪ", "ɪə", "eə", "ʊə", "iː", "uː", "ɑː", "ɔː", "ɜː",
    "aː", "eː", "oː", "æ", "ʃ", "ʒ", "θ", "ð", "ŋ", "ɡ",
];

const STRESS_AND_BOUNDARIES: &[char] = &['/', '[', ']', 'ˈ', 'ˌ', '.', ' ', '\u{02C8}', '\u{02CC}'];

/// Strip transcription delimiters and stress marks.
pub fn normalize_ipa(raw: &str) -> String {
    raw.chars()
        .filter(|c| !STRESS_AND_BOUNDARIES.contains(c) && *c != '(' && *c != ')')
        .collect()
}

/// Greedy longest-match IPA tokenization.
pub fn tokenize_ipa(raw: &str) -> Vec<String> {
    let normalized = normalize_ipa(raw);
    let chars: Vec<char> = normalized.chars().collect();
    let mut tokens = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        let mut matched = None;
        for token in IPA_TOKENS {
            let tchars: Vec<char> = token.chars().collect();
            if i + tchars.len() <= chars.len() && chars[i..i + tchars.len()] == tchars[..] {
                matched = Some(token.to_string());
                i += tchars.len();
                break;
            }
        }
        if let Some(token) = matched {
            tokens.push(token);
        } else {
            tokens.push(chars[i].to_string());
            i += 1;
        }
    }
    tokens
}

/// Classic Levenshtein distance over IPA tokens (not UTF-16 code units).
pub fn token_levenshtein(a: &[String], b: &[String]) -> usize {
    let m = a.len();
    let n = b.len();
    if m == 0 {
        return n;
    }
    if n == 0 {
        return m;
    }

    let mut prev: Vec<usize> = (0..=n).collect();
    let mut curr = vec![0; n + 1];
    for i in 1..=m {
        curr[0] = i;
        for j in 1..=n {
            let cost = if a[i - 1] == b[j - 1] { 0 } else { 1 };
            curr[j] = (prev[j] + 1).min(curr[j - 1] + 1).min(prev[j - 1] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }
    prev[n]
}

/// 0–100 similarity from token Levenshtein.
pub fn ipa_similarity_score(target_ipa: &str, recognized_ipa: &str) -> u8 {
    let a = tokenize_ipa(target_ipa);
    let b = tokenize_ipa(recognized_ipa);
    if a.is_empty() && b.is_empty() {
        return 100;
    }
    let max_len = a.len().max(b.len());
    if max_len == 0 {
        return 0;
    }
    let dist = token_levenshtein(&a, &b);
    let ratio = 1.0 - (dist as f64 / max_len as f64);
    (ratio * 100.0).round().clamp(0.0, 100.0) as u8
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AlignedPhoneme {
    pub target_phoneme: String,
    pub recognized_phoneme: Option<String>,
    pub accuracy: u8,
    pub status: String,
    pub position: i64,
}

pub fn phoneme_status(accuracy: u8) -> &'static str {
    if accuracy >= 85 {
        "ok"
    } else if accuracy >= 50 {
        "close"
    } else {
        "miss"
    }
}

/// Align target tokens against recognized tokens (Wagner–Fischer backtrace).
pub fn align_phonemes(target_ipa: &str, recognized_ipa: &str) -> Vec<AlignedPhoneme> {
    let a = tokenize_ipa(target_ipa);
    let b = tokenize_ipa(recognized_ipa);
    let m = a.len();
    let n = b.len();

    let mut dp = vec![vec![0usize; n + 1]; m + 1];
    for (i, row) in dp.iter_mut().enumerate().take(m + 1) {
        row[0] = i;
    }
    for (j, val) in dp[0].iter_mut().enumerate().take(n + 1) {
        *val = j;
    }
    for i in 1..=m {
        for j in 1..=n {
            let cost = if a[i - 1] == b[j - 1] { 0 } else { 1 };
            dp[i][j] = (dp[i - 1][j] + 1)
                .min(dp[i][j - 1] + 1)
                .min(dp[i - 1][j - 1] + cost);
        }
    }

    let mut i = m;
    let mut j = n;
    let mut aligned_rev = Vec::new();
    while i > 0 || j > 0 {
        if i > 0 && j > 0 {
            let cost = if a[i - 1] == b[j - 1] { 0 } else { 1 };
            if dp[i][j] == dp[i - 1][j - 1] + cost {
                let accuracy = if cost == 0 { 100 } else { 40 };
                aligned_rev.push(AlignedPhoneme {
                    target_phoneme: a[i - 1].clone(),
                    recognized_phoneme: Some(b[j - 1].clone()),
                    accuracy,
                    status: phoneme_status(accuracy).to_string(),
                    position: (i - 1) as i64,
                });
                i -= 1;
                j -= 1;
                continue;
            }
        }
        if i > 0 && (j == 0 || dp[i][j] == dp[i - 1][j] + 1) {
            aligned_rev.push(AlignedPhoneme {
                target_phoneme: a[i - 1].clone(),
                recognized_phoneme: None,
                accuracy: 0,
                status: "miss".to_string(),
                position: (i - 1) as i64,
            });
            i -= 1;
            continue;
        }
        // extra recognized phoneme — skip (no target to attach)
        j = j.saturating_sub(1);
    }
    aligned_rev.reverse();
    aligned_rev
}

/// Offline pronunciation evaluation from two IPA strings (and optional orthography).
pub fn evaluate_offline(
    target_text: &str,
    target_ipa: &str,
    recognized_text: &str,
    recognized_ipa: &str,
) -> (u8, Vec<AlignedPhoneme>) {
    let ipa_target = if target_ipa.trim().is_empty() {
        target_text
    } else {
        target_ipa
    };
    let ipa_rec = if recognized_ipa.trim().is_empty() {
        recognized_text
    } else {
        recognized_ipa
    };
    let score = ipa_similarity_score(ipa_target, ipa_rec);
    let phonemes = align_phonemes(ipa_target, ipa_rec);
    (score, phonemes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenize_strips_slashes_and_splits_affricates() {
        assert_eq!(tokenize_ipa("/ʃiːp/"), vec!["ʃ", "iː", "p"]);
        assert_eq!(tokenize_ipa("/tʃiːp/"), vec!["tʃ", "iː", "p"]);
        assert_eq!(tokenize_ipa("ˈʃɪp"), vec!["ʃ", "ɪ", "p"]);
    }

    #[test]
    fn identical_ipa_scores_100() {
        assert_eq!(ipa_similarity_score("/ʃiːp/", "/ʃiːp/"), 100);
        assert_eq!(ipa_similarity_score("ʃɪp", "/ʃɪp/"), 100);
    }

    #[test]
    fn ship_vs_sheep_is_one_vowel_off() {
        let score = ipa_similarity_score("/ʃɪp/", "/ʃiːp/");
        assert!((60..100).contains(&score), "got {score}");
    }

    #[test]
    fn unrelated_words_score_low() {
        let score = ipa_similarity_score("/kæt/", "/ʃiːp/");
        assert!(score < 50, "got {score}");
    }

    #[test]
    fn alignment_marks_substituted_vowel() {
        let aligned = align_phonemes("/ʃɪp/", "/ʃiːp/");
        assert_eq!(aligned.len(), 3);
        assert_eq!(aligned[0].target_phoneme, "ʃ");
        assert_eq!(aligned[0].status, "ok");
        assert_eq!(aligned[1].target_phoneme, "ɪ");
        assert_ne!(aligned[1].status, "ok");
        assert_eq!(aligned[2].target_phoneme, "p");
        assert_eq!(aligned[2].status, "ok");
    }

    #[test]
    fn levenshtein_empty_and_equal() {
        assert_eq!(token_levenshtein(&[], &[]), 0);
        assert_eq!(token_levenshtein(&["a".into()], &[]), 1);
        assert_eq!(
            token_levenshtein(&["a".into(), "b".into()], &["a".into(), "b".into()]),
            0
        );
    }

    #[test]
    fn evaluate_offline_falls_back_to_orthography() {
        let (score, _) = evaluate_offline("cat", "", "cat", "");
        assert_eq!(score, 100);
        let (score, _) = evaluate_offline("cat", "", "cot", "");
        assert!(score < 100);
    }
}
