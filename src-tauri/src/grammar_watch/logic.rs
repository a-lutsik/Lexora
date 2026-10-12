// ============================================================
// LEXORA — System-wide writing check: pure logic
// No OS calls here: what to check, when, and where the badge goes.
// The macOS layer feeds observations in and executes decisions.
// ============================================================

use std::time::{Duration, Instant};

/// Typing pause after which the field text is sent for a check.
pub const SETTLE_DELAY: Duration = Duration::from_millis(1_200);
/// Shorter texts are not worth an AI call («ok», «thanks!»).
pub const MIN_CHECK_CHARS: usize = 12;
pub const MIN_CHECK_WORDS: usize = 3;
/// Same cap as the Writing Assistant (`commands::writing::MAX_WRITING_CHARS`).
pub const MAX_CHECK_CHARS: usize = crate::commands::writing::MAX_WRITING_CHARS;
/// Share of letters that must be in the learning language's script.
const SCRIPT_MATCH_RATIO: f64 = 0.7;

// ── Field eligibility ─────────────────────────────────────

const ROLE_TEXT_AREA: &str = "AXTextArea";
const ROLE_TEXT_FIELD: &str = "AXTextField";
const ROLE_COMBO_BOX: &str = "AXComboBox";
const SECURE_TEXT_FIELD: &str = "AXSecureTextField";
const SUBROLE_SEARCH_FIELD: &str = "AXSearchField";

/// Password fields are never read — neither by role nor by subrole
/// (browsers expose `<input type=password>` as a subrole).
pub fn is_secure_field(role: Option<&str>, subrole: Option<&str>) -> bool {
    role == Some(SECURE_TEXT_FIELD) || subrole == Some(SECURE_TEXT_FIELD)
}

/// Editable text controls we check. Search boxes are skipped: short
/// queries, and replacing their text would re-run the search.
pub fn is_checkable_role(role: Option<&str>, subrole: Option<&str>) -> bool {
    if is_secure_field(role, subrole) || subrole == Some(SUBROLE_SEARCH_FIELD) {
        return false;
    }
    matches!(
        role,
        Some(ROLE_TEXT_AREA | ROLE_TEXT_FIELD | ROLE_COMBO_BOX)
    )
}

/// Exact bundle id, or a prefix when the entry ends in `*`.
pub fn is_app_excluded(bundle_id: Option<&str>, excluded: &[String]) -> bool {
    let Some(bundle_id) = bundle_id else {
        return false;
    };
    excluded.iter().any(|entry| match entry.strip_suffix('*') {
        Some(prefix) => bundle_id.starts_with(prefix),
        None => entry == bundle_id,
    })
}

// ── Text eligibility ─────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Script {
    Latin,
    Cyrillic,
}

fn script_of_language(language: &str) -> Option<Script> {
    let code = language
        .split(['-', '_'])
        .next()
        .unwrap_or(language)
        .to_ascii_lowercase();
    match code.as_str() {
        "en" | "de" | "fr" | "es" | "it" | "pt" | "nl" | "pl" | "cs" | "sk" | "sv" | "da"
        | "no" | "nb" | "fi" | "tr" | "ro" | "hu" | "hr" | "sl" | "lt" | "lv" | "et" | "id"
        | "vi" => Some(Script::Latin),
        "ru" | "uk" | "be" | "bg" | "sr" | "mk" | "kk" => Some(Script::Cyrillic),
        _ => None,
    }
}

fn char_script(c: char) -> Option<Script> {
    if c.is_ascii_alphabetic() || ('\u{00C0}'..='\u{024F}').contains(&c) {
        Some(Script::Latin)
    } else if ('\u{0400}'..='\u{04FF}').contains(&c) {
        Some(Script::Cyrillic)
    } else {
        None
    }
}

