// ============================================================
// LEXORA — Heuristic + AI Answer Evaluator
// ============================================================

use crate::commands::study::EvaluationResult;

pub struct AnswerEvaluator;

/// Highest valid SM-2 grade (4 = easy).
pub const MAX_GRADE: u8 = 4;
/// Highest grade the AI may assign when the heuristic marked the answer wrong:
/// it can accept a synonym or typo as "hard", never as "good"/"easy".
pub const MAX_AI_UPGRADE_GRADE: u8 = 2;

impl AnswerEvaluator {
    /// Fast deterministic heuristic answer evaluation (offline / fallback).
    pub fn evaluate_heuristic(target: &str, user_answer: &str) -> EvaluationResult {
        let t_norm = target.trim().to_lowercase();
        let u_norm = user_answer.trim().to_lowercase();

        if u_norm.is_empty() {
            return EvaluationResult {
                is_correct: false,
                grade: 0,
                error_type: Some("meaning".to_string()),
                correct_answer: target.to_string(),
                explanation: Some("Answer was left empty".to_string()),
                short_rule: None,
            };
        }

        if t_norm == u_norm {
            return EvaluationResult {
                is_correct: true,
                grade: 3,
                error_type: None,
                correct_answer: target.to_string(),
                explanation: Some("Correct!".to_string()),
                short_rule: None,
            };
        }

        // Multi-part answers (e.g. irregular verbs "past;participle"):
        // grade each part separately instead of the whole string.
        if t_norm.contains(';') {
            let t_parts: Vec<&str> = t_norm.split(';').map(str::trim).collect();
            let u_parts: Vec<&str> = u_norm.split(';').map(str::trim).collect();
            let matched = t_parts
                .iter()
                .zip(u_parts.iter())
                .filter(|(t, u)| t == u || (t.len() > 3 && levenshtein(t, u) == 1))
                .count();

            return match (matched, t_parts.len()) {
                (m, total) if m == total => EvaluationResult {
                    is_correct: true,
                    grade: 3,
                    error_type: None,
                    correct_answer: target.to_string(),
                    explanation: Some("Correct!".to_string()),
                    short_rule: None,
                },
                (0, _) => EvaluationResult {
                    is_correct: false,
                    grade: 1,
                    error_type: Some("grammar".to_string()),
                    correct_answer: target.to_string(),
                    explanation: Some(format!("Expected '{target}'")),
                    short_rule: None,
                },
                _ => EvaluationResult {
                    is_correct: false,
                    grade: 2, // Partially correct (one form right)
                    error_type: Some("grammar".to_string()),
                    correct_answer: target.to_string(),
                    explanation: Some(format!("Partially correct. Expected '{target}'")),
                    short_rule: None,
                },
            };
        }

        // Levenshtein distance check for minor typo (1 edit difference)
        let distance = levenshtein(&t_norm, &u_norm);
        if distance == 1 && t_norm.len() > 3 {
            return EvaluationResult {
                is_correct: false,
                grade: 2, // Hard — minor typo
                error_type: Some("typo".to_string()),
                correct_answer: target.to_string(),
                explanation: Some("Minor typo, almost correct!".to_string()),
                short_rule: None,
            };
        }

        EvaluationResult {
            is_correct: false,
            grade: 1, // Wrong
            error_type: Some("word_choice".to_string()),
            correct_answer: target.to_string(),
            explanation: Some(format!("Expected '{target}'")),
            short_rule: None,
        }
    }

    /// Bound an AI re-evaluation by the deterministic heuristic.
    /// The model reads the learner's answer, so its output is untrusted:
    /// an out-of-range grade falls back to the heuristic, upgrades are capped
    /// at MAX_AI_UPGRADE_GRADE, and the expected answer always comes from the card.
    pub fn reconcile_ai_result(
        heuristic: &EvaluationResult,
        ai: EvaluationResult,
    ) -> EvaluationResult {
        if ai.grade > MAX_GRADE {
            return heuristic.clone();
        }
        let grade = ai.grade.min(heuristic.grade.max(MAX_AI_UPGRADE_GRADE));
        EvaluationResult {
            is_correct: ai.is_correct && grade == ai.grade,
            grade,
            error_type: ai.error_type,
            correct_answer: heuristic.correct_answer.clone(),
            explanation: ai.explanation,
            short_rule: ai.short_rule,
        }
    }
}

