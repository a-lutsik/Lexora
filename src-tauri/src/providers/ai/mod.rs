// ============================================================
// LEXORA — AI Provider Trait & Registry
// ============================================================

pub mod anthropic;
pub mod cloudflare;
pub mod custom;
pub mod gemini;
pub mod lexical_domain;
pub mod openai;
pub mod rate_limit;

use crate::providers::models::usage::ChainUsage;
use crate::commands::study::EvaluationResult;
use crate::commands::translate::TranslationResult;
use crate::error::AppError;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Extract JSON Value from LLM string output, safely handling markdown code blocks,
/// reasoning traces (<think>...</think>), or extra surrounding text.
pub fn extract_json(raw: &str) -> Result<serde_json::Value, AppError> {
    let mut text = raw.trim();

    // Strip DeepSeek/Reasoning model <think>...</think> tags if present
    if let Some(end_think) = text.find("</think>") {
        text = text[end_think + 8..].trim();
    }

    // Try direct parsing first
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(text) {
        return Ok(v);
    }

    // Check for markdown code fence ```json ... ``` or ``` ... ```
    if let Some(start_idx) = text.find("```") {
        let after_start = &text[start_idx + 3..];
        let content_start = if let Some(stripped) = after_start.strip_prefix("json") {
            stripped
        } else if let Some(newline_pos) = after_start.find('\n') {
            &after_start[newline_pos + 1..]
        } else {
            after_start
        };

        if let Some(end_idx) = content_start.find("```") {
            let json_str = content_start[..end_idx].trim();
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
                return Ok(v);
            }
        }
    }

    // Fallback: extract the first matching outer `{ ... }`
    if let (Some(first_brace), Some(last_brace)) = (text.find('{'), text.rfind('}')) {
        if first_brace < last_brace {
            let slice = &text[first_brace..=last_brace];
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(slice) {
                return Ok(v);
            }
        }
    }

    // Truncate by chars: a byte slice panics inside multi-byte UTF-8 (Cyrillic, CJK),
    // and the release profile aborts the whole app on panic.
    let excerpt: String = text.chars().take(300).collect();
    Err(AppError::Provider(format!(
        "Failed to parse structured JSON from LLM response. Response was: {excerpt}"
    )))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateRequest {
    pub text: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub context_sentence: Option<String>,
    /// Subject lexicon: `auto` | `general` | `it` | `medicine` | `legal` | `finance` | `business`.
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichRequest {
    pub text: String,
    pub source_language: String,
    pub target_language: String,
    pub main_translation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichResult {
    pub usage_note: Option<String>,
    pub example_sentence: Option<String>,
    pub example_sentence_2: Option<String>,
}

/// Request for the first mnemonic LLM step (3 visual associations).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MnemonicConceptsRequest {
    pub word: String,
    pub translation: String,
    pub context: String,
    pub level: String,
    /// Previously used scenes to avoid when regenerating a new image.
    #[serde(default)]
    pub avoid_scenes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MnemonicAssociation {
    pub id: String,
    pub association: String,
    pub memory_hook: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MnemonicConceptsResult {
    pub sense: String,
    pub associations: Vec<MnemonicAssociation>,
    /// Ready-to-use image-generation prompt (single-scene designer output).
    pub image_prompt: Option<String>,
}

/// Request for the ranking + image-prompt LLM step.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MnemonicRankRequest {
    pub word: String,
    pub sense: String,
    pub associations: Vec<MnemonicAssociation>,
    /// Previously used scenes — rank should prefer a different situation.
    #[serde(default)]
    pub avoid_scenes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MnemonicAssociationScore {
    pub id: String,
    pub clarity: u8,
    pub memorability: u8,
    pub ambiguity: u8,
    pub cultural_universality: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MnemonicRankResult {
    pub selected_id: String,
    pub scores: Vec<MnemonicAssociationScore>,
    pub image_prompt: String,
    pub photo_search_query: String,
}

/// Parse string array field from LLM JSON (`alternatives`, `source_synonyms`, …).
pub fn parse_string_array(value: &serde_json::Value, key: &str) -> Vec<String> {
    value[key]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(|s| s.trim().to_string()))
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// Build TranslationResult fields from compact gloss JSON (no example/usage required).
pub fn gloss_from_json(
    req: &TranslateRequest,
    parsed: &serde_json::Value,
) -> crate::commands::translate::TranslationResult {
    let detected = parsed["detected_source_language"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty() && !s.eq_ignore_ascii_case("auto"))
        .map(|s| s.to_lowercase().replace('_', "-"));
    let detected = detected.map(|s| s.split('-').next().unwrap_or(&s).to_string());
    let source_language = detected
        .or_else(|| {
            req.source_language
                .as_ref()
                .map(|s| s.trim().to_lowercase())
                .filter(|s| !s.is_empty() && s != "auto")
        })
        .unwrap_or_else(|| "auto".to_string());

    let requested_domain =
        lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let forced = lexical_domain::resolve_domain_for_request(
        &requested_domain,
        &req.text,
        req.context_sentence.as_deref(),
    );
    let detected_domain = forced.or_else(|| {
        lexical_domain::parse_resolved_domain(parsed["detected_lexical_domain"].as_str())
    });

    crate::commands::translate::TranslationResult {
        text: req.text.clone(),
        source_language,
        target_language: req.target_language.clone(),
        main_translation: parsed["main_translation"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        alternatives: parse_string_array(parsed, "alternatives"),
        source_synonyms: parse_string_array(parsed, "source_synonyms"),
        part_of_speech: parsed["part_of_speech"].as_str().map(String::from),
        phonetic: parsed["phonetic"].as_str().map(String::from),
        usage_note: parsed["usage_note"].as_str().map(String::from),
        example_sentence: parsed["example_sentence"].as_str().map(String::from),
        example_sentence_2: parsed["example_sentence_2"].as_str().map(String::from),
        frequency_hint: None,
        from_cache: false,
        is_offline_fallback: false,
        lexeme_id: None,
        image_path: None,
        detected_lexical_domain: detected_domain.or_else(|| Some("general".to_string())),
        requested_lexical_domain: Some(requested_domain),
    }
}

/// Build EvaluationResult from parsed LLM JSON (shared by evaluate_answer / explain_error).
/// Missing fields degrade gracefully: is_correct=false, grade=1,
/// correct_answer falls back to the target text.
pub fn evaluation_from_json(parsed: &serde_json::Value, target_fallback: &str) -> EvaluationResult {
    EvaluationResult {
        is_correct: parsed["is_correct"].as_bool().unwrap_or(false),
        // Saturate instead of `as u8` wrapping (260 → 4); callers reject grades > 4.
        grade: parsed["grade"]
            .as_u64()
            .map_or(1, |g| u8::try_from(g).unwrap_or(u8::MAX)),
        error_type: parsed["error_type"].as_str().map(String::from),
        correct_answer: parsed["correct_answer"]
            .as_str()
            .unwrap_or(target_fallback)
            .to_string(),
        explanation: parsed["explanation"].as_str().map(String::from),
        short_rule: parsed["short_rule"].as_str().map(String::from),
    }
}

/// Build EnrichResult from parsed LLM JSON. Optional usage and examples.
pub fn enrich_from_json(parsed: &serde_json::Value) -> EnrichResult {
    let example_sentence = parsed["example_sentence"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from);
    let example_sentence_2 = parsed["example_sentence_2"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .filter(|second| {
            !example_sentence
                .as_ref()
                .is_some_and(|first| first.eq_ignore_ascii_case(second))
        });
    EnrichResult {
        usage_note: parsed["usage_note"].as_str().map(String::from),
        example_sentence,
        example_sentence_2,
    }
}

fn optional_trimmed_string(value: &serde_json::Value, key: &str) -> Option<String> {
    value[key]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
}

/// Parse mnemonic designer JSON (image_prompt scene, or legacy 3 associations).
pub fn mnemonic_concepts_from_json(
    parsed: &serde_json::Value,
) -> Result<MnemonicConceptsResult, AppError> {
    let sense = optional_trimmed_string(parsed, "sense")
        .ok_or_else(|| AppError::Provider("Mnemonic concepts missing sense".to_string()))?;

    let mut associations = parsed["associations"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let id = item["id"].as_str()?.trim();
                    let association = item["association"].as_str()?.trim();
                    let memory_hook = item["memory_hook"].as_str()?.trim();
                    if id.is_empty() || association.is_empty() || memory_hook.is_empty() {
                        return None;
                    }
                    Some(MnemonicAssociation {
                        id: id.to_string(),
                        association: association.to_string(),
                        memory_hook: memory_hook.to_string(),
                    })
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    if associations.is_empty() {
        if let (Some(association), Some(memory_hook)) = (
            optional_trimmed_string(parsed, "association"),
            optional_trimmed_string(parsed, "memory_hook"),
        ) {
            associations.push(MnemonicAssociation {
                id: "a".to_string(),
                association,
                memory_hook,
            });
        }
    }

    let image_prompt = optional_trimmed_string(parsed, "image_prompt");
    if image_prompt.is_none() && associations.len() < 3 {
        return Err(AppError::Provider(format!(
            "Mnemonic concepts expected image_prompt or 3 associations, got {}",
            associations.len()
        )));
    }

    Ok(MnemonicConceptsResult {
        sense,
        associations: associations.into_iter().take(3).collect(),
        image_prompt,
    })
}

/// Parse mnemonic rank JSON (selected association + image prompt + photo query).
pub fn mnemonic_rank_from_json(parsed: &serde_json::Value) -> Result<MnemonicRankResult, AppError> {
    let selected_id = optional_trimmed_string(parsed, "selected_id")
        .ok_or_else(|| AppError::Provider("Mnemonic rank missing selected_id".to_string()))?;
    let image_prompt = optional_trimmed_string(parsed, "image_prompt")
        .ok_or_else(|| AppError::Provider("Mnemonic rank missing image_prompt".to_string()))?;
    let photo_search_query =
        optional_trimmed_string(parsed, "photo_search_query").ok_or_else(|| {
            AppError::Provider("Mnemonic rank missing photo_search_query".to_string())
        })?;

    let scores = parsed["scores"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    Some(MnemonicAssociationScore {
                        id: item["id"].as_str()?.trim().to_string(),
                        clarity: item["clarity"].as_u64().unwrap_or(0) as u8,
                        memorability: item["memorability"].as_u64().unwrap_or(0) as u8,
                        ambiguity: item["ambiguity"].as_u64().unwrap_or(0) as u8,
                        cultural_universality: item["cultural_universality"].as_u64().unwrap_or(0)
                            as u8,
                    })
                })
                .filter(|s| !s.id.is_empty())
                .collect()
        })
        .unwrap_or_default();

    Ok(MnemonicRankResult {
        selected_id,
        scores,
        image_prompt,
        photo_search_query,
    })
}

/// Render the translate prompt from prompts/translate.txt.
pub fn render_translate_prompt(req: &TranslateRequest) -> String {
    let requested = lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let forced = lexical_domain::resolve_domain_for_request(
        &requested,
        &req.text,
        req.context_sentence.as_deref(),
    );
    include_str!("prompts/translate.txt")
        .replace("{{text}}", &req.text)
        .replace(
            "{{source_lang}}",
            req.source_language.as_deref().unwrap_or("auto"),
        )
        .replace("{{target_lang}}", &req.target_language)
        .replace(
            "{{context}}",
            req.context_sentence.as_deref().unwrap_or("none"),
        )
        .replace(
            "{{lexical_domain}}",
            lexical_domain::domain_for_prompt(forced.as_deref()),
        )
}

/// Render the enrich prompt from prompts/enrich.txt.
pub fn render_enrich_prompt(req: &EnrichRequest) -> String {
    include_str!("prompts/enrich.txt")
        .replace("{{text}}", &req.text)
        .replace("{{source_lang}}", &req.source_language)
        .replace("{{target_lang}}", &req.target_language)
        .replace("{{main_translation}}", &req.main_translation)
}

/// Format previously used scenes for mnemonic prompts (`none` when empty).
pub fn format_avoid_scenes(scenes: &[String]) -> String {
    let lines: Vec<&str> = scenes
        .iter()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    if lines.is_empty() {
        "none".to_string()
    } else {
        lines
            .iter()
            .enumerate()
            .map(|(i, scene)| format!("{}. {scene}", i + 1))
            .collect::<Vec<_>>()
            .join("\n")
    }
}

/// Render the mnemonic concepts prompt.
pub fn render_mnemonic_concepts_prompt(req: &MnemonicConceptsRequest) -> String {
    include_str!("prompts/mnemonic_concepts.txt")
        .replace("{{word}}", &req.word)
        .replace("{{translation}}", &req.translation)
        .replace("{{context}}", &req.context)
        .replace("{{level}}", &req.level)
        .replace("{{avoid_scenes}}", &format_avoid_scenes(&req.avoid_scenes))
}

/// Render the mnemonic rank + image-prompt prompt.
pub fn render_mnemonic_rank_prompt(req: &MnemonicRankRequest) -> String {
    let associations_json =
        serde_json::to_string_pretty(&req.associations).unwrap_or_else(|_| "[]".to_string());
    include_str!("prompts/mnemonic_rank.txt")
        .replace("{{word}}", &req.word)
        .replace("{{sense}}", &req.sense)
        .replace("{{associations_json}}", &associations_json)
        .replace("{{avoid_scenes}}", &format_avoid_scenes(&req.avoid_scenes))
}

/// Render the evaluate prompt from prompts/evaluate.txt.
pub fn render_evaluate_prompt(req: &EvaluateRequest) -> String {
    include_str!("prompts/evaluate.txt")
        .replace("{{target_text}}", &req.target_text)
        .replace("{{user_answer}}", &req.user_answer)
        .replace("{{mode}}", &req.mode)
        .replace("{{language}}", &req.language)
}

/// Render the explain_error prompt from prompts/explain_error.txt.
pub fn render_explain_prompt(req: &ExplainRequest) -> String {
    include_str!("prompts/explain_error.txt")
        .replace("{{target_text}}", &req.target_text)
        .replace("{{user_answer}}", &req.user_answer)
        .replace("{{mode}}", &req.mode)
        .replace("{{language}}", &req.language)
        .replace("{{error_type}}", &req.error_type)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluateRequest {
    pub target_text: String,
    pub user_answer: String,
    pub mode: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplainRequest {
    pub target_text: String,
    pub user_answer: String,
    pub mode: String,
    pub language: String,
    /// Error type guessed by the heuristic evaluator, passed as a hint.
    pub error_type: String,
}

// ── Stage 2: Writing Assistant Types ──────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckWritingRequest {
    pub text: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckWritingResult {
    pub issues: Vec<WritingIssueRaw>,
    pub overall_score: u8,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingIssueRaw {
    pub category: String,
    pub severity: String,
    pub original_fragment: String,
    pub suggested_fix: String,
    pub explanation: String,
    pub rule_hint: Option<String>,
    pub offset_start: i64,
    pub offset_end: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewriteRequest {
    pub text: String,
    pub language: String,
    pub mode: String,
    #[serde(default)]
    pub custom_instruction: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewriteResult {
    pub rewritten_text: String,
    pub changes_summary: String,
}

/// Stage 2: a summary of one recurring user error pattern, used to generate exercises.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPatternSummary {
    pub category: String,
    pub occurrence_count: i64,
    pub sample_original: Option<String>,
    pub sample_fix: Option<String>,
}

/// Stage 2: request to generate practice exercises from the user's error patterns.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateExercisesRequest {
    pub language: String,
    pub patterns: Vec<ErrorPatternSummary>,
}

/// Stage 2: one generated exercise as returned by the LLM (before DB/DTO mapping).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingExerciseRaw {
    pub category: String,
    pub exercise_type: String,
    pub prompt: String,
    pub correct_answer: String,
    pub explanation: String,
}

/// Render the check_writing prompt from prompts/check_writing.txt.
pub fn render_check_writing_prompt(req: &CheckWritingRequest) -> String {
    include_str!("prompts/check_writing.txt")
        .replace("{language}", &req.language)
        .replace("{text}", &req.text)
}

/// Render the rewrite_text prompt from prompts/rewrite_text.txt.
pub fn render_rewrite_prompt(req: &RewriteRequest) -> String {
    include_str!("prompts/rewrite_text.txt")
        .replace("{mode}", &req.mode)
        .replace("{language}", &req.language)
        .replace("{text}", &req.text)
        .replace("{custom_instruction}", &req.custom_instruction)
}

/// Parse CheckWritingResult from LLM JSON.
pub fn check_writing_from_json(parsed: &serde_json::Value) -> CheckWritingResult {
    let issues = parsed["issues"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| {
                    Some(WritingIssueRaw {
                        category: v["category"].as_str()?.to_string(),
                        severity: v["severity"].as_str().unwrap_or("warning").to_string(),
                        original_fragment: v["original_fragment"].as_str()?.to_string(),
                        suggested_fix: v["suggested_fix"].as_str()?.to_string(),
                        explanation: v["explanation"].as_str().unwrap_or("").to_string(),
                        rule_hint: v["rule_hint"].as_str().map(String::from),
                        offset_start: v["offset_start"].as_i64().unwrap_or(0),
                        offset_end: v["offset_end"].as_i64().unwrap_or(0),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    CheckWritingResult {
        issues,
        overall_score: parsed["overall_score"].as_u64().unwrap_or(100) as u8,
        summary: parsed["summary"]
            .as_str()
            .unwrap_or("Analysis complete.")
            .to_string(),
    }
}

/// Parse RewriteResult from LLM JSON.
pub fn rewrite_from_json(parsed: &serde_json::Value) -> Result<RewriteResult, AppError> {
    let rewritten_text = parsed["rewritten_text"]
        .as_str()
        .ok_or_else(|| AppError::Provider("Missing rewritten_text in LLM response".to_string()))?
        .to_string();
    Ok(RewriteResult {
        rewritten_text,
        changes_summary: parsed["changes_summary"]
            .as_str()
            .unwrap_or("Text rewritten.")
            .to_string(),
    })
}

// ── Stage 3: Pronunciation Coach Types ────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluatePronunciationRequest {
    pub target_text: String,
    pub target_ipa: Option<String>,
    pub language: String,
    pub audio_path: Option<String>,
    pub recognized_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhonemeScoreRaw {
    pub target_phoneme: String,
    pub recognized_phoneme: Option<String>,
    pub accuracy: u8,
    pub status: String,
    pub position: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PronunciationEvaluationResult {
    pub overall_score: u8,
    pub recognized_text: String,
    pub target_ipa: String,
    pub recognized_ipa: String,
    pub stress_feedback: Option<String>,
    pub summary: String,
    pub phonemes: Vec<PhonemeScoreRaw>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticulationTipRequest {
    pub phoneme: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticulationTipResult {
    pub phoneme: String,
    pub tip: String,
    pub tongue_position: Option<String>,
    pub lip_position: Option<String>,
}

pub fn render_evaluate_pronunciation_prompt(req: &EvaluatePronunciationRequest) -> String {
    let recognized = req.recognized_text.as_deref().unwrap_or("").trim();
    let has_audio = req
        .audio_path
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .is_some();
    // Without an ASR transcript the model must transcribe the attached audio
    // itself — telling it "recognized text is empty" makes it score 0 blindly.
    let asr_hint = if !recognized.is_empty() {
        format!("Recognized text (ASR): {recognized}")
    } else if has_audio {
        "No ASR transcript is provided: transcribe the attached audio yourself, then evaluate it."
            .to_string()
    } else {
        "Recognized text (ASR): (none)".to_string()
    };
    let no_speech_rule = if has_audio {
        "- If the attached audio contains no discernible speech, return overall_score 0, empty recognized_text, and an empty phonemes array."
    } else {
        "- If recognized text is empty, still return JSON with overall_score 0 and an empty phonemes array."
    };
    include_str!("prompts/evaluate_pronunciation.txt")
        .replace("{{target_text}}", &req.target_text)
        .replace(
            "{{target_ipa}}",
            req.target_ipa.as_deref().unwrap_or("unknown"),
        )
        .replace("{{asr_hint}}", &asr_hint)
        .replace("{{no_speech_rule}}", no_speech_rule)
        .replace("{{language}}", &req.language)
}

pub fn render_articulation_tip_prompt(req: &ArticulationTipRequest) -> String {
    include_str!("prompts/articulation_tip.txt")
        .replace("{{phoneme}}", &req.phoneme)
        .replace("{{language}}", &req.language)
}

pub fn pronunciation_from_json(
    parsed: &serde_json::Value,
    req: &EvaluatePronunciationRequest,
) -> PronunciationEvaluationResult {
    let phonemes = parsed["phonemes"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .enumerate()
                .filter_map(|(i, v)| {
                    Some(PhonemeScoreRaw {
                        target_phoneme: v["target_phoneme"].as_str()?.to_string(),
                        recognized_phoneme: v["recognized_phoneme"].as_str().map(String::from),
                        accuracy: v["accuracy"].as_u64().unwrap_or(0) as u8,
                        status: v["status"].as_str().unwrap_or("miss").to_string(),
                        position: v["position"].as_i64().unwrap_or(i as i64),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    PronunciationEvaluationResult {
        overall_score: parsed["overall_score"].as_u64().unwrap_or(0) as u8,
        recognized_text: parsed["recognized_text"]
            .as_str()
            .map(String::from)
            .or_else(|| req.recognized_text.clone())
            .unwrap_or_default(),
        target_ipa: parsed["target_ipa"]
            .as_str()
            .map(String::from)
            .or_else(|| req.target_ipa.clone())
            .unwrap_or_default(),
        recognized_ipa: parsed["recognized_ipa"].as_str().unwrap_or("").to_string(),
        stress_feedback: parsed["stress_feedback"].as_str().map(String::from),
        summary: parsed["summary"]
            .as_str()
            .unwrap_or("Pronunciation analyzed.")
            .to_string(),
        phonemes,
    }
}

pub fn articulation_tip_from_json(
    parsed: &serde_json::Value,
    phoneme: &str,
) -> ArticulationTipResult {
    ArticulationTipResult {
        phoneme: parsed["phoneme"].as_str().unwrap_or(phoneme).to_string(),
        tip: parsed["tip"].as_str().unwrap_or("").to_string(),
        tongue_position: parsed["tongue_position"].as_str().map(String::from),
        lip_position: parsed["lip_position"].as_str().map(String::from),
    }
}

/// Offline fallback: IPA Levenshtein between target and recognized transcriptions.
pub fn evaluate_pronunciation_heuristic(
    req: &EvaluatePronunciationRequest,
) -> PronunciationEvaluationResult {
    let recognized_text = req.recognized_text.clone().unwrap_or_default();
    let target_ipa = req.target_ipa.clone().unwrap_or_default();
    let (score, aligned) = crate::pronunciation::ipa::evaluate_offline(
        &req.target_text,
        &target_ipa,
        &recognized_text,
        "",
    );
    let recognized_ipa = if target_ipa.is_empty() {
        recognized_text.clone()
    } else {
        aligned
            .iter()
            .filter_map(|p| p.recognized_phoneme.clone())
            .collect::<Vec<_>>()
            .join("")
    };
    PronunciationEvaluationResult {
        overall_score: score,
        recognized_text,
        target_ipa: target_ipa.clone(),
        recognized_ipa,
        stress_feedback: None,
        summary: "Offline IPA comparison (no live ASR).".to_string(),
        phonemes: aligned
            .into_iter()
            .map(|p| PhonemeScoreRaw {
                target_phoneme: p.target_phoneme,
                recognized_phoneme: p.recognized_phoneme,
                accuracy: p.accuracy,
                status: p.status,
                position: p.position,
            })
            .collect(),
    }
}

/// Render the generate_exercises prompt from prompts/generate_exercises.txt.
pub fn render_generate_exercises_prompt(req: &GenerateExercisesRequest) -> String {
    let patterns = req
        .patterns
        .iter()
        .enumerate()
        .map(|(i, p)| {
            let mut line = format!(
                "{}. Category: {} ({} occurrences)",
                i + 1,
                p.category,
                p.occurrence_count
            );
            if let Some(original) = &p.sample_original {
                line.push_str(&format!("\n   User wrote: {original}"));
            }
            if let Some(fix) = &p.sample_fix {
                line.push_str(&format!("\n   Correct version: {fix}"));
            }
            line
        })
        .collect::<Vec<_>>()
        .join("\n");

    include_str!("prompts/generate_exercises.txt")
        .replace("{language}", &req.language)
        .replace("{patterns}", &patterns)
}

/// Parse WritingExerciseRaw list from LLM JSON.
/// Accepts a top-level JSON array (or an {"exercises": [...]} wrapper).
/// Malformed elements are skipped gracefully.
pub fn exercises_from_json(parsed: &serde_json::Value) -> Vec<WritingExerciseRaw> {
    let arr = parsed.as_array().or_else(|| parsed["exercises"].as_array());

    arr.map(|arr| {
        arr.iter()
            .filter_map(|v| {
                Some(WritingExerciseRaw {
                    category: v["category"].as_str()?.to_string(),
                    exercise_type: v["exercise_type"]
                        .as_str()
                        .unwrap_or("fill_blank")
                        .to_string(),
                    prompt: v["prompt"].as_str()?.to_string(),
                    correct_answer: v["correct_answer"].as_str()?.to_string(),
                    explanation: v["explanation"].as_str().unwrap_or("").to_string(),
                })
            })
            .collect()
    })
    .unwrap_or_default()
}

// ── Stage 4: Multimodal Translation Types ─────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateImageRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub source_language: Option<String>,
    pub target_language: String,
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoundingBox {
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageTextBlock {
    pub original_text: String,
    pub translated_text: String,
    pub bounding_box: Option<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageTranslationResult {
    pub source_language: String,
    pub target_language: String,
    pub full_translated_text: String,
    pub blocks: Vec<ImageTextBlock>,
    #[serde(default)]
    pub detected_lexical_domain: Option<String>,
    #[serde(default)]
    pub requested_lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateDocChunkRequest {
    pub doc_name: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub content: String,
    /// `default` | `formal` | `casual` | `academic`
    #[serde(default)]
    pub tone: Option<String>,
    /// Mandatory term pairs, one per line: `source => target`.
    #[serde(default)]
    pub glossary: Option<String>,
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocChunkTranslationResult {
    pub source_language: String,
    pub target_language: String,
    pub translated_content: String,
    #[serde(default)]
    pub detected_lexical_domain: Option<String>,
    #[serde(default)]
    pub requested_lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateAudioRequest {
    pub audio_base64: String,
    pub mime_type: String,
    pub source_language: Option<String>,
    pub target_language: String,
    #[serde(default)]
    pub lexical_domain: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioTranslationSegment {
    pub start_seconds: f64,
    pub end_seconds: f64,
    pub original_text: String,
    pub translated_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioTranslationResult {
    pub source_language: String,
    pub target_language: String,
    pub transcribed_text: String,
    pub translated_text: String,
    pub segments: Vec<AudioTranslationSegment>,
    #[serde(default)]
    pub detected_lexical_domain: Option<String>,
    #[serde(default)]
    pub requested_lexical_domain: Option<String>,
}

/// Speech recognition only (no translation): dialogue voice turns, live captions.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeAudioRequest {
    pub audio_base64: String,
    pub mime_type: String,
    /// ISO 639-1 hint; None = auto-detect.
    #[serde(default)]
    pub language: Option<String>,
    /// Expected phrase / context — reduces hallucinated stock phrases on short clips.
    #[serde(default)]
    pub prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionResult {
    pub text: String,
    /// Detected or requested ISO code, when the provider reports it.
    pub language: Option<String>,
}

pub fn render_transcribe_audio_prompt(req: &TranscribeAudioRequest) -> String {
    include_str!("prompts/transcribe_audio.txt")
        .replace("{{language}}", req.language.as_deref().unwrap_or("auto"))
        .replace(
            "{{context}}",
            req.prompt
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .unwrap_or("(none)"),
        )
}

/// Parse `{transcribed_text, source_language}` JSON from a multimodal model.
pub fn transcription_from_json(
    parsed: &serde_json::Value,
    req: &TranscribeAudioRequest,
) -> Result<TranscriptionResult, AppError> {
    let text = parsed["transcribed_text"]
        .as_str()
        .or_else(|| parsed["text"].as_str())
        .map(str::trim)
        .unwrap_or("")
        .to_string();
    if text.is_empty() {
        return Err(AppError::Provider(
            "No speech recognized in the recording".to_string(),
        ));
    }
    let language = parsed["source_language"]
        .as_str()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty() && s != "auto")
        .or_else(|| req.language.clone());
    Ok(TranscriptionResult { text, language })
}

pub fn render_translate_image_prompt(req: &TranslateImageRequest) -> String {
    let requested = lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    // Images always carry visual context → allow Auto detection.
    let forced = if requested == "auto" {
        None
    } else {
        Some(requested.clone())
    };
    include_str!("prompts/translate_image.txt")
        .replace("{{target_lang}}", &req.target_language)
        .replace(
            "{{lexical_domain}}",
            lexical_domain::domain_for_prompt(forced.as_deref()),
        )
}

pub fn render_translate_document_prompt(req: &TranslateDocChunkRequest) -> String {
    let requested = lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let forced = lexical_domain::resolve_domain_for_request(
        &requested,
        &req.content,
        None,
    );
    include_str!("prompts/translate_document.txt")
        .replace("{{doc_name}}", &req.doc_name)
        .replace(
            "{{source_lang}}",
            req.source_language.as_deref().unwrap_or("auto"),
        )
        .replace("{{target_lang}}", &req.target_language)
        .replace("{{tone}}", req.tone.as_deref().unwrap_or("default"))
        .replace(
            "{{glossary}}",
            req.glossary
                .as_deref()
                .filter(|s| !s.trim().is_empty())
                .unwrap_or("(none)"),
        )
        .replace(
            "{{lexical_domain}}",
            lexical_domain::domain_for_prompt(forced.as_deref()),
        )
        .replace("{{content}}", &req.content)
}

pub fn render_translate_audio_prompt(req: &TranslateAudioRequest) -> String {
    let requested = lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    // Spoken content usually has enough context for Auto.
    let forced = if requested == "auto" {
        None
    } else {
        Some(requested.clone())
    };
    include_str!("prompts/translate_audio.txt")
        .replace(
            "{{source_lang}}",
            req.source_language.as_deref().unwrap_or("auto"),
        )
        .replace("{{target_lang}}", &req.target_language)
        .replace(
            "{{lexical_domain}}",
            lexical_domain::domain_for_prompt(forced.as_deref()),
        )
}

// ── AI Dialogue Types ─────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueHistoryMessage {
    pub role: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueTurnRequest {
    pub scenario_title: String,
    pub tutor_role: String,
    pub level: String,
    pub language: String,
    pub history: Vec<DialogueHistoryMessage>,
    pub user_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogueTurnResult {
    pub tutor_reply: String,
    pub turn_score: u8,
    pub fluency_score: u8,
    pub clarity_score: u8,
    pub grammar_score: u8,
    pub vocabulary_suggestions: Vec<String>,
}

pub fn render_dialogue_turn_prompt(req: &DialogueTurnRequest) -> String {
    let history = if req.history.is_empty() {
        "(no prior turns)".to_string()
    } else {
        req.history
            .iter()
            .map(|m| format!("{}: {}", m.role, m.text))
            .collect::<Vec<_>>()
            .join("\n")
    };
    include_str!("prompts/dialogue_turn.txt")
        .replace("{tutor_role}", &req.tutor_role)
        .replace("{level}", &req.level)
        .replace("{language}", &req.language)
        .replace("{scenario_title}", &req.scenario_title)
        .replace("{history}", &history)
        .replace("{user_text}", &req.user_text)
}

pub fn dialogue_turn_from_json(parsed: &serde_json::Value) -> DialogueTurnResult {
    let suggestions = parsed["vocabulary_suggestions"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.trim().to_string()))
                .filter(|s| !s.is_empty())
                .take(5)
                .collect()
        })
        .unwrap_or_default();

    let clamp = |v: u64| v.min(100) as u8;

    DialogueTurnResult {
        tutor_reply: parsed["tutor_reply"]
            .as_str()
            .unwrap_or("Could you say that again?")
            .trim()
            .to_string(),
        turn_score: clamp(parsed["turn_score"].as_u64().unwrap_or(70)),
        fluency_score: clamp(parsed["fluency_score"].as_u64().unwrap_or(70)),
        clarity_score: clamp(parsed["clarity_score"].as_u64().unwrap_or(70)),
        grammar_score: clamp(parsed["grammar_score"].as_u64().unwrap_or(70)),
        vocabulary_suggestions: suggestions,
    }
}

// ── Dialogue scenario generation ──────────────────────────

/// Source of a scenario: an English builtin to localize, or the learner's
/// own title/description (empty `tutor_role` / `opening_line` = "write them").
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioSeed {
    pub title: String,
    pub level: String,
    /// `guided` or `free`.
    pub kind: String,
    pub description: String,
    pub tutor_role: String,
    pub opening_line: String,
    pub suggested_vocab: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateScenarioRequest {
    /// English name of the target language ("German").
    pub language_name: String,
    pub seed: ScenarioSeed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GeneratedScenario {
    pub title: String,
    pub description: String,
    pub tutor_role: String,
    pub opening_line: String,
    pub suggested_vocab: Vec<String>,
}

pub fn render_generate_scenario_prompt(req: &GenerateScenarioRequest) -> String {
    let seed = &req.seed;
    let vocab = if seed.suggested_vocab.is_empty() {
        String::new()
    } else {
        seed.suggested_vocab.join(", ")
    };
    include_str!("prompts/generate_scenario.txt")
        .replace("{language}", &req.language_name)
        .replace("{level}", &seed.level)
        .replace("{kind}", &seed.kind)
        .replace("{title}", &seed.title)
        .replace("{description}", &seed.description)
        .replace("{tutor_role}", &seed.tutor_role)
        .replace("{opening_line}", &seed.opening_line)
        .replace("{suggested_vocab}", &vocab)
}

/// Parse a model answer. The scenario is only usable with a title, a tutor
/// role and an opening line, so a partial answer is an error, not a default.
pub fn generated_scenario_from_json(
    parsed: &serde_json::Value,
) -> Result<GeneratedScenario, AppError> {
    let text = |key: &str| parsed[key].as_str().map(|s| s.trim().to_string()).unwrap_or_default();
    let title = text("title");
    let tutor_role = text("tutor_role");
    let opening_line = text("opening_line");
    if title.is_empty() || tutor_role.is_empty() || opening_line.is_empty() {
        return Err(AppError::Provider(
            "The model returned an incomplete scenario. Try again.".to_string(),
        ));
    }
    let suggested_vocab = parsed["suggested_vocab"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.trim().to_string()))
                .filter(|s| !s.is_empty())
                .take(6)
                .collect()
        })
        .unwrap_or_default();
    Ok(GeneratedScenario {
        title,
        description: text("description"),
        tutor_role,
        opening_line,
        suggested_vocab,
    })
}

pub fn image_translation_from_json(
    parsed: &serde_json::Value,
    req: &TranslateImageRequest,
) -> ImageTranslationResult {
    let source_lang = parsed["source_language"]
        .as_str()
        .or(req.source_language.as_deref())
        .unwrap_or("auto")
        .to_string();
    let target_lang = parsed["target_language"]
        .as_str()
        .unwrap_or(&req.target_language)
        .to_string();
    let full_text = parsed["full_translated_text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let blocks = parsed["blocks"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let orig = item["original_text"].as_str()?.to_string();
                    let trans = item["translated_text"]
                        .as_str()
                        .unwrap_or(&orig)
                        .to_string();
                    let bbox = item["bounding_box"].as_object().map(|b| BoundingBox {
                        x: b.get("x").and_then(|v| v.as_i64()).unwrap_or(0),
                        y: b.get("y").and_then(|v| v.as_i64()).unwrap_or(0),
                        width: b.get("width").and_then(|v| v.as_i64()).unwrap_or(100),
                        height: b.get("height").and_then(|v| v.as_i64()).unwrap_or(100),
                    });
                    Some(ImageTextBlock {
                        original_text: orig,
                        translated_text: trans,
                        bounding_box: bbox,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    let requested =
        lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let detected = lexical_domain::parse_resolved_domain(parsed["detected_lexical_domain"].as_str())
        .or_else(|| {
            if requested == "auto" {
                None
            } else {
                Some(requested.clone())
            }
        })
        .or_else(|| Some("general".to_string()));

    ImageTranslationResult {
        source_language: source_lang,
        target_language: target_lang,
        full_translated_text: full_text,
        blocks,
        detected_lexical_domain: detected,
        requested_lexical_domain: Some(requested),
    }
}

pub fn doc_chunk_from_json(
    parsed: &serde_json::Value,
    req: &TranslateDocChunkRequest,
) -> DocChunkTranslationResult {
    let requested =
        lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let forced =
        lexical_domain::resolve_domain_for_request(&requested, &req.content, None);
    let detected = forced
        .or_else(|| {
            lexical_domain::parse_resolved_domain(parsed["detected_lexical_domain"].as_str())
        })
        .or_else(|| Some("general".to_string()));

    DocChunkTranslationResult {
        source_language: parsed["source_language"]
            .as_str()
            .or(req.source_language.as_deref())
            .unwrap_or("auto")
            .to_string(),
        target_language: parsed["target_language"]
            .as_str()
            .unwrap_or(&req.target_language)
            .to_string(),
        translated_content: parsed["translated_content"]
            .as_str()
            .unwrap_or(&req.content)
            .to_string(),
        detected_lexical_domain: detected,
        requested_lexical_domain: Some(requested),
    }
}

pub fn audio_translation_from_json(
    parsed: &serde_json::Value,
    req: &TranslateAudioRequest,
) -> AudioTranslationResult {
    let source_lang = parsed["source_language"]
        .as_str()
        .or(req.source_language.as_deref())
        .unwrap_or("auto")
        .to_string();
    let target_lang = parsed["target_language"]
        .as_str()
        .unwrap_or(&req.target_language)
        .to_string();
    let transcribed = parsed["transcribed_text"]
        .as_str()
        .unwrap_or("")
        .to_string();
    let translated = parsed["translated_text"]
        .as_str()
        .unwrap_or(&transcribed)
        .to_string();

    let segments = parsed["segments"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let start = item["start_seconds"].as_f64().unwrap_or(0.0);
                    let end = item["end_seconds"].as_f64().unwrap_or(start);
                    let orig = item["original_text"].as_str()?.to_string();
                    let trans = item["translated_text"]
                        .as_str()
                        .unwrap_or(&orig)
                        .to_string();
                    Some(AudioTranslationSegment {
                        start_seconds: start,
                        end_seconds: end,
                        original_text: orig,
                        translated_text: trans,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    let requested =
        lexical_domain::normalize_requested_domain(req.lexical_domain.as_deref());
    let detected = lexical_domain::parse_resolved_domain(parsed["detected_lexical_domain"].as_str())
        .or_else(|| {
            if requested == "auto" {
                None
            } else {
                Some(requested.clone())
            }
        })
        .or_else(|| Some("general".to_string()));

    AudioTranslationResult {
        source_language: source_lang,
        target_language: target_lang,
        transcribed_text: transcribed,
        translated_text: translated,
        segments,
        detected_lexical_domain: detected,
        requested_lexical_domain: Some(requested),
    }
}

/// The unified AIProvider trait. All LLM providers implement this contract.
#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError>;
    /// Second-pass enrichment: example sentence + usage note (non-blocking for UI).
    async fn enrich(&self, req: EnrichRequest) -> Result<EnrichResult, AppError>;
    /// Visual mnemonic: invent 3 association concepts for a word sense.
    async fn mnemonic_concepts(
        &self,
        req: MnemonicConceptsRequest,
    ) -> Result<MnemonicConceptsResult, AppError>;
    /// Visual mnemonic: rank concepts and emit image + photo-search prompts.
    async fn mnemonic_rank(&self, req: MnemonicRankRequest)
        -> Result<MnemonicRankResult, AppError>;
    async fn evaluate_answer(&self, req: EvaluateRequest) -> Result<EvaluationResult, AppError>;
    /// Re-evaluate an incorrect answer and explain the mistake.
    /// Returns a full EvaluationResult enriched with explanation and short_rule.
    async fn explain_error(&self, req: ExplainRequest) -> Result<EvaluationResult, AppError>;
    /// Stage 2: Check text for grammar, spelling, style, and other issues.
    async fn check_writing(&self, req: CheckWritingRequest)
        -> Result<CheckWritingResult, AppError>;
    /// Stage 2: Rewrite text in a specified mode (clearer, shorter, formal, etc.).
    async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError>;
    /// Stage 3: Score a spoken attempt (ASR transcript + IPA comparison).
    async fn evaluate_pronunciation(
        &self,
        req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError>;
    /// Stage 3: Articulatory tip for a target phoneme.
    async fn get_articulation_tip(
        &self,
        req: ArticulationTipRequest,
    ) -> Result<ArticulationTipResult, AppError>;
    /// Stage 2: Generate practice exercises from the user's recurring error patterns.
    async fn generate_exercises(
        &self,
        req: GenerateExercisesRequest,
    ) -> Result<Vec<WritingExerciseRaw>, AppError>;
    /// Stage 4: OCR image and translate detected text with bounding boxes.
    async fn translate_image(
        &self,
        req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError>;
    /// Stage 4: Translate document chunk preserving formatting and structure.
    async fn translate_document_chunk(
        &self,
        req: TranslateDocChunkRequest,
    ) -> Result<DocChunkTranslationResult, AppError>;
    /// Stage 4: Speech-to-text transcribe and translate audio stream or file.
    async fn translate_audio(
        &self,
        req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError>;
    /// Speech recognition only. Providers without ASR keep this default.
    async fn transcribe_audio(
        &self,
        _req: TranscribeAudioRequest,
    ) -> Result<TranscriptionResult, AppError> {
        Err(AppError::Validation(format!(
            "{} cannot transcribe speech. Choose a Gemini, OpenAI or Groq model for speech.",
            self.provider_name()
        )))
    }
    /// AI Dialogue: score learner reply and continue the scenario as tutor.
    async fn dialogue_turn(&self, req: DialogueTurnRequest)
        -> Result<DialogueTurnResult, AppError>;
    /// AI Dialogue: localize a builtin scenario or compose a learner's own one.
    async fn generate_scenario(
        &self,
        req: GenerateScenarioRequest,
    ) -> Result<GeneratedScenario, AppError>;
    fn provider_name(&self) -> &'static str;
}

/// Ordered chain of providers for one AI role: the first model that answers wins.
/// Every attempt is bounded by `attempt_timeout` so a hung model falls through.
pub struct ProviderRegistry {
    chain: Vec<Arc<dyn AIProvider>>,
    attempt_timeout: Option<std::time::Duration>,
    /// Counts each attempt per role/model (Settings → «Расходы AI»).
    usage: Option<ChainUsage>,
}

/// What a failed model attempt means for the rest of the chain.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FailureKind {
    /// The provider rejected the key: stop — falling back would hide a broken key.
    Auth,
    /// Quota / 429: the next model has its own limits.
    RateLimit,
    /// Timeout, missing capability, server error: try the next model.
    Other,
}

const AUTH_FAILURE_MARKERS: &[&str] = &[
    "unauthorized",
    "api key not valid",
    "api_key_invalid",
    "invalid api key",
    "invalid_api_key",
    "incorrect api key",
    "invalid x-api-key",
    "authentication_error",
];

const RATE_LIMIT_MARKERS: &[&str] = &[
    "too many requests",
    "rate limit",
    "rate_limit",
    "resource_exhausted",
    "quota",
];

/// `code` as a standalone number ("error 401:"), not inside "34012 tokens".
fn has_status_code(text: &str, code: &str) -> bool {
    text.match_indices(code).any(|(at, _)| {
        let before = text[..at].chars().next_back();
        let after = text[at + code.len()..].chars().next();
        !before.is_some_and(|c| c.is_ascii_digit()) && !after.is_some_and(|c| c.is_ascii_digit())
    })
}

pub(crate) fn classify_failure(err: &AppError) -> FailureKind {
    let text = err.to_string().to_lowercase();
    if has_status_code(&text, "401") || AUTH_FAILURE_MARKERS.iter().any(|m| text.contains(m)) {
        FailureKind::Auth
    } else if has_status_code(&text, "429") || RATE_LIMIT_MARKERS.iter().any(|m| text.contains(m)) {
        FailureKind::RateLimit
    } else {
        FailureKind::Other
    }
}

/// Try each provider of the chain in order; return the first success or the last error.
macro_rules! chain_call {
    ($self:ident, $method:ident, $req:expr) => {{
        let mut last_err: Option<AppError> = None;
        let total = $self.chain.len();
        for (index, provider) in $self.chain.iter().enumerate() {
            let attempt = provider.$method($req.clone());
            let outcome = match $self.attempt_timeout {
                Some(limit) => match tokio::time::timeout(limit, attempt).await {
                    Ok(result) => result,
                    Err(_) => Err(AppError::Provider(format!(
                        "{} did not answer within {}s",
                        provider.provider_name(),
                        limit.as_secs()
                    ))),
                },
                None => attempt.await,
            };
            if let Some(usage) = &$self.usage {
                usage.record_attempt(index, outcome.is_ok());
            }
            match outcome {
                Ok(value) => return Ok(value),
                Err(e) => {
                    if classify_failure(&e) == FailureKind::Auth {
                        log::warn!(
                            "AI {} via {}: API key rejected, not falling back: {e}",
                            stringify!($method),
                            provider.provider_name()
                        );
                        return Err(e);
                    }
                    if index + 1 < total {
                        log::warn!(
                            "AI {} via {} failed: {e}. Trying next model...",
                            stringify!($method),
                            provider.provider_name()
                        );
                    }
                    last_err = Some(e);
                }
            }
        }
        Err(last_err.unwrap_or_else(|| {
            AppError::Validation("No AI model is configured for this feature.".to_string())
        }))
    }};
}

impl ProviderRegistry {
    pub fn new(primary: Arc<dyn AIProvider>, fallback: Option<Arc<dyn AIProvider>>) -> Self {
        let mut chain = vec![primary];
        chain.extend(fallback);
        Self {
            chain,
            attempt_timeout: None,
            usage: None,
        }
    }

    pub fn from_chain(
        chain: Vec<Arc<dyn AIProvider>>,
        attempt_timeout: Option<std::time::Duration>,
    ) -> Self {
        Self {
            chain,
            attempt_timeout,
            usage: None,
        }
    }

    /// Count attempts; `usage.targets` must be parallel to the chain.
    pub fn with_usage(mut self, usage: ChainUsage) -> Self {
        self.usage = Some(usage);
        self
    }

    pub fn len(&self) -> usize {
        self.chain.len()
    }

    pub fn is_empty(&self) -> bool {
        self.chain.is_empty()
    }

    /// Provider name of the primary model (for diagnostics / UI).
    pub fn primary_name(&self) -> Option<&'static str> {
        self.chain.first().map(|p| p.provider_name())
    }

    pub async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError> {
        chain_call!(self, translate, req)
    }

    pub async fn enrich(&self, req: EnrichRequest) -> Result<EnrichResult, AppError> {
        chain_call!(self, enrich, req)
    }

    pub async fn mnemonic_concepts(
        &self,
        req: MnemonicConceptsRequest,
    ) -> Result<MnemonicConceptsResult, AppError> {
        chain_call!(self, mnemonic_concepts, req)
    }

    pub async fn mnemonic_rank(
        &self,
        req: MnemonicRankRequest,
    ) -> Result<MnemonicRankResult, AppError> {
        chain_call!(self, mnemonic_rank, req)
    }

    pub async fn evaluate_answer(
        &self,
        req: EvaluateRequest,
    ) -> Result<EvaluationResult, AppError> {
        chain_call!(self, evaluate_answer, req)
    }

    pub async fn explain_error(&self, req: ExplainRequest) -> Result<EvaluationResult, AppError> {
        chain_call!(self, explain_error, req)
    }

    pub async fn check_writing(
        &self,
        req: CheckWritingRequest,
    ) -> Result<CheckWritingResult, AppError> {
        chain_call!(self, check_writing, req)
    }

    pub async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError> {
        chain_call!(self, rewrite_text, req)
    }

    pub async fn evaluate_pronunciation(
        &self,
        req: EvaluatePronunciationRequest,
    ) -> Result<PronunciationEvaluationResult, AppError> {
        chain_call!(self, evaluate_pronunciation, req)
    }

    pub async fn get_articulation_tip(
        &self,
        req: ArticulationTipRequest,
    ) -> Result<ArticulationTipResult, AppError> {
        chain_call!(self, get_articulation_tip, req)
    }

    pub async fn generate_exercises(
        &self,
        req: GenerateExercisesRequest,
    ) -> Result<Vec<WritingExerciseRaw>, AppError> {
        chain_call!(self, generate_exercises, req)
    }

    pub async fn translate_image(
        &self,
        req: TranslateImageRequest,
    ) -> Result<ImageTranslationResult, AppError> {
        chain_call!(self, translate_image, req)
    }

    pub async fn translate_document_chunk(
        &self,
        req: TranslateDocChunkRequest,
    ) -> Result<DocChunkTranslationResult, AppError> {
        chain_call!(self, translate_document_chunk, req)
    }

    pub async fn translate_audio(
        &self,
        req: TranslateAudioRequest,
    ) -> Result<AudioTranslationResult, AppError> {
        chain_call!(self, translate_audio, req)
    }

    pub async fn transcribe_audio(
        &self,
        req: TranscribeAudioRequest,
    ) -> Result<TranscriptionResult, AppError> {
        chain_call!(self, transcribe_audio, req)
    }

    pub async fn dialogue_turn(
        &self,
        req: DialogueTurnRequest,
    ) -> Result<DialogueTurnResult, AppError> {
        chain_call!(self, dialogue_turn, req)
    }

    pub async fn generate_scenario(
        &self,
        req: GenerateScenarioRequest,
    ) -> Result<GeneratedScenario, AppError> {
        chain_call!(self, generate_scenario, req)
    }
}

pub fn create_provider(
    app: &tauri::AppHandle,
    provider_name: &str,
    model_name: &str,
    settings: &crate::commands::settings::AppSettings,
) -> Result<Arc<dyn AIProvider>, AppError> {
    match provider_name {
        "anthropic" => {
            let key = crate::api_keys::get_api_key(app, "anthropic");
            if let Some(k) = key {
                Ok(Arc::new(anthropic::AnthropicProvider::new(
                    k,
                    Some(model_name.to_string()),
                )))
            } else {
                Err(AppError::Validation(
                    "Anthropic API Key is missing. Please enter and save your Anthropic key in Settings."
                        .to_string(),
                ))
            }
        }
        "cloudflare" => {
            let api_token = crate::api_keys::get_api_key(app, "cloudflare").unwrap_or_default();
            let account_id = settings
                .cloudflare_account_id
                .clone()
                .or_else(|| std::env::var("CLOUDFLARE_ACCOUNT_ID").ok())
                .unwrap_or_default();

            if account_id.is_empty() {
                return Err(AppError::Validation(
                    "Cloudflare Account ID is missing. Please enter your Account ID in Settings."
                        .to_string(),
                ));
            }
            if api_token.is_empty() {
                return Err(AppError::Validation(
                    "Cloudflare API Token is missing. Please paste and save your Cloudflare API Token in Settings.".to_string(),
                ));
            }
            Ok(Arc::new(cloudflare::CloudflareProvider::new(
                account_id,
                api_token,
                Some(model_name.to_string()),
            )))
        }
        "groq" => {
            let key = crate::api_keys::get_api_key(app, "groq");
            if key.is_none() {
                return Err(AppError::Validation(
                    "Groq API Key is missing. Please enter and save your Groq key in Settings."
                        .to_string(),
                ));
            }
            Ok(Arc::new(custom::CustomOpenAIProvider::new(
                Some("https://api.groq.com/openai/v1".to_string()),
                key,
                Some(model_name.to_string()),
                Some("Groq".to_string()),
            )))
        }
        "gemini" => {
            let key = crate::api_keys::get_api_key(app, "gemini");
            if let Some(k) = key {
                Ok(Arc::new(gemini::GeminiProvider::new(
                    k,
                    Some(model_name.to_string()),
                )))
            } else {
                Err(AppError::Validation(
                    "Gemini API Key is missing. Please enter and save your Gemini key in Settings."
                        .to_string(),
                ))
            }
        }
        "openrouter" => {
            let key = crate::api_keys::get_api_key(app, "openrouter");
            if key.is_none() {
                return Err(AppError::Validation(
                    "OpenRouter API Key is missing. Please enter and save your OpenRouter key in Settings.".to_string(),
                ));
            }
            Ok(Arc::new(custom::CustomOpenAIProvider::new(
                Some("https://openrouter.ai/api/v1".to_string()),
                key,
                Some(model_name.to_string()),
                Some("OpenRouter".to_string()),
            )))
        }
        "openai" => {
            let key = crate::api_keys::get_api_key(app, "openai");
            if let Some(k) = key {
                Ok(Arc::new(openai::OpenAIProvider::new(
                    k,
                    Some(model_name.to_string()),
                )))
            } else {
                Err(AppError::Validation(
                    "OpenAI API Key is missing. Please enter and save your OpenAI key in Settings."
                        .to_string(),
                ))
            }
        }
        "custom" => {
            let key = crate::api_keys::get_api_key(app, "custom");
            let base_url = settings
                .custom_base_url
                .clone()
                .unwrap_or_else(|| "http://localhost:11434/v1".to_string());
            Ok(Arc::new(custom::CustomOpenAIProvider::new(
                Some(base_url),
                key,
                Some(model_name.to_string()),
                Some("Custom / Local LLM".to_string()),
            )))
        }
        _ => Err(AppError::Validation(format!(
            "Unsupported provider: {provider_name}"
        ))),
    }
}

/// Fallback is used when enabled and it differs from primary by provider or model.
/// Same provider + different model (e.g. two OpenRouter free models) is valid.
pub fn fallback_slot(
    settings: &crate::commands::settings::AppSettings,
) -> Option<(&str, &str)> {
    if !settings.fallback_enabled {
        return None;
    }
    let fb_provider = settings.fallback_ai_provider.as_deref()?;
    let fb_model = settings.fallback_ai_model.as_deref()?;
    if fb_provider == settings.ai_provider && fb_model == settings.ai_model {
        return None;
    }
    Some((fb_provider, fb_model))
}

pub fn build_registry(
    app: &tauri::AppHandle,
    settings: &crate::commands::settings::AppSettings,
) -> Result<ProviderRegistry, AppError> {
    let primary_res = create_provider(app, &settings.ai_provider, &settings.ai_model, settings);

    let fallback = fallback_slot(settings)
        .and_then(|(fb_provider, fb_model)| create_provider(app, fb_provider, fb_model, settings).ok());

    match (primary_res, fallback) {
        (Ok(primary), fallback) => Ok(ProviderRegistry::new(primary, fallback)),
        (Err(_), Some(fallback)) => {
            log::warn!(
                "Primary provider creation failed, seamlessly promoting fallback to primary"
            );
            Ok(ProviderRegistry::new(fallback, None))
        }
        (Err(e), None) => Err(e),
    }
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    fn scenario_seed() -> ScenarioSeed {
        ScenarioSeed {
            title: "Airport Check-in (B1 Level)".into(),
            level: "B1".into(),
            kind: "guided".into(),
            description: "Check in for a flight.".into(),
            tutor_role: "You are an airport check-in agent.".into(),
            opening_line: "Good morning!".into(),
            suggested_vocab: vec!["boarding pass".into(), "window seat".into()],
        }
    }

    #[test]
    fn scenario_prompt_names_language_and_embeds_seed() {
        let prompt = render_generate_scenario_prompt(&GenerateScenarioRequest {
            language_name: "German".into(),
            seed: scenario_seed(),
        });
        assert!(prompt.contains("TARGET LANGUAGE: German"));
        assert!(prompt.contains("CEFR LEVEL: B1"));
        assert!(prompt.contains("title: Airport Check-in (B1 Level)"));
        assert!(prompt.contains("suggested_vocab: boarding pass, window seat"));
        assert!(!prompt.contains("{language}") && !prompt.contains("{title}"));
    }

    #[test]
    fn generated_scenario_is_parsed_and_trimmed() {
        let parsed = serde_json::json!({
            "title": " Check-in am Flughafen (B1) ",
            "description": "Einchecken.",
            "tutor_role": "You are an agent. Speak only German.",
            "opening_line": "Guten Morgen!",
            "suggested_vocab": ["Bordkarte", " ", "Fensterplatz"]
        });
        let scenario = generated_scenario_from_json(&parsed).expect("valid");
        assert_eq!(scenario.title, "Check-in am Flughafen (B1)");
        assert_eq!(scenario.suggested_vocab, vec!["Bordkarte", "Fensterplatz"]);
    }

    #[test]
    fn incomplete_generated_scenario_is_rejected() {
        for missing in ["title", "tutor_role", "opening_line"] {
            let mut parsed = serde_json::json!({
                "title": "t", "description": "d", "tutor_role": "r",
                "opening_line": "o", "suggested_vocab": []
            });
            parsed[missing] = serde_json::json!("  ");
            assert!(
                matches!(generated_scenario_from_json(&parsed), Err(AppError::Provider(_))),
                "{missing} must be required"
            );
        }
    }

    use super::*;
    use crate::commands::study::EvaluationResult;
    use crate::commands::translate::TranslationResult;
    use std::sync::atomic::{AtomicUsize, Ordering};

    // ── extract_json ────────────────────────────────────────

    #[test]
    fn extract_json_parses_plain_json() {
        let v = extract_json(r#"{"a": 1}"#).unwrap();
        assert_eq!(v["a"], 1);
    }

    #[test]
    fn extract_json_strips_json_code_fence() {
        let raw = "```json\n{\"a\": 1}\n```";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 1);
    }

    #[test]
    fn extract_json_strips_plain_code_fence() {
        let raw = "```\n{\"a\": 2}\n```";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 2);
    }

    #[test]
    fn extract_json_strips_fence_without_language_and_newline() {
        let raw = "```{\"a\": 3}```";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 3);
    }

    #[test]
    fn extract_json_strips_think_tags() {
        let raw = "<think>reasoning trace</think>{\"a\": 4}";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 4);
    }

    #[test]
    fn extract_json_think_tag_with_code_fence() {
        let raw = "<think>deep thoughts</think>```json\n{\"a\": 5}\n```";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 5);
    }

    #[test]
    fn extract_json_falls_back_to_outer_braces() {
        let raw = "Sure! Here is the result: {\"a\": 6} — hope that helps.";
        let v = extract_json(raw).unwrap();
        assert_eq!(v["a"], 6);
    }

    #[test]
    fn extract_json_errors_on_invalid_input() {
        let err = extract_json("this is not json at all").unwrap_err();
        assert!(
            matches!(err, AppError::Provider(ref msg) if msg.contains("Failed to parse structured JSON"))
        );
    }

    #[test]
    fn extract_json_errors_on_empty_input() {
        assert!(extract_json("").is_err());
        assert!(extract_json("   ").is_err());
    }

    #[test]
    fn extract_json_error_message_truncates_long_responses() {
        let raw = "x".repeat(500);
        let err = extract_json(&raw).unwrap_err();
        let msg = err.to_string();
        // 300 chars of the response, not all 500
        assert!(msg.len() < 500);
    }

    #[test]
    fn extract_json_error_message_truncates_multibyte_reply_without_panic() {
        // Truncated JSON in Russian: byte 300 falls inside a 2-byte Cyrillic char.
        let raw = format!(
            "{{\"translated_content\": \" {}",
            "Привет, это перевод документа. ".repeat(20)
        );
        assert!(!raw.is_char_boundary(300), "fixture must split a char at byte 300");

        let msg = extract_json(&raw).unwrap_err().to_string();

        let excerpt = msg
            .split("Response was: ")
            .nth(1)
            .expect("error message carries the response excerpt");
        assert_eq!(excerpt.chars().count(), 300);
        assert!(raw.starts_with(excerpt));
    }

    // ── parse_string_array ──────────────────────────────────

    #[test]
    fn parse_string_array_reads_and_trims_values() {
        let v = serde_json::json!({ "alts": [" one ", "two"] });
        assert_eq!(parse_string_array(&v, "alts"), vec!["one", "two"]);
    }

    #[test]
    fn parse_string_array_missing_key_returns_empty() {
        let v = serde_json::json!({});
        assert!(parse_string_array(&v, "alts").is_empty());
    }

    #[test]
    fn parse_string_array_non_array_returns_empty() {
        let v = serde_json::json!({ "alts": "not-an-array" });
        assert!(parse_string_array(&v, "alts").is_empty());
    }

    #[test]
    fn parse_string_array_filters_non_strings_and_empties() {
        let v = serde_json::json!({ "alts": ["ok", 42, "", "   ", null, "fine"] });
        assert_eq!(parse_string_array(&v, "alts"), vec!["ok", "fine"]);
    }

    // ── gloss_from_json ─────────────────────────────────────

    fn translate_req() -> TranslateRequest {
        TranslateRequest {
            text: "house".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: None,
        }
    }

    #[test]
    fn gloss_from_json_maps_all_fields() {
        let parsed = serde_json::json!({
            "main_translation": "дом",
            "alternatives": ["здание"],
            "source_synonyms": ["home"],
            "part_of_speech": "noun",
            "phonetic": "haʊs",
            "usage_note": "note",
            "example_sentence": "The house is big."
        });
        let res = gloss_from_json(&translate_req(), &parsed);
        assert_eq!(res.text, "house");
        assert_eq!(res.source_language, "en");
        assert_eq!(res.target_language, "ru");
        assert_eq!(res.main_translation, "дом");
        assert_eq!(res.alternatives, vec!["здание"]);
        assert_eq!(res.source_synonyms, vec!["home"]);
        assert_eq!(res.part_of_speech.as_deref(), Some("noun"));
        assert_eq!(res.phonetic.as_deref(), Some("haʊs"));
        assert_eq!(res.usage_note.as_deref(), Some("note"));
        assert_eq!(res.example_sentence.as_deref(), Some("The house is big."));
        assert!(!res.from_cache);
        assert!(
            !res.is_offline_fallback,
            "providers never mark results as offline fallback"
        );
        assert!(res.lexeme_id.is_none());
        assert!(res.image_path.is_none());
        assert!(res.frequency_hint.is_none());
        assert_eq!(res.detected_lexical_domain.as_deref(), Some("general"));
        assert_eq!(res.requested_lexical_domain.as_deref(), Some("auto"));
    }

    #[test]
    fn gloss_from_json_honors_manual_it_domain() {
        let mut req = translate_req();
        req.lexical_domain = Some("it".to_string());
        let parsed = serde_json::json!({
            "main_translation": "ошибка",
            "detected_lexical_domain": "general",
            "alternatives": ["баг"],
            "source_synonyms": ["defect"]
        });
        let res = gloss_from_json(&req, &parsed);
        assert_eq!(res.detected_lexical_domain.as_deref(), Some("it"));
        assert_eq!(res.requested_lexical_domain.as_deref(), Some("it"));
        assert_eq!(res.main_translation, "ошибка");
    }

    #[test]
    fn gloss_from_json_detects_domain_for_phrases() {
        let req = TranslateRequest {
            text: "We found a bug in the code".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: Some("auto".to_string()),
        };
        let parsed = serde_json::json!({
            "main_translation": "ошибка",
            "detected_lexical_domain": "it",
            "alternatives": ["дефект"],
            "source_synonyms": ["glitch"]
        });
        let res = gloss_from_json(&req, &parsed);
        assert_eq!(res.detected_lexical_domain.as_deref(), Some("it"));
        assert_eq!(res.requested_lexical_domain.as_deref(), Some("auto"));
    }

    #[test]
    fn gloss_from_json_degrades_on_missing_optional_fields() {
        let parsed = serde_json::json!({ "main_translation": "дом" });
        let res = gloss_from_json(&translate_req(), &parsed);
        assert_eq!(res.main_translation, "дом");
        assert!(res.alternatives.is_empty());
        assert!(res.source_synonyms.is_empty());
        assert!(res.part_of_speech.is_none());
        assert!(res.phonetic.is_none());
        assert!(res.usage_note.is_none());
        assert!(res.example_sentence.is_none());
    }

    #[test]
    fn gloss_from_json_missing_main_translation_is_empty_string() {
        let parsed = serde_json::json!({});
        let res = gloss_from_json(&translate_req(), &parsed);
        assert_eq!(res.main_translation, "");
    }

    #[test]
    fn gloss_from_json_none_source_language_becomes_auto() {
        let req = TranslateRequest {
            source_language: None,
            lexical_domain: None,
            ..translate_req()
        };
        let res = gloss_from_json(&req, &serde_json::json!({}));
        assert_eq!(res.source_language, "auto");
    }

    // ── evaluation_from_json ────────────────────────────────

    #[test]
    fn evaluation_from_json_maps_all_fields() {
        let parsed = serde_json::json!({
            "is_correct": true,
            "grade": 4,
            "error_type": "typo",
            "correct_answer": "went",
            "explanation": "long explanation",
            "short_rule": "short rule"
        });
        let res = evaluation_from_json(&parsed, "fallback-target");
        assert!(res.is_correct);
        assert_eq!(res.grade, 4);
        assert_eq!(res.error_type.as_deref(), Some("typo"));
        assert_eq!(res.correct_answer, "went");
        assert_eq!(res.explanation.as_deref(), Some("long explanation"));
        assert_eq!(res.short_rule.as_deref(), Some("short rule"));
    }

    #[test]
    fn evaluation_from_json_accepts_all_error_type_values() {
        for error_type in ["typo", "grammar", "spelling", "word_choice", "meaning"] {
            let parsed = serde_json::json!({ "error_type": error_type });
            let res = evaluation_from_json(&parsed, "t");
            assert_eq!(res.error_type.as_deref(), Some(error_type));
        }
    }

    #[test]
    fn evaluation_from_json_does_not_wrap_out_of_range_grade() {
        // 260 as u8 == 4: truncation would turn garbage into "easy".
        let parsed = serde_json::json!({ "grade": 260 });
        let res = evaluation_from_json(&parsed, "t");
        assert!(res.grade > 4, "out-of-range grade must stay out of range, got {}", res.grade);
    }

    #[test]
    fn evaluation_from_json_degrades_on_missing_fields() {
        let parsed = serde_json::json!({});
        let res = evaluation_from_json(&parsed, "target-text");
        assert!(!res.is_correct, "missing is_correct defaults to false");
        assert_eq!(res.grade, 1, "missing grade defaults to 1");
        assert_eq!(
            res.correct_answer, "target-text",
            "falls back to target text"
        );
        assert!(res.error_type.is_none());
        assert!(res.explanation.is_none());
        assert!(res.short_rule.is_none());
    }

    // ── enrich_from_json ────────────────────────────────────

    #[test]
    fn enrich_from_json_maps_optional_fields() {
        let parsed = serde_json::json!({
            "usage_note": "formal",
            "example_sentence": "An example."
        });
        let res = enrich_from_json(&parsed);
        assert_eq!(res.usage_note.as_deref(), Some("formal"));
        assert_eq!(res.example_sentence.as_deref(), Some("An example."));
        assert!(res.example_sentence_2.is_none());
    }

    #[test]
    fn enrich_from_json_maps_second_example_and_drops_duplicates() {
        let parsed = serde_json::json!({
            "example_sentence": "Keep the machine in good maintenance.",
            "example_sentence_2": "The building needs regular maintenance."
        });
        let res = enrich_from_json(&parsed);
        assert_eq!(
            res.example_sentence.as_deref(),
            Some("Keep the machine in good maintenance.")
        );
        assert_eq!(
            res.example_sentence_2.as_deref(),
            Some("The building needs regular maintenance.")
        );

        let dup = enrich_from_json(&serde_json::json!({
            "example_sentence": "Same sentence.",
            "example_sentence_2": "same sentence."
        }));
        assert!(dup.example_sentence_2.is_none());
    }

    #[test]
    fn enrich_from_json_missing_fields_are_none() {
        let res = enrich_from_json(&serde_json::json!({}));
        assert!(res.usage_note.is_none());
        assert!(res.example_sentence.is_none());
        assert!(res.example_sentence_2.is_none());
    }

    #[test]
    fn mnemonic_concepts_from_json_pesky_sample() {
        let parsed = serde_json::json!({
            "sense": "annoyingly persistent",
            "associations": [
                {
                    "id": "a",
                    "association": "A mosquito keeps returning after being swatted away",
                    "memory_hook": "keeps coming back"
                },
                {
                    "id": "b",
                    "association": "A child repeatedly tugs a busy person's sleeve",
                    "memory_hook": "tugs for attention"
                },
                {
                    "id": "c",
                    "association": "A small dog keeps putting a toy on a laptop keyboard",
                    "memory_hook": "toy on keyboard"
                }
            ]
        });
        let res = mnemonic_concepts_from_json(&parsed).expect("parse");
        assert_eq!(res.sense, "annoyingly persistent");
        assert_eq!(res.associations.len(), 3);
        assert_eq!(res.associations[0].id, "a");
        assert!(res.associations[0].association.contains("mosquito"));
        assert!(res.image_prompt.is_none());
    }

    #[test]
    fn mnemonic_concepts_from_json_image_prompt_scene() {
        let parsed = serde_json::json!({
            "sense": "annoyingly persistent",
            "association": "A child repeatedly asks the same question",
            "memory_hook": "asks again",
            "image_prompt": "Clean expressive educational illustration: a child tugs a busy adult's sleeve. No text, no captions, no labels."
        });
        let res = mnemonic_concepts_from_json(&parsed).expect("parse");
        assert_eq!(res.associations.len(), 1);
        assert!(res
            .image_prompt
            .as_deref()
            .is_some_and(|s| s.contains("educational illustration")));
    }

    #[test]
    fn mnemonic_concepts_from_json_rejects_too_few() {
        let parsed = serde_json::json!({
            "sense": "x",
            "associations": [
                { "id": "a", "association": "one", "memory_hook": "h" }
            ]
        });
        assert!(mnemonic_concepts_from_json(&parsed).is_err());
    }

    #[test]
    fn mnemonic_rank_from_json_maps_prompt_and_query() {
        let parsed = serde_json::json!({
            "selected_id": "a",
            "scores": [
                {
                    "id": "a",
                    "clarity": 9,
                    "memorability": 8,
                    "ambiguity": 2,
                    "cultural_universality": 9
                }
            ],
            "image_prompt": "A simple expressive educational illustration of a mosquito...",
            "photo_search_query": "mosquito buzzing around face"
        });
        let res = mnemonic_rank_from_json(&parsed).expect("parse");
        assert_eq!(res.selected_id, "a");
        assert!(res.image_prompt.contains("mosquito"));
        assert_eq!(res.photo_search_query, "mosquito buzzing around face");
        assert_eq!(res.scores.len(), 1);
    }

    // ── prompt rendering ────────────────────────────────────

    #[test]
    fn render_translate_prompt_substitutes_all_placeholders() {
        let req = TranslateRequest {
            text: "apple".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: Some("I eat an apple.".to_string()),
            lexical_domain: None,
        };
        let prompt = render_translate_prompt(&req);
        assert!(!prompt.contains("{{"), "no placeholder left: {prompt}");
        assert!(prompt.contains("apple"));
        assert!(prompt.contains("en"));
        assert!(prompt.contains("ru"));
        assert!(prompt.contains("I eat an apple."));
        // Phrase/context → Auto stays auto in the prompt
        assert!(prompt.contains("Lexical Domain: auto"));
    }

    #[test]
    fn render_translate_prompt_forces_general_for_single_word_auto() {
        let req = TranslateRequest {
            text: "Bug".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: Some("auto".to_string()),
        };
        let prompt = render_translate_prompt(&req);
        assert!(prompt.contains("Lexical Domain: general"));
    }

    #[test]
    fn render_translate_prompt_uses_manual_it_domain() {
        let req = TranslateRequest {
            text: "Bug".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: Some("it".to_string()),
        };
        let prompt = render_translate_prompt(&req);
        assert!(prompt.contains("Lexical Domain: it"));
    }

    #[test]
    fn render_translate_prompt_uses_auto_and_none_defaults() {
        let req = TranslateRequest {
            text: "apple".to_string(),
            source_language: None,
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: None,
        };
        let prompt = render_translate_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("auto"));
        assert!(prompt.contains("none"));
    }

    #[test]
    fn render_enrich_prompt_substitutes_all_placeholders() {
        let req = EnrichRequest {
            text: "house".to_string(),
            source_language: "en".to_string(),
            target_language: "ru".to_string(),
            main_translation: "дом".to_string(),
        };
        let prompt = render_enrich_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("house"));
        assert!(prompt.contains("дом"));
    }

    #[test]
    fn format_avoid_scenes_none_or_numbered() {
        assert_eq!(format_avoid_scenes(&[]), "none");
        assert_eq!(
            format_avoid_scenes(&["  mosquito close-up  ".to_string()]),
            "1. mosquito close-up"
        );
    }

    #[test]
    fn render_mnemonic_concepts_prompt_prefers_behavior_not_collocation() {
        let prompt = render_mnemonic_concepts_prompt(&MnemonicConceptsRequest {
            word: "be pesky".to_string(),
            translation: "быть назойливым".to_string(),
            context: "Don't be pesky and keep asking me the same question.".to_string(),
            level: "A2".to_string(),
            avoid_scenes: vec!["A mosquito close-up".to_string()],
        });
        assert!(!prompt.contains("{{"), "leftover placeholder: {prompt}");
        assert!(prompt.contains("be pesky"));
        assert!(prompt.contains("быть назойливым"));
        assert!(prompt.contains("1. A mosquito close-up"));
        assert!(prompt.contains("Do NOT simply illustrate the object"));
        assert!(prompt.to_lowercase().contains("educational illustration"));
        assert!(prompt.contains("facial expressions/emotions"));
    }

    #[test]
    fn render_mnemonic_rank_prompt_penalizes_wrong_noun() {
        let prompt = render_mnemonic_rank_prompt(&MnemonicRankRequest {
            word: "be pesky".to_string(),
            sense: "annoyingly persistent".to_string(),
            associations: vec![MnemonicAssociation {
                id: "a".to_string(),
                association: "A child repeatedly asks the same question".to_string(),
                memory_hook: "asks again".to_string(),
            }],
            avoid_scenes: vec![],
        });
        assert!(!prompt.contains("{{"), "leftover placeholder: {prompt}");
        assert!(prompt.contains("be pesky"));
        assert!(prompt.contains("none"));
        assert!(prompt.contains("child repeatedly asks"));
        assert!(prompt.contains("not \"mosquito\" for \"pesky\""));
    }

    #[test]
    fn render_translate_document_prompt_substitutes_tone_and_glossary() {
        let req = TranslateDocChunkRequest {
            doc_name: "brief.md".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            content: "# Hello".to_string(),
            tone: Some("formal".to_string()),
            glossary: Some("Hello => Здравствуйте".to_string()),
            lexical_domain: None,
        };
        let prompt = render_translate_document_prompt(&req);
        assert!(!prompt.contains("{{"), "leftover placeholder: {prompt}");
        assert!(prompt.contains("formal"));
        assert!(prompt.contains("Hello => Здравствуйте"));
        assert!(prompt.contains("# Hello"));
        assert!(prompt.contains("brief.md"));
    }

    #[test]
    fn render_evaluate_prompt_substitutes_all_placeholders() {
        let req = EvaluateRequest {
            target_text: "went".to_string(),
            user_answer: "goed".to_string(),
            mode: "typing".to_string(),
            language: "en".to_string(),
        };
        let prompt = render_evaluate_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("went"));
        assert!(prompt.contains("goed"));
        assert!(prompt.contains("typing"));
    }

    #[test]
    fn render_explain_prompt_substitutes_all_placeholders() {
        let req = ExplainRequest {
            target_text: "went".to_string(),
            user_answer: "goed".to_string(),
            mode: "typing".to_string(),
            language: "en".to_string(),
            error_type: "grammar".to_string(),
        };
        let prompt = render_explain_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("grammar"));
    }

    #[test]
    fn render_check_writing_prompt_includes_language_and_text() {
        let req = CheckWritingRequest {
            text: "I has a apple.".to_string(),
            language: "en".to_string(),
        };
        let prompt = render_check_writing_prompt(&req);
        assert!(!prompt.contains("{language}"));
        assert!(!prompt.contains("{text}"));
        assert!(prompt.contains("I has a apple."));
        assert!(prompt.contains("en"));
    }

    #[test]
    fn render_rewrite_prompt_includes_mode_language_and_text() {
        let req = RewriteRequest {
            text: "Please find attached the file.".to_string(),
            language: "en".to_string(),
            mode: "clearer".to_string(),
            custom_instruction: String::new(),
        };
        let mut prompt = render_rewrite_prompt(&req);
        assert!(!prompt.contains("{mode}"));
        assert!(!prompt.contains("{language}"));
        assert!(!prompt.contains("{text}"));
        assert!(!prompt.contains("{custom_instruction}"));
        assert!(prompt.contains("clearer"));
        assert!(prompt.contains("Please find attached the file."));

        let custom_req = RewriteRequest {
            text: req.text.clone(),
            language: req.language.clone(),
            mode: "custom".to_string(),
            custom_instruction: "make a bullet list".to_string(),
        };
        prompt = render_rewrite_prompt(&custom_req);
        assert!(prompt.contains("make a bullet list"));
        assert!(!prompt.contains("{custom_instruction}"));
    }

    #[test]
    fn render_generate_exercises_prompt_substitutes_all_placeholders() {
        let req = GenerateExercisesRequest {
            language: "en".to_string(),
            patterns: vec![
                ErrorPatternSummary {
                    category: "grammar".to_string(),
                    occurrence_count: 5,
                    sample_original: Some("he go".to_string()),
                    sample_fix: Some("he goes".to_string()),
                },
                ErrorPatternSummary {
                    category: "spelling".to_string(),
                    occurrence_count: 2,
                    sample_original: None,
                    sample_fix: None,
                },
            ],
        };
        let prompt = render_generate_exercises_prompt(&req);
        assert!(
            !prompt.contains("{language}"),
            "no placeholder left: {prompt}"
        );
        assert!(
            !prompt.contains("{patterns}"),
            "no placeholder left: {prompt}"
        );
        assert!(prompt.contains("en"));
        assert!(prompt.contains("grammar"));
        assert!(prompt.contains("5 occurrences"));
        assert!(prompt.contains("he go"));
        assert!(prompt.contains("he goes"));
        assert!(prompt.contains("spelling"));
    }

    #[test]
    fn render_generate_exercises_prompt_handles_empty_patterns() {
        let req = GenerateExercisesRequest {
            language: "en".to_string(),
            patterns: vec![],
        };
        let prompt = render_generate_exercises_prompt(&req);
        assert!(!prompt.contains("{patterns}"));
        assert!(prompt.contains("en"));
    }

    // ── check_writing_from_json / rewrite_from_json ─────────

    #[test]
    fn check_writing_from_json_maps_issues() {
        let parsed = serde_json::json!({
            "issues": [{
                "category": "grammar",
                "severity": "error",
                "original_fragment": "has",
                "suggested_fix": "have",
                "explanation": "Subject-verb agreement.",
                "rule_hint": "I/you/we/they take have",
                "offset_start": 2,
                "offset_end": 5
            }],
            "overall_score": 72,
            "summary": "One grammar error."
        });
        let res = check_writing_from_json(&parsed);
        assert_eq!(res.overall_score, 72);
        assert_eq!(res.summary, "One grammar error.");
        assert_eq!(res.issues.len(), 1);
        let issue = &res.issues[0];
        assert_eq!(issue.category, "grammar");
        assert_eq!(issue.severity, "error");
        assert_eq!(issue.original_fragment, "has");
        assert_eq!(issue.suggested_fix, "have");
        assert_eq!(issue.offset_start, 2);
        assert_eq!(issue.offset_end, 5);
        assert_eq!(issue.rule_hint.as_deref(), Some("I/you/we/they take have"));
    }

    #[test]
    fn check_writing_from_json_degrades_on_missing_fields() {
        let res = check_writing_from_json(&serde_json::json!({}));
        assert!(res.issues.is_empty());
        assert_eq!(res.overall_score, 100);
        assert_eq!(res.summary, "Analysis complete.");
    }

    #[test]
    fn check_writing_from_json_skips_issues_missing_required_fields() {
        let parsed = serde_json::json!({
            "issues": [
                { "category": "grammar" },
                {
                    "category": "spelling",
                    "original_fragment": "teh",
                    "suggested_fix": "the"
                }
            ]
        });
        let res = check_writing_from_json(&parsed);
        assert_eq!(res.issues.len(), 1);
        assert_eq!(res.issues[0].category, "spelling");
        assert_eq!(res.issues[0].severity, "warning");
    }

    #[test]
    fn rewrite_from_json_maps_fields() {
        let parsed = serde_json::json!({
            "rewritten_text": "Shorter now.",
            "changes_summary": "Removed filler."
        });
        let res = rewrite_from_json(&parsed).unwrap();
        assert_eq!(res.rewritten_text, "Shorter now.");
        assert_eq!(res.changes_summary, "Removed filler.");
    }

    #[test]
    fn rewrite_from_json_errors_without_rewritten_text() {
        let err = rewrite_from_json(&serde_json::json!({})).unwrap_err();
        assert!(matches!(err, AppError::Provider(ref msg) if msg.contains("rewritten_text")));
    }

    #[test]
    fn rewrite_from_json_defaults_changes_summary() {
        let parsed = serde_json::json!({ "rewritten_text": "Hello." });
        let res = rewrite_from_json(&parsed).unwrap();
        assert_eq!(res.changes_summary, "Text rewritten.");
    }

    #[test]
    fn pronunciation_from_json_maps_phonemes() {
        let req = EvaluatePronunciationRequest {
            target_text: "ship".to_string(),
            target_ipa: Some("/ʃɪp/".to_string()),
            language: "en".to_string(),
            audio_path: None,
            recognized_text: Some("sheep".to_string()),
        };
        let parsed = serde_json::json!({
            "overall_score": 70,
            "recognized_text": "sheep",
            "target_ipa": "/ʃɪp/",
            "recognized_ipa": "/ʃiːp/",
            "stress_feedback": "stress ok",
            "summary": "Vowel too long.",
            "phonemes": [{
                "target_phoneme": "ɪ",
                "recognized_phoneme": "iː",
                "accuracy": 40,
                "status": "miss",
                "position": 1
            }]
        });
        let res = pronunciation_from_json(&parsed, &req);
        assert_eq!(res.overall_score, 70);
        assert_eq!(res.phonemes.len(), 1);
        assert_eq!(res.phonemes[0].target_phoneme, "ɪ");
        assert_eq!(res.recognized_ipa, "/ʃiːp/");
    }

    #[test]
    fn evaluate_pronunciation_heuristic_scores_identical_text() {
        let req = EvaluatePronunciationRequest {
            target_text: "cat".to_string(),
            target_ipa: None,
            language: "en".to_string(),
            audio_path: None,
            recognized_text: Some("cat".to_string()),
        };
        let res = evaluate_pronunciation_heuristic(&req);
        assert_eq!(res.overall_score, 100);
    }

    #[test]
    fn render_evaluate_pronunciation_prompt_substitutes_placeholders() {
        let req = EvaluatePronunciationRequest {
            target_text: "ship".to_string(),
            target_ipa: Some("/ʃɪp/".to_string()),
            language: "en".to_string(),
            audio_path: None,
            recognized_text: Some("sheep".to_string()),
        };
        let prompt = render_evaluate_pronunciation_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("ship"));
        assert!(prompt.contains("sheep"));
    }

    #[test]
    fn render_evaluate_pronunciation_prompt_with_audio_asks_model_to_transcribe() {
        let req = EvaluatePronunciationRequest {
            target_text: "ship".to_string(),
            target_ipa: Some("/ʃɪp/".to_string()),
            language: "en".to_string(),
            audio_path: Some("/tmp/attempt.wav".to_string()),
            recognized_text: None,
        };
        let prompt = render_evaluate_pronunciation_prompt(&req);
        assert!(!prompt.contains("{{"));
        assert!(prompt.contains("transcribe the attached audio"));
        // The text-only "empty ASR → score 0" rule must not fire when audio is attached.
        assert!(
            !prompt.contains("If recognized text is empty, still return JSON with overall_score 0")
        );
        assert!(prompt.contains("no discernible speech"));
    }

    #[test]
    fn dialogue_turn_from_json_parses_scores_and_suggestions() {
        let parsed = serde_json::json!({
            "tutor_reply": "A medium roast, coming up!",
            "turn_score": 95,
            "fluency_score": 92,
            "clarity_score": 90,
            "grammar_score": 96,
            "vocabulary_suggestions": ["medium roast", "dark roast", "Arabica", ""]
        });
        let res = dialogue_turn_from_json(&parsed);
        assert_eq!(res.tutor_reply, "A medium roast, coming up!");
        assert_eq!(res.turn_score, 95);
        assert_eq!(res.fluency_score, 92);
        assert_eq!(res.clarity_score, 90);
        assert_eq!(res.grammar_score, 96);
        assert_eq!(
            res.vocabulary_suggestions,
            vec!["medium roast", "dark roast", "Arabica"]
        );
    }

    #[test]
    fn render_dialogue_turn_prompt_substitutes_placeholders() {
        let req = DialogueTurnRequest {
            scenario_title: "Coffee Shop".into(),
            tutor_role: "barista".into(),
            level: "B2".into(),
            language: "en".into(),
            history: vec![DialogueHistoryMessage {
                role: "tutor".into(),
                text: "What kind of roast?".into(),
            }],
            user_text: "Medium roast please".into(),
        };
        let prompt = render_dialogue_turn_prompt(&req);
        assert!(!prompt.contains("{tutor_role}"));
        assert!(prompt.contains("barista"));
        assert!(prompt.contains("Medium roast please"));
        assert!(prompt.contains("What kind of roast?"));
    }

    // ── exercises_from_json ─────────────────────────────────

    #[test]
    fn exercises_from_json_maps_valid_array() {
        let parsed = serde_json::json!([
            {
                "category": "grammar",
                "exercise_type": "fill_blank",
                "prompt": "He ___ to school every day.",
                "correct_answer": "goes",
                "explanation": "Third person singular takes -s."
            },
            {
                "category": "spelling",
                "exercise_type": "correct_the_error",
                "prompt": "Fix: I recieved the letter.",
                "correct_answer": "I received the letter.",
                "explanation": "i before e except after c."
            }
        ]);
        let res = exercises_from_json(&parsed);
        assert_eq!(res.len(), 2);
        assert_eq!(res[0].category, "grammar");
        assert_eq!(res[0].exercise_type, "fill_blank");
        assert_eq!(res[0].prompt, "He ___ to school every day.");
        assert_eq!(res[0].correct_answer, "goes");
        assert_eq!(res[0].explanation, "Third person singular takes -s.");
        assert_eq!(res[1].exercise_type, "correct_the_error");
    }

    #[test]
    fn exercises_from_json_accepts_exercises_wrapper() {
        let parsed = serde_json::json!({
            "exercises": [{
                "category": "grammar",
                "exercise_type": "translate",
                "prompt": "Translate: Он ходит в школу.",
                "correct_answer": "He goes to school.",
                "explanation": ""
            }]
        });
        let res = exercises_from_json(&parsed);
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].category, "grammar");
    }

    #[test]
    fn exercises_from_json_skips_broken_elements() {
        let parsed = serde_json::json!([
            { "category": "grammar" },
            {
                "category": "grammar",
                "prompt": "He ___ to school.",
                "correct_answer": "goes"
            },
            "not-an-object",
            {
                "category": "spelling",
                "prompt": "Fix: teh",
                "correct_answer": "the",
                "explanation": "Typo."
            }
        ]);
        let res = exercises_from_json(&parsed);
        assert_eq!(res.len(), 2);
        assert_eq!(
            res[0].exercise_type, "fill_blank",
            "missing type defaults to fill_blank"
        );
        assert_eq!(
            res[0].explanation, "",
            "missing explanation defaults to empty"
        );
        assert_eq!(res[1].category, "spelling");
    }

    #[test]
    fn exercises_from_json_empty_or_invalid_returns_empty() {
        assert!(exercises_from_json(&serde_json::json!([])).is_empty());
        assert!(exercises_from_json(&serde_json::json!({})).is_empty());
        assert!(exercises_from_json(&serde_json::json!("nope")).is_empty());
    }

    // ── fallback_slot ───────────────────────────────────────

    #[test]
    fn fallback_slot_allows_same_provider_with_different_model() {
        let settings = crate::commands::settings::AppSettings::default();
        assert_eq!(
            fallback_slot(&settings),
            Some(("gemini", "gemini-3.5-flash-lite"))
        );
    }

    #[test]
    fn fallback_slot_skips_identical_provider_and_model() {
        let mut settings = crate::commands::settings::AppSettings::default();
        settings.fallback_ai_model = Some(settings.ai_model.clone());
        assert_eq!(fallback_slot(&settings), None);
    }

    #[test]
    fn fallback_slot_skips_when_disabled() {
        let settings = crate::commands::settings::AppSettings {
            fallback_enabled: false,
            ..Default::default()
        };
        assert_eq!(fallback_slot(&settings), None);
    }

    // ── ProviderRegistry ────────────────────────────────────

    fn make_translation(main: &str) -> TranslationResult {
        TranslationResult {
            text: "w".to_string(),
            source_language: "en".to_string(),
            target_language: "ru".to_string(),
            main_translation: main.to_string(),
            alternatives: vec![],
            source_synonyms: vec![],
            part_of_speech: None,
            phonetic: None,
            usage_note: None,
            example_sentence: None,
            example_sentence_2: None,
            frequency_hint: None,
            from_cache: false,
            lexeme_id: None,
            image_path: None,
            is_offline_fallback: false,
            detected_lexical_domain: None,
            requested_lexical_domain: None,
        }
    }

    fn make_evaluation(grade: u8) -> EvaluationResult {
        EvaluationResult {
            is_correct: true,
            grade,
            error_type: None,
            correct_answer: "ok".to_string(),
            explanation: None,
            short_rule: None,
        }
    }

    /// Test stub implementing the AIProvider contract.
    struct StubProvider {
        name: &'static str,
        fail: bool,
        fail_message: Option<&'static str>,
        delay_ms: u64,
        calls: Arc<AtomicUsize>,
    }

    impl StubProvider {
        fn ok(name: &'static str) -> Self {
            Self {
                name,
                fail: false,
                fail_message: None,
                delay_ms: 0,
                calls: Arc::new(AtomicUsize::new(0)),
            }
        }

        fn failing(name: &'static str) -> Self {
            Self {
                name,
                fail: true,
                fail_message: None,
                delay_ms: 0,
                calls: Arc::new(AtomicUsize::new(0)),
            }
        }

        /// Answers successfully, but only after `delay_ms` (a hung model).
        fn slow(name: &'static str, delay_ms: u64) -> Self {
            Self {
                name,
                fail: false,
                fail_message: None,
                delay_ms,
                calls: Arc::new(AtomicUsize::new(0)),
            }
        }

        fn call_count(&self) -> usize {
            self.calls.load(Ordering::SeqCst)
        }

        /// Fails with a provider-like message (auth, quota…).
        fn failing_with(name: &'static str, message: &'static str) -> Self {
            Self {
                fail_message: Some(message),
                ..Self::failing(name)
            }
        }

        fn fail_err(&self) -> AppError {
            match self.fail_message {
                Some(message) => AppError::Provider(message.to_string()),
                None => AppError::Provider(format!("{} failed", self.name)),
            }
        }
    }

    #[async_trait]
    impl AIProvider for StubProvider {
        async fn translate(&self, _req: TranslateRequest) -> Result<TranslationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.delay_ms > 0 {
                tokio::time::sleep(std::time::Duration::from_millis(self.delay_ms)).await;
            }
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(make_translation(self.name))
            }
        }

        async fn enrich(&self, _req: EnrichRequest) -> Result<EnrichResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(EnrichResult {
                    usage_note: Some(self.name.to_string()),
                    example_sentence: None,
                    example_sentence_2: None,
                })
            }
        }

        async fn mnemonic_concepts(
            &self,
            _req: MnemonicConceptsRequest,
        ) -> Result<MnemonicConceptsResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(MnemonicConceptsResult {
                    sense: "annoyingly persistent".to_string(),
                    associations: vec![
                        MnemonicAssociation {
                            id: "a".to_string(),
                            association: "A mosquito keeps returning after being swatted away"
                                .to_string(),
                            memory_hook: "keeps coming back".to_string(),
                        },
                        MnemonicAssociation {
                            id: "b".to_string(),
                            association: "A child repeatedly tugs a busy person's sleeve"
                                .to_string(),
                            memory_hook: "tugs for attention".to_string(),
                        },
                        MnemonicAssociation {
                            id: "c".to_string(),
                            association: "A small dog keeps putting a toy on a laptop keyboard"
                                .to_string(),
                            memory_hook: "toy on keyboard".to_string(),
                        },
                    ],
                    image_prompt: None,
                })
            }
        }

        async fn mnemonic_rank(
            &self,
            req: MnemonicRankRequest,
        ) -> Result<MnemonicRankResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                let selected = req
                    .associations
                    .first()
                    .cloned()
                    .unwrap_or(MnemonicAssociation {
                        id: "a".to_string(),
                        association: "fallback scene".to_string(),
                        memory_hook: "hook".to_string(),
                    });
                Ok(MnemonicRankResult {
                    selected_id: selected.id.clone(),
                    scores: vec![],
                    image_prompt: format!(
                        "A simple expressive educational illustration: {}. No text, no captions, no labels.",
                        selected.association
                    ),
                    photo_search_query: "mosquito buzzing around face photograph".to_string(),
                })
            }
        }

        async fn evaluate_answer(
            &self,
            _req: EvaluateRequest,
        ) -> Result<EvaluationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(make_evaluation(3))
            }
        }

        async fn explain_error(&self, _req: ExplainRequest) -> Result<EvaluationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(make_evaluation(2))
            }
        }

        async fn check_writing(
            &self,
            _req: CheckWritingRequest,
        ) -> Result<CheckWritingResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(CheckWritingResult {
                    issues: vec![],
                    overall_score: 100,
                    summary: self.name.to_string(),
                })
            }
        }

        async fn rewrite_text(&self, req: RewriteRequest) -> Result<RewriteResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(RewriteResult {
                    rewritten_text: req.text,
                    changes_summary: self.name.to_string(),
                })
            }
        }

        async fn evaluate_pronunciation(
            &self,
            req: EvaluatePronunciationRequest,
        ) -> Result<PronunciationEvaluationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(PronunciationEvaluationResult {
                    overall_score: 90,
                    recognized_text: req
                        .recognized_text
                        .unwrap_or_else(|| req.target_text.clone()),
                    target_ipa: req.target_ipa.unwrap_or_default(),
                    recognized_ipa: String::new(),
                    stress_feedback: None,
                    summary: self.name.to_string(),
                    phonemes: vec![],
                })
            }
        }

        async fn get_articulation_tip(
            &self,
            req: ArticulationTipRequest,
        ) -> Result<ArticulationTipResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(ArticulationTipResult {
                    phoneme: req.phoneme,
                    tip: self.name.to_string(),
                    tongue_position: None,
                    lip_position: None,
                })
            }
        }

        async fn generate_exercises(
            &self,
            req: GenerateExercisesRequest,
        ) -> Result<Vec<WritingExerciseRaw>, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(vec![WritingExerciseRaw {
                    category: req
                        .patterns
                        .first()
                        .map(|p| p.category.clone())
                        .unwrap_or_default(),
                    exercise_type: "fill_blank".to_string(),
                    prompt: self.name.to_string(),
                    correct_answer: "answer".to_string(),
                    explanation: String::new(),
                }])
            }
        }

        async fn translate_image(
            &self,
            req: TranslateImageRequest,
        ) -> Result<ImageTranslationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(ImageTranslationResult {
                    source_language: req.source_language.unwrap_or_else(|| "en".to_string()),
                    target_language: req.target_language,
                    full_translated_text: self.name.to_string(),
                    blocks: vec![],
                    detected_lexical_domain: None,
                    requested_lexical_domain: None,
                })
            }
        }

        async fn translate_document_chunk(
            &self,
            req: TranslateDocChunkRequest,
        ) -> Result<DocChunkTranslationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(DocChunkTranslationResult {
                    source_language: req.source_language.unwrap_or_else(|| "en".to_string()),
                    target_language: req.target_language,
                    translated_content: format!("{}: {}", self.name, req.content),
                    detected_lexical_domain: None,
                    requested_lexical_domain: None,
                })
            }
        }

        async fn translate_audio(
            &self,
            req: TranslateAudioRequest,
        ) -> Result<AudioTranslationResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(AudioTranslationResult {
                    source_language: req.source_language.unwrap_or_else(|| "en".to_string()),
                    target_language: req.target_language,
                    transcribed_text: "Spoken audio".to_string(),
                    translated_text: self.name.to_string(),
                    segments: vec![],
                    detected_lexical_domain: None,
                    requested_lexical_domain: None,
                })
            }
        }

        async fn generate_scenario(
            &self,
            req: GenerateScenarioRequest,
        ) -> Result<GeneratedScenario, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(GeneratedScenario {
                    title: format!("{} ({})", req.seed.title, req.language_name),
                    description: req.seed.description,
                    tutor_role: format!("{} tutor", self.name),
                    opening_line: "Hello!".into(),
                    suggested_vocab: vec!["hello".into()],
                })
            }
        }

        async fn dialogue_turn(
            &self,
            req: DialogueTurnRequest,
        ) -> Result<DialogueTurnResult, AppError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(self.fail_err())
            } else {
                Ok(DialogueTurnResult {
                    tutor_reply: format!("{} heard: {}", self.name, req.user_text),
                    turn_score: 95,
                    fluency_score: 92,
                    clarity_score: 92,
                    grammar_score: 94,
                    vocabulary_suggestions: vec![
                        "medium roast".into(),
                        "dark roast".into(),
                        "Arabica".into(),
                    ],
                })
            }
        }

        fn provider_name(&self) -> &'static str {
            self.name
        }
    }

    fn sample_translate_req() -> TranslateRequest {
        TranslateRequest {
            text: "cat".to_string(),
            source_language: Some("en".to_string()),
            target_language: "ru".to_string(),
            context_sentence: None,
            lexical_domain: None,
        }
    }

    fn sample_enrich_req() -> EnrichRequest {
        EnrichRequest {
            text: "cat".to_string(),
            source_language: "en".to_string(),
            target_language: "ru".to_string(),
            main_translation: "кот".to_string(),
        }
    }

    fn sample_evaluate_req() -> EvaluateRequest {
        EvaluateRequest {
            target_text: "cat".to_string(),
            user_answer: "kat".to_string(),
            mode: "typing".to_string(),
            language: "en".to_string(),
        }
    }

    fn sample_explain_req() -> ExplainRequest {
        ExplainRequest {
            target_text: "cat".to_string(),
            user_answer: "kat".to_string(),
            mode: "typing".to_string(),
            language: "en".to_string(),
            error_type: "typo".to_string(),
        }
    }

    fn sample_check_req() -> CheckWritingRequest {
        CheckWritingRequest {
            text: "I has a apple.".to_string(),
            language: "en".to_string(),
        }
    }

    fn sample_rewrite_req() -> RewriteRequest {
        RewriteRequest {
            text: "Please find attached the file.".to_string(),
            language: "en".to_string(),
            mode: "clearer".to_string(),
            custom_instruction: String::new(),
        }
    }

    fn sample_pronunciation_req() -> EvaluatePronunciationRequest {
        EvaluatePronunciationRequest {
            target_text: "ship".to_string(),
            target_ipa: Some("/ʃɪp/".to_string()),
            language: "en".to_string(),
            audio_path: None,
            recognized_text: Some("sheep".to_string()),
        }
    }

    fn sample_tip_req() -> ArticulationTipRequest {
        ArticulationTipRequest {
            phoneme: "θ".to_string(),
            language: "en".to_string(),
        }
    }

    fn sample_exercises_req() -> GenerateExercisesRequest {
        GenerateExercisesRequest {
            language: "en".to_string(),
            patterns: vec![
                ErrorPatternSummary {
                    category: "grammar".to_string(),
                    occurrence_count: 5,
                    sample_original: Some("he go".to_string()),
                    sample_fix: Some("he goes".to_string()),
                },
                ErrorPatternSummary {
                    category: "spelling".to_string(),
                    occurrence_count: 2,
                    sample_original: None,
                    sample_fix: None,
                },
            ],
        }
    }

    #[tokio::test]
    async fn registry_returns_primary_result_without_touching_fallback() {
        let primary = Arc::new(StubProvider::ok("primary"));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::new(primary.clone(), Some(fallback.clone()));

        let res = registry.translate(sample_translate_req()).await.unwrap();
        assert_eq!(res.main_translation, "primary");
        assert_eq!(primary.call_count(), 1);
        assert_eq!(fallback.call_count(), 0, "fallback must not be called");
    }

    #[tokio::test]
    async fn registry_falls_back_when_primary_fails() {
        let primary = Arc::new(StubProvider::failing("primary"));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::new(primary.clone(), Some(fallback.clone()));

        let res = registry.translate(sample_translate_req()).await.unwrap();
        assert_eq!(res.main_translation, "fallback");
        assert_eq!(primary.call_count(), 1);
        assert_eq!(fallback.call_count(), 1);
    }

    #[tokio::test]
    async fn registry_moves_on_when_a_model_hangs() {
        let slow = Arc::new(StubProvider::slow("slow", 5_000));
        let fast = Arc::new(StubProvider::ok("fast"));
        let registry = ProviderRegistry::from_chain(
            vec![slow.clone(), fast.clone()],
            Some(std::time::Duration::from_millis(50)),
        );

        let res = registry.translate(sample_translate_req()).await.unwrap();
        assert_eq!(res.main_translation, "fast");
        assert_eq!(slow.call_count(), 1);
        assert_eq!(fast.call_count(), 1);
    }

    #[tokio::test]
    async fn registry_walks_a_longer_chain_in_order() {
        let first = Arc::new(StubProvider::failing("first"));
        let second = Arc::new(StubProvider::failing("second"));
        let third = Arc::new(StubProvider::ok("third"));
        let registry =
            ProviderRegistry::from_chain(vec![first.clone(), second.clone(), third.clone()], None);

        let res = registry.translate(sample_translate_req()).await.unwrap();
        assert_eq!(res.main_translation, "third");
        assert_eq!(
            (first.call_count(), second.call_count(), third.call_count()),
            (1, 1, 1)
        );
    }

    #[tokio::test]
    async fn rejected_key_stops_the_chain_instead_of_falling_back() {
        let bad_key = Arc::new(StubProvider::failing_with(
            "primary",
            "Gemini API error 400: API key not valid. Please pass a valid API key.",
        ));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::from_chain(vec![bad_key.clone(), fallback.clone()], None);

        let err = registry.translate(sample_translate_req()).await.unwrap_err();
        assert!(err.to_string().contains("API key not valid"), "{err}");
        assert_eq!(fallback.call_count(), 0, "a rejected key must not silently fall back");
    }

    #[tokio::test]
    async fn rate_limited_model_hands_over_to_the_next_one() {
        let limited = Arc::new(StubProvider::failing_with(
            "primary",
            "429 Too Many Requests: RESOURCE_EXHAUSTED",
        ));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::from_chain(vec![limited.clone(), fallback.clone()], None);

        let res = registry.translate(sample_translate_req()).await.unwrap();
        assert_eq!(res.main_translation, "fallback");
    }

    #[test]
    fn classifies_provider_failures() {
        let kind = |msg: &str| classify_failure(&AppError::Provider(msg.to_string()));
        assert_eq!(kind("OpenAI error 401: Incorrect API key provided: sk-…"), FailureKind::Auth);
        assert_eq!(kind("Anthropic 401 authentication_error: invalid x-api-key"), FailureKind::Auth);
        assert_eq!(kind("Gemini 400 API_KEY_INVALID"), FailureKind::Auth);
        assert_eq!(kind("Groq 401: Invalid API Key"), FailureKind::Auth);
        assert_eq!(kind("429 Too Many Requests"), FailureKind::RateLimit);
        assert_eq!(kind("Gemini 429 RESOURCE_EXHAUSTED: quota exceeded"), FailureKind::RateLimit);
        assert_eq!(kind("gemini did not answer within 30s"), FailureKind::Other);
        assert_eq!(kind("Gemini 403: User location is not supported"), FailureKind::Other);
        assert_eq!(
            kind("Input of 34012 tokens exceeds the 14290 limit"),
            FailureKind::Other,
            "status codes only match as standalone numbers"
        );
    }

    #[tokio::test]
    async fn registry_counts_every_attempt_per_model() -> Result<(), AppError> {
        use crate::db::repos::ai_usage::AiUsageRepo;
        use crate::providers::models::packages::RouteTarget;
        use crate::providers::models::roles::ModelRole;
        use crate::providers::models::usage::UsageSink;

        let pool = crate::db::create_pool_test_memory()?;
        crate::db::run_migrations(&pool)?;
        let registry = ProviderRegistry::from_chain(
            vec![Arc::new(StubProvider::failing("primary")), Arc::new(StubProvider::ok("fallback"))],
            None,
        )
        .with_usage(ChainUsage {
            sink: UsageSink::new(pool.clone(), ModelRole::TextFast),
            targets: vec![
                RouteTarget::new("gemini", "gemini-3.5-flash-lite"),
                RouteTarget::new("gemini", "gemini-3.8-flash"),
            ],
        });
        registry.translate(sample_translate_req()).await?;

        let conn = pool.get()?;
        let rows = AiUsageRepo::summary(&conn, 1)?;
        let count = |model: &str| {
            rows.iter()
                .find(|r| r.model == model)
                .map(|r| (r.role.as_str(), r.requests, r.failures))
        };
        assert_eq!(count("gemini-3.5-flash-lite"), Some(("text_fast", 1, 1)));
        assert_eq!(count("gemini-3.8-flash"), Some(("text_fast", 1, 0)));
        Ok(())
    }

    #[tokio::test]
    async fn empty_registry_reports_missing_model() {
        let registry = ProviderRegistry::from_chain(vec![], None);
        let err = registry.translate(sample_translate_req()).await.unwrap_err();
        assert!(err.to_string().contains("No AI model"));
    }

    #[tokio::test]
    async fn registry_propagates_primary_error_without_fallback() {
        let registry = ProviderRegistry::new(Arc::new(StubProvider::failing("primary")), None);
        let err = registry
            .translate(sample_translate_req())
            .await
            .unwrap_err();
        assert!(matches!(err, AppError::Provider(ref msg) if msg.contains("primary failed")));
    }

    #[tokio::test]
    async fn registry_propagates_error_when_both_fail() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::failing("fallback"))),
        );
        let err = registry
            .translate(sample_translate_req())
            .await
            .unwrap_err();
        assert!(matches!(err, AppError::Provider(ref msg) if msg.contains("fallback failed")));
    }

    #[tokio::test]
    async fn registry_enrich_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry.enrich(sample_enrich_req()).await.unwrap();
        assert_eq!(res.usage_note.as_deref(), Some("fallback"));
    }

    #[tokio::test]
    async fn registry_evaluate_answer_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry
            .evaluate_answer(sample_evaluate_req())
            .await
            .unwrap();
        assert!(res.is_correct);
        assert_eq!(res.grade, 3);
    }

    #[tokio::test]
    async fn registry_explain_error_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry.explain_error(sample_explain_req()).await.unwrap();
        assert_eq!(res.grade, 2);
    }

    #[tokio::test]
    async fn registry_check_writing_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry.check_writing(sample_check_req()).await.unwrap();
        assert_eq!(res.summary, "fallback");
        assert_eq!(res.overall_score, 100);
    }

    #[tokio::test]
    async fn registry_rewrite_text_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry.rewrite_text(sample_rewrite_req()).await.unwrap();
        assert_eq!(res.rewritten_text, sample_rewrite_req().text);
        assert_eq!(res.changes_summary, "fallback");
    }

    #[tokio::test]
    async fn registry_evaluate_pronunciation_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry
            .evaluate_pronunciation(sample_pronunciation_req())
            .await
            .unwrap();
        assert_eq!(res.summary, "fallback");
        assert_eq!(res.overall_score, 90);
    }

    #[tokio::test]
    async fn registry_articulation_tip_uses_fallback_on_primary_failure() {
        let registry = ProviderRegistry::new(
            Arc::new(StubProvider::failing("primary")),
            Some(Arc::new(StubProvider::ok("fallback"))),
        );
        let res = registry
            .get_articulation_tip(sample_tip_req())
            .await
            .unwrap();
        assert_eq!(res.tip, "fallback");
    }

    #[tokio::test]
    async fn registry_generate_exercises_uses_fallback_on_primary_failure() {
        let primary = Arc::new(StubProvider::failing("primary"));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::new(primary.clone(), Some(fallback.clone()));

        let res = registry
            .generate_exercises(sample_exercises_req())
            .await
            .unwrap();
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].prompt, "fallback");
        assert_eq!(res[0].category, "grammar");
        assert_eq!(primary.call_count(), 1);
        assert_eq!(fallback.call_count(), 1);
    }

    #[tokio::test]
    async fn registry_generate_exercises_returns_primary_without_fallback() {
        let primary = Arc::new(StubProvider::ok("primary"));
        let fallback = Arc::new(StubProvider::ok("fallback"));
        let registry = ProviderRegistry::new(primary.clone(), Some(fallback.clone()));

        let res = registry
            .generate_exercises(sample_exercises_req())
            .await
            .unwrap();
        assert_eq!(res[0].prompt, "primary");
        assert_eq!(fallback.call_count(), 0, "fallback must not be called");
    }

    #[tokio::test]
    async fn registry_generate_exercises_without_fallback_propagates_error() {
        let registry = ProviderRegistry::new(Arc::new(StubProvider::failing("primary")), None);
        let err = registry
            .generate_exercises(sample_exercises_req())
            .await
            .unwrap_err();
        assert!(matches!(err, AppError::Provider(ref msg) if msg.contains("primary failed")));
    }

    #[tokio::test]
    async fn registry_writing_without_fallback_propagates_error() {
        let registry = ProviderRegistry::new(Arc::new(StubProvider::failing("primary")), None);
        assert!(registry.check_writing(sample_check_req()).await.is_err());
        assert!(registry.rewrite_text(sample_rewrite_req()).await.is_err());
    }

    #[tokio::test]
    async fn registry_enrich_without_fallback_propagates_error() {
        let registry = ProviderRegistry::new(Arc::new(StubProvider::failing("primary")), None);
        assert!(registry.enrich(sample_enrich_req()).await.is_err());
        assert!(registry
            .evaluate_answer(sample_evaluate_req())
            .await
            .is_err());
        assert!(registry.explain_error(sample_explain_req()).await.is_err());
    }

    #[test]
    fn translate_audio_request_deserializes_camel_case_from_frontend() {
        let req: TranslateAudioRequest = serde_json::from_str(
            r#"{"audioBase64":"YWJj","mimeType":"audio/webm","targetLanguage":"ru"}"#,
        )
        .expect("frontend camelCase payload must deserialize");
        assert_eq!(req.audio_base64, "YWJj");
        assert_eq!(req.mime_type, "audio/webm");
        assert_eq!(req.target_language, "ru");
        assert!(req.source_language.is_none());
    }
}