/// Is the text written in the learning language's script? A Russian chat
/// message is not sent for an English grammar check. Unknown languages pass.
pub fn script_matches_language(text: &str, language: &str) -> bool {
    let Some(expected) = script_of_language(language) else {
        return true;
    };
    let mut letters = 0_usize;
    let mut matching = 0_usize;
    for c in text.chars().filter(|c| c.is_alphabetic()) {
        letters += 1;
        if char_script(c) == Some(expected) {
            matching += 1;
        }
    }
    letters > 0 && (matching as f64) / (letters as f64) >= SCRIPT_MATCH_RATIO
}

/// Why a text is not sent for a check.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rejection {
    TooShort,
    TooLong,
    OtherLanguage,
}

pub fn rejection(text: &str, language: &str) -> Option<Rejection> {
    let trimmed = text.trim();
    let chars = trimmed.chars().count();
    if chars > MAX_CHECK_CHARS {
        Some(Rejection::TooLong)
    } else if chars < MIN_CHECK_CHARS || trimmed.split_whitespace().count() < MIN_CHECK_WORDS {
        Some(Rejection::TooShort)
    } else if !script_matches_language(trimmed, language) {
        Some(Rejection::OtherLanguage)
    } else {
        None
    }
}

/// Worth an AI call: long enough, not too long, in the learning language.
pub fn text_is_checkable(text: &str, language: &str) -> bool {
    rejection(text, language).is_none()
}

// ── Watch state machine ──────────────────────────────────

/// What the OS layer saw in the focused field on this tick.
#[derive(Debug, Clone, Copy)]
pub struct Observation<'a> {
    /// The focused element is the one observed on the previous tick.
    pub same_field: bool,
    /// Full field value (untrimmed).
    pub text: &'a str,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Decision {
    Nothing,
    /// Hide the badge (focus left, text no longer checkable, …).
    Hide,
    /// The user is typing again: the shown result is stale.
    Pending {
        field_id: u64,
    },
    /// Text settled: check it and show the badge.
    Check {
        field_id: u64,
        text: String,
    },
}

#[derive(Debug)]
pub struct WatchState {
    field_id: u64,
    active: bool,
    last_text: String,
    changed_at: Instant,
    /// Trimmed text last sent for a check (or rejected as uncheckable).
    settled: Option<String>,
    badge_visible: bool,
    pending: bool,
}

impl WatchState {
    pub fn new(now: Instant) -> Self {
        Self {
            field_id: 0,
            active: false,
            last_text: String::new(),
            changed_at: now,
            settled: None,
            badge_visible: false,
            pending: false,
        }
    }

    /// The user typed within the last `SETTLE_DELAY`.
    pub fn is_settling(&self, now: Instant) -> bool {
        self.active && now.duration_since(self.changed_at) < SETTLE_DELAY
    }

    pub fn field_id(&self) -> Option<u64> {
        self.active.then_some(self.field_id)
    }

    fn hide(&mut self) -> Decision {
        self.pending = false;
        if self.badge_visible {
            self.badge_visible = false;
            Decision::Hide
        } else {
            Decision::Nothing
        }
    }

    /// `None` — no eligible field is focused (another app, password field, …).
    pub fn observe(
        &mut self,
        observation: Option<Observation<'_>>,
        checkable: impl Fn(&str) -> bool,
        now: Instant,
    ) -> Decision {
        let Some(observation) = observation else {
            self.active = false;
            self.settled = None;
            return self.hide();
        };

        if !self.active || !observation.same_field {
            self.field_id += 1;
            self.active = true;
            self.last_text = observation.text.to_string();
            self.changed_at = now;
            self.settled = None;
            return self.hide();
        }

        if observation.text != self.last_text {
            self.last_text = observation.text.to_string();
            self.changed_at = now;
            if self.badge_visible && !self.pending {
                self.pending = true;
                return Decision::Pending {
                    field_id: self.field_id,
                };
            }
            return Decision::Nothing;
        }

        if now.duration_since(self.changed_at) < SETTLE_DELAY {
            return Decision::Nothing;
        }
        let trimmed = observation.text.trim();
        if self.settled.as_deref() == Some(trimmed) {
            return Decision::Nothing;
        }
        self.settled = Some(trimmed.to_string());
        if checkable(trimmed) {
            self.badge_visible = true;
            self.pending = false;
            Decision::Check {
                field_id: self.field_id,
                text: trimmed.to_string(),
            }
        } else {
            self.hide()
        }
    }