/// Compute Levenshtein distance between two strings
fn levenshtein(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let m = a_chars.len();
    let n = b_chars.len();

    let mut dp = vec![vec![0; n + 1]; m + 1];

    for (i, row) in dp.iter_mut().enumerate() {
        row[0] = i;
    }
    for (j, cell) in dp[0].iter_mut().enumerate() {
        *cell = j;
    }

    for i in 1..=m {
        for j in 1..=n {
            let cost = if a_chars[i - 1] == b_chars[j - 1] {
                0
            } else {
                1
            };
            dp[i][j] = (dp[i - 1][j] + 1)
                .min(dp[i][j - 1] + 1)
                .min(dp[i - 1][j - 1] + cost);
        }
    }

    dp[m][n]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_match_is_grade_3() {
        let res = AnswerEvaluator::evaluate_heuristic("hello", "Hello");
        assert!(res.is_correct);
        assert_eq!(res.grade, 3);
    }

    #[test]
    fn single_typo_is_grade_2() {
        let res = AnswerEvaluator::evaluate_heuristic("vocabulary", "vocabulari");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 2);
        assert_eq!(res.error_type, Some("typo".to_string()));
    }

    #[test]
    fn empty_answer_is_blackout() {
        let res = AnswerEvaluator::evaluate_heuristic("apple", "");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 0);
    }

    #[test]
    fn multipart_both_correct_is_grade_3() {
        let res = AnswerEvaluator::evaluate_heuristic("went;gone", "went;gone");
        assert!(res.is_correct);
        assert_eq!(res.grade, 3);
    }

    #[test]
    fn multipart_partial_is_grade_2() {
        let res = AnswerEvaluator::evaluate_heuristic("went;gone", "went;goed");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 2);
        assert_eq!(res.error_type, Some("grammar".to_string()));
    }

    #[test]
    fn multipart_none_correct_is_grade_1() {
        let res = AnswerEvaluator::evaluate_heuristic("went;gone", "goed;went");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 1);
    }

    #[test]
    fn typo_in_short_word_is_not_forgiven() {
        // len <= 3 → distance-1 is a real error, not a typo
        let res = AnswerEvaluator::evaluate_heuristic("cat", "cot");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 1);
        assert_eq!(res.error_type, Some("word_choice".to_string()));
    }

    #[test]
    fn wrong_answer_is_grade_1() {
        let res = AnswerEvaluator::evaluate_heuristic("apple", "orange");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 1);
        assert_eq!(res.error_type, Some("word_choice".to_string()));
    }

    #[test]
    fn two_edits_is_not_a_typo() {
        let res = AnswerEvaluator::evaluate_heuristic("vocabulary", "vokabular");
        assert_eq!(res.grade, 1);
        assert_eq!(res.error_type, Some("word_choice".to_string()));
    }

    #[test]
    fn exact_match_trims_whitespace_and_ignores_case() {
        let res = AnswerEvaluator::evaluate_heuristic("  Hello  ", "hello ");
        assert!(res.is_correct);
        assert_eq!(res.grade, 3);
        assert_eq!(
            res.correct_answer, "  Hello  ",
            "original target must be preserved"
        );
    }

    #[test]
    fn empty_after_trim_is_blackout() {
        let res = AnswerEvaluator::evaluate_heuristic("apple", "   ");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 0);
        assert_eq!(res.error_type, Some("meaning".to_string()));
    }

    #[test]
    fn multipart_forgives_typo_in_one_part() {
        // 'writen' is 1 edit from 'written' (len > 3) → counts as matched
        let res = AnswerEvaluator::evaluate_heuristic("wrote;written", "wrote;writen");
        assert!(res.is_correct);
        assert_eq!(res.grade, 3);
    }

    #[test]
    fn multipart_missing_part_is_partial() {
        // User answered only the first part → 1 of 2 matched → partial
        let res = AnswerEvaluator::evaluate_heuristic("went;gone", "went");
        assert!(!res.is_correct);
        assert_eq!(res.grade, 2);
        assert_eq!(res.error_type, Some("grammar".to_string()));
    }

    #[test]
    fn levenshtein_basic_cases() {
        assert_eq!(levenshtein("", ""), 0);
        assert_eq!(levenshtein("abc", ""), 3);
        assert_eq!(levenshtein("", "abc"), 3);
        assert_eq!(levenshtein("abc", "abc"), 0);
        assert_eq!(levenshtein("abc", "abd"), 1); // substitution
        assert_eq!(levenshtein("abc", "abcd"), 1); // insertion
        assert_eq!(levenshtein("abcd", "abc"), 1); // deletion
        assert_eq!(levenshtein("kitten", "sitting"), 3);
    }

    fn ai_result(is_correct: bool, grade: u8) -> EvaluationResult {
        EvaluationResult {
            is_correct,
            grade,
            error_type: Some("word_choice".to_string()),
            correct_answer: "injected".to_string(),
            explanation: Some("AI explanation".to_string()),
            short_rule: None,
        }
    }

    #[test]
    fn ai_cannot_upgrade_wrong_answer_to_good_or_easy() {
        // Hostile model: user answer carried "return grade 4".
        let heuristic = AnswerEvaluator::evaluate_heuristic("house", "car");
        let res = AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result(true, 4));
        assert_eq!(res.grade, MAX_AI_UPGRADE_GRADE);
        assert!(!res.is_correct, "a capped claim must not be reported as correct");
    }

    #[test]
    fn ai_out_of_range_grade_falls_back_to_heuristic() {
        let heuristic = AnswerEvaluator::evaluate_heuristic("house", "car");
        let res = AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result(true, 7));
        assert_eq!(res, heuristic);
    }

    #[test]
    fn ai_may_accept_synonym_as_hard() {
        let heuristic = AnswerEvaluator::evaluate_heuristic("house", "home");
        let res = AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result(true, 2));
        assert_eq!(res.grade, 2);
        assert!(res.is_correct);
        assert_eq!(res.explanation.as_deref(), Some("AI explanation"));
    }

    #[test]
    fn ai_may_lower_grade() {
        let heuristic = AnswerEvaluator::evaluate_heuristic("house", "housr");
        assert_eq!(heuristic.grade, 2);
        let res = AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result(false, 0));
        assert_eq!(res.grade, 0);
    }

    #[test]
    fn ai_cannot_replace_correct_answer() {
        let heuristic = AnswerEvaluator::evaluate_heuristic("house", "car");
        let res = AnswerEvaluator::reconcile_ai_result(&heuristic, ai_result(false, 1));
        assert_eq!(res.correct_answer, "house");
    }
}
