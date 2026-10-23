// ============================================================
// LEXORA — Underlines and hover card («Grammarly mode»)
// The writing-check window sends the open suggestions of the
// watched field. This module asks the OS layer where each flagged
// word is drawn, puts a transparent click-through window over the
// field (the webview paints red/yellow underlines in it) and
// shows a card under a word the pointer rests on.
//
// The platform layer (`platform`) measures words and moves
// windows; everything else — state, timing, payloads — is here
// and in `logic` (pure, unit-tested).
// ============================================================

use super::logic::{self, HoverState, HoverStep, Rect};
use super::{
    platform, MarkInput, MarkKind, MarkRect, MarkRegion, MarksPayload, SetMarksInput, CARD_EVENT,
    CARD_GAP, CARD_HEIGHT, CARD_LABEL, CARD_WIDTH, MARKS_EVENT, MARKS_LABEL, MARK_ACTION_EVENT,
};
use crate::error::AppError;
use std::sync::{LazyLock, Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// Underlines are re-measured this often (scrolling, resizing, moving).
const REFRESH_INTERVAL: Duration = Duration::from_millis(400);
/// How often the pointer is compared with the underlines.
const HOVER_POLL: Duration = Duration::from_millis(60);

/// The two overlay windows besides the badge/panel window.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Overlay {
    /// Transparent, click-through, as large as the watched field.
    Marks,
    /// Interactive card under an underlined word.
    Card,
}

impl Overlay {
    pub(super) fn label(self) -> &'static str {
        match self {
            Overlay::Marks => MARKS_LABEL,
            Overlay::Card => CARD_LABEL,
        }
    }

    /// Same page as the badge; the fragment picks what it renders.
    pub(super) fn url(self) -> &'static str {
        match self {
            Overlay::Marks => "grammar.html#marks",
            Overlay::Card => "grammar.html#card",
        }
    }
}

/// Where the flagged words are on screen, as measured by the OS layer.
pub(super) struct MarkGeometry {
    /// The watched field; the underline window covers it.
    pub field_bounds: Rect,
    /// Rectangles (screen px) of every word that could be measured.
    pub regions: Vec<(i64, Vec<Rect>)>,
}

struct Active {
    field_id: u64,
    /// The checked text the offsets refer to.
    text: String,
    marks: Vec<MarkInput>,
    regions: Vec<(i64, Vec<Rect>)>,
    frame: Option<Rect>,
    shown: bool,
    last_refresh: Instant,
    /// Start of the last measurement attempt, successful or not. Without
    /// input since then nothing moved, so it is only re-measured now and
    /// then (`logic::text_read_due`).
    measured_at: Option<Instant>,
}

#[derive(Default)]
struct Shared {
    /// Bumped on every set/clear: a slow measurement of an older state is dropped.
    version: u64,
    active: Option<Active>,
    payload: MarksPayload,
    card: Option<MarkInput>,
    hover: HoverState,
}

static SHARED: LazyLock<Mutex<Shared>> = LazyLock::new(|| Mutex::new(Shared::default()));
/// One measurement at a time (the watcher and an IPC call can both ask).
static REFRESH_LOCK: Mutex<()> = Mutex::new(());

fn lock() -> MutexGuard<'static, Shared> {
    SHARED
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

pub(super) fn last_payload() -> MarksPayload {
    lock().payload.clone()
}

pub(super) fn last_card() -> Option<MarkInput> {
    lock().card.clone()
}

fn emit_marks(app: &AppHandle, payload: &MarksPayload) {
    if let Err(e) = app.emit(MARKS_EVENT, payload) {
        log::debug!("Grammar marks event not delivered: {e}");
    }
}

fn emit_card(app: &AppHandle, card: Option<&MarkInput>) {
    if let Err(e) = app.emit(CARD_EVENT, card) {
        log::debug!("Grammar card event not delivered: {e}");
    }
}

/// Underline these suggestions (`None` or an empty list clears them).
/// Measuring talks to other apps, so call this off the async runtime.
pub(super) fn set(app: &AppHandle, input: Option<SetMarksInput>) -> Result<(), AppError> {
    let Some(input) = input.filter(|input| !input.marks.is_empty()) else {
        clear(app);
        return Ok(());
    };
    log::debug!(
        "Grammar marks set: field {} with {} suggestion(s)",
        input.field_id,
        input.marks.len()
    );
    {
        let mut shared = lock();
        shared.version += 1;
        shared.active = Some(Active {
            field_id: input.field_id,
            text: input.text,
            marks: input.marks,
            regions: Vec::new(),
            frame: None,
            shown: false,
            last_refresh: Instant::now(),
            measured_at: None,
        });
    }
    refresh(app);
    Ok(())
}

