// ============================================================
// LEXORA — Dialogue Repository
// Scenarios, sessions, and turns for AI Dialogue.
// ============================================================

use crate::error::AppError;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogueScenarioDto {
    pub id: i64,
    pub slug: String,
    pub title: String,
    pub level: String,
    pub language: String,
    pub description: Option<String>,
    pub tutor_role: String,
    pub opening_line: String,
    pub suggested_vocab: Vec<String>,
    pub sort_order: i64,
    /// `guided` (a concrete situation) or `free` (talk about anything).
    pub kind: String,
    /// `builtin` (English seed), `generated` (AI localization) or `custom`.
    pub origin: String,
    /// Slug of the builtin scenario a generated row localizes.
    pub base_slug: Option<String>,
}

/// A scenario row to insert (generated localization or learner's own).
#[derive(Debug, Clone)]
pub struct NewScenario {
    pub slug: String,
    pub title: String,
    pub level: String,
    pub language: String,
    pub description: Option<String>,
    pub tutor_role: String,
    pub opening_line: String,
    pub suggested_vocab: Vec<String>,
    pub kind: String,
    pub origin: String,
    pub base_slug: Option<String>,
    /// `None` → appended after the language's last scenario.
    pub sort_order: Option<i64>,
}

pub const KIND_GUIDED: &str = "guided";
pub const KIND_FREE: &str = "free";
pub const ORIGIN_BUILTIN: &str = "builtin";
pub const ORIGIN_GENERATED: &str = "generated";
pub const ORIGIN_CUSTOM: &str = "custom";
/// Language of the builtin scenarios every localization is generated from.
pub const BASE_LANGUAGE: &str = "en";

