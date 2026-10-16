// ============================================================
// LEXORA — Collocations commands
// On-demand collocations of a word (cached after the first AI
// call) and promotion of chosen collocations to vocabulary cards.
// ============================================================

use crate::commands::vocabulary::AddVocabularyInput;
use crate::db::repos::collocation::CollocationRepo;
use crate::db::repos::lexeme::LexemeRepo;
use crate::db::repos::settings::SettingsRepo;
use crate::db::repos::vocabulary::VocabularyRepo;
use crate::db::DbPool;
use crate::error::AppError;
use crate::providers::ai::CollocationsRequest;
use rusqlite::{Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollocationDto {
    pub id: i64,
    pub lexeme_id: i64,
    pub text: String,
    pub pattern: Option<String>,
    pub translation: String,
    pub example: Option<String>,
    pub focus: Option<String>,
    pub distractors: Vec<String>,
    pub nuance: Option<String>,
    /// Active vocabulary entry of this phrase, when it is already being learned.
    pub vocabulary_entry_id: Option<i64>,
}

/// Study hints attached to a vocabulary card created from a collocation.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CollocationDrillDto {
    pub focus: String,
    pub distractors: Vec<String>,
    pub translation: String,
    pub example: Option<String>,
    pub pattern: Option<String>,
    /// The word this collocation was generated for.
    pub headword: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddCollocationsInput {
    pub lexeme_id: i64,
    pub target_language: String,
    pub collocation_ids: Vec<i64>,
    #[serde(default)]
    pub category_id: Option<i64>,
}

struct WordInfo {
    text: String,
    language_id: i64,
    language_code: String,
}

fn word_info(conn: &Connection, lexeme_id: i64) -> Result<WordInfo, AppError> {
    conn.query_row(
        "SELECT l.text, l.language_id, lang.code
         FROM lexeme l JOIN language lang ON lang.id = l.language_id
         WHERE l.id = ?1 AND l.deleted_at IS NULL",
        [lexeme_id],
        |row| {
            Ok(WordInfo {
                text: row.get(0)?,
                language_id: row.get(1)?,
                language_code: row.get(2)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("Word {lexeme_id} not found")))
}

/// Create (or reuse) a phrase card for each chosen collocation in one transaction.
/// Cards go to the explicit category, else to the category of the word itself.
pub fn add_collocations_inner(
    conn: &mut Connection,
    input: &AddCollocationsInput,
) -> Result<(), AppError> {
    let tx = conn.transaction()?;
    let word = word_info(&tx, input.lexeme_id)?;
    let target_language_id = LexemeRepo::language_id_by_code(&tx, &input.target_language)?;
    let category_id = match input.category_id {
        Some(id) => Some(id),
        None => tx
            .query_row(
                "SELECT category_id FROM user_vocabulary
                 WHERE user_id = 1 AND lexeme_id = ?1 AND deleted_at IS NULL",
                [input.lexeme_id],
                |row| row.get::<_, Option<i64>>(0),
            )
            .optional()?
            .flatten(),
    };

    for &collocation_id in &input.collocation_ids {
        let row = CollocationRepo::get_for_word(
            &tx,
            collocation_id,
            input.lexeme_id,
            target_language_id,
        )?
        .ok_or_else(|| {
            AppError::Validation(format!(
                "Collocation {collocation_id} does not belong to this word"
            ))
        })?;

        let phrase_id =
            LexemeRepo::find_or_create(&tx, word.language_id, &row.text, None, None, None)?;
        // Keep a part of speech the user may already have set for this phrase.
        tx.execute(
            "UPDATE lexeme SET part_of_speech = COALESCE(part_of_speech, 'phrase') WHERE id = ?1",
            [phrase_id],
        )?;
        LexemeRepo::upsert_translation(
            &tx,
            phrase_id,
            target_language_id,
            &row.translation,
            row.nuance.as_deref(),
            Some("ai"),
            Some(0.9),
            "general",
        )?;
        if let Some(example) = &row.example {
            LexemeRepo::upsert_example(&tx, phrase_id, example, None, Some("ai"), Some(1))?;
        }
        VocabularyRepo::add(
            &tx,
            &AddVocabularyInput {
                lexeme_id: Some(phrase_id),
                text: row.text.clone(),
                source_language: word.language_code.clone(),
                notes: None,
                source: Some("collocation".to_string()),
                category_id,
            },
        )?;
        CollocationRepo::link_phrase_lexeme(&tx, row.id, phrase_id)?;
    }

    tx.commit()?;
    Ok(())
}

/// Persist model collocations for a word and return the stored list.
pub fn store_collocations(
    conn: &mut Connection,
    lexeme_id: i64,
    target_language_id: i64,
    items: &[crate::providers::ai::CollocationItem],
) -> Result<Vec<CollocationDto>, AppError> {
    let tx = conn.transaction()?;
    CollocationRepo::insert_batch(&tx, lexeme_id, target_language_id, items, Some("ai"))?;
    tx.commit()?;
    CollocationRepo::list(conn, lexeme_id, target_language_id)
}

// ── Commands ──────────────────────────────────────────────

/// Collocations of a word: from SQLite when cached, otherwise from the AI model.
#[tauri::command]
pub async fn get_collocations(
    lexeme_id: i64,
    target_language: String,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<Vec<CollocationDto>, AppError> {
    let pool = db.inner().clone();
    let (word, target_language_id, main_translation, settings) = {
        let conn = pool.get()?;
        let word = word_info(&conn, lexeme_id)?;
        let target_language_id = LexemeRepo::ensure_language(&conn, &target_language)?;
        let cached = CollocationRepo::list(&conn, lexeme_id, target_language_id)?;
        if !cached.is_empty()
            || CollocationRepo::known_to_have_none(&conn, lexeme_id, target_language_id)?
        {
            return Ok(cached);
        }
        let main_translation =
            LexemeRepo::get_translations(&conn, lexeme_id, Some(target_language_id))?
                .into_iter()
                .next()
                .map(|t| t.translated_text)
                .unwrap_or_default();
        let settings = SettingsRepo::get(&conn).unwrap_or_default();
        (word, target_language_id, main_translation, settings)
    };

    if settings.offline_mode || settings.ai_provider == "offline" {
        return Err(AppError::ai_not_connected("Collocations"));
    }
    let registry = crate::providers::models::router::registry_for_role(
        &app,
        &pool,
        &settings,
        crate::providers::models::roles::ModelRole::TextFast,
    )?;
    let result = registry
        .collocations(CollocationsRequest {
            text: word.text,
            source_language: word.language_code,
            target_language,
            main_translation,
        })
        .await?;

    let mut conn = pool.get()?;
    store_collocations(&mut conn, lexeme_id, target_language_id, &result.collocations)
}

/// Add chosen collocations of a word as vocabulary cards; returns the refreshed list.
#[tauri::command]
pub async fn add_collocations_to_vocabulary(
    input: AddCollocationsInput,
    db: State<'_, Arc<DbPool>>,
    app: AppHandle,
) -> Result<Vec<CollocationDto>, AppError> {
    let pool = db.inner().clone();
    let mut conn = pool.get()?;
    add_collocations_inner(&mut conn, &input)?;
    let target_language_id = LexemeRepo::language_id_by_code(&conn, &input.target_language)?;
    let list = CollocationRepo::list(&conn, input.lexeme_id, target_language_id)?;
    drop(conn);
    crate::commands::categories::notify_categories_changed(&app);
    Ok(list)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::study::StudyQueueFilters;
    use crate::db::{create_pool_test_memory, run_migrations, DbPool};
    use crate::providers::ai::CollocationItem;
    use crate::srs::queue::QueueBuilder;

    fn setup_db() -> DbPool {
        let pool = create_pool_test_memory().expect("create in-memory pool");
        run_migrations(&pool).expect("run migrations");
        pool
    }

    fn item(text: &str, focus: Option<&str>, distractors: &[&str]) -> CollocationItem {
        CollocationItem {
            text: text.to_string(),
            pattern: Some("prep + noun".to_string()),
            translation: format!("{text} (uk)"),
            example: Some(format!("It happened {text}.")),
            focus: focus.map(str::to_string),
            distractors: distractors.iter().map(|d| d.to_string()).collect(),
            nuance: None,
        }
    }

    /// Word "end" with three stored collocations for Ukrainian.
    fn seed_end(conn: &mut Connection) -> (i64, i64, Vec<CollocationDto>) {
        let en = LexemeRepo::ensure_language(conn, "en").expect("en");
        let uk = LexemeRepo::ensure_language(conn, "uk").expect("uk");
        let end = LexemeRepo::find_or_create(conn, en, "end", Some("noun"), None, None)
            .expect("lexeme");
        let list = store_collocations(
            conn,
            end,
            uk,
            &[
                item("in the end", Some("in"), &["at", "by"]),
                item("at the end of", Some("at"), &["in"]),
                item("end up", None, &[]),
            ],
        )
        .expect("store");
        (end, uk, list)
    }

    fn add_input(lexeme_id: i64, ids: Vec<i64>) -> AddCollocationsInput {
        AddCollocationsInput {
            lexeme_id,
            target_language: "uk".to_string(),
            collocation_ids: ids,
            category_id: None,
        }
    }

    #[test]
    fn stored_collocations_keep_model_order_and_are_not_duplicated() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, list) = seed_end(&mut conn);
        let texts: Vec<_> = list.iter().map(|c| c.text.as_str()).collect();
        assert_eq!(texts, vec!["in the end", "at the end of", "end up"]);
        assert_eq!(list[0].distractors, vec!["at", "by"]);
        assert!(list.iter().all(|c| c.vocabulary_entry_id.is_none()));

        let again = store_collocations(&mut conn, end, uk, &[item("In The End", None, &[])])
            .expect("store again");
        assert_eq!(again.len(), 3);
        assert_eq!(again[0].focus.as_deref(), Some("in"), "first stored row wins");
        assert!(!CollocationRepo::known_to_have_none(&conn, end, uk).expect("check"));
    }

    #[test]
    fn empty_model_answer_is_remembered_per_target_language() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, _list) = seed_end(&mut conn);
        let ru = LexemeRepo::ensure_language(&conn, "ru").expect("ru");
        let de = LexemeRepo::ensure_language(&conn, "de").expect("de");
        assert!(!CollocationRepo::known_to_have_none(&conn, end, ru).expect("check"));

        assert!(store_collocations(&mut conn, end, ru, &[]).expect("store").is_empty());
        assert!(CollocationRepo::known_to_have_none(&conn, end, ru).expect("check"));
        assert!(!CollocationRepo::known_to_have_none(&conn, end, uk).expect("check"));
        assert!(!CollocationRepo::known_to_have_none(&conn, end, de).expect("check"), "never asked");
    }

    #[test]
    fn a_second_model_answer_does_not_merge_into_the_stored_list() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, _list) = seed_end(&mut conn);
        let again = store_collocations(&mut conn, end, uk, &[item("end of story", None, &[])])
            .expect("store again");
        let texts: Vec<_> = again.iter().map(|c| c.text.as_str()).collect();
        assert_eq!(texts, vec!["in the end", "at the end of", "end up"]);
    }

    #[test]
    fn respelling_forgets_collocations_and_phrase_drills() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, list) = seed_end(&mut conn);
        add_collocations_inner(&mut conn, &add_input(end, vec![list[0].id])).expect("add");
        let phrase: i64 = conn
            .query_row(
                "SELECT collocation_lexeme_id FROM lexeme_collocation WHERE id = ?1",
                [list[0].id],
                |r| r.get(0),
            )
            .expect("link");

        // Respelling the phrase card drops its drill.
        CollocationRepo::forget_for_lexeme(&conn, phrase).expect("forget phrase");
        assert!(CollocationRepo::drill_for_phrase(&conn, phrase).expect("drill").is_none());

        // Respelling the word drops its cached list and the "none" marker.
        let ru = LexemeRepo::ensure_language(&conn, "ru").expect("ru");
        store_collocations(&mut conn, end, ru, &[]).expect("ru none");
        CollocationRepo::forget_for_lexeme(&conn, end).expect("forget word");
        assert!(CollocationRepo::list(&conn, end, uk).expect("list").is_empty());
        assert!(!CollocationRepo::known_to_have_none(&conn, end, ru).expect("check"));
    }

    #[test]
    fn adding_collocations_creates_linked_phrase_cards_idempotently() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, list) = seed_end(&mut conn);
        let ids = vec![list[0].id, list[1].id];

        add_collocations_inner(&mut conn, &add_input(end, ids.clone())).expect("add");
        add_collocations_inner(&mut conn, &add_input(end, ids)).expect("add twice");

        let refreshed = CollocationRepo::list(&conn, end, uk).expect("list");
        assert!(refreshed[0].vocabulary_entry_id.is_some());
        assert!(refreshed[1].vocabulary_entry_id.is_some());
        assert!(refreshed[2].vocabulary_entry_id.is_none());

        let cards: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM user_vocabulary WHERE source = 'collocation' AND deleted_at IS NULL",
                [],
                |r| r.get(0),
            )
            .expect("count");
        assert_eq!(cards, 2);

        let entry_id = refreshed[0].vocabulary_entry_id.expect("entry");
        let entry =
            crate::commands::vocabulary::get_vocabulary_entry_by_id(&conn, entry_id).expect("entry");
        assert_eq!(entry.lexeme.text, "in the end");
        assert_eq!(entry.lexeme.part_of_speech.as_deref(), Some("phrase"));
        assert_eq!(entry.translations[0].translated_text, "in the end (uk)");
        assert_eq!(entry.examples[0].sentence, "It happened in the end.");
        assert!(entry.review_state.is_some());
        let drill = entry.collocation_drill.expect("drill");
        assert_eq!(drill.focus, "in");
        assert_eq!(drill.distractors, vec!["at", "by"]);
        assert_eq!(drill.headword, "end");
    }

    #[test]
    fn collocation_cards_inherit_the_word_category() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, _uk, list) = seed_end(&mut conn);
        let en = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        conn.execute(
            "INSERT INTO vocabulary_category(language_id, name, normalized_name) VALUES (?1, 'Time', 'time')",
            [en],
        )
        .expect("category");
        let category = conn.last_insert_rowid();
        VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: Some(end),
                text: "end".to_string(),
                source_language: "en".to_string(),
                notes: None,
                source: Some("popup".to_string()),
                category_id: Some(category),
            },
        )
        .expect("add word");

        add_collocations_inner(&mut conn, &add_input(end, vec![list[0].id])).expect("add");
        let card_category: i64 = conn
            .query_row(
                "SELECT category_id FROM user_vocabulary WHERE source = 'collocation'",
                [],
                |r| r.get(0),
            )
            .expect("category");
        assert_eq!(card_category, category);
    }

    #[test]
    fn foreign_collocation_id_rolls_back_the_whole_batch() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, _uk, list) = seed_end(&mut conn);
        let err = add_collocations_inner(&mut conn, &add_input(end, vec![list[0].id, 999_999]))
            .expect_err("foreign id");
        assert!(matches!(err, AppError::Validation(_)));
        let cards: i64 = conn
            .query_row("SELECT COUNT(*) FROM user_vocabulary", [], |r| r.get(0))
            .expect("count");
        assert_eq!(cards, 0);
    }

    #[test]
    fn manually_added_phrase_counts_as_added() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, uk, _list) = seed_end(&mut conn);
        VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: None,
                text: "End Up".to_string(),
                source_language: "en".to_string(),
                notes: None,
                source: None,
                category_id: None,
            },
        )
        .expect("add phrase");
        let refreshed = CollocationRepo::list(&conn, end, uk).expect("list");
        assert!(refreshed[2].vocabulary_entry_id.is_some());
    }

    #[test]
    fn collocation_queue_only_holds_drillable_collocation_cards() {
        let pool = setup_db();
        let mut conn = pool.get().expect("conn");
        let (end, _uk, list) = seed_end(&mut conn);
        let ids = list.iter().map(|c| c.id).collect();
        add_collocations_inner(&mut conn, &add_input(end, ids)).expect("add");
        VocabularyRepo::add(
            &conn,
            &AddVocabularyInput {
                lexeme_id: Some(end),
                text: "end".to_string(),
                source_language: "en".to_string(),
                notes: None,
                source: None,
                category_id: None,
            },
        )
        .expect("add word");

        let en = LexemeRepo::language_id_by_code(&conn, "en").expect("en");
        let mut filters = StudyQueueFilters {
            language_id: en,
            limit: 20,
            include_new: true,
            include_mature_refresh: false,
            include_mine: None,
            collection_ids: Vec::new(),
            category_ids: Vec::new(),
            collocations_only: true,
        };
        let queue = QueueBuilder::build_queue(&conn, &filters).expect("queue");
        let mut texts: Vec<_> = queue.iter().map(|e| e.lexeme.text.clone()).collect();
        texts.sort();
        assert_eq!(texts, vec!["at the end of", "in the end"], "\"end up\" has no drill");

        filters.collocations_only = false;
        let all = QueueBuilder::build_queue(&conn, &filters).expect("queue");
        assert_eq!(all.len(), 4);
    }
}