/// Remove the underlines and the card (typing, focus left, fix applied, …).
pub(super) fn clear(app: &AppHandle) {
    let had_any = {
        let mut shared = lock();
        shared.version += 1;
        let had_any = shared.active.take().is_some() || shared.card.is_some();
        shared.payload = MarksPayload::default();
        shared.card = None;
        shared.hover.reset();
        had_any
    };
    if had_any {
        platform::hide_overlay(app, Overlay::Marks);
        platform::hide_overlay(app, Overlay::Card);
        emit_marks(app, &MarksPayload::default());
        emit_card(app, None);
    }
}

/// Called by the watcher on every tick: re-measure when the last
/// measurement is old enough and the user did something since (scrolling,
/// resizing and moving the field all take input), or after an idle pause
/// (layout reflow without input, a result that arrived before the layout).
pub(super) fn refresh_if_due(app: &AppHandle) {
    let measured_at = {
        let shared = lock();
        match shared.active.as_ref() {
            Some(active) if active.last_refresh.elapsed() >= REFRESH_INTERVAL => active.measured_at,
            _ => return,
        }
    };
    let due = measured_at.is_none_or(|measured_at| {
        logic::text_read_due(platform::last_input(), measured_at, Instant::now())
    });
    if due {
        refresh(app);
    }
}

fn refresh(app: &AppHandle) {
    let _serial = REFRESH_LOCK
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let started = Instant::now();
    let (field_id, text, marks, version) = {
        let mut shared = lock();
        let version = shared.version;
        let Some(active) = shared.active.as_mut() else {
            return;
        };
        active.last_refresh = started;
        active.measured_at = Some(started);
        (
            active.field_id,
            active.text.clone(),
            active.marks.clone(),
            version,
        )
    };
    platform::prepare_thread();
    let measured = platform::mark_geometry(field_id, &text, &marks);
    match measured.as_ref() {
        None => log::debug!("Grammar marks: the field or its text could not be read"),
        Some(geometry) => log::debug!(
            "Grammar marks: measured {} of {} word(s)",
            geometry.regions.len(),
            marks.len()
        ),
    }
    let geometry =
        measured.filter(|geometry| geometry.regions.iter().any(|(_, rects)| !rects.is_empty()));
    match geometry {
        Some(geometry) => show_marks(app, version, geometry),
        None => hide_marks(app, version),
    }
}

fn show_marks(app: &AppHandle, version: u64, geometry: MarkGeometry) {
    // The window covers the visible part of the field only (a document
    // editor can be taller than the screen).
    let (center_x, center_y) = geometry.field_bounds.center();
    let screen = platform::screen_at(app, center_x, center_y);
    let scale = screen.map_or(1.0, |(_, scale)| scale);
    let frame = screen
        .and_then(|(visible, _)| geometry.field_bounds.intersect(&visible))
        .unwrap_or(geometry.field_bounds);
    let regions: Vec<(i64, Vec<Rect>)> = geometry
        .regions
        .into_iter()
        .filter_map(|(id, rects)| {
            let rects: Vec<Rect> = rects
                .iter()
                .filter_map(|rect| rect.intersect(&frame))
                .collect();
            (!rects.is_empty()).then_some((id, rects))
        })
        .collect();
    if regions.is_empty() {
        hide_marks(app, version);
        return;
    }
    let kinds: Vec<(i64, MarkKind)> = lock()
        .active
        .as_ref()
        .map(|active| {
            active
                .marks
                .iter()
                .map(|mark| (mark.id, mark.kind))
                .collect()
        })
        .unwrap_or_default();
    let payload = MarksPayload {
        regions: regions
            .iter()
            .filter_map(|(id, rects)| {
                let kind = kinds.iter().find(|(mark, _)| mark == id)?.1;
                Some(MarkRegion {
                    id: *id,
                    kind,
                    rects: rects
                        .iter()
                        .map(|rect| MarkRect {
                            x: (rect.x - frame.x) / scale,
                            y: (rect.y - frame.y) / scale,
                            width: rect.width / scale,
                            height: rect.height / scale,
                        })
                        .collect(),
                })
            })
            .collect(),
    };
    let unchanged = {
        let mut shared = lock();
        if shared.version != version {
            return;
        }
        let Some(active) = shared.active.as_mut() else {
            return;
        };
        let unchanged = active.shown && active.frame == Some(frame) && active.regions == regions;
        active.regions = regions;
        active.frame = Some(frame);
        active.shown = true;
        shared.payload = payload.clone();
        unchanged
    };
    if unchanged {
        return;
    }
    platform::show_overlay(app, Overlay::Marks, frame);
    emit_marks(app, &payload);
    // Cleared while the window was being shown (the user kept typing).
    if lock().version != version {
        platform::hide_overlay(app, Overlay::Marks);
        emit_marks(app, &MarksPayload::default());
    }
}

