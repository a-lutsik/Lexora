// ============================================================
// LEXORA — System-wide writing check: pure logic
// No OS calls here: what to check, when, and where the badge goes.
// The macOS layer feeds observations in and executes decisions.
// ============================================================

use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Typing pause after which the field text is sent for a check.
pub const SETTLE_DELAY: Duration = Duration::from_millis(700);
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
            if !self.pending {
                return Decision::Nothing;
            }
            // Only whitespace changed while the badge showed «stale»: hand
            // the same text over again so the shown result comes back.
            self.pending = false;
            self.badge_visible = true;
            return Decision::Check {
                field_id: self.field_id,
                text: trimmed.to_string(),
            };
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

// ── Polling cost ─────────────────────────────────────────
// Every read of another app's field is served on that app's UI thread
// (Outlook/Word freeze while typing when asked too often), so reads
// follow the user's input and slow apps are polled less.

/// Input this long before a read still triggers the next one: apps edit
/// the text right after a keystroke (autocorrect, auto-format, IME).
pub const INPUT_GRACE: Duration = Duration::from_millis(1000);
/// The watcher sleeps this many times as long as its last probe took.
pub const POLL_COST_FACTOR: u32 = 5;
/// Longest pause between two probes of a slow app.
pub const MAX_POLL_INTERVAL: Duration = Duration::from_secs(2);

/// Read the field (text, frame, underline positions) again? Only when the
/// user pressed a key, clicked or moved the pointer after `grace` before
/// the last read: nothing else changes another app's text or layout.
pub fn read_due(last_input: Instant, last_read: Instant, grace: Duration) -> bool {
    last_read
        .checked_duration_since(last_input)
        .is_none_or(|since_input| since_input < grace)
}

/// Without input the field text is still re-read this often: dictation
/// and other apps change it without a key or click of the user.
pub const IDLE_READ_INTERVAL: Duration = Duration::from_secs(3);

/// Read the field text again? After input (`read_due`), when the input time
/// is unknown, or when the last read is older than `IDLE_READ_INTERVAL`.
pub fn text_read_due(last_input: Option<Instant>, last_read: Instant, now: Instant) -> bool {
    last_input.is_none_or(|input| read_due(input, last_read, INPUT_GRACE))
        || now.duration_since(last_read) >= IDLE_READ_INTERVAL
}

/// Pause before the next probe when the last probe and tick took `spent`.
pub fn next_poll_interval(spent: Duration, base: Duration, max: Duration) -> Duration {
    spent
        .saturating_mul(POLL_COST_FACTOR)
        .max(base)
        .min(max.max(base))
}

/// The probe cost is logged at most this often.
pub const POLL_LOG_INTERVAL: Duration = Duration::from_secs(5);

/// Probe costs since the previous summary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PollSummary {
    pub probes: u32,
    /// Probes that read the field text (the rest reused the last read).
    pub reads: u32,
    pub slowest: Duration,
    pub last: Duration,
}

/// Collects probe costs for a rate-limited log line.
#[derive(Debug)]
pub struct PollStats {
    since: Instant,
    probes: u32,
    reads: u32,
    slowest: Duration,
}

impl PollStats {
    pub fn new(now: Instant) -> Self {
        Self {
            since: now,
            probes: 0,
            reads: 0,
            slowest: Duration::ZERO,
        }
    }

    /// Count one probe; once per `POLL_LOG_INTERVAL` returns the summary
    /// of the probes since the previous one.
    pub fn record(&mut self, spent: Duration, read: bool, now: Instant) -> Option<PollSummary> {
        self.probes = self.probes.saturating_add(1);
        if read {
            self.reads = self.reads.saturating_add(1);
        }
        self.slowest = self.slowest.max(spent);
        if now.duration_since(self.since) < POLL_LOG_INTERVAL {
            return None;
        }
        let summary = PollSummary {
            probes: self.probes,
            reads: self.reads,
            slowest: self.slowest,
            last: spent,
        };
        *self = Self::new(now);
        Some(summary)
    }
}

/// How many parent processes up a field may live below the app's window
/// process (WebView2: app → msedgewebview2 → renderer).
const MAX_PARENT_DEPTH: usize = 6;