const SCENARIO_COLUMNS: &str = "id, slug, title, level, language, description, tutor_role,
                        opening_line, suggested_vocab_json, sort_order,
                        kind, origin, base_slug";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogueTurnDto {
    pub id: i64,
    pub session_id: i64,
    pub role: String,
    pub text: String,
    pub audio_path: Option<String>,
    pub turn_score: Option<i64>,
    pub fluency_score: Option<i64>,
    pub clarity_score: Option<i64>,
    pub grammar_score: Option<i64>,
    pub suggestions: Vec<String>,
    pub sort_order: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogueSessionDto {
    pub id: i64,
    pub scenario_id: i64,
    pub scenario_title: String,
    pub scenario_level: String,
    pub scenario_slug: String,
    pub language: String,
    pub session_score: Option<i64>,
    pub turn_count: i64,
    pub status: String,
    pub turns: Vec<DialogueTurnDto>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Scores of one learner turn (0–100).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TurnScores {
    pub turn: i64,
    pub fluency: i64,
    pub clarity: i64,
    pub grammar: i64,
}

#[derive(Debug, Clone)]
pub struct InsertTurnInput {
    pub role: String,
    pub text: String,
    pub audio_path: Option<String>,
    pub turn_score: Option<i64>,
    pub fluency_score: Option<i64>,
    pub clarity_score: Option<i64>,
    pub grammar_score: Option<i64>,
    pub suggestions: Vec<String>,
}

pub struct DialogueRepo;

impl DialogueRepo {
    pub fn list_scenarios(
        conn: &Connection,
        language: Option<&str>,
    ) -> Result<Vec<DialogueScenarioDto>, AppError> {
        let lang = language.filter(|s| !s.is_empty());
        let sql = format!(
            "SELECT {SCENARIO_COLUMNS}
             FROM dialogue_scenario
             WHERE deleted_at IS NULL AND (?1 IS NULL OR language = ?1)
             ORDER BY sort_order ASC, id ASC"
        );
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt
            .query_map(params![lang], map_scenario_row)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(rows)
    }

    pub fn get_scenario_by_id(conn: &Connection, id: i64) -> Result<DialogueScenarioDto, AppError> {
        let sql = format!("SELECT {SCENARIO_COLUMNS} FROM dialogue_scenario WHERE id = ?1");
        conn.query_row(&sql, params![id], map_scenario_row)
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("Dialogue scenario {id} not found")))
    }

    pub fn get_scenario_by_slug(
        conn: &Connection,
        slug: &str,
    ) -> Result<DialogueScenarioDto, AppError> {
        let sql = format!("SELECT {SCENARIO_COLUMNS} FROM dialogue_scenario WHERE slug = ?1");
        conn.query_row(&sql, params![slug], map_scenario_row)
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("Dialogue scenario '{slug}' not found")))
    }

    /// First live scenario of a language (the one a fresh page opens).
    pub fn first_scenario(
        conn: &Connection,
        language: &str,
    ) -> Result<Option<DialogueScenarioDto>, AppError> {
        let sql = format!(
            "SELECT {SCENARIO_COLUMNS} FROM dialogue_scenario
             WHERE language = ?1 AND deleted_at IS NULL
             ORDER BY sort_order ASC, id ASC LIMIT 1"
        );
        Ok(conn.query_row(&sql, params![language], map_scenario_row).optional()?)
    }

    /// Builtin English scenarios that have no live localization in `language`.
    pub fn missing_base_scenarios(
        conn: &Connection,
        language: &str,
    ) -> Result<Vec<DialogueScenarioDto>, AppError> {
        let sql = "SELECT b.id, b.slug, b.title, b.level, b.language, b.description,
                          b.tutor_role, b.opening_line, b.suggested_vocab_json, b.sort_order,
                          b.kind, b.origin, b.base_slug
                   FROM dialogue_scenario b
                   WHERE b.language = ?1 AND b.origin = ?2 AND b.deleted_at IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM dialogue_scenario g
                         WHERE g.base_slug = b.slug AND g.language = ?3 AND g.deleted_at IS NULL
                     )
                   ORDER BY b.sort_order ASC, b.id ASC";
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt
            .query_map(params![BASE_LANGUAGE, ORIGIN_BUILTIN, language], map_scenario_row)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(rows)
    }

    /// English name of a catalogued language (`None` = unknown code).
    pub fn language_name(conn: &Connection, code: &str) -> Result<Option<String>, AppError> {
        Ok(conn
            .query_row("SELECT name FROM language WHERE code = ?1", params![code], |row| {
                row.get::<_, String>(0)
            })
            .optional()?)
    }

    /// Insert one scenario. Transactional.
    pub fn insert_scenario(
        conn: &mut Connection,
        new: &NewScenario,
    ) -> Result<DialogueScenarioDto, AppError> {
        let tx = conn.transaction()?;
        let sort_order = match new.sort_order {
            Some(order) => order,
            None => tx.query_row(
                "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM dialogue_scenario
                 WHERE language = ?1",
                params![new.language],
                |row| row.get::<_, i64>(0),
            )?,
        };
        let vocab_json = serde_json::to_string(&new.suggested_vocab)?;
        tx.execute(
            "INSERT INTO dialogue_scenario (
                slug, title, level, language, description, tutor_role, opening_line,
                suggested_vocab_json, sort_order, kind, origin, base_slug
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                new.slug,
                new.title,
                new.level,
                new.language,
                new.description,
                new.tutor_role,
                new.opening_line,
                vocab_json,
                sort_order,
                new.kind,
                new.origin,
                new.base_slug,
            ],
        )?;
        let id = tx.last_insert_rowid();
        tx.commit()?;
        Self::get_scenario_by_id(conn, id)
    }

    /// Soft-delete a learner's or generated scenario. Builtin seeds stay.
    /// The slug is freed so the same localization can be generated again.
    pub fn delete_scenario(conn: &Connection, id: i64) -> Result<(), AppError> {
        let scenario = Self::get_scenario_by_id(conn, id)?;
        if scenario.origin == ORIGIN_BUILTIN {
            return Err(AppError::Validation(
                "Built-in scenarios cannot be deleted".to_string(),
            ));
        }
        conn.execute(
            "UPDATE dialogue_scenario
             SET deleted_at = unixepoch(), slug = slug || '~deleted-' || id
             WHERE id = ?1 AND deleted_at IS NULL",
            params![id],
        )?;
        Ok(())
    }

    /// Create a session and insert the tutor opening line. Transactional.
    pub fn start_session(
        conn: &mut Connection,
        scenario_id: i64,
        language: &str,
    ) -> Result<DialogueSessionDto, AppError> {
        let scenario = Self::get_scenario_by_id(conn, scenario_id)?;
        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO dialogue_session (scenario_id, language, status)
             VALUES (?1, ?2, 'active')",
            params![scenario_id, language],
        )?;
        let session_id = tx.last_insert_rowid();

        let suggestions_json =
            serde_json::to_string(&scenario.suggested_vocab).unwrap_or_else(|_| "[]".to_string());
        tx.execute(
            "INSERT INTO dialogue_turn (
                session_id, role, text, suggestions_json, sort_order
             ) VALUES (?1, 'tutor', ?2, ?3, 0)",
            params![session_id, scenario.opening_line, suggestions_json],
        )?;

        tx.commit()?;
        Self::get_session(conn, session_id)
    }

    pub fn get_session(conn: &Connection, session_id: i64) -> Result<DialogueSessionDto, AppError> {
        let mut session = conn
            .query_row(
                "SELECT s.id, s.scenario_id, sc.title, sc.level, sc.slug, s.language,
                        s.session_score, s.turn_count, s.status, s.created_at, s.updated_at
                 FROM dialogue_session s
                 JOIN dialogue_scenario sc ON sc.id = s.scenario_id
                 WHERE s.id = ?1 AND s.deleted_at IS NULL",
                params![session_id],
                |row| {
                    Ok(DialogueSessionDto {
                        id: row.get(0)?,
                        scenario_id: row.get(1)?,
                        scenario_title: row.get(2)?,
                        scenario_level: row.get(3)?,
                        scenario_slug: row.get(4)?,
                        language: row.get(5)?,
                        session_score: row.get(6)?,
                        turn_count: row.get(7)?,
                        status: row.get(8)?,
                        turns: vec![],
                        created_at: row.get(9)?,
                        updated_at: row.get(10)?,
                    })
                },
            )
            .optional()?
            .ok_or_else(|| {
                AppError::NotFound(format!("Dialogue session {session_id} not found"))
            })?;

        session.turns = Self::list_turns(conn, session_id)?;
        Ok(session)
    }

    pub fn list_turns(
        conn: &Connection,
        session_id: i64,
    ) -> Result<Vec<DialogueTurnDto>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT id, session_id, role, text, audio_path,
                    turn_score, fluency_score, clarity_score, grammar_score,
                    suggestions_json, sort_order, created_at
             FROM dialogue_turn
             WHERE session_id = ?1
             ORDER BY sort_order ASC, id ASC",
        )?;
        let turns = stmt
            .query_map(params![session_id], map_turn_row)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(turns)
    }

    pub fn next_sort_order(conn: &Connection, session_id: i64) -> Result<i64, AppError> {
        let max: Option<i64> = conn
            .query_row(
                "SELECT MAX(sort_order) FROM dialogue_turn WHERE session_id = ?1",
                params![session_id],
                |row| row.get(0),
            )
            .optional()?
            .flatten();
        Ok(max.map(|m| m + 1).unwrap_or(0))
    }

    /// Insert user + tutor turns and update session averages. Transactional.
    pub fn append_exchange(
        conn: &mut Connection,
        session_id: i64,
        user_turn: InsertTurnInput,
        tutor_turn: InsertTurnInput,
    ) -> Result<DialogueSessionDto, AppError> {
        let status: String = conn
            .query_row(
                "SELECT status FROM dialogue_session
                 WHERE id = ?1 AND deleted_at IS NULL",
                params![session_id],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| {
                AppError::NotFound(format!("Dialogue session {session_id} not found"))
            })?;

        if status != "active" {
            return Err(AppError::Validation(
                "Dialogue session is not active".to_string(),
            ));
        }

        let tx = conn.transaction()?;
        let mut sort = Self::next_sort_order(&tx, session_id)?;

        insert_turn(&tx, session_id, sort, &user_turn)?;
        sort += 1;
        insert_turn(&tx, session_id, sort, &tutor_turn)?;

        let (avg_score, user_turns) = compute_session_score(&tx, session_id)?;
        tx.execute(
            "UPDATE dialogue_session
             SET session_score = ?1,
                 turn_count = ?2,
                 updated_at = unixepoch()
             WHERE id = ?3",
            params![avg_score, user_turns, session_id],
        )?;
        tx.commit()?;
        Self::get_session(conn, session_id)
    }

    /// Store late scores of a learner turn (live dialogue scores asynchronously)
    /// and refresh the session average. Transactional.
    pub fn update_turn_scores(
        conn: &mut Connection,
        turn_id: i64,
        scores: TurnScores,
        tutor_suggestions: &[String],
    ) -> Result<DialogueSessionDto, AppError> {
        let tx = conn.transaction()?;
        let session_id: i64 = tx
            .query_row(
                "SELECT session_id FROM dialogue_turn WHERE id = ?1 AND role = 'user'",
                params![turn_id],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| AppError::NotFound(format!("Dialogue turn {turn_id} not found")))?;
        tx.execute(
            "UPDATE dialogue_turn
             SET turn_score = ?1, fluency_score = ?2, clarity_score = ?3, grammar_score = ?4
             WHERE id = ?5",
            params![
                scores.turn,
                scores.fluency,
                scores.clarity,
                scores.grammar,
                turn_id
            ],
        )?;
        if !tutor_suggestions.is_empty() {
            let suggestions_json =
                serde_json::to_string(tutor_suggestions).unwrap_or_else(|_| "[]".to_string());
            // Suggestions live on the tutor turn that follows the learner turn.
            tx.execute(
                "UPDATE dialogue_turn SET suggestions_json = ?1
                 WHERE id = (
                    SELECT id FROM dialogue_turn
                    WHERE session_id = ?2 AND role = 'tutor'
                      AND sort_order > (SELECT sort_order FROM dialogue_turn WHERE id = ?3)
                    ORDER BY sort_order ASC LIMIT 1
                 )",
                params![suggestions_json, session_id, turn_id],
            )?;
        }
        let (avg_score, user_turns) = compute_session_score(&tx, session_id)?;
        tx.execute(
            "UPDATE dialogue_session
             SET session_score = ?1, turn_count = ?2, updated_at = unixepoch()
             WHERE id = ?3",
            params![avg_score, user_turns, session_id],
        )?;
        tx.commit()?;
        Self::get_session(conn, session_id)
    }

    pub fn end_session(conn: &Connection, session_id: i64) -> Result<DialogueSessionDto, AppError> {
        let updated = conn.execute(
            "UPDATE dialogue_session
             SET status = 'ended',
                 ended_at = unixepoch(),
                 updated_at = unixepoch()
             WHERE id = ?1 AND deleted_at IS NULL AND status = 'active'",
            params![session_id],
        )?;
        if updated == 0 {
            // Still return session if it already ended; error if missing
            let session = Self::get_session(conn, session_id)?;
            if session.status != "ended" {
                return Err(AppError::NotFound(format!(
                    "Dialogue session {session_id} not found"
                )));
            }
            return Ok(session);
        }
        Self::get_session(conn, session_id)
    }
}

