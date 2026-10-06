// ============================================================
// LEXORA — Writing Repository
// Stage 2: DB access for writing checks, issues, error patterns.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

// ── DTO Types ────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WritingCheckDto {
    pub id: i64,
    pub original_text: String,
    pub corrected_text: Option<String>,
    pub language: String,
    pub issue_count: i64,
    pub accepted_count: i64,
    pub rejected_count: i64,
    pub overall_score: i64,
    pub summary: Option<String>,
    pub rewrite_mode: Option<String>,
    pub issues: Vec<WritingIssueDto>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WritingIssueDto {
    pub id: i64,
    pub writing_check_id: i64,
    pub category: String,
    pub severity: String,
    pub original_fragment: String,
    pub suggested_fix: String,
    pub explanation: String,
    pub rule_hint: Option<String>,
    pub offset_start: i64,
    pub offset_end: i64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WritingErrorPatternDto {
    pub id: i64,
    pub category: String,
    pub language: String,
    pub occurrence_count: i64,
    pub last_seen_at: i64,
    pub sample_original: Option<String>,
    pub sample_fix: Option<String>,
}

/// Input for inserting a single writing issue (before DB id is assigned).
#[derive(Debug, Clone)]
pub struct WritingIssueInput {
    pub category: String,
    pub severity: String,
    pub original_fragment: String,
    pub suggested_fix: String,
    pub explanation: String,
    pub rule_hint: Option<String>,
    pub offset_start: i64,
    pub offset_end: i64,
}

// ── Repository ───────────────────────────────────────────

pub struct WritingRepo;

impl WritingRepo {
    /// Create a new writing check session, returning its id.
    pub fn create_check(
        conn: &Connection,
        original_text: &str,
        language: &str,
        overall_score: i64,
        summary: Option<&str>,
    ) -> Result<i64, AppError> {
        conn.execute(
            "INSERT INTO writing_check (original_text, language, overall_score, summary)
             VALUES (?1, ?2, ?3, ?4)",
            params![original_text, language, overall_score, summary],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Persist a rewrite as a writing_check row (no issues).
    pub fn create_rewrite(
        conn: &Connection,
        original_text: &str,
        language: &str,
        rewritten_text: &str,
        rewrite_mode: &str,
        summary: Option<&str>,
    ) -> Result<i64, AppError> {
        conn.execute(
            "INSERT INTO writing_check
             (original_text, language, overall_score, summary, rewrite_mode, corrected_text)
             VALUES (?1, ?2, 100, ?3, ?4, ?5)",
            params![
                original_text,
                language,
                summary,
                rewrite_mode,
                rewritten_text
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Insert multiple issues for a check in a batch.
    pub fn insert_issues(
        conn: &Connection,
        check_id: i64,
        issues: &[WritingIssueInput],
    ) -> Result<Vec<i64>, AppError> {
        let mut ids = Vec::with_capacity(issues.len());
        let mut stmt = conn.prepare(
            "INSERT INTO writing_issue
             (writing_check_id, category, severity, original_fragment, suggested_fix,
              explanation, rule_hint, offset_start, offset_end)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        )?;

        for issue in issues {
            stmt.execute(params![
                check_id,
                issue.category,
                issue.severity,
                issue.original_fragment,
                issue.suggested_fix,
                issue.explanation,
                issue.rule_hint,
                issue.offset_start,
                issue.offset_end,
            ])?;
            ids.push(conn.last_insert_rowid());
        }

        // Update issue_count on the check
        conn.execute(
            "UPDATE writing_check SET issue_count = ?1 WHERE id = ?2",
            params![issues.len() as i64, check_id],
        )?;

        Ok(ids)
    }

    /// Update a single issue status (accept/reject).
    pub fn update_issue_status(
        conn: &Connection,
        issue_id: i64,
        status: &str,
    ) -> Result<(), AppError> {
        let rows = conn.execute(
            "UPDATE writing_issue SET status = ?1 WHERE id = ?2",
            params![status, issue_id],
        )?;
        if rows == 0 {
            return Err(AppError::NotFound(format!(
                "Writing issue {issue_id} not found"
            )));
        }

        // Re-count accepted/rejected on the parent check
        let check_id: i64 = conn.query_row(
            "SELECT writing_check_id FROM writing_issue WHERE id = ?1",
            params![issue_id],
            |row| row.get(0),
        )?;
        Self::recount_check_statuses(conn, check_id)?;

        Ok(())
    }

    /// Accept all pending issues for a check.
    pub fn accept_all_issues(conn: &Connection, check_id: i64) -> Result<(), AppError> {
        conn.execute(
            "UPDATE writing_issue SET status = 'accepted'
             WHERE writing_check_id = ?1 AND status = 'pending'",
            params![check_id],
        )?;
        Self::recount_check_statuses(conn, check_id)?;
        Self::build_corrected_text(conn, check_id)?;
        Ok(())
    }

    /// Convert exclusive character offsets into UTF-8 byte offsets.
    fn char_span_to_bytes(text: &str, start: usize, end: usize) -> Option<(usize, usize)> {
        if start > end {
            return None;
        }
        let mut starts: Vec<usize> = text.char_indices().map(|(i, _)| i).collect();
        starts.push(text.len());
        if end < starts.len() {
            Some((starts[start], starts[end]))
        } else {
            None
        }
    }

    /// Build corrected text by applying all accepted fixes (sorted by offset descending
    /// to preserve positions when replacing).
    fn build_corrected_text(conn: &Connection, check_id: i64) -> Result<(), AppError> {
        let original: String = conn.query_row(
            "SELECT original_text FROM writing_check WHERE id = ?1",
            params![check_id],
            |row| row.get(0),
        )?;

        let mut stmt = conn.prepare(
            "SELECT offset_start, offset_end, suggested_fix FROM writing_issue
             WHERE writing_check_id = ?1 AND status = 'accepted'
             ORDER BY offset_start DESC",
        )?;
        let fixes: Vec<(usize, usize, String)> = stmt
            .query_map(params![check_id], |row| {
                Ok((
                    row.get::<_, i64>(0)? as usize,
                    row.get::<_, i64>(1)? as usize,
                    row.get::<_, String>(2)?,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let mut corrected = original;
        for (start, end, fix) in fixes {
            // Character offsets from the LLM / realigner. Convert to UTF-8 bytes
            // so replace_range does not panic on a mid-codepoint index.
            if let Some((bstart, bend)) = Self::char_span_to_bytes(&corrected, start, end) {
                if corrected.get(bstart..bend).is_some() {
                    corrected.replace_range(bstart..bend, &fix);
                }
            }
        }

        conn.execute(
            "UPDATE writing_check SET corrected_text = ?1 WHERE id = ?2",
            params![corrected, check_id],
        )?;
        Ok(())
    }

    /// Re-count accepted/rejected totals on a check.
    fn recount_check_statuses(conn: &Connection, check_id: i64) -> Result<(), AppError> {
        conn.execute(
            "UPDATE writing_check SET
                accepted_count = (SELECT COUNT(*) FROM writing_issue
                                  WHERE writing_check_id = ?1 AND status = 'accepted'),
                rejected_count = (SELECT COUNT(*) FROM writing_issue
                                  WHERE writing_check_id = ?1 AND status = 'rejected')
             WHERE id = ?1",
            params![check_id],
        )?;
        Ok(())
    }

    /// Increment (or create) an error pattern for a category.
    pub fn increment_error_pattern(
        conn: &Connection,
        category: &str,
        language: &str,
        sample_original: Option<&str>,
        sample_fix: Option<&str>,
    ) -> Result<(), AppError> {
        conn.execute(
            "INSERT INTO writing_error_pattern (category, language, occurrence_count, sample_original, sample_fix)
             VALUES (?1, ?2, 1, ?3, ?4)
             ON CONFLICT(category, language) DO UPDATE SET
                occurrence_count = occurrence_count + 1,
                last_seen_at = unixepoch(),
                sample_original = COALESCE(?3, sample_original),
                sample_fix = COALESCE(?4, sample_fix)",
            params![category, language, sample_original, sample_fix],
        )?;
        Ok(())
    }

    /// Get all error patterns for a language, ordered by frequency.
    pub fn get_error_patterns(
        conn: &Connection,
        language: &str,
    ) -> Result<Vec<WritingErrorPatternDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, category, language, occurrence_count, last_seen_at,
                    sample_original, sample_fix
             FROM writing_error_pattern
             WHERE language = ?1
             ORDER BY occurrence_count DESC",
        )?;
        let patterns = stmt
            .query_map(params![language], |row| {
                Ok(WritingErrorPatternDto {
                    id: row.get(0)?,
                    category: row.get(1)?,
                    language: row.get(2)?,
                    occurrence_count: row.get(3)?,
                    last_seen_at: row.get(4)?,
                    sample_original: row.get(5)?,
                    sample_fix: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(patterns)
    }

    /// Get a check with all its issues.
    pub fn get_check_with_issues(
        conn: &Connection,
        check_id: i64,
    ) -> Result<WritingCheckDto, AppError> {
        let check = conn
            .query_row(
                "SELECT id, original_text, corrected_text, language, issue_count,
                    accepted_count, rejected_count, overall_score, summary,
                    rewrite_mode, created_at
             FROM writing_check WHERE id = ?1",
                params![check_id],
                |row| {
                    Ok(WritingCheckDto {
                        id: row.get(0)?,
                        original_text: row.get(1)?,
                        corrected_text: row.get(2)?,
                        language: row.get(3)?,
                        issue_count: row.get(4)?,
                        accepted_count: row.get(5)?,
                        rejected_count: row.get(6)?,
                        overall_score: row.get(7)?,
                        summary: row.get(8)?,
                        rewrite_mode: row.get(9)?,
                        issues: Vec::new(),
                        created_at: row.get(10)?,
                    })
                },
            )
            .map_err(|_| AppError::NotFound(format!("Writing check {check_id} not found")))?;

        let issues = Self::get_issues_for_check(conn, check_id)?;
        Ok(WritingCheckDto { issues, ..check })
    }

    /// Get issues for a specific check.
    fn get_issues_for_check(
        conn: &Connection,
        check_id: i64,
    ) -> Result<Vec<WritingIssueDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, writing_check_id, category, severity, original_fragment,
                    suggested_fix, explanation, rule_hint, offset_start, offset_end, status
             FROM writing_issue
             WHERE writing_check_id = ?1
             ORDER BY offset_start ASC",
        )?;
        let issues = stmt
            .query_map(params![check_id], |row| {
                Ok(WritingIssueDto {
                    id: row.get(0)?,
                    writing_check_id: row.get(1)?,
                    category: row.get(2)?,
                    severity: row.get(3)?,
                    original_fragment: row.get(4)?,
                    suggested_fix: row.get(5)?,
                    explanation: row.get(6)?,
                    rule_hint: row.get(7)?,
                    offset_start: row.get(8)?,
                    offset_end: row.get(9)?,
                    status: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(issues)
    }

    /// Get a single issue by id.
    pub fn get_issue(conn: &Connection, issue_id: i64) -> Result<WritingIssueDto, AppError> {
        conn.query_row(
            "SELECT id, writing_check_id, category, severity, original_fragment,
                    suggested_fix, explanation, rule_hint, offset_start, offset_end, status
             FROM writing_issue WHERE id = ?1",
            params![issue_id],
            |row| {
                Ok(WritingIssueDto {
                    id: row.get(0)?,
                    writing_check_id: row.get(1)?,
                    category: row.get(2)?,
                    severity: row.get(3)?,
                    original_fragment: row.get(4)?,
                    suggested_fix: row.get(5)?,
                    explanation: row.get(6)?,
                    rule_hint: row.get(7)?,
                    offset_start: row.get(8)?,
                    offset_end: row.get(9)?,
                    status: row.get(10)?,
                })
            },
        )
        .map_err(|_| AppError::NotFound(format!("Writing issue {issue_id} not found")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    fn issue_input(
        category: &str,
        original: &str,
        fix: &str,
        start: i64,
        end: i64,
    ) -> WritingIssueInput {
        WritingIssueInput {
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

    /// Create a check with the given text and issues, return (check_id, issue_ids).
    fn create_check_with_issues(
        conn: &Connection,
        text: &str,
        issues: &[WritingIssueInput],
    ) -> (i64, Vec<i64>) {
        let check_id = WritingRepo::create_check(conn, text, "en", 80, Some("Needs work"))
            .expect("create check");
        let ids = WritingRepo::insert_issues(conn, check_id, issues).expect("insert issues");
        (check_id, ids)
    }

    #[test]
    fn create_check_and_get_back_with_issues() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let issues = vec![
            issue_input("grammar", "go", "goes", 3, 5),
            issue_input("spelling", "he", "He", 0, 2),
        ];
        let (check_id, ids) = create_check_with_issues(&conn, "he go home", &issues);
        assert_eq!(ids.len(), 2);

        let check = WritingRepo::get_check_with_issues(&conn, check_id).expect("get check");
        assert_eq!(check.original_text, "he go home");
        assert_eq!(check.language, "en");
        assert_eq!(check.overall_score, 80);
        assert_eq!(check.summary.as_deref(), Some("Needs work"));
        assert_eq!(check.issue_count, 2);
        assert_eq!(check.accepted_count, 0);
        assert_eq!(check.rejected_count, 0);
        assert!(check.corrected_text.is_none());

        // Issues come back ordered by offset_start ASC
        assert_eq!(check.issues.len(), 2);
        assert_eq!(check.issues[0].original_fragment, "he");
        assert_eq!(check.issues[1].original_fragment, "go");
        assert_eq!(check.issues[0].status, "pending");
    }

    #[test]
    fn get_check_with_issues_unknown_id_returns_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        match WritingRepo::get_check_with_issues(&conn, 999_999) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn update_issue_status_recounts_parent_check() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let issues = vec![
            issue_input("grammar", "go", "goes", 3, 5),
            issue_input("spelling", "he", "He", 0, 2),
        ];
        let (check_id, ids) = create_check_with_issues(&conn, "he go home", &issues);

        WritingRepo::update_issue_status(&conn, ids[0], "accepted").expect("accept");
        WritingRepo::update_issue_status(&conn, ids[1], "rejected").expect("reject");

        let check = WritingRepo::get_check_with_issues(&conn, check_id).expect("get check");
        assert_eq!(check.accepted_count, 1);
        assert_eq!(check.rejected_count, 1);
        let by_id: std::collections::HashMap<i64, &WritingIssueDto> =
            check.issues.iter().map(|i| (i.id, i)).collect();
        assert_eq!(by_id[&ids[0]].status, "accepted");
        assert_eq!(by_id[&ids[1]].status, "rejected");
    }

    #[test]
    fn update_issue_status_unknown_id_returns_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        match WritingRepo::update_issue_status(&conn, 999_999, "accepted") {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn accept_all_issues_builds_corrected_text() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let issues = vec![
            issue_input("grammar", "go", "goes", 3, 5),
            issue_input("spelling", "he", "He", 0, 2),
        ];
        let (check_id, _) = create_check_with_issues(&conn, "he go home", &issues);

        WritingRepo::accept_all_issues(&conn, check_id).expect("accept all");

        let check = WritingRepo::get_check_with_issues(&conn, check_id).expect("get check");
        assert_eq!(check.accepted_count, 2);
        assert_eq!(
            check.corrected_text.as_deref(),
            Some("He goes home"),
            "fixes applied back-to-front keep earlier offsets valid"
        );
    }

    #[test]
    fn accept_all_applies_unicode_character_offsets() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        // Offsets are character indices (not UTF-8 bytes). "мир" is chars 7..10.
        let text = "Привет мир";
        let issues = vec![
            issue_input("grammar", "x", "y", 3, 1), // start > end — skip
            issue_input("grammar", "x", "y", 0, 999_999), // out of range — skip
            issue_input("spelling", "мир", "мир!", 7, 10),
        ];
        let (check_id, _) = create_check_with_issues(&conn, text, &issues);

        WritingRepo::accept_all_issues(&conn, check_id).expect("accept all");

        let check = WritingRepo::get_check_with_issues(&conn, check_id).expect("get check");
        assert_eq!(check.corrected_text.as_deref(), Some("Привет мир!"));
    }

    #[test]
    fn increment_error_pattern_upserts_and_orders_by_frequency() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        WritingRepo::increment_error_pattern(
            &conn,
            "grammar",
            "en",
            Some("he go"),
            Some("he goes"),
        )
        .expect("first insert");
        WritingRepo::increment_error_pattern(&conn, "grammar", "en", None, None)
            .expect("increment keeps samples via COALESCE");
        WritingRepo::increment_error_pattern(&conn, "spelling", "en", Some("teh"), Some("the"))
            .expect("other category");
        WritingRepo::increment_error_pattern(&conn, "grammar", "de", Some("ich bin"), None)
            .expect("other language");

        let patterns = WritingRepo::get_error_patterns(&conn, "en").expect("get patterns");
        assert_eq!(patterns.len(), 2, "only 'en' patterns returned");
        assert_eq!(patterns[0].category, "grammar", "most frequent first");
        assert_eq!(patterns[0].occurrence_count, 2);
        assert_eq!(patterns[0].sample_original.as_deref(), Some("he go"));
        assert_eq!(patterns[0].sample_fix.as_deref(), Some("he goes"));
        assert_eq!(patterns[1].category, "spelling");
        assert_eq!(patterns[1].occurrence_count, 1);
    }

    #[test]
    fn get_issue_returns_single_issue_or_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let (check_id, ids) = create_check_with_issues(
            &conn,
            "he go home",
            &[issue_input("grammar", "go", "goes", 3, 5)],
        );

        let issue = WritingRepo::get_issue(&conn, ids[0]).expect("get issue");
        assert_eq!(issue.writing_check_id, check_id);
        assert_eq!(issue.category, "grammar");
        assert_eq!(issue.suggested_fix, "goes");

        match WritingRepo::get_issue(&conn, 999_999) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }

    #[test]
    fn create_rewrite_stores_mode_and_corrected_text() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");

        let id = WritingRepo::create_rewrite(
            &conn,
            "Please find attached the file.",
            "en",
            "The file is attached.",
            "clearer",
            Some("Simplified the phrasing."),
        )
        .expect("create rewrite");

        let check = WritingRepo::get_check_with_issues(&conn, id).expect("get");
        assert_eq!(check.original_text, "Please find attached the file.");
        assert_eq!(
            check.corrected_text.as_deref(),
            Some("The file is attached.")
        );
        assert_eq!(check.rewrite_mode.as_deref(), Some("clearer"));
        assert_eq!(check.summary.as_deref(), Some("Simplified the phrasing."));
        assert_eq!(check.overall_score, 100);
        assert!(check.issues.is_empty());
    }
}