    /// Lexora itself wrote `text` into the field (a fix was applied): the
    /// result shown already matches it, so do not re-check or mark stale.
    pub fn expect_text(&mut self, text: &str, now: Instant) {
        self.last_text = text.to_string();
        self.settled = Some(text.trim().to_string());
        self.changed_at = now;
        self.pending = false;
    }

    /// The user dismissed the badge: hide it until the text changes.
    pub fn snooze(&mut self) -> Decision {
        self.hide()
    }
}

// ── Text replacement ─────────────────────────────────────

/// Smallest replacement turning `old` into `new`. Offsets are UTF-16 code
/// units — the unit of macOS `AXSelectedTextRange`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextEdit {
    pub start: usize,
    pub removed: usize,
    pub inserted: String,
}

pub fn minimal_edit(old: &str, new: &str) -> Option<TextEdit> {
    if old == new {
        return None;
    }
    let old_chars: Vec<char> = old.chars().collect();
    let new_chars: Vec<char> = new.chars().collect();
    let prefix = old_chars
        .iter()
        .zip(&new_chars)
        .take_while(|(a, b)| a == b)
        .count();
    let max_suffix = old_chars.len().min(new_chars.len()) - prefix;
    let suffix = old_chars
        .iter()
        .rev()
        .zip(new_chars.iter().rev())
        .take(max_suffix)
        .take_while(|(a, b)| a == b)
        .count();
    let utf16_len = |chars: &[char]| chars.iter().map(|c| c.len_utf16()).sum::<usize>();
    Some(TextEdit {
        start: utf16_len(&old_chars[..prefix]),
        removed: utf16_len(&old_chars[prefix..old_chars.len() - suffix]),
        inserted: new_chars[prefix..new_chars.len() - suffix].iter().collect(),
    })
}

/// Where the caret/selection (UTF-16 `location`, `length`) ends up after
/// `edit`: text before the edit keeps it, text after shifts, a selection
/// touching the edit collapses to the end of the inserted text.
pub fn shift_selection(location: usize, length: usize, edit: &TextEdit) -> (usize, usize) {
    let edit_end = edit.start + edit.removed;
    let inserted = edit.inserted.encode_utf16().count();
    if location + length <= edit.start {
        (location, length)
    } else if location >= edit_end {
        ((location + inserted).saturating_sub(edit.removed), length)
    } else {
        (edit.start + inserted, 0)
    }
}

/// The check ran on the trimmed field text. Put the corrected text back
/// between the field's original leading/trailing whitespace. `None` when
/// the field no longer holds the checked text (the user kept typing).
pub fn rebuild_field_text(current: &str, checked: &str, corrected: &str) -> Option<String> {
    let body = current.trim();
    if body != checked.trim() {
        return None;
    }
    let leading = &current[..current.len() - current.trim_start().len()];
    let trailing = &current[current.trim_end().len()..];
    Some(format!("{leading}{}{trailing}", corrected.trim()))
}

// ── Badge geometry ───────────────────────────────────────

/// Rectangle in global screen points, origin top-left of the primary
/// display, Y down (the Accessibility / CoreGraphics convention).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Rect {
    pub fn right(&self) -> f64 {
        self.x + self.width
    }

    pub fn bottom(&self) -> f64 {
        self.y + self.height
    }

    pub fn center(&self) -> (f64, f64) {
        (self.x + self.width / 2.0, self.y + self.height / 2.0)
    }

    pub fn is_usable(&self) -> bool {
        self.x.is_finite()
            && self.y.is_finite()
            && self.width.is_finite()
            && self.height.is_finite()
            && self.width >= 1.0
            && self.height >= 1.0
    }
}

