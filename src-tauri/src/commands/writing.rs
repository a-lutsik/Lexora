// ============================================================
// LEXORA — Writing Assistant Commands
// Stage 2: check_writing / rewrite_text — AI pipeline + persist.
// ============================================================

use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::writing::{
    WritingCheckDto, WritingErrorPatternDto, WritingIssueDto, WritingIssueInput, WritingRepo,
};
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::{CheckWritingRequest, RewriteRequest, WritingIssueRaw};
use serde::Deserialize;
use std::sync::Arc;
use tauri::{AppHandle, State};

/// Upper bound so a single request cannot flood the provider.
pub(crate) const MAX_WRITING_CHARS: usize = 8_000;

pub(crate) const REWRITE_MODES: &[&str] = &[
    "clearer",
    "shorter",
    "formal",
    "friendly",
    "professional",
    "simpler",
    "rephrase",
    "custom",
];

pub(crate) const ISSUE_STATUSES: &[&str] = &["pending", "accepted", "rejected"];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckWritingInput {
    pub text: String,
    pub language: Option<String>,
    /// Never store this check (system-wide check of text typed in other apps).
    #[serde(default)]
    pub ephemeral: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RewriteTextInput {
    pub text: String,
    pub language: Option<String>,
    pub mode: String,
    pub custom_prompt: Option<String>,
}

pub(crate) fn validate_writing_text(text: &str) -> Result<&str, AppError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Text is empty".to_string()));
    }
    if trimmed.chars().count() > MAX_WRITING_CHARS {
        return Err(AppError::Validation(format!(
            "Text is too long (max {MAX_WRITING_CHARS} characters)"
        )));
    }
    Ok(trimmed)
}

pub(crate) fn validate_rewrite_mode(mode: &str) -> Result<(), AppError> {
    if REWRITE_MODES.contains(&mode) {
        Ok(())
    } else {
        Err(AppError::Validation(format!(
            "Unknown rewrite mode '{mode}'. Expected one of: {}",
            REWRITE_MODES.join(", ")
        )))
    }
}

pub(crate) fn validate_custom_prompt(mode: &str, prompt: Option<&str>) -> Result<String, AppError> {
    let trimmed = prompt.map(str::trim).unwrap_or("");
    if mode == "custom" {
        if trimmed.is_empty() {
            return Err(AppError::Validation(
                "Custom prompt is required for custom rewrite mode".to_string(),
            ));
        }
        if trimmed.chars().count() > 500 {
            return Err(AppError::Validation(
                "Custom prompt is too long (max 500 characters)".to_string(),
            ));
        }
        return Ok(trimmed.to_string());
    }
    Ok(trimmed.to_string())
}

pub(crate) fn validate_issue_status(status: &str) -> Result<&str, AppError> {
    let trimmed = status.trim();
    if ISSUE_STATUSES.contains(&trimmed) {
        Ok(trimmed)
    } else {
        Err(AppError::Validation(format!(
            "Unknown issue status '{trimmed}'. Expected one of: {}",
            ISSUE_STATUSES.join(", ")
        )))
    }
}

pub(crate) fn validate_patterns_language(language: &str) -> Result<&str, AppError> {
    let trimmed = language.trim();
    if trimmed.is_empty() {
        Err(AppError::Validation("Language is empty".to_string()))
    } else {
        Ok(trimmed)
    }
}

/// Build a WritingCheckDto without touching the DB (privacy mode).
/// id = 0 signals to the frontend that the session was not persisted.
pub(crate) fn ephemeral_check_dto(
    text: String,
    language: String,
    overall_score: i64,
    summary: Option<String>,
    rewrite_mode: Option<String>,
    corrected_text: Option<String>,
    issues: &[WritingIssueRaw],
) -> WritingCheckDto {
    let created_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let issue_dtos: Vec<WritingIssueDto> = issues
        .iter()
        .enumerate()
        .map(|(idx, raw)| WritingIssueDto {
            id: idx as i64 + 1,
            writing_check_id: 0,
            category: raw.category.clone(),
            severity: raw.severity.clone(),
            original_fragment: raw.original_fragment.clone(),
            suggested_fix: raw.suggested_fix.clone(),
            explanation: raw.explanation.clone(),
            rule_hint: raw.rule_hint.clone(),
            offset_start: raw.offset_start,
            offset_end: raw.offset_end,
            status: "pending".to_string(),
        })
        .collect();

    WritingCheckDto {
        id: 0,
        original_text: text,
        corrected_text,
        language,
        issue_count: issue_dtos.len() as i64,
        accepted_count: 0,
        rejected_count: 0,
        overall_score,
        summary,
        rewrite_mode,
        issues: issue_dtos,
        created_at,
    }
}

