// ============================================================
// LEXORA — Pronunciation Repository
// Stage 3: attempts, phoneme scores, patterns, minimal pairs.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhonemeScoreDto {
    pub id: i64,
    pub attempt_id: i64,
    pub target_phoneme: String,
    pub recognized_phoneme: Option<String>,
    pub accuracy: i64,
    pub status: String,
    pub position: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PronunciationAttemptDto {
    pub id: i64,
    pub lexeme_id: Option<i64>,
    pub audio_path: String,
    pub overall_score: i64,
    pub recognized_text: Option<String>,
    pub target_text: String,
    pub target_ipa: Option<String>,
    pub recognized_ipa: Option<String>,
    pub stress_feedback: Option<String>,
    pub summary: Option<String>,
    pub language: String,
    pub created_at: i64,
    pub phonemes: Vec<PhonemeScoreDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhonemePatternDto {
    pub id: i64,
    pub phoneme: String,
    pub language: String,
    pub occurrence_count: i64,
    pub last_seen_at: i64,
    pub sample_target: Option<String>,
    pub sample_recognized: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinimalPairDto {
    pub id: i64,
    pub word_a: String,
    pub word_b: String,
    pub ipa_a: String,
    pub ipa_b: String,
    pub contrast_phoneme_a: String,
    pub contrast_phoneme_b: String,
    pub contrast_type: String,
    pub language: String,
}

#[derive(Debug, Clone)]
pub struct PhonemeScoreInput {
    pub target_phoneme: String,
    pub recognized_phoneme: Option<String>,
    pub accuracy: i64,
    pub status: String,
    pub position: i64,
}

#[derive(Debug, Clone)]
pub struct CreateAttemptInput<'a> {
    pub lexeme_id: Option<i64>,
    pub audio_path: &'a str,
    pub overall_score: i64,
    pub recognized_text: Option<&'a str>,
    pub target_text: &'a str,
    pub target_ipa: Option<&'a str>,
    pub recognized_ipa: Option<&'a str>,
    pub stress_feedback: Option<&'a str>,
    pub summary: Option<&'a str>,
    pub language: &'a str,
}

pub struct PronunciationRepo;

impl PronunciationRepo {
    /// Persist an attempt and its phoneme scores in one transaction caller.
    pub fn create_attempt(
        conn: &Connection,
        input: &CreateAttemptInput<'_>,
        phonemes: &[PhonemeScoreInput],
    ) -> Result<i64, AppError> {
        conn.execute(
            "INSERT INTO pronunciation_attempt
             (lexeme_id, audio_path, overall_score, recognized_text, target_text,
              target_ipa, recognized_ipa, stress_feedback, summary, language)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                input.lexeme_id,
                input.audio_path,
                input.overall_score,
                input.recognized_text,
                input.target_text,
                input.target_ipa,
                input.recognized_ipa,
                input.stress_feedback,
                input.summary,
                input.language,
            ],
        )?;
        let attempt_id = conn.last_insert_rowid();
        Self::insert_phoneme_scores(conn, attempt_id, phonemes)?;
        Ok(attempt_id)
    }

    fn insert_phoneme_scores(
        conn: &Connection,
        attempt_id: i64,
        phonemes: &[PhonemeScoreInput],
    ) -> Result<(), AppError> {
        let mut stmt = conn.prepare(
            "INSERT INTO phoneme_score
             (attempt_id, target_phoneme, recognized_phoneme, accuracy, status, position)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )?;
        for phone in phonemes {
            stmt.execute(params![
                attempt_id,
                phone.target_phoneme,
                phone.recognized_phoneme,
                phone.accuracy,
                phone.status,
                phone.position,
            ])?;
        }
        Ok(())
    }

    /// Increment problem-phoneme profile for misses and close matches.
    pub fn increment_phoneme_pattern(
        conn: &Connection,
        phoneme: &str,
        language: &str,
        sample_target: Option<&str>,
        sample_recognized: Option<&str>,
    ) -> Result<(), AppError> {
        conn.execute(
            "INSERT INTO phoneme_pattern (phoneme, language, occurrence_count, sample_target, sample_recognized)
             VALUES (?1, ?2, 1, ?3, ?4)
             ON CONFLICT(phoneme, language) DO UPDATE SET
                occurrence_count = occurrence_count + 1,
                last_seen_at = unixepoch(),
                sample_target = COALESCE(?3, sample_target),
                sample_recognized = COALESCE(?4, sample_recognized)",
            params![phoneme, language, sample_target, sample_recognized],
        )?;
        Ok(())
    }

    pub fn get_attempt_with_scores(
        conn: &Connection,
        attempt_id: i64,
    ) -> Result<PronunciationAttemptDto, AppError> {
        let mut attempt = conn
            .query_row(
                "SELECT id, lexeme_id, audio_path, overall_score, recognized_text, target_text,
                        target_ipa, recognized_ipa, stress_feedback, summary, language, created_at
                 FROM pronunciation_attempt WHERE id = ?1",
                params![attempt_id],
                |row| {
                    Ok(PronunciationAttemptDto {
                        id: row.get(0)?,
                        lexeme_id: row.get(1)?,
                        audio_path: row.get(2)?,
                        overall_score: row.get(3)?,
                        recognized_text: row.get(4)?,
                        target_text: row.get(5)?,
                        target_ipa: row.get(6)?,
                        recognized_ipa: row.get(7)?,
                        stress_feedback: row.get(8)?,
                        summary: row.get(9)?,
                        language: row.get(10)?,
                        created_at: row.get(11)?,
                        phonemes: Vec::new(),
                    })
                },
            )
            .map_err(|_| {
                AppError::NotFound(format!("Pronunciation attempt {attempt_id} not found"))
            })?;

        attempt.phonemes = Self::scores_for_attempt(conn, attempt_id)?;
        Ok(attempt)
    }

    fn scores_for_attempt(
        conn: &Connection,
        attempt_id: i64,
    ) -> Result<Vec<PhonemeScoreDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, attempt_id, target_phoneme, recognized_phoneme, accuracy, status, position
             FROM phoneme_score WHERE attempt_id = ?1 ORDER BY position ASC, id ASC",
        )?;
        let rows = stmt
            .query_map(params![attempt_id], |row| {
                Ok(PhonemeScoreDto {
                    id: row.get(0)?,
                    attempt_id: row.get(1)?,
                    target_phoneme: row.get(2)?,
                    recognized_phoneme: row.get(3)?,
                    accuracy: row.get(4)?,
                    status: row.get(5)?,
                    position: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn list_attempts(
        conn: &Connection,
        lexeme_id: Option<i64>,
        language: Option<&str>,
        limit: i64,
    ) -> Result<Vec<PronunciationAttemptDto>, AppError> {
        let limit = limit.clamp(1, 100);
        let mut attempts = Vec::new();

        if let Some(id) = lexeme_id {
            let mut stmt = conn.prepare(
                "SELECT id FROM pronunciation_attempt
                 WHERE lexeme_id = ?1
                 ORDER BY created_at DESC LIMIT ?2",
            )?;
            let ids = stmt
                .query_map(params![id, limit], |row| row.get::<_, i64>(0))?
                .collect::<Result<Vec<_>, _>>()?;
            for attempt_id in ids {
                attempts.push(Self::get_attempt_with_scores(conn, attempt_id)?);
            }
        } else if let Some(lang) = language {
            let mut stmt = conn.prepare(
                "SELECT id FROM pronunciation_attempt
                 WHERE language = ?1
                 ORDER BY created_at DESC LIMIT ?2",
            )?;
            let ids = stmt
                .query_map(params![lang, limit], |row| row.get::<_, i64>(0))?
                .collect::<Result<Vec<_>, _>>()?;
            for attempt_id in ids {
                attempts.push(Self::get_attempt_with_scores(conn, attempt_id)?);
            }
        } else {
            let mut stmt = conn.prepare(
                "SELECT id FROM pronunciation_attempt
                 ORDER BY created_at DESC LIMIT ?1",
            )?;
            let ids = stmt
                .query_map(params![limit], |row| row.get::<_, i64>(0))?
                .collect::<Result<Vec<_>, _>>()?;
            for attempt_id in ids {
                attempts.push(Self::get_attempt_with_scores(conn, attempt_id)?);
            }
        }

        Ok(attempts)
    }

    pub fn get_problem_phonemes(
        conn: &Connection,
        language: &str,
        limit: i64,
    ) -> Result<Vec<PhonemePatternDto>, AppError> {
        let limit = limit.clamp(1, 50);
        let mut stmt = conn.prepare(
            "SELECT id, phoneme, language, occurrence_count, last_seen_at,
                    sample_target, sample_recognized
             FROM phoneme_pattern
             WHERE language = ?1
             ORDER BY occurrence_count DESC, last_seen_at DESC
             LIMIT ?2",
        )?;
        let rows = stmt
            .query_map(params![language, limit], |row| {
                Ok(PhonemePatternDto {
                    id: row.get(0)?,
                    phoneme: row.get(1)?,
                    language: row.get(2)?,
                    occurrence_count: row.get(3)?,
                    last_seen_at: row.get(4)?,
                    sample_target: row.get(5)?,
                    sample_recognized: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn list_minimal_pairs(
        conn: &Connection,
        language: &str,
        contrast_type: Option<&str>,
        limit: i64,
    ) -> Result<Vec<MinimalPairDto>, AppError> {
        let limit = limit.clamp(1, 500);
        if let Some(kind) = contrast_type {
            let mut stmt = conn.prepare(
                "SELECT id, word_a, word_b, ipa_a, ipa_b,
                        contrast_phoneme_a, contrast_phoneme_b, contrast_type, language
                 FROM minimal_pair
                 WHERE language = ?1 AND contrast_type = ?2
                 ORDER BY id ASC
                 LIMIT ?3",
            )?;
            let rows = stmt
                .query_map(params![language, kind, limit], Self::map_pair)?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, word_a, word_b, ipa_a, ipa_b,
                        contrast_phoneme_a, contrast_phoneme_b, contrast_type, language
                 FROM minimal_pair
                 WHERE language = ?1
                 ORDER BY id ASC
                 LIMIT ?2",
            )?;
            let rows = stmt
                .query_map(params![language, limit], Self::map_pair)?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(rows)
        }
    }

    fn map_pair(row: &rusqlite::Row<'_>) -> rusqlite::Result<MinimalPairDto> {
        Ok(MinimalPairDto {
            id: row.get(0)?,
            word_a: row.get(1)?,
            word_b: row.get(2)?,
            ipa_a: row.get(3)?,
            ipa_b: row.get(4)?,
            contrast_phoneme_a: row.get(5)?,
            contrast_phoneme_b: row.get(6)?,
            contrast_type: row.get(7)?,
            language: row.get(8)?,
        })
    }

    pub fn count_minimal_pairs(conn: &Connection, language: &str) -> Result<i64, AppError> {
        let n: i64 = conn.query_row(
            "SELECT COUNT(*) FROM minimal_pair WHERE language = ?1",
            params![language],
            |row| row.get(0),
        )?;
        Ok(n)
    }

    pub fn lexeme_exists(conn: &Connection, lexeme_id: i64) -> Result<bool, AppError> {
        let found: Option<i64> = conn
            .query_row(
                "SELECT id FROM lexeme WHERE id = ?1 AND deleted_at IS NULL",
                params![lexeme_id],
                |row| row.get(0),
            )
            .optional()?;
        Ok(found.is_some())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        pool
    }

    fn sample_phones() -> Vec<PhonemeScoreInput> {
        vec![
            PhonemeScoreInput {
                target_phoneme: "θ".to_string(),
                recognized_phoneme: Some("s".to_string()),
                accuracy: 40,
                status: "miss".to_string(),
                position: 0,
            },
            PhonemeScoreInput {
                target_phoneme: "ɪ".to_string(),
                recognized_phoneme: Some("ɪ".to_string()),
                accuracy: 100,
                status: "ok".to_string(),
                position: 1,
            },
        ]
    }

    #[test]
    fn v009_seeds_at_least_100_english_minimal_pairs() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let n = PronunciationRepo::count_minimal_pairs(&conn, "en").expect("count");
        assert!(n >= 100, "expected >= 100 pairs, got {n}");
    }

    #[test]
    fn create_attempt_round_trips_with_phonemes() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let input = CreateAttemptInput {
            lexeme_id: None,
            audio_path: "/tmp/a.webm",
            overall_score: 72,
            recognized_text: Some("sink"),
            target_text: "think",
            target_ipa: Some("/θɪŋk/"),
            recognized_ipa: Some("/sɪŋk/"),
            stress_feedback: Some("stress ok"),
            summary: Some("th vs s"),
            language: "en",
        };
        let id =
            PronunciationRepo::create_attempt(&conn, &input, &sample_phones()).expect("create");
        let loaded = PronunciationRepo::get_attempt_with_scores(&conn, id).expect("get");
        assert_eq!(loaded.target_text, "think");
        assert_eq!(loaded.overall_score, 72);
        assert_eq!(loaded.phonemes.len(), 2);
        assert_eq!(loaded.phonemes[0].target_phoneme, "θ");
        assert_eq!(loaded.phonemes[0].status, "miss");
    }

    #[test]
    fn increment_phoneme_pattern_aggregates() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        PronunciationRepo::increment_phoneme_pattern(&conn, "θ", "en", Some("θ"), Some("s"))
            .expect("first");
        PronunciationRepo::increment_phoneme_pattern(&conn, "θ", "en", None, None).expect("second");
        PronunciationRepo::increment_phoneme_pattern(&conn, "ð", "en", Some("ð"), Some("d"))
            .expect("other");
        let problems = PronunciationRepo::get_problem_phonemes(&conn, "en", 10).expect("list");
        assert_eq!(problems[0].phoneme, "θ");
        assert_eq!(problems[0].occurrence_count, 2);
        assert_eq!(problems[0].sample_target.as_deref(), Some("θ"));
    }

    #[test]
    fn list_minimal_pairs_can_filter_by_type() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        let vowels =
            PronunciationRepo::list_minimal_pairs(&conn, "en", Some("vowel"), 20).expect("vowels");
        let consonants = PronunciationRepo::list_minimal_pairs(&conn, "en", Some("consonant"), 20)
            .expect("cons");
        assert!(!vowels.is_empty());
        assert!(!consonants.is_empty());
        assert!(vowels.iter().all(|p| p.contrast_type == "vowel"));
        assert!(consonants.iter().all(|p| p.contrast_type == "consonant"));
        assert!(vowels
            .iter()
            .any(|p| p.word_a == "ship" && p.word_b == "sheep"));
    }

    #[test]
    fn list_attempts_filters_by_lexeme() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        conn.execute(
            "INSERT INTO lexeme (language_id, text, normalized_text) VALUES (1, 'you', 'you')",
            [],
        )
        .expect("lexeme");
        let lexeme_id = conn.last_insert_rowid();
        let a = CreateAttemptInput {
            lexeme_id: Some(lexeme_id),
            audio_path: "/tmp/a.webm",
            overall_score: 80,
            recognized_text: None,
            target_text: "you",
            target_ipa: None,
            recognized_ipa: None,
            stress_feedback: None,
            summary: None,
            language: "en",
        };
        PronunciationRepo::create_attempt(&conn, &a, &[]).expect("a");
        let listed =
            PronunciationRepo::list_attempts(&conn, Some(lexeme_id), None, 10).expect("list");
        assert_eq!(listed.len(), 1);
        let empty = PronunciationRepo::list_attempts(&conn, Some(999_999), None, 10).expect("none");
        assert!(empty.is_empty());
    }

    #[test]
    fn get_attempt_unknown_is_not_found() {
        let pool = setup_db();
        let conn = pool.get().expect("conn");
        match PronunciationRepo::get_attempt_with_scores(&conn, 42) {
            Err(AppError::NotFound(_)) => {}
            other => panic!("expected NotFound, got {other:?}"),
        }
    }
}