/// The words cannot be located now (text changed, field scrolled away):
/// keep the state, drop what is drawn.
fn hide_marks(app: &AppHandle, version: u64) {
    {
        let mut shared = lock();
        if shared.version != version {
            return;
        }
        let was_shown = match shared.active.as_mut() {
            Some(active) => {
                let was_shown = active.shown;
                active.shown = false;
                active.regions.clear();
                active.frame = None;
                was_shown
            }
            None => return,
        };
        if !was_shown {
            return;
        }
        shared.payload = MarksPayload::default();
        shared.card = None;
        shared.hover.reset();
    }
    platform::hide_overlay(app, Overlay::Marks);
    platform::hide_overlay(app, Overlay::Card);
    emit_marks(app, &MarksPayload::default());
    emit_card(app, None);
}

// ── Hover card ───────────────────────────────────────────

pub(super) fn spawn_hover(app: AppHandle) {
    let spawned = thread::Builder::new()
        .name("lexora-grammar-hover".to_string())
        .spawn(move || loop {
            thread::sleep(HOVER_POLL);
            hover_tick(&app);
        });
    if let Err(e) = spawned {
        log::warn!("Failed to start writing-check hover watcher: {e}");
    }
}

fn hover_tick(app: &AppHandle) {
    let idle = {
        let shared = lock();
        shared.active.is_none() && shared.card.is_none()
    };
    if idle {
        return;
    }
    let Some(cursor) = platform::cursor_position() else {
        return;
    };
    let step = {
        let mut shared = lock();
        let Shared { active, hover, .. } = &mut *shared;
        let regions = active
            .as_ref()
            .map_or(&[][..], |active| active.regions.as_slice());
        hover.step(regions, cursor, Instant::now())
    };
    match step {
        HoverStep::Nothing => {}
        HoverStep::Show { id, anchor } => show_card(app, id, anchor),
        HoverStep::Hide => hide_card(app),
    }
}

fn show_card(app: &AppHandle, id: i64, anchor: Rect) {
    let mark = lock()
        .active
        .as_ref()
        .and_then(|active| active.marks.iter().find(|mark| mark.id == id).cloned());
    let Some(mark) = mark else {
        return;
    };
    let (center_x, center_y) = anchor.center();
    let Some((visible, scale)) = platform::screen_at(app, center_x, center_y) else {
        return;
    };
    let frame = logic::card_frame(
        &anchor,
        CARD_WIDTH * scale,
        CARD_HEIGHT * scale,
        CARD_GAP * scale,
        &visible,
    );
    {
        let mut shared = lock();
        shared.card = Some(mark.clone());
        shared.hover.card_shown(id, frame);
    }
    platform::show_overlay(app, Overlay::Card, frame);
    emit_card(app, Some(&mark));
}

fn hide_card(app: &AppHandle) {
    {
        let mut shared = lock();
        shared.card = None;
        shared.hover.reset();
    }
    platform::hide_overlay(app, Overlay::Card);
    emit_card(app, None);
}

/// A button of the card: the writing-check window carries it out.
pub(super) fn card_action(app: &AppHandle, issue_id: i64, action: &str) -> Result<(), AppError> {
    if !matches!(action, "apply" | "dismiss" | "open") {
        return Err(AppError::Validation(format!(
            "Unknown card action '{action}'"
        )));
    }
    if let Err(e) = app.emit(
        MARK_ACTION_EVENT,
        serde_json::json!({ "issueId": issue_id, "action": action }),
    ) {
        log::debug!("Grammar card action not delivered: {e}");
    }
    hide_card(app);
    Ok(())
}