fn issue_input_from_raw(raw: &WritingIssueRaw) -> WritingIssueInput {
    WritingIssueInput {
        category: raw.category.clone(),
        severity: raw.severity.clone(),
        original_fragment: raw.original_fragment.clone(),
        suggested_fix: raw.suggested_fix.clone(),
        explanation: raw.explanation.clone(),
        rule_hint: raw.rule_hint.clone(),
        offset_start: raw.offset_start,
        offset_end: raw.offset_end,
    }
}

fn char_slice(text: &str, start: i64, end: i64) -> Option<String> {
    if start < 0 || end < start {
        return None;
    }
    let start_u = usize::try_from(start).ok()?;
    let end_u = usize::try_from(end).ok()?;
    let total = text.chars().count();
    if end_u > total {
        return None;
    }
    Some(
        text.chars()
            .skip(start_u)
            .take(end_u.saturating_sub(start_u))
            .collect(),
    )
}

fn nearest_fragment_index(text: &str, fragment: &str, hint: i64) -> Option<i64> {
    if fragment.is_empty() {
        return None;
    }
    let haystack: Vec<char> = text.chars().collect();
    let needle: Vec<char> = fragment.chars().collect();
    if needle.len() > haystack.len() {
        return None;
    }
    let mut best: Option<(i64, i64)> = None;
    for start in 0..=haystack.len() - needle.len() {
        if haystack[start..start + needle.len()] == needle[..] {
            let dist = (start as i64 - hint).abs();
            match best {
                Some((best_dist, _)) if dist >= best_dist => {}
                _ => best = Some((dist, start as i64)),
            }
        }
    }
    best.map(|(_, idx)| idx)
}

/// Models often report offset_end as the last included character. The rest of
/// the pipeline uses exclusive ends (JS slice / Python). Snap ranges to original_fragment.
pub(crate) fn realign_writing_issues(text: &str, issues: &mut [WritingIssueRaw]) {
    for issue in issues.iter_mut() {
        let fragment = issue.original_fragment.as_str();
        let start = issue.offset_start;
        let end = issue.offset_end;
        if fragment.is_empty() {
            let max = text.chars().count() as i64;
            let clamped = start.clamp(0, max);
            issue.offset_start = clamped;
            issue.offset_end = clamped;
            continue;
        }
        if char_slice(text, start, end).as_deref() == Some(fragment) {
            continue;
        }
        if char_slice(text, start, end + 1).as_deref() == Some(fragment) {
            issue.offset_end = end + 1;
            continue;
        }
        if let Some(idx) = nearest_fragment_index(text, fragment, start) {
            issue.offset_start = idx;
            issue.offset_end = idx + fragment.chars().count() as i64;
        }
    }
}

#[tauri::command]
pub async fn check_writing(
    input: CheckWritingInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<WritingCheckDto, AppError> {
    let text = validate_writing_text(&input.text)?.to_string();

    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Writing assistant"));
    }

    let language = input
        .language
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(&settings.primary_language)
        .to_string();

    let registry = crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextQuality)?;
    let mut ai = registry
        .check_writing(CheckWritingRequest {
            text: text.clone(),
            language: language.clone(),
        })
        .await?;
    realign_writing_issues(&text, &mut ai.issues);

    // Privacy mode: чувствительный текст не попадает в БД вообще —
    // ни writing_check, ни writing_issue, ни writing_error_pattern.
    if settings.writing_privacy_mode || input.ephemeral {
        return Ok(ephemeral_check_dto(
            text,
            language,
            i64::from(ai.overall_score),
            Some(ai.summary),
            None,
            None,
            &ai.issues,
        ));
    }

    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    let check_id = WritingRepo::create_check(
        &tx,
        &text,
        &language,
        i64::from(ai.overall_score),
        Some(&ai.summary),
    )?;
    let issue_inputs: Vec<WritingIssueInput> = ai.issues.iter().map(issue_input_from_raw).collect();
    WritingRepo::insert_issues(&tx, check_id, &issue_inputs)?;
    for issue in &ai.issues {
        WritingRepo::increment_error_pattern(
            &tx,
            &issue.category,
            &language,
            Some(&issue.original_fragment),
            Some(&issue.suggested_fix),
        )?;
    }
    tx.commit()?;

    WritingRepo::get_check_with_issues(&conn, check_id)
}