/// Does the focused element (process `element_pid`) belong to the
/// foreground app: the same process or a descendant of it? `parents` maps a
/// process to its parent; `None` when the process snapshot failed — then
/// the answer is unknown (`None`), not «another app», unless the processes
/// are the same.
pub fn same_app_verdict(
    element_pid: u32,
    foreground_pid: u32,
    parents: Option<&HashMap<u32, u32>>,
) -> Option<bool> {
    if element_pid == foreground_pid {
        return Some(true);
    }
    let parents = parents?;
    let mut current = element_pid;
    for _ in 0..MAX_PARENT_DEPTH {
        match parents.get(&current) {
            Some(&parent) if parent == foreground_pid => return Some(true),
            Some(&parent) if parent != 0 && parent != current => current = parent,
            _ => return Some(false),
        }
    }
    Some(false)
}

/// A text range was asked to move `requested` characters and reported
/// `moved`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RangeMove {
    /// It is where it was asked to go: later words may walk on from it.
    Exact,
    /// The count differs but the text check may still accept the range;
    /// its position is not trusted for the next word.
    Unverified,
    /// A walk from the previous word lost its way: start over.
    Abort,
}

/// `strict` for a walk from the previous word; a fresh range from the
/// document start is judged by its text (some providers report an inexact
/// count but move correctly).
pub fn range_move_outcome(requested: i32, moved: i32, strict: bool) -> RangeMove {
    if moved == requested {
        RangeMove::Exact
    } else if strict {
        RangeMove::Abort
    } else {
        RangeMove::Unverified
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

/// Like `minimal_edit`, but when the replacement would start or end with
/// whitespace the span is widened to whole words. Rich editors (Teams,
/// browsers) turn edge spaces of an inserted fragment into non-breaking ones
/// or drop them, so « to » replacing «to» ends up glued again; a replacement
/// that begins and ends with a letter is inserted verbatim everywhere.
pub fn word_aligned_edit(old: &str, new: &str) -> Option<TextEdit> {
    let edit = minimal_edit(old, new)?;
    let edge_space = edit.inserted.chars().next().is_some_and(char::is_whitespace)
        || edit.inserted.chars().next_back().is_some_and(char::is_whitespace);
    if !edge_space {
        return Some(edit);
    }
    let old_chars: Vec<char> = old.chars().collect();
    let new_chars: Vec<char> = new.chars().collect();
    let utf16_len = |chars: &[char]| chars.iter().map(|c| c.len_utf16()).sum::<usize>();
    // Char index of the edit start / end in `old`.
    let mut units = 0usize;
    let mut start = 0usize;
    while start < old_chars.len() && units < edit.start {
        units += old_chars[start].len_utf16();
        start += 1;
    }
    let mut end = start;
    let mut removed = 0usize;
    while end < old_chars.len() && removed < edit.removed {
        removed += old_chars[end].len_utf16();
        end += 1;
    }
    let tail = old_chars.len() - end;
    let mut left = 0usize;
    while start - left > 0 && !old_chars[start - left - 1].is_whitespace() {
        left += 1;
    }
    let mut right = 0usize;
    while right < tail && !old_chars[end + right].is_whitespace() {
        right += 1;
    }
    // `new` shares the untouched prefix/suffix with `old`, so the same
    // widening applies to it.
    let new_start = start - left;
    let new_end = new_chars.len() - (tail - right);
    if new_start > new_end {
        return Some(edit);
    }
    Some(TextEdit {
        start: utf16_len(&old_chars[..start - left]),
        removed: utf16_len(&old_chars[start - left..end + right]),
        inserted: new_chars[new_start..new_end].iter().collect(),
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

    /// The point lies inside the rectangle grown by `slop` on every side.
    pub fn contains(&self, x: f64, y: f64, slop: f64) -> bool {
        x >= self.x - slop
            && x <= self.right() + slop
            && y >= self.y - slop
            && y <= self.bottom() + slop
    }

    /// Overlap with `other`, if any.
    pub fn intersect(&self, other: &Rect) -> Option<Rect> {
        let x = self.x.max(other.x);
        let y = self.y.max(other.y);
        let right = self.right().min(other.right());
        let bottom = self.bottom().min(other.bottom());
        let overlap = Rect {
            x,
            y,
            width: right - x,
            height: bottom - y,
        };
        overlap.is_usable().then_some(overlap)
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

// ── Underlines and the hover card ────────────────────────

/// The pointer may be this far (screen px) from an underlined word.
pub const MARK_HIT_SLOP: f64 = 2.0;
/// The pointer must rest on a word this long before the card appears.
pub const HOVER_DELAY: Duration = Duration::from_millis(250);
/// The card stays this long after the pointer left word and card.
pub const HIDE_DELAY: Duration = Duration::from_millis(450);
/// Gap between the underlined word and its card (logical px).
pub const CARD_GAP: f64 = 4.0;

/// UTF-16 length of the whitespace the field has before the checked text.
/// `None` when the field no longer holds `checked` (the user kept typing).
pub fn body_offset_utf16(current: &str, checked: &str) -> Option<usize> {
    if current.trim() != checked.trim() {
        return None;
    }
    let leading = &current[..current.len() - current.trim_start().len()];
    Some(leading.encode_utf16().count())
}

/// `text` between two UTF-16 offsets (`None` when out of range or inside a
/// surrogate pair).
pub fn utf16_slice(text: &str, start: usize, end: usize) -> Option<String> {
    if start > end {
        return None;
    }
    let units: Vec<u16> = text.encode_utf16().collect();
    let slice = units.get(start..end)?;
    String::from_utf16(slice).ok()
}

/// How many `\n` precede UTF-16 offset `start` — the shift when a control
/// counts every line break as two characters (`\r\n`).
pub fn newlines_before_utf16(text: &str, start: usize) -> usize {
    let mut seen = 0usize;
    let mut breaks = 0usize;
    for ch in text.chars() {
        if seen >= start {
            break;
        }
        seen += ch.len_utf16();
        if ch == '\n' {
            breaks += 1;
        }
    }
    breaks
}

/// The underlined word under the pointer: its id and the rectangle hit.
pub fn hit_mark(regions: &[(i64, Vec<Rect>)], x: f64, y: f64) -> Option<(i64, Rect)> {
    regions.iter().find_map(|(id, rects)| {
        rects
            .iter()
            .find(|rect| rect.contains(x, y, MARK_HIT_SLOP))
            .map(|rect| (*id, *rect))
    })
}

/// Hover card: left edge on the word, below it when there is room,
/// otherwise above, always inside the visible screen area.
pub fn card_frame(anchor: &Rect, width: f64, height: f64, gap: f64, visible: &Rect) -> Rect {
    let below = anchor.bottom() + gap;
    let y = if below + height <= visible.bottom() - SCREEN_MARGIN {
        below
    } else {
        anchor.y - gap - height
    };
    let (x, y) = clamp_into(anchor.x, y, width, height, visible);
    Rect {
        x,
        y,
        width,
        height,
    }
}

/// What the hover thread should do after looking at the pointer.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum HoverStep {
    Nothing,
    Show { id: i64, anchor: Rect },
    Hide,
}

/// Pointer-over-underline state: a short dwell opens the card, leaving
/// both the word and the card closes it after a grace period.
#[derive(Debug, Default)]
pub struct HoverState {
    pointed: Option<(i64, Instant)>,
    card: Option<i64>,
    card_frame: Option<Rect>,
    left_at: Option<Instant>,
}

impl HoverState {
    pub fn card_id(&self) -> Option<i64> {
        self.card
    }

    /// The card for `id` is now on screen at `frame`.
    pub fn card_shown(&mut self, id: i64, frame: Rect) {
        self.card = Some(id);
        self.card_frame = Some(frame);
        self.pointed = None;
        self.left_at = None;
    }

    pub fn reset(&mut self) {
        *self = Self::default();
    }

    pub fn step(
        &mut self,
        regions: &[(i64, Vec<Rect>)],
        cursor: (f64, f64),
        now: Instant,
    ) -> HoverStep {
        let (x, y) = cursor;
        let over_card = self
            .card_frame
            .is_some_and(|frame| frame.contains(x, y, MARK_HIT_SLOP));
        if over_card {
            self.left_at = None;
            self.pointed = None;
            return HoverStep::Nothing;
        }
        match hit_mark(regions, x, y) {
            Some((id, anchor)) => {
                self.left_at = None;
                if self.card == Some(id) {
                    self.pointed = None;
                    return HoverStep::Nothing;
                }
                match self.pointed {
                    Some((pointed, since)) if pointed == id => {
                        if now.duration_since(since) >= HOVER_DELAY {
                            self.pointed = None;
                            HoverStep::Show { id, anchor }
                        } else {
                            HoverStep::Nothing
                        }
                    }
                    _ => {
                        self.pointed = Some((id, now));
                        HoverStep::Nothing
                    }
                }
            }
            None => {
                self.pointed = None;
                if self.card.is_none() {
                    return HoverStep::Nothing;
                }
                let since = *self.left_at.get_or_insert(now);
                if now.duration_since(since) >= HIDE_DELAY {
                    self.card = None;
                    self.card_frame = None;
                    self.left_at = None;
                    HoverStep::Hide
                } else {
                    HoverStep::Nothing
                }
            }
        }
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
    fn whitespace_only_change_redraws_the_same_result() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        let t1 = t0 + SETTLE_DELAY;
        let field_id = state.field_id().expect("active");
        assert!(matches!(
            state.observe(obs(true, "She dont like it"), always, t1),
            Decision::Check { .. }
        ));
        let t2 = t1 + Duration::from_millis(10);
        assert_eq!(
            state.observe(obs(true, "She dont like it "), always, t2),
            Decision::Pending { field_id }
        );
        // The badge was marked stale: the same text is handed over again
        // (the result is cached, no new AI call) instead of spinning forever.
        assert_eq!(
            state.observe(obs(true, "She dont like it "), always, t2 + SETTLE_DELAY),
            Decision::Check {
                field_id,
                text: "She dont like it".to_string()
            }
        );
        // ...once.
        assert_eq!(
            state.observe(
                obs(true, "She dont like it "),
                always,
                t2 + SETTLE_DELAY * 2
            ),
            Decision::Nothing
        );
    }

    #[test]
    fn snoozed_badge_stays_hidden_after_whitespace_change() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let t1 = t0 + SETTLE_DELAY * 2;
        assert!(matches!(
            state.observe(obs(true, "She dont like it "), always, t1),
            Decision::Pending { .. }
        ));
        // Dismissed while stale: the same text does not bring the badge back.
        assert_eq!(state.snooze(), Decision::Hide);
        assert_eq!(
            state.observe(obs(true, "She dont like it "), always, t1 + SETTLE_DELAY),
            Decision::Nothing
        );
        // Hidden badge, whitespace-only edit: still nothing.
        let t2 = t1 + SETTLE_DELAY * 2;
        assert_eq!(
            state.observe(obs(true, "She dont like it"), always, t2),
            Decision::Nothing
        );
        assert_eq!(
            state.observe(obs(true, "She dont like it"), always, t2 + SETTLE_DELAY),
            Decision::Nothing
        );
    }

    #[test]
    fn rejected_text_is_not_handed_over_again() {
        let t0 = Instant::now();
        let mut state = WatchState::new(t0);
        state.observe(obs(false, "She dont like it"), always, t0);
        state.observe(obs(true, "She dont like it"), always, t0 + SETTLE_DELAY);
        let t1 = t0 + SETTLE_DELAY * 2;
        state.observe(obs(true, "ok"), never, t1);
        assert_eq!(
            state.observe(obs(true, "ok"), never, t1 + SETTLE_DELAY),
            Decision::Hide
        );
        let t2 = t1 + SETTLE_DELAY * 2;
        state.observe(obs(true, "ok "), never, t2);
        assert_eq!(
            state.observe(obs(true, "ok "), never, t2 + SETTLE_DELAY),
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

    // ── polling cost ──

    #[test]
    fn read_is_due_only_after_input_plus_grace() {
        let t0 = Instant::now();
        let grace = Duration::from_millis(1000);
        // Input after the last read: read again.
        assert!(read_due(t0 + Duration::from_millis(5), t0, grace));
        // Input shortly before the read: still inside the grace period
        // (autocorrect may rewrite the text right after a keystroke).
        assert!(read_due(t0, t0 + Duration::from_millis(999), grace));
        // The grace period ended before the read: nothing new to see.
        assert!(!read_due(t0, t0 + grace, grace));
        assert!(!read_due(t0, t0 + Duration::from_secs(30), grace));
        // Input exactly at the read.
        assert!(read_due(t0, t0, grace));
        // No grace: due only for input after the read.
        assert!(!read_due(t0, t0, Duration::ZERO));
        assert!(read_due(t0 + Duration::from_millis(1), t0, Duration::ZERO));
    }

    #[test]
    fn text_is_reread_after_input_or_when_the_read_is_old() {
        let t0 = Instant::now();
        let read = t0 + Duration::from_secs(10);
        // Input after the read: due.
        assert!(text_read_due(
            Some(read + Duration::from_millis(1)),
            read,
            read + Duration::from_millis(2)
        ));
        // Old input, recent read: not due.
        assert!(!text_read_due(
            Some(t0),
            read,
            read + Duration::from_secs(1)
        ));
        // Old input, but the read is older than the idle interval: due
        // (dictation and other apps change the text without input).
        assert!(text_read_due(Some(t0), read, read + IDLE_READ_INTERVAL));
        // Unknown input time: always due.
        assert!(text_read_due(None, read, read));
    }

    #[test]
    fn poll_interval_backs_off_for_slow_apps() {
        let base = Duration::from_millis(200);
        let max = Duration::from_secs(2);
        // Cheap probes keep the base rate.
        assert_eq!(next_poll_interval(Duration::ZERO, base, max), base);
        assert_eq!(
            next_poll_interval(Duration::from_millis(40), base, max),
            base
        );
        // Five times the probe cost in between.
        assert_eq!(
            next_poll_interval(Duration::from_millis(41), base, max),
            Duration::from_millis(205)
        );
        assert_eq!(
            next_poll_interval(Duration::from_millis(300), base, max),
            Duration::from_millis(1500)
        );
        // Capped.
        assert_eq!(
            next_poll_interval(Duration::from_millis(401), base, max),
            max
        );
        assert_eq!(next_poll_interval(Duration::MAX, base, max), max);
        // A cap below the base never shortens the base interval.
        assert_eq!(
            next_poll_interval(Duration::from_secs(5), base, Duration::from_millis(100)),
            base
        );
    }

    #[test]
    fn poll_stats_summarize_once_per_log_interval() {
        let t0 = Instant::now();
        let mut stats = PollStats::new(t0);
        let ms = Duration::from_millis;
        assert_eq!(stats.record(ms(30), true, t0 + ms(200)), None);
        assert_eq!(stats.record(ms(90), false, t0 + ms(400)), None);
        assert_eq!(
            stats.record(ms(10), false, t0 + POLL_LOG_INTERVAL),
            Some(PollSummary {
                probes: 3,
                reads: 1,
                slowest: ms(90),
                last: ms(10),
            })
        );
        // A new window starts after each summary.
        assert_eq!(
            stats.record(ms(5), true, t0 + POLL_LOG_INTERVAL + ms(200)),
            None
        );
        assert_eq!(
            stats.record(ms(7), true, t0 + POLL_LOG_INTERVAL * 2),
            Some(PollSummary {
                probes: 2,
                reads: 2,
                slowest: ms(7),
                last: ms(7),
            })
        );
    }

    #[test]
    fn same_app_verdict_needs_a_snapshot_only_for_other_processes() {
        // Same process: no snapshot needed.
        assert_eq!(same_app_verdict(7, 7, None), Some(true));
        // Another process and the snapshot failed: unknown, not «different».
        assert_eq!(same_app_verdict(9, 7, None), None);
        // WebView2: the field lives in a grandchild of the app process.
        let parents = HashMap::from([(9, 8), (8, 7), (7, 1), (5, 1)]);
        assert_eq!(same_app_verdict(9, 7, Some(&parents)), Some(true));
        assert_eq!(same_app_verdict(5, 7, Some(&parents)), Some(false));
        // Unknown process, or a parent cycle.
        assert_eq!(same_app_verdict(42, 7, Some(&parents)), Some(false));
        let cycle = HashMap::from([(3, 4), (4, 3)]);
        assert_eq!(same_app_verdict(3, 7, Some(&cycle)), Some(false));
    }

    #[test]
    fn range_move_outcome_is_strict_only_when_walking() {
        assert_eq!(range_move_outcome(12, 12, true), RangeMove::Exact);
        assert_eq!(range_move_outcome(12, 12, false), RangeMove::Exact);
        // A walk that moved a different count lost its position.
        assert_eq!(range_move_outcome(12, 11, true), RangeMove::Abort);
        // From the document start the text check decides; the position is
        // not trusted for the next word.
        assert_eq!(range_move_outcome(12, 11, false), RangeMove::Unverified);
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
    fn word_aligned_edit_avoids_edge_whitespace() {
        // «to» → « to »: widened to the whole glued word.
        assert_eq!(
            word_aligned_edit("I wanttocheck those", "I want to check those"),
            Some(TextEdit {
                start: 2,
                removed: 11,
                inserted: "want to check".to_string(),
            })
        );
        // No edge whitespace: identical to the minimal edit.
        assert_eq!(
            word_aligned_edit("She dont like it", "She doesn't like it"),
            minimal_edit("She dont like it", "She doesn't like it")
        );
        // A pure deletion has no inserted edge whitespace: left as is.
        assert_eq!(
            word_aligned_edit("the  cat", "the cat"),
            minimal_edit("the  cat", "the cat")
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

    // ── Underlines and the hover card ────────────────────

    fn rect(x: f64, y: f64, width: f64, height: f64) -> Rect {
        Rect {
            x,
            y,
            width,
            height,
        }
    }

    #[test]
    fn body_offset_counts_leading_whitespace_in_utf16_units() {
        assert_eq!(body_offset_utf16("  \nHi there", "Hi there"), Some(3));
        assert_eq!(body_offset_utf16("Hi there  ", "Hi there"), Some(0));
        assert_eq!(body_offset_utf16("Hi there", "Hi there!"), None);
    }

    #[test]
    fn utf16_slice_follows_javascript_offsets() {
        // 😀 is two UTF-16 units, like in a JavaScript string.
        let text = "a😀 dont";
        assert_eq!(utf16_slice(text, 4, 8).as_deref(), Some("dont"));
        assert_eq!(utf16_slice(text, 1, 3).as_deref(), Some("😀"));
        assert_eq!(utf16_slice(text, 2, 3), None);
        assert_eq!(utf16_slice(text, 4, 99), None);
        assert_eq!(utf16_slice(text, 5, 4), None);
    }

    #[test]
    fn newlines_before_counts_breaks_in_front_of_the_offset() {
        let text = "one\ntwo\nthree";
        assert_eq!(newlines_before_utf16(text, 0), 0);
        assert_eq!(newlines_before_utf16(text, 4), 1);
        assert_eq!(newlines_before_utf16(text, 9), 2);
    }

    #[test]
    fn rect_contains_and_intersect() {
        let word = rect(10.0, 10.0, 20.0, 10.0);
        assert!(word.contains(10.0, 10.0, 0.0));
        assert!(!word.contains(8.0, 15.0, 0.0));
        assert!(word.contains(8.0, 15.0, 2.0));

        let field = rect(0.0, 0.0, 25.0, 100.0);
        assert_eq!(word.intersect(&field), Some(rect(10.0, 10.0, 15.0, 10.0)));
        assert_eq!(word.intersect(&rect(50.0, 0.0, 10.0, 10.0)), None);
    }

    #[test]
    fn hit_mark_finds_the_word_under_the_pointer() {
        let regions = vec![
            (1, vec![rect(10.0, 10.0, 20.0, 10.0)]),
            (2, vec![rect(40.0, 10.0, 20.0, 10.0), rect(0.0, 30.0, 15.0, 10.0)]),
        ];
        assert_eq!(hit_mark(&regions, 15.0, 15.0), Some((1, rect(10.0, 10.0, 20.0, 10.0))));
        assert_eq!(hit_mark(&regions, 5.0, 35.0), Some((2, rect(0.0, 30.0, 15.0, 10.0))));
        assert_eq!(hit_mark(&regions, 33.0, 15.0), None);
    }

    #[test]
    fn card_opens_below_the_word_or_above_when_cramped() {
        let screen = rect(0.0, 0.0, 1000.0, 800.0);
        let word = rect(100.0, 100.0, 40.0, 20.0);
        let below = card_frame(&word, 340.0, 200.0, 4.0, &screen);
        assert_eq!((below.x, below.y), (100.0, 124.0));

        let low = rect(100.0, 700.0, 40.0, 20.0);
        let above = card_frame(&low, 340.0, 200.0, 4.0, &screen);
        assert_eq!(above.y, 700.0 - 4.0 - 200.0);

        let edge = rect(900.0, 100.0, 40.0, 20.0);
        let clamped = card_frame(&edge, 340.0, 200.0, 4.0, &screen);
        assert_eq!(clamped.x, 1000.0 - SCREEN_MARGIN - 340.0);
    }

    #[test]
    fn hover_opens_the_card_after_a_short_dwell() {
        let regions = vec![(1, vec![rect(10.0, 10.0, 20.0, 10.0)])];
        let start = Instant::now();
        let mut hover = HoverState::default();

        assert_eq!(hover.step(&regions, (15.0, 15.0), start), HoverStep::Nothing);
        let early = start + HOVER_DELAY / 2;
        assert_eq!(hover.step(&regions, (15.0, 15.0), early), HoverStep::Nothing);
        let late = start + HOVER_DELAY;
        assert_eq!(
            hover.step(&regions, (15.0, 15.0), late),
            HoverStep::Show { id: 1, anchor: rect(10.0, 10.0, 20.0, 10.0) }
        );
    }

    #[test]
    fn hover_restarts_the_dwell_when_the_pointer_moves_to_another_word() {
        let regions = vec![
            (1, vec![rect(10.0, 10.0, 20.0, 10.0)]),
            (2, vec![rect(40.0, 10.0, 20.0, 10.0)]),
        ];
        let start = Instant::now();
        let mut hover = HoverState::default();
        hover.step(&regions, (15.0, 15.0), start);
        let moved = start + HOVER_DELAY;
        assert_eq!(hover.step(&regions, (45.0, 15.0), moved), HoverStep::Nothing);
        assert_eq!(
            hover.step(&regions, (45.0, 15.0), moved + HOVER_DELAY),
            HoverStep::Show { id: 2, anchor: rect(40.0, 10.0, 20.0, 10.0) }
        );
    }

    #[test]
    fn hover_closes_the_card_only_after_the_grace_period() {
        let regions = vec![(1, vec![rect(10.0, 10.0, 20.0, 10.0)])];
        let card = rect(10.0, 30.0, 100.0, 60.0);
        let start = Instant::now();
        let mut hover = HoverState::default();
        hover.card_shown(1, card);

        // Over the card: stays open however long.
        assert_eq!(hover.step(&regions, (50.0, 50.0), start), HoverStep::Nothing);
        assert_eq!(
            hover.step(&regions, (50.0, 50.0), start + HIDE_DELAY * 4),
            HoverStep::Nothing
        );

        // Left both: closes after the grace period.
        let left = start + HIDE_DELAY * 5;
        assert_eq!(hover.step(&regions, (500.0, 500.0), left), HoverStep::Nothing);
        assert_eq!(
            hover.step(&regions, (500.0, 500.0), left + HIDE_DELAY / 2),
            HoverStep::Nothing
        );
        assert_eq!(
            hover.step(&regions, (500.0, 500.0), left + HIDE_DELAY),
            HoverStep::Hide
        );
        assert_eq!(hover.card_id(), None);
    }

    #[test]
    fn hover_keeps_the_card_when_the_pointer_returns_to_the_word() {
        let regions = vec![(1, vec![rect(10.0, 10.0, 20.0, 10.0)])];
        let start = Instant::now();
        let mut hover = HoverState::default();
        hover.card_shown(1, rect(10.0, 30.0, 100.0, 60.0));
        hover.step(&regions, (500.0, 500.0), start);
        assert_eq!(
            hover.step(&regions, (15.0, 15.0), start + HIDE_DELAY / 2),
            HoverStep::Nothing
        );
        // The grace timer restarted: still open long after the first exit.
        assert_eq!(
            hover.step(&regions, (15.0, 15.0), start + HIDE_DELAY * 3),
            HoverStep::Nothing
        );
        assert_eq!(hover.card_id(), Some(1));
    }
}