/// Inset from the field's corner and gap between badge and panel. The
/// badge window already pads its visible circle, so this stays small.
pub const BADGE_INSET: f64 = 2.0;
pub const SCREEN_MARGIN: f64 = 8.0;

fn clamp_axis(value: f64, size: f64, min: f64, max_edge: f64) -> f64 {
    let max = max_edge - size;
    if max < min {
        min
    } else {
        value.clamp(min, max)
    }
}

fn clamp_into(x: f64, y: f64, width: f64, height: f64, visible: &Rect) -> (f64, f64) {
    (
        clamp_axis(
            x,
            width,
            visible.x + SCREEN_MARGIN,
            visible.right() - SCREEN_MARGIN,
        ),
        clamp_axis(
            y,
            height,
            visible.y + SCREEN_MARGIN,
            visible.bottom() - SCREEN_MARGIN,
        ),
    )
}

/// Badge inside the field's bottom-right corner (like Grammarly). A field
/// taller than the screen (document editors) keeps it on screen.
pub fn badge_frame(field: &Rect, size: f64, visible: &Rect) -> Rect {
    let x = field.right() - size - BADGE_INSET;
    let y = field.bottom() - size - BADGE_INSET;
    let (x, y) = clamp_into(x, y, size, size, visible);
    Rect {
        x,
        y,
        width: size,
        height: size,
    }
}