fn insert_turn(
    conn: &Connection,
    session_id: i64,
    sort_order: i64,
    turn: &InsertTurnInput,
) -> Result<(), AppError> {
    let suggestions_json =
        serde_json::to_string(&turn.suggestions).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT INTO dialogue_turn (
            session_id, role, text, audio_path,
            turn_score, fluency_score, clarity_score, grammar_score,
            suggestions_json, sort_order
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            session_id,
            turn.role,
            turn.text,
            turn.audio_path,
            turn.turn_score,
            turn.fluency_score,
            turn.clarity_score,
            turn.grammar_score,
            suggestions_json,
            sort_order,
        ],
    )?;
    Ok(())
}

/// Average of (fluency + clarity) / 2 across user turns that have both scores.
pub fn compute_session_score(
    conn: &Connection,
    session_id: i64,
) -> Result<(Option<i64>, i64), AppError> {
    let mut stmt = conn.prepare(
        "SELECT fluency_score, clarity_score
         FROM dialogue_turn
         WHERE session_id = ?1 AND role = 'user'",
    )?;
    let rows = stmt
        .query_map(params![session_id], |row| {
            Ok((row.get::<_, Option<i64>>(0)?, row.get::<_, Option<i64>>(1)?))
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let user_turns = rows.len() as i64;
    let mut sum = 0i64;
    let mut count = 0i64;
    for (fluency, clarity) in rows {
        if let (Some(f), Some(c)) = (fluency, clarity) {
            sum += (f + c) / 2;
            count += 1;
        }
    }
    let avg = if count > 0 {
        Some((sum as f64 / count as f64).round() as i64)
    } else {
        None
    };
    Ok((avg, user_turns))
}

fn parse_string_array(raw: &str) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(raw).unwrap_or_default()
}

fn map_scenario_row(row: &rusqlite::Row<'_>) -> Result<DialogueScenarioDto, rusqlite::Error> {
    let vocab_json: String = row.get(8)?;
    Ok(DialogueScenarioDto {
        id: row.get(0)?,
        slug: row.get(1)?,
        title: row.get(2)?,
        level: row.get(3)?,
        language: row.get(4)?,
        description: row.get(5)?,
        tutor_role: row.get(6)?,
        opening_line: row.get(7)?,
        suggested_vocab: parse_string_array(&vocab_json),
        sort_order: row.get(9)?,
        kind: row.get(10)?,
        origin: row.get(11)?,
        base_slug: row.get(12)?,
    })
}

fn map_turn_row(row: &rusqlite::Row<'_>) -> Result<DialogueTurnDto, rusqlite::Error> {
    let suggestions_json: Option<String> = row.get(9)?;
    Ok(DialogueTurnDto {
        id: row.get(0)?,
        session_id: row.get(1)?,
        role: row.get(2)?,
        text: row.get(3)?,
        audio_path: row.get(4)?,
        turn_score: row.get(5)?,
        fluency_score: row.get(6)?,
        clarity_score: row.get(7)?,
        grammar_score: row.get(8)?,
        suggestions: suggestions_json
            .as_deref()
            .map(parse_string_array)
            .unwrap_or_default(),
        sort_order: row.get(10)?,
        created_at: row.get(11)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};

    fn pool() -> DbPool {
        let pool = create_pool_test_memory().expect("pool");
        run_migrations(&pool).expect("migrations");
        pool
    }

    #[test]
    fn start_session_inserts_opening_turn() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let scenario = DialogueRepo::get_scenario_by_slug(&conn, "coffee-shop-london-b2")
            .expect("seed scenario");
        let session = DialogueRepo::start_session(&mut conn, scenario.id, "en").expect("start");

        assert_eq!(session.scenario_slug, "coffee-shop-london-b2");
        assert_eq!(session.status, "active");
        assert_eq!(session.turns.len(), 1);
        assert_eq!(session.turns[0].role, "tutor");
        assert!(session.turns[0]
            .text
            .contains("What kind of roast would you like"));
        assert_eq!(
            session.turns[0].suggestions,
            vec![
                "medium roast".to_string(),
                "dark roast".to_string(),
                "Arabica".to_string(),
                "single origin".to_string()
            ]
        );
        assert!(session.session_score.is_none());
        assert_eq!(session.turn_count, 0);
    }

    #[test]
    fn late_scores_update_learner_turn_and_session_average() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let scenario =
            DialogueRepo::get_scenario_by_slug(&conn, "coffee-shop-london-b2").expect("scenario");
        let session = DialogueRepo::start_session(&mut conn, scenario.id, "en").expect("start");
        let unscored = |role: &str, text: &str| InsertTurnInput {
            role: role.into(),
            text: text.into(),
            audio_path: None,
            turn_score: None,
            fluency_score: None,
            clarity_score: None,
            grammar_score: None,
            suggestions: vec![],
        };
        let saved = DialogueRepo::append_exchange(
            &mut conn,
            session.id,
            unscored("user", "Medium roast please"),
            unscored("tutor", "Great choice!"),
        )
        .expect("append");
        assert_eq!(saved.session_score, None, "live turns are saved before scoring");
        let user_turn = saved.turns.iter().find(|t| t.role == "user").expect("user turn");

        let scored = DialogueRepo::update_turn_scores(
            &mut conn,
            user_turn.id,
            TurnScores { turn: 80, fluency: 70, clarity: 90, grammar: 85 },
            &["oat milk".to_string()],
        )
        .expect("score");

        let user = scored.turns.iter().find(|t| t.id == user_turn.id).expect("user");
        assert_eq!(user.fluency_score, Some(70));
        assert_eq!(scored.session_score, Some(80));
        let tutor = scored.turns.last().expect("tutor reply");
        assert_eq!(tutor.suggestions, vec!["oat milk".to_string()]);
    }

    #[test]
    fn session_score_averages_fluency_and_clarity() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let scenario =
            DialogueRepo::get_scenario_by_slug(&conn, "coffee-shop-london-b2").expect("scenario");
        let session = DialogueRepo::start_session(&mut conn, scenario.id, "en").expect("start");

        let updated = DialogueRepo::append_exchange(
            &mut conn,
            session.id,
            InsertTurnInput {
                role: "user".into(),
                text: "A medium roast, please.".into(),
                audio_path: None,
                turn_score: Some(95),
                fluency_score: Some(90),
                clarity_score: Some(94),
                grammar_score: Some(96),
                suggestions: vec![],
            },
            InsertTurnInput {
                role: "tutor".into(),
                text: "Great choice!".into(),
                audio_path: None,
                turn_score: None,
                fluency_score: None,
                clarity_score: None,
                grammar_score: None,
                suggestions: vec!["oat milk".into()],
            },
        )
        .expect("append");

        // (90+94)/2 = 92
        assert_eq!(updated.session_score, Some(92));
        assert_eq!(updated.turn_count, 1);
        assert_eq!(updated.turns.len(), 3);

        let updated2 = DialogueRepo::append_exchange(
            &mut conn,
            session.id,
            InsertTurnInput {
                role: "user".into(),
                text: "With oat milk.".into(),
                audio_path: None,
                turn_score: Some(88),
                fluency_score: Some(80),
                clarity_score: Some(84),
                grammar_score: Some(90),
                suggestions: vec![],
            },
            InsertTurnInput {
                role: "tutor".into(),
                text: "Coming right up.".into(),
                audio_path: None,
                turn_score: None,
                fluency_score: None,
                clarity_score: None,
                grammar_score: None,
                suggestions: vec![],
            },
        )
        .expect("append2");

        // avg of 92 and (80+84)/2=82 → (92+82)/2 = 87
        assert_eq!(updated2.session_score, Some(87));
        assert_eq!(updated2.turn_count, 2);
    }

    #[test]
    fn list_scenarios_returns_seeded() {
        let pool = pool();
        let conn = pool.get().expect("conn");
        let list = DialogueRepo::list_scenarios(&conn, Some("en")).expect("list");
        assert!(list.len() >= 5);
        assert!(list.iter().any(|s| s.slug == "coffee-shop-london-b2"));
    }

    fn new_scenario(slug: &str, language: &str, origin: &str, base: Option<&str>) -> NewScenario {
        NewScenario {
            slug: slug.into(),
            title: format!("Title {slug}"),
            level: "B1".into(),
            language: language.into(),
            description: Some("desc".into()),
            tutor_role: "role".into(),
            opening_line: "Hallo!".into(),
            suggested_vocab: vec!["eins".into()],
            kind: KIND_GUIDED.into(),
            origin: origin.into(),
            base_slug: base.map(str::to_string),
            sort_order: None,
        }
    }

    #[test]
    fn seeded_scenarios_are_builtin_guided_english() {
        let pool = pool();
        let conn = pool.get().expect("conn");
        let list = DialogueRepo::list_scenarios(&conn, Some("en")).expect("list");
        assert!(list.iter().all(|s| s.origin == ORIGIN_BUILTIN && s.kind == KIND_GUIDED));
        assert!(DialogueRepo::list_scenarios(&conn, Some("de")).expect("de").is_empty());
        assert_eq!(
            DialogueRepo::first_scenario(&conn, "en").expect("first").map(|s| s.slug),
            Some("coffee-shop-london-b2".to_string())
        );
        assert!(DialogueRepo::first_scenario(&conn, "de").expect("first").is_none());
    }

    #[test]
    fn missing_base_scenarios_shrink_as_localizations_are_added() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let all = DialogueRepo::missing_base_scenarios(&conn, "de").expect("missing");
        assert_eq!(all.len(), 5);

        let base = all.first().expect("base");
        let mut new = new_scenario("coffee-shop-london-b2-de", "de", ORIGIN_GENERATED, Some(&base.slug));
        new.sort_order = Some(base.sort_order);
        let saved = DialogueRepo::insert_scenario(&mut conn, &new).expect("insert");
        assert_eq!(saved.base_slug.as_deref(), Some(base.slug.as_str()));
        assert_eq!(saved.sort_order, base.sort_order);
        assert_eq!(DialogueRepo::missing_base_scenarios(&conn, "de").expect("missing").len(), 4);
        // Another language is unaffected.
        assert_eq!(DialogueRepo::missing_base_scenarios(&conn, "fr").expect("missing").len(), 5);

        // One live localization per base and language.
        let dup = new_scenario("dup-slug", "de", ORIGIN_GENERATED, Some(&base.slug));
        assert!(DialogueRepo::insert_scenario(&mut conn, &dup).is_err());
    }

    #[test]
    fn custom_scenarios_are_appended_after_existing_ones() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let first = DialogueRepo::insert_scenario(&mut conn, &new_scenario("custom-a", "de", ORIGIN_CUSTOM, None))
            .expect("a");
        let second = DialogueRepo::insert_scenario(&mut conn, &new_scenario("custom-b", "de", ORIGIN_CUSTOM, None))
            .expect("b");
        assert!(second.sort_order > first.sort_order);
        let list = DialogueRepo::list_scenarios(&conn, Some("de")).expect("list");
        assert_eq!(list.iter().map(|s| s.slug.as_str()).collect::<Vec<_>>(), ["custom-a", "custom-b"]);
        assert_eq!(list[0].suggested_vocab, vec!["eins".to_string()]);
    }

    #[test]
    fn delete_hides_generated_scenario_and_allows_regeneration() {
        let pool = pool();
        let mut conn = pool.get().expect("conn");
        let base = DialogueRepo::get_scenario_by_slug(&conn, "airport-checkin-b1").expect("base");
        let generated = DialogueRepo::insert_scenario(
            &mut conn,
            &new_scenario("airport-checkin-b1-de", "de", ORIGIN_GENERATED, Some(&base.slug)),
        )
        .expect("insert");

        // A session keeps its scenario even after the scenario is deleted.
        let session = DialogueRepo::start_session(&mut conn, generated.id, "de").expect("session");
        DialogueRepo::delete_scenario(&conn, generated.id).expect("delete");

        assert!(DialogueRepo::list_scenarios(&conn, Some("de")).expect("list").is_empty());
        assert_eq!(DialogueRepo::missing_base_scenarios(&conn, "de").expect("missing").len(), 5);
        assert_eq!(
            DialogueRepo::get_session(&conn, session.id).expect("session").scenario_id,
            generated.id
        );
        DialogueRepo::insert_scenario(
            &mut conn,
            &new_scenario("airport-checkin-b1-de", "de", ORIGIN_GENERATED, Some(&base.slug)),
        )
        .expect("regenerate under the same slug");
    }

    #[test]
    fn builtin_scenarios_cannot_be_deleted() {
        let pool = pool();
        let conn = pool.get().expect("conn");
        let builtin = DialogueRepo::get_scenario_by_slug(&conn, "small-talk-b2").expect("seed");
        assert!(matches!(
            DialogueRepo::delete_scenario(&conn, builtin.id),
            Err(AppError::Validation(_))
        ));
        assert!(DialogueRepo::get_scenario_by_slug(&conn, "small-talk-b2").is_ok());
    }

    #[test]
    fn language_name_resolves_catalog_codes() {
        let pool = pool();
        let conn = pool.get().expect("conn");
        assert!(DialogueRepo::language_name(&conn, "de").expect("de").is_some());
        assert!(DialogueRepo::language_name(&conn, "zz-nope").expect("zz").is_none());
    }
}