#[tauri::command]
pub async fn rewrite_text(
    input: RewriteTextInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<WritingCheckDto, AppError> {
    let text = validate_writing_text(&input.text)?.to_string();
    validate_rewrite_mode(&input.mode)?;
    let custom_instruction = validate_custom_prompt(&input.mode, input.custom_prompt.as_deref())?;

    let pool = db.inner().clone();
    let settings = {
        let conn = pool.get()?;
        SettingsRepo::get(&conn)?
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Writing assistant"));
    }

    let language = input
        .language
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(&settings.primary_language)
        .to_string();

    let registry = crate::providers::models::router::registry_for_role(&app, &pool, &settings, crate::providers::models::roles::ModelRole::TextQuality)?;
    let ai = registry
        .rewrite_text(RewriteRequest {
            text: text.clone(),
            language: language.clone(),
            mode: input.mode.clone(),
            custom_instruction,
        })
        .await?;

    // Privacy mode: результат рерайта не персистится (см. check_writing).
    if settings.writing_privacy_mode {
        return Ok(ephemeral_check_dto(
            text,
            language,
            100,
            Some(ai.changes_summary),
            Some(input.mode),
            Some(ai.rewritten_text),
            &[],
        ));
    }

    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    let check_id = WritingRepo::create_rewrite(
        &tx,
        &text,
        &language,
        &ai.rewritten_text,
        &input.mode,
        Some(&ai.changes_summary),
    )?;
    tx.commit()?;

    WritingRepo::get_check_with_issues(&conn, check_id)
}

#[tauri::command]
pub async fn update_writing_issue_status(
    issue_id: i64,
    status: String,
    db: State<'_, Arc<DbPool>>,
) -> Result<WritingCheckDto, AppError> {
    let status = validate_issue_status(&status)?.to_string();

    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    let check_id = {
        let tx = conn.transaction()?;
        WritingRepo::update_issue_status(&tx, issue_id, &status)?;
        let check_id = WritingRepo::get_issue(&tx, issue_id)?.writing_check_id;
        tx.commit()?;
        check_id
    };

    WritingRepo::get_check_with_issues(&conn, check_id)
}

#[tauri::command]
pub async fn accept_all_issues(
    check_id: i64,
    db: State<'_, Arc<DbPool>>,
) -> Result<WritingCheckDto, AppError> {
    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    {
        let tx = conn.transaction()?;
        WritingRepo::accept_all_issues(&tx, check_id)?;
        tx.commit()?;
    }

    WritingRepo::get_check_with_issues(&conn, check_id)
}

#[tauri::command]
pub async fn get_writing_error_patterns(
    language: String,
    db: State<'_, Arc<DbPool>>,
) -> Result<Vec<WritingErrorPatternDto>, AppError> {
    let language = validate_patterns_language(&language)?.to_string();

    let pool = db.inner().clone();
    let conn = pool.get()?;
    WritingRepo::get_error_patterns(&conn, &language)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_writing_text_rejects_blank() {
        assert!(validate_writing_text("").is_err());
        assert!(validate_writing_text("   \n").is_err());
    }

    #[test]
    fn validate_writing_text_trims() {
        assert_eq!(validate_writing_text("  hello  ").unwrap(), "hello");
    }

    #[test]
    fn validate_writing_text_rejects_too_long() {
        let long = "a".repeat(MAX_WRITING_CHARS + 1);
        assert!(validate_writing_text(&long).is_err());
        let ok = "a".repeat(MAX_WRITING_CHARS);
        assert!(validate_writing_text(&ok).is_ok());
    }

    #[test]
    fn validate_rewrite_mode_accepts_known_modes() {
        for mode in REWRITE_MODES {
            assert!(validate_rewrite_mode(mode).is_ok(), "{mode}");
        }
    }

    #[test]
    fn validate_rewrite_mode_rejects_unknown() {
        let err = validate_rewrite_mode("poetic").unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
    }

    #[test]
    fn validate_custom_prompt_required_for_custom_mode() {
        let err = validate_custom_prompt("custom", None).unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
        let err = validate_custom_prompt("custom", Some("   ")).unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
        assert_eq!(
            validate_custom_prompt("custom", Some(" make a bullet list ")).unwrap(),
            "make a bullet list"
        );
        assert_eq!(validate_custom_prompt("clearer", None).unwrap(), "");
    }

    #[test]
    fn validate_issue_status_accepts_all_known_statuses() {
        for status in ISSUE_STATUSES {
            assert_eq!(validate_issue_status(status).unwrap(), *status);
        }
        // Тримим пробелы вокруг валидного статуса
        assert_eq!(validate_issue_status("  accepted ").unwrap(), "accepted");
    }

    #[test]
    fn validate_issue_status_rejects_unknown() {
        for bad in ["done", "ACCEPTED", "", "   "] {
            let err = validate_issue_status(bad).unwrap_err();
            assert!(matches!(err, AppError::Validation(_)), "{bad}");
        }
    }

    #[test]
    fn validate_patterns_language_rejects_blank() {
        for bad in ["", "   \n"] {
            let err = validate_patterns_language(bad).unwrap_err();
            assert!(matches!(err, AppError::Validation(_)), "{bad}");
        }
    }

    #[test]
    fn validate_patterns_language_trims() {
        assert_eq!(validate_patterns_language("  en ").unwrap(), "en");
    }

    fn raw_issue(
        category: &str,
        original: &str,
        fix: &str,
        start: i64,
        end: i64,
    ) -> WritingIssueRaw {
        WritingIssueRaw {
            category: category.to_string(),
            severity: "error".to_string(),
            original_fragment: original.to_string(),
            suggested_fix: fix.to_string(),
            explanation: "test explanation".to_string(),
            rule_hint: None,
            offset_start: start,
            offset_end: end,
        }
    }

    #[test]
    fn ephemeral_check_dto_marks_session_as_not_persisted() {
        let issues = vec![
            raw_issue("spelling", "he", "He", 0, 2),
            raw_issue("grammar", "go", "goes", 3, 5),
        ];
        let dto = ephemeral_check_dto(
            "he go home".to_string(),
            "en".to_string(),
            80,
            Some("Needs work".to_string()),
            None,
            None,
            &issues,
        );

        // id == 0 — контракт для фронтенда: сессия не персистилась
        assert_eq!(dto.id, 0);
        assert_eq!(dto.original_text, "he go home");
        assert_eq!(dto.language, "en");
        assert_eq!(dto.overall_score, 80);
        assert_eq!(dto.summary.as_deref(), Some("Needs work"));
        assert_eq!(dto.issue_count, 2);
        assert_eq!(dto.accepted_count, 0);
        assert_eq!(dto.rejected_count, 0);
        assert!(dto.corrected_text.is_none());
        assert!(dto.created_at > 0, "created_at — текущий unix timestamp");

        // Синтетические id issues: порядковые 1..n, writing_check_id = 0
        assert_eq!(dto.issues.len(), 2);
        for (idx, issue) in dto.issues.iter().enumerate() {
            assert_eq!(issue.id, idx as i64 + 1);
            assert_eq!(issue.writing_check_id, 0);
            assert_eq!(issue.status, "pending");
        }
        assert_eq!(dto.issues[0].original_fragment, "he");
        assert_eq!(dto.issues[1].suggested_fix, "goes");
    }

    #[test]
    fn ephemeral_check_dto_for_rewrite_carries_corrected_text() {
        let dto = ephemeral_check_dto(
            "Please find attached the file.".to_string(),
            "en".to_string(),
            100,
            Some("Simplified the phrasing.".to_string()),
            Some("clearer".to_string()),
            Some("The file is attached.".to_string()),
            &[],
        );

        assert_eq!(dto.id, 0);
        assert_eq!(dto.corrected_text.as_deref(), Some("The file is attached."));
        assert_eq!(dto.rewrite_mode.as_deref(), Some("clearer"));
        assert_eq!(dto.summary.as_deref(), Some("Simplified the phrasing."));
        assert_eq!(dto.overall_score, 100);
        assert_eq!(dto.issue_count, 0);
        assert!(dto.issues.is_empty());
        assert!(dto.created_at > 0);
    }

    #[test]
    fn realign_writing_issues_converts_inclusive_end_offsets() {
        let text = "Hi Andrew I would say I can't do it but I had to fix that bug";
        let but = "it but";
        let bug = "bug";
        let but_at = text.find(but).expect("but") as i64;
        let bug_at = text.find(bug).expect("bug") as i64;
        let mut issues = vec![
            raw_issue("punctuation", "Hi Andrew I", "Hi Andrew, I", 0, 10),
            raw_issue(
                "punctuation",
                but,
                "it, but",
                but_at,
                but_at + but.chars().count() as i64 - 1,
            ),
            raw_issue("punctuation", bug, "bug.", bug_at, bug_at + 2),
        ];
        realign_writing_issues(text, &mut issues);
        assert_eq!(issues[0].offset_start, 0);
        assert_eq!(issues[0].offset_end, 11);
        assert_eq!(issues[1].offset_end - issues[1].offset_start, 6);
        assert_eq!(issues[2].offset_end - issues[2].offset_start, 3);

        let mut rebuilt = text.to_string();
        for issue in issues.iter().rev() {
            let start = issue.offset_start as usize;
            let end = issue.offset_end as usize;
            let chars: Vec<char> = rebuilt.chars().collect();
            let prefix: String = chars[..start].iter().collect();
            let suffix: String = chars[end..].iter().collect();
            rebuilt = format!("{}{}{}", prefix, issue.suggested_fix, suffix);
        }
        assert_eq!(
            rebuilt,
            "Hi Andrew, I would say I can't do it, but I had to fix that bug."
        );
    }
}