/// Suggestions panel: right-aligned with the badge, below it when there is
/// room, otherwise above, always inside the visible screen area.
pub fn panel_frame(badge: &Rect, width: f64, height: f64, visible: &Rect) -> Rect {
    let x = badge.right() - width;
    let below = badge.bottom() + BADGE_INSET;
    let y = if below + height <= visible.bottom() - SCREEN_MARGIN {
        below
    } else {
        badge.y - BADGE_INSET - height
    };
    let (x, y) = clamp_into(x, y, width, height, visible);
    Rect {
        x,
        y,
        width,
        height,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn always(_: &str) -> bool {
        true
    }

    fn never(_: &str) -> bool {
        false
    }

    fn obs(same_field: bool, text: &str) -> Option<Observation<'_>> {
        Some(Observation { same_field, text })
    }

    // ── eligibility ──

    #[test]
    fn password_fields_are_never_checkable() {
        assert!(is_secure_field(Some("AXSecureTextField"), None));
        assert!(is_secure_field(
            Some("AXTextField"),
            Some("AXSecureTextField")
        ));
        assert!(!is_checkable_role(
            Some("AXTextField"),
            Some("AXSecureTextField")
        ));
        assert!(!is_checkable_role(Some("AXSecureTextField"), None));
    }

    #[test]
    fn checkable_roles() {
        assert!(is_checkable_role(Some("AXTextArea"), None));
        assert!(is_checkable_role(Some("AXTextField"), None));
        assert!(is_checkable_role(Some("AXComboBox"), None));
        assert!(!is_checkable_role(
            Some("AXTextField"),
            Some("AXSearchField")
        ));
        assert!(!is_checkable_role(Some("AXButton"), None));
        assert!(!is_checkable_role(None, None));
    }

    #[test]
    fn excluded_apps_match_exact_and_prefix() {
        let list = vec![
            "com.apple.Terminal".to_string(),
            "com.jetbrains.*".to_string(),
        ];
        assert!(is_app_excluded(Some("com.apple.Terminal"), &list));
        assert!(is_app_excluded(Some("com.jetbrains.intellij"), &list));
        assert!(!is_app_excluded(Some("com.apple.TerminalX"), &list));
        assert!(!is_app_excluded(Some("com.apple.mail"), &list));
        assert!(!is_app_excluded(None, &list));
    }

    #[test]
    fn script_detection_follows_learning_language() {
        assert!(script_matches_language("I goes to school yesterday", "en"));
        assert!(!script_matches_language("Привет, как дела у тебя", "en"));
        assert!(script_matches_language("Привет, как дела у тебя", "ru"));
        assert!(script_matches_language("Ich habe Hunger, später", "de-DE"));
        // Mostly English with one Russian word still passes.
        assert!(script_matches_language(
            "Send the report to Иван today please",
            "en"
        ));
        // Unknown language (Japanese) — no script filter.
        assert!(script_matches_language("こんにちは", "ja"));
        // No letters at all.
        assert!(!script_matches_language("12345 !!!", "en"));
    }

    #[test]
    fn rejection_reasons() {
        assert_eq!(rejection("ok thanks", "en"), Some(Rejection::TooShort));
        assert_eq!(
            rejection("Я сегодня иду в магазин", "en"),
            Some(Rejection::OtherLanguage)
        );
        assert_eq!(
            rejection(&"word ".repeat(MAX_CHECK_CHARS), "en"),
            Some(Rejection::TooLong)
        );
        assert_eq!(rejection("She dont like apples.", "en"), None);
    }

    #[test]
    fn settling_tracks_typing_pause() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        assert!(!state.is_settling(t0));
        state.observe(obs(false, "She dont"), always, t0);
        assert!(state.is_settling(t0 + Duration::from_millis(100)));
        assert!(!state.is_settling(t0 + SETTLE_DELAY));
    }

    #[test]
    fn text_checkability_bounds() {
        assert!(!text_is_checkable("ok thanks", "en"));
        assert!(!text_is_checkable("supercalifragilistic", "en")); // one word
        assert!(text_is_checkable("  She dont like apples.  ", "en"));
        let long = "word ".repeat(MAX_CHECK_CHARS);
        assert!(!text_is_checkable(&long, "en"));
        assert!(!text_is_checkable("Я сегодня иду в магазин", "en"));
    }

    // ── state machine ──

    #[test]
    fn checks_only_after_typing_pause() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        assert_eq!(
            state.observe(obs(false, "She dont"), always, t0),
            Decision::Nothing
        );
        let t1 = t0 + Duration::from_millis(300);
        assert_eq!(
            state.observe(obs(true, "She dont like it"), always, t1),
            Decision::Nothing
        );
        // Not settled yet.
        assert_eq!(
            state.observe(
                obs(true, "She dont like it"),
                always,
                t1 + Duration::from_millis(500)
            ),
            Decision::Nothing
        );
        let settled = t1 + SETTLE_DELAY;
        let field_id = state.field_id().expect("active");
        assert_eq!(
            state.observe(obs(true, "She dont like it"), always, settled),
            Decision::Check {
                field_id,
                text: "She dont like it".to_string()
            }
        );
        // Same text is not checked twice.
        assert_eq!(
            state.observe(
                obs(true, "She dont like it"),
                always,
                settled + SETTLE_DELAY
            ),
            Decision::Nothing
        );
    }

    #[test]
    fn whitespace_only_change_is_not_rechecked() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        let t1 = t0 + SETTLE_DELAY;
        assert!(matches!(
            state.observe(obs(true, "She dont like it"), always, t1),
            Decision::Check { .. }
        ));
        let t2 = t1 + Duration::from_millis(10);
        assert!(matches!(
            state.observe(obs(true, "She dont like it "), always, t2),
            Decision::Pending { .. }
        ));
        assert_eq!(
            state.observe(obs(true, "She dont like it "), always, t2 + SETTLE_DELAY),
            Decision::Nothing
        );
    }

    #[test]
    fn typing_after_check_marks_pending_once_then_rechecks() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let t1 = t0 + SETTLE_DELAY * 2;
        let field_id = state.field_id().expect("active");
        assert_eq!(
            state.observe(obs(true, "She dont like it,"), always, t1),
            Decision::Pending { field_id }
        );
        assert_eq!(
            state.observe(obs(true, "She dont like it, no"), always, t1),
            Decision::Nothing
        );
        assert_eq!(
            state.observe(obs(true, "She dont like it, no"), always, t1 + SETTLE_DELAY),
            Decision::Check {
                field_id,
                text: "She dont like it, no".to_string()
            }
        );
    }

    #[test]
    fn focus_change_hides_badge_and_starts_new_field() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let first = state.field_id().expect("active");
        let t1 = t0 + SETTLE_DELAY * 2;
        assert_eq!(
            state.observe(obs(false, "Other field text here"), always, t1),
            Decision::Hide
        );
        assert_ne!(state.field_id(), Some(first));
        // Leaving to a non-text element: nothing visible → nothing to hide.
        assert_eq!(state.observe(None, always, t1), Decision::Nothing);
        assert_eq!(state.field_id(), None);
    }

    #[test]
    fn leaving_field_with_visible_badge_hides_it() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        assert_eq!(
            state.observe(None, always, t0 + SETTLE_DELAY * 2),
            Decision::Hide
        );
    }

    #[test]
    fn uncheckable_text_hides_badge_without_check() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let t1 = t0 + SETTLE_DELAY * 2;
        state.observe(obs(true, "ok"), always, t1);
        assert_eq!(
            state.observe(obs(true, "ok"), never, t1 + SETTLE_DELAY),
            Decision::Hide
        );
    }

    #[test]
    fn applied_fix_is_not_rechecked() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let t1 = t0 + SETTLE_DELAY * 2;
        state.expect_text("She doesn't like it", t1);
        assert_eq!(
            state.observe(obs(true, "She doesn't like it"), always, t1),
            Decision::Nothing
        );
        assert_eq!(
            state.observe(obs(true, "She doesn't like it"), always, t1 + SETTLE_DELAY),
            Decision::Nothing
        );
    }

    #[test]
    fn snooze_hides_until_text_changes() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        assert_eq!(state.snooze(), Decision::Hide);
        let t1 = t0 + SETTLE_DELAY * 3;
        assert_eq!(
            state.observe(obs(true, "She dont like it"), always, t1),
            Decision::Nothing
        );
        // Hidden badge: typing is not «pending», the next pause re-checks.
        assert_eq!(
            state.observe(obs(true, "She dont like it at all"), always, t1),
            Decision::Nothing
        );
        assert!(matches!(
            state.observe(
                obs(true, "She dont like it at all"),
                always,
                t1 + SETTLE_DELAY
            ),
            Decision::Check { .. }
        ));
    }

    // ── text replacement ──

    #[test]
    fn minimal_edit_finds_changed_span() {
        assert_eq!(minimal_edit("same", "same"), None);
        // "do|n|t" → "do|esn'|t": the shared «t» is kept.
        assert_eq!(
            minimal_edit("She dont like it", "She doesn't like it"),
            Some(TextEdit {
                start: 6,
                removed: 1,
                inserted: "esn'".to_string(),
            })
        );
        // Pure insertion and deletion.
        assert_eq!(
            minimal_edit("a b", "a, b"),
            Some(TextEdit {
                start: 1,
                removed: 0,
                inserted: ",".to_string(),
            })
        );
        assert_eq!(
            minimal_edit("the the cat", "the cat"),
            Some(TextEdit {
                start: 4,
                removed: 4,
                inserted: String::new(),
            })
        );
    }

    #[test]
    fn minimal_edit_counts_utf16_units() {
        // 😀 is two UTF-16 units; the edit after it starts at 3, not 2.
        assert_eq!(
            minimal_edit("😀 teh", "😀 the"),
            Some(TextEdit {
                start: 4,
                removed: 2,
                inserted: "he".to_string(),
            })
        );
    }

    #[test]
    fn minimal_edit_repeated_chars_do_not_overlap() {
        assert_eq!(
            minimal_edit("aaa", "aa"),
            Some(TextEdit {
                start: 2,
                removed: 1,
                inserted: String::new(),
            })
        );
    }

    #[test]
    fn selection_follows_edit() {
        // Replace 2 units at 6 with 5 units (net +3).
        let edit = TextEdit {
            start: 6,
            removed: 2,
            inserted: "esn't".to_string(),
        };
        // Caret at the end of the text (16) shifts by +3.
        assert_eq!(shift_selection(16, 0, &edit), (19, 0));
        // Caret before the edit stays.
        assert_eq!(shift_selection(3, 0, &edit), (3, 0));
        // Caret exactly at the edit start stays (insertion point before it).
        assert_eq!(shift_selection(6, 0, &edit), (6, 0));
        // Selection overlapping the edit collapses after the insertion.
        assert_eq!(shift_selection(5, 3, &edit), (11, 0));
        // Pure deletion of text before the caret.
        let deletion = TextEdit {
            start: 3,
            removed: 4,
            inserted: String::new(),
        };
        assert_eq!(shift_selection(11, 0, &deletion), (7, 0));
    }

    #[test]
    fn rebuild_keeps_surrounding_whitespace() {
        assert_eq!(
            rebuild_field_text(
                "  She dont like it\n",
                "She dont like it",
                "She doesn't like it"
            ),
            Some("  She doesn't like it\n".to_string())
        );
        assert_eq!(
            rebuild_field_text("She dont like it, no", "She dont like it", "x"),
            None
        );
    }

    // ── geometry ──

    const SCREEN: Rect = Rect {
        x: 0.0,
        y: 25.0,
        width: 1440.0,
        height: 850.0,
    };

    #[test]
    fn badge_sits_in_field_bottom_right_corner() {
        let field = Rect {
            x: 100.0,
            y: 500.0,
            width: 400.0,
            height: 80.0,
        };
        let badge = badge_frame(&field, 28.0, &SCREEN);
        assert_eq!(badge.x, 500.0 - 28.0 - BADGE_INSET);
        assert_eq!(badge.y, 580.0 - 28.0 - BADGE_INSET);
    }

    #[test]
    fn badge_for_huge_field_stays_on_screen() {
        let field = Rect {
            x: 0.0,
            y: 0.0,
            width: 3000.0,
            height: 5000.0,
        };
        let badge = badge_frame(&field, 28.0, &SCREEN);
        assert!(badge.right() <= SCREEN.right() - SCREEN_MARGIN);
        assert!(badge.bottom() <= SCREEN.bottom() - SCREEN_MARGIN);
    }

    #[test]
    fn panel_opens_below_or_above_badge() {
        let badge = Rect {
            x: 600.0,
            y: 100.0,
            width: 28.0,
            height: 28.0,
        };
        let panel = panel_frame(&badge, 380.0, 400.0, &SCREEN);
        assert_eq!(panel.y, badge.bottom() + BADGE_INSET);
        assert_eq!(panel.right(), badge.right());

        let low_badge = Rect { y: 800.0, ..badge };
        let panel = panel_frame(&low_badge, 380.0, 400.0, &SCREEN);
        assert_eq!(panel.bottom(), low_badge.y - BADGE_INSET);
    }

    #[test]
    fn panel_clamps_to_left_edge() {
        let badge = Rect {
            x: 10.0,
            y: 100.0,
            width: 28.0,
            height: 28.0,
        };
        let panel = panel_frame(&badge, 380.0, 400.0, &SCREEN);
        assert_eq!(panel.x, SCREEN.x + SCREEN_MARGIN);
    }

    #[test]
    fn rect_usability() {
        assert!(SCREEN.is_usable());
        assert!(!Rect {
            width: 0.0,
            ..SCREEN
        }
        .is_usable());
        assert!(!Rect {
            x: f64::NAN,
            ..SCREEN
        }
        .is_usable());
    }
}
