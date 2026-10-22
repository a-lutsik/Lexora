// ============================================================
// LEXORA — System-wide writing check: macOS layer
// Polls the focused UI element through the Accessibility API,
// runs the pure state machine (`logic.rs`), places the badge
// window and writes fixes back into the field.
// ============================================================

use super::logic::{self, Decision, Observation, Rect, TextEdit, WatchState};
use super::marks::{self, MarkGeometry, Overlay};
use super::{
    clear_marks, config_snapshot, publish, refresh_language, report, ActivityCode, FieldPayload,
    MarkInput, WatchConfig, BADGE_SIZE, GRAMMAR_LABEL, PANEL_EVENT, PANEL_HEIGHT, PANEL_WIDTH,
};
use crate::display::{pick_bounds_for_point, LogicalBounds};
use crate::error::AppError;
use core_foundation::array::{CFArray, CFArrayRef};
use core_foundation::base::{CFGetTypeID, CFRelease, CFRetain, CFType, CFTypeRef, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::number::CFNumber;
use core_foundation::string::{CFString, CFStringRef};
use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, KeyCode};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use objc2::rc::Retained;
use objc2::MainThreadMarker;
use objc2_app_kit::{
    NSColor, NSPasteboard, NSPasteboardTypeString, NSPopUpMenuWindowLevel, NSRunningApplication,
    NSScreen, NSView, NSWindow, NSWindowCollectionBehavior,
};
use objc2_foundation::{NSPoint, NSRect, NSSize, NSString};
use objc2_quartz_core::kCACornerCurveContinuous;
use std::collections::{HashMap, HashSet};
use std::ffi::c_void;
use std::ptr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant};
use tauri::window::Color;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// Focused-field poll while the feature is on.
const POLL_INTERVAL: Duration = Duration::from_millis(350);
/// Poll while the feature is off or Accessibility is not granted.
const IDLE_INTERVAL: Duration = Duration::from_secs(1);
const LANGUAGE_REFRESH: Duration = Duration::from_secs(10);
/// Per-call Accessibility timeout: a hung app must not stall the watcher.
const AX_TIMEOUT_SECS: f32 = 0.25;
/// How long to wait for the app to report the new field value.
const VALUE_SETTLE_TIMEOUT: Duration = Duration::from_millis(400);
const VALUE_SETTLE_STEP: Duration = Duration::from_millis(30);
const FOCUS_RETURN_DELAY: Duration = Duration::from_millis(120);
const PASTE_SETTLE: Duration = Duration::from_millis(150);
/// Move the badge only when the field moved noticeably (points).
const FOLLOW_THRESHOLD: f64 = 1.0;
/// Matches `--radius-lg` in `src/styles/tokens.css`.
const PANEL_CORNER_RADIUS: f64 = 16.0;
const APP_CACHE_LIMIT: usize = 64;
/// A range taller than this many first-character heights spans several lines.
const WRAP_HEIGHT_FACTOR: f64 = 1.5;

const ATTR_FOCUSED_APP: &str = "AXFocusedApplication";
const ATTR_FOCUSED_UI: &str = "AXFocusedUIElement";
const ATTR_ROLE: &str = "AXRole";
const ATTR_SUBROLE: &str = "AXSubrole";
const ATTR_VALUE: &str = "AXValue";
const ATTR_CHAR_COUNT: &str = "AXNumberOfCharacters";
const ATTR_SELECTED_TEXT: &str = "AXSelectedText";
const ATTR_SELECTED_RANGE: &str = "AXSelectedTextRange";
const ATTR_POSITION: &str = "AXPosition";
const ATTR_SIZE: &str = "AXSize";
const ATTR_WINDOW: &str = "AXWindow";
const ATTR_BOUNDS_FOR_RANGE: &str = "AXBoundsForRange";
const ATTR_STRING_FOR_RANGE: &str = "AXStringForRange";
const ATTR_CHILDREN: &str = "AXChildren";
const ROLE_STATIC_TEXT: &str = "AXStaticText";
/// How many text nodes and how deep the search below a field goes.
const MAX_TEXT_NODES: usize = 400;
const MAX_NODE_DEPTH: usize = 6;
/// A flagged word is at most this tall (points); taller is not a word.
const MAX_WORD_HEIGHT: f64 = 120.0;
/// Tolerance when checking that a word lies inside its field (points).
const RECT_SLACK: f64 = 6.0;
/// Chromium/Electron build their accessibility tree only on request.
const ATTR_MANUAL_ACCESSIBILITY: &str = "AXManualAccessibility";
/// Chrome and other Chromium browsers react to this one (VoiceOver-style hint).
const ATTR_ENHANCED_UI: &str = "AXEnhancedUserInterface";

// ── Accessibility FFI ────────────────────────────────────

type AXUIElementRef = CFTypeRef;
type AXError = i32;
const AX_ERROR_SUCCESS: AXError = 0;
const AX_VALUE_CGPOINT: u32 = 1;
const AX_VALUE_CGSIZE: u32 = 2;
const AX_VALUE_CGRECT: u32 = 3;
const AX_VALUE_CFRANGE: u32 = 4;

#[repr(C)]
#[derive(Default)]
struct RawPoint {
    x: f64,
    y: f64,
}

#[repr(C)]
#[derive(Default)]
struct RawSize {
    width: f64,
    height: f64,
}

#[repr(C)]
#[derive(Default)]
struct RawRect {
    origin: RawPoint,
    size: RawSize,
}

#[repr(C)]
#[derive(Default)]
struct RawRange {
    location: isize,
    length: isize,
}

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXUIElementCreateSystemWide() -> AXUIElementRef;
    fn AXUIElementCreateApplication(pid: i32) -> AXUIElementRef;
    fn AXUIElementCopyAttributeValue(
        element: AXUIElementRef,
        attribute: CFStringRef,
        value: *mut CFTypeRef,
    ) -> AXError;
    fn AXUIElementCopyParameterizedAttributeValue(
        element: AXUIElementRef,
        attribute: CFStringRef,
        parameter: CFTypeRef,
        value: *mut CFTypeRef,
    ) -> AXError;
    fn AXUIElementSetAttributeValue(
        element: AXUIElementRef,
        attribute: CFStringRef,
        value: CFTypeRef,
    ) -> AXError;
    fn AXUIElementGetPid(element: AXUIElementRef, pid: *mut i32) -> AXError;
    fn AXUIElementSetMessagingTimeout(element: AXUIElementRef, timeout_in_seconds: f32) -> AXError;
    fn AXValueCreate(the_type: u32, value_ptr: *const c_void) -> CFTypeRef;
    fn AXValueGetValue(value: CFTypeRef, the_type: u32, value_ptr: *mut c_void) -> u8;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFEqual(a: CFTypeRef, b: CFTypeRef) -> u8;
}

/// Owned AXUIElement. AX elements are immutable CF objects: retain/release
/// and AX calls are safe from any thread.
struct AxElement(AXUIElementRef);

// SAFETY: see above — the wrapped CF object is thread-safe and only
// accessed through retain/release and AX API calls.
unsafe impl Send for AxElement {}
unsafe impl Sync for AxElement {}

impl AxElement {
    /// Take ownership of a +1 reference (Create/Copy rule).
    fn from_owned(raw: AXUIElementRef) -> Option<Self> {
        (!raw.is_null()).then_some(Self(raw))
    }

    fn system_wide() -> Option<Self> {
        let element = Self::from_owned(unsafe { AXUIElementCreateSystemWide() })?;
        // On the system-wide element this sets the default for every element.
        let _ = unsafe { AXUIElementSetMessagingTimeout(element.0, AX_TIMEOUT_SECS) };
        Some(element)
    }

    fn application(pid: i32) -> Option<Self> {
        Self::from_owned(unsafe { AXUIElementCreateApplication(pid) })
    }

    fn same_as(&self, other: &AxElement) -> bool {
        unsafe { CFEqual(self.0, other.0) != 0 }
    }

    fn pid(&self) -> Option<i32> {
        let mut pid = 0_i32;
        let err = unsafe { AXUIElementGetPid(self.0, &mut pid) };
        (err == AX_ERROR_SUCCESS && pid > 0).then_some(pid)
    }

    fn copy_raw(&self, attr: &str) -> Option<CFTypeRef> {
        let name = CFString::new(attr);
        let mut value: CFTypeRef = ptr::null();
        let err = unsafe {
            AXUIElementCopyAttributeValue(self.0, name.as_concrete_TypeRef(), &mut value)
        };
        if err != AX_ERROR_SUCCESS || value.is_null() {
            return None;
        }
        Some(value)
    }

    fn copy_element(&self, attr: &str) -> Option<AxElement> {
        AxElement::from_owned(self.copy_raw(attr)?)
    }

    /// Field text; non-breaking spaces (browser editors insert them) count as
    /// plain spaces so they never make the field look changed.
    fn field_value(&self) -> Option<String> {
        self.copy_string(ATTR_VALUE)
            .map(|value| value.replace('\u{a0}', " "))
    }

    fn copy_string(&self, attr: &str) -> Option<String> {
        let value = self.copy_raw(attr)?;
        if unsafe { CFGetTypeID(value) } != CFString::type_id() {
            unsafe { CFRelease(value) };
            return None;
        }
        let string = unsafe { CFString::wrap_under_create_rule(value as CFStringRef) };
        Some(string.to_string())
    }

    fn copy_i64(&self, attr: &str) -> Option<i64> {
        let value = self.copy_raw(attr)?;
        if unsafe { CFGetTypeID(value) } != CFNumber::type_id() {
            unsafe { CFRelease(value) };
            return None;
        }
        let number = unsafe { CFNumber::wrap_under_create_rule(value as _) };
        number.to_i64()
    }

    fn copy_ax_value<T: Default>(&self, attr: &str, kind: u32) -> Option<T> {
        let value = self.copy_raw(attr)?;
        let mut out = T::default();
        let ok = unsafe { AXValueGetValue(value, kind, (&mut out as *mut T).cast()) } != 0;
        unsafe { CFRelease(value) };
        ok.then_some(out)
    }

    fn set_raw(&self, attr: &str, value: CFTypeRef) -> bool {
        let name = CFString::new(attr);
        let err =
            unsafe { AXUIElementSetAttributeValue(self.0, name.as_concrete_TypeRef(), value) };
        err == AX_ERROR_SUCCESS
    }

    fn set_string(&self, attr: &str, text: &str) -> bool {
        let value = CFString::new(text);
        self.set_raw(attr, value.as_CFTypeRef())
    }

    fn set_range(&self, location: usize, length: usize) -> bool {
        let (Ok(location), Ok(length)) = (isize::try_from(location), isize::try_from(length))
        else {
            return false;
        };
        let range = RawRange { location, length };
        let value = unsafe { AXValueCreate(AX_VALUE_CFRANGE, (&range as *const RawRange).cast()) };
        if value.is_null() {
            return false;
        }
        let ok = self.set_raw(ATTR_SELECTED_RANGE, value);
        unsafe { CFRelease(value) };
        ok
    }

    /// Answer of a parameterized attribute for the character range
    /// `[location, location + length)` (UTF-16 units). Caller releases.
    fn copy_for_range(&self, attr: &str, location: usize, length: usize) -> Option<CFTypeRef> {
        let range = RawRange {
            location: isize::try_from(location).ok()?,
            length: isize::try_from(length).ok()?,
        };
        let param = unsafe { AXValueCreate(AX_VALUE_CFRANGE, (&range as *const RawRange).cast()) };
        if param.is_null() {
            return None;
        }
        let name = CFString::new(attr);
        let mut value: CFTypeRef = ptr::null();
        let err = unsafe {
            AXUIElementCopyParameterizedAttributeValue(
                self.0,
                name.as_concrete_TypeRef(),
                param,
                &mut value,
            )
        };
        unsafe { CFRelease(param) };
        if err != AX_ERROR_SUCCESS || value.is_null() {
            log_once(&format!("{attr} for {location}+{length} failed (AXError {err})"));
            return None;
        }
        Some(value)
    }

    /// Screen rectangle (points, origin top-left) the app draws the range in.
    /// `None` unless the range holds exactly `expected`: apps that count
    /// characters differently would otherwise underline the wrong word.
    fn range_rect(&self, location: usize, length: usize, expected: &str) -> Option<Rect> {
        let covered = self.copy_for_range(ATTR_STRING_FOR_RANGE, location, length)?;
        if unsafe { CFGetTypeID(covered) } != CFString::type_id() {
            unsafe { CFRelease(covered) };
            log_once("AXStringForRange is not a string");
            return None;
        }
        let covered = unsafe { CFString::wrap_under_create_rule(covered as CFStringRef) }
            .to_string()
            .replace('\u{a0}', " ");
        if covered != expected {
            log_once(&format!(
                "range {location}+{length} holds {covered:?}, expected {expected:?}"
            ));
            return None;
        }
        let value = self.copy_for_range(ATTR_BOUNDS_FOR_RANGE, location, length)?;
        let mut raw = RawRect::default();
        let ok =
            unsafe { AXValueGetValue(value, AX_VALUE_CGRECT, (&mut raw as *mut RawRect).cast()) }
                != 0;
        unsafe { CFRelease(value) };
        let rect = Rect {
            x: raw.origin.x,
            y: raw.origin.y,
            width: raw.size.width,
            height: raw.size.height,
        };
        if !(ok && rect.is_usable()) {
            log_once(&format!("AXBoundsForRange {location}+{length} gave unusable {rect:?}"));
            return None;
        }
        Some(rect)
    }

    /// Rectangles of a flagged fragment, one per line. The app answers with
    /// a single bounding box; when it is taller than one line the fragment
    /// wraps, so it is measured word by word instead.
    fn fragment_rects(&self, location: usize, fragment: &str) -> Vec<Rect> {
        let length = fragment.encode_utf16().count();
        let Some(whole) = self.range_rect(location, length, fragment) else {
            return self.char_rects(location, fragment);
        };
        let first_char_len = fragment.chars().next().map_or(0, char::len_utf16);
        let first = fragment
            .chars()
            .next()
            .and_then(|ch| self.range_rect(location, first_char_len, &ch.to_string()));
        let one_line = first.is_none_or(|first| whole.height <= first.height * WRAP_HEIGHT_FACTOR);
        if one_line {
            return vec![whole];
        }
        let mut rects = Vec::new();
        let mut offset = location;
        for piece in fragment.split_inclusive(char::is_whitespace) {
            let units = piece.encode_utf16().count();
            let word = piece.trim_end();
            let word_units = word.encode_utf16().count();
            if word_units > 0 {
                if let Some(rect) = self.range_rect(offset, word_units, word) {
                    rects.push(rect);
                }
            }
            offset += units;
        }
        rects
    }

    fn children(&self) -> Vec<AxElement> {
        let Some(raw) = self.copy_raw(ATTR_CHILDREN) else {
            return Vec::new();
        };
        if unsafe { CFGetTypeID(raw) } != CFArray::<CFType>::type_id() {
            unsafe { CFRelease(raw) };
            return Vec::new();
        }
        let array = unsafe { CFArray::<CFType>::wrap_under_create_rule(raw as CFArrayRef) };
        array
            .iter()
            .filter_map(|item| {
                let raw = item.as_CFTypeRef();
                unsafe { CFRetain(raw) };
                AxElement::from_owned(raw)
            })
            .collect()
    }

    /// The text nodes below the element, in document order. Chromium draws
    /// the words of a rich-text field there and knows their geometry even when
    /// the field itself answers an empty range rectangle.
    fn collect_text_nodes(&self, depth: usize, out: &mut Vec<AxElement>) {
        for child in self.children() {
            if out.len() >= MAX_TEXT_NODES {
                return;
            }
            if child.copy_string(ATTR_ROLE).as_deref() == Some(ROLE_STATIC_TEXT) {
                out.push(child);
            } else if depth > 0 {
                child.collect_text_nodes(depth - 1, out);
            }
        }
    }

    /// Where each text node starts inside the field value (UTF-16).
    fn text_runs(&self, field_text: &str) -> Vec<TextRun> {
        let mut nodes = Vec::new();
        self.collect_text_nodes(MAX_NODE_DEPTH, &mut nodes);
        let mut runs = Vec::new();
        let mut cursor = 0;
        for element in nodes {
            let Some(text) = element.field_value().filter(|text| !text.is_empty()) else {
                continue;
            };
            let Some(found) = field_text.get(cursor..).and_then(|rest| rest.find(&text)) else {
                continue;
            };
            let at = cursor + found;
            runs.push(TextRun {
                element,
                start: field_text[..at].encode_utf16().count(),
                len: text.encode_utf16().count(),
                text: text.clone(),
            });
            cursor = at + text.len();
        }
        runs
    }

    /// Fallback for apps (Chromium: Teams, Outlook) that answer a multi-character
    /// range with an empty rectangle: measure character by character and merge
    /// the neighbours that sit on one line.
    fn char_rects(&self, location: usize, fragment: &str) -> Vec<Rect> {
        let mut rects: Vec<Rect> = Vec::new();
        let mut offset = location;
        for (index, ch) in fragment.chars().enumerate() {
            let units = ch.len_utf16();
            if !ch.is_whitespace() {
                match self.range_rect(offset, units, &ch.to_string()) {
                    Some(rect) => match rects.last_mut() {
                        Some(last) if same_line(last, &rect) => *last = union(last, &rect),
                        _ => rects.push(rect),
                    },
                    // Nothing measurable at the start: do not probe the rest.
                    None if index == 0 => return Vec::new(),
                    None => {}
                }
            }
            offset += units;
        }
        rects
    }

    fn selected_range(&self) -> Option<(usize, usize)> {
        let range: RawRange = self.copy_ax_value(ATTR_SELECTED_RANGE, AX_VALUE_CFRANGE)?;
        Some((
            usize::try_from(range.location).ok()?,
            usize::try_from(range.length).ok()?,
        ))
    }

    fn frame(&self) -> Option<Rect> {
        let origin: RawPoint = self.copy_ax_value(ATTR_POSITION, AX_VALUE_CGPOINT)?;
        let size: RawSize = self.copy_ax_value(ATTR_SIZE, AX_VALUE_CGSIZE)?;
        let rect = Rect {
            x: origin.x,
            y: origin.y,
            width: size.width,
            height: size.height,
        };
        rect.is_usable().then_some(rect)
    }

    /// Field frame; some web views report none — use the window then.
    fn bounds(&self) -> Option<Rect> {
        self.frame().or_else(|| {
            self.copy_element(ATTR_WINDOW)
                .and_then(|window| window.frame())
        })
    }
}

/// The text-node dump is logged once per run, not on every refresh.
static CAPABILITIES_LOGGED: AtomicBool = AtomicBool::new(false);
/// The last message of `log_once`: measuring repeats every 400 ms, the log must not.
static LAST_LOGGED: Mutex<String> = Mutex::new(String::new());

fn log_once(message: &str) {
    let mut last = LAST_LOGGED.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if last.as_str() != message {
        log::debug!("Grammar marks: {message}");
        *last = message.to_string();
    }
}

/// A text node of a rich-text field and the part of the field value it holds.
struct TextRun {
    element: AxElement,
    /// UTF-16 offset of the node text inside the field value.
    start: usize,
    len: usize,
    text: String,
}

/// Rectangles of `[location, location + fragment)` measured on the text nodes.
fn run_rects(runs: &[TextRun], location: usize, fragment: &str) -> Vec<Rect> {
    let end = location + fragment.encode_utf16().count();
    let mut rects = Vec::new();
    for run in runs {
        let from = location.max(run.start);
        let to = end.min(run.start + run.len);
        if from >= to {
            continue;
        }
        let Some(piece) = logic::utf16_slice(&run.text, from - run.start, to - run.start) else {
            continue;
        };
        rects.extend(run.element.fragment_rects(from - run.start, &piece));
    }
    rects
}

/// A word is never taller than a couple of lines: a bigger rectangle is the
/// app's answer for "the whole control", not for the word.
fn is_word_rect(rect: &Rect, field: &Rect) -> bool {
    rect.height <= MAX_WORD_HEIGHT
        && rect.x >= field.x - RECT_SLACK
        && rect.y >= field.y - RECT_SLACK
        && rect.right() <= field.right() + RECT_SLACK
        && rect.bottom() <= field.bottom() + RECT_SLACK
}

/// Both rectangles hold the same text line (they overlap mostly vertically).
fn same_line(a: &Rect, b: &Rect) -> bool {
    let overlap = a.bottom().min(b.bottom()) - a.y.max(b.y);
    overlap >= a.height.min(b.height) * 0.5
}

fn union(a: &Rect, b: &Rect) -> Rect {
    let x = a.x.min(b.x);
    let y = a.y.min(b.y);
    Rect {
        x,
        y,
        width: a.right().max(b.right()) - x,
        height: a.bottom().max(b.bottom()) - y,
    }
}

impl Clone for AxElement {
    fn clone(&self) -> Self {
        unsafe { CFRetain(self.0) };
        Self(self.0)
    }
}

impl Drop for AxElement {
    fn drop(&mut self) {
        unsafe { CFRelease(self.0) };
    }
}

// ── Focused field probe ──────────────────────────────────

#[derive(Debug, Clone, Default)]
struct AppInfo {
    bundle_id: Option<String>,
    name: Option<String>,
}

/// Bundle id / name per pid, and which apps were asked for their AX tree.
#[derive(Default)]
struct AppCache {
    apps: HashMap<i32, AppInfo>,
    ax_enabled: HashSet<i32>,
}

impl AppCache {
    /// Electron apps build their accessibility tree only when asked. Done
    /// once per process and never for excluded apps (it costs them CPU).
    /// Native apps ignore the unknown attribute.
    fn enable_accessibility(&mut self, app_element: &AxElement, pid: i32) {
        if self.ax_enabled.len() >= APP_CACHE_LIMIT {
            self.ax_enabled.clear();
        }
        if self.ax_enabled.insert(pid) {
            let _ = app_element.set_raw(
                ATTR_MANUAL_ACCESSIBILITY,
                CFBoolean::true_value().as_CFTypeRef(),
            );
            let _ = app_element.set_raw(ATTR_ENHANCED_UI, CFBoolean::true_value().as_CFTypeRef());
        }
    }

    /// The app exposed no focused element: its tree may not have been built
    /// yet, so ask again on the next tick.
    fn retry_accessibility(&mut self, pid: i32) {
        self.ax_enabled.remove(&pid);
    }

    fn info(&mut self, pid: i32) -> AppInfo {
        if let Some(info) = self.apps.get(&pid) {
            return info.clone();
        }
        if self.apps.len() >= APP_CACHE_LIMIT {
            self.apps.clear();
        }
        let info = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
            .map(|app| AppInfo {
                bundle_id: app.bundleIdentifier().map(|id| id.to_string()),
                name: app.localizedName().map(|name| name.to_string()),
            })
            .unwrap_or_default();
        self.apps.insert(pid, info.clone());
        info
    }
}

struct FieldSnapshot {
    element: AxElement,
    pid: i32,
    app: AppInfo,
    text: String,
}

/// Why there is no eligible field — reported to the Settings status line.
struct Skipped {
    code: ActivityCode,
    app: Option<AppInfo>,
    detail: Option<String>,
}

impl Skipped {
    fn probe(code: ActivityCode, app: Option<&AppInfo>, detail: Option<String>) -> Probe {
        Probe::Nothing(Skipped {
            code,
            app: app.cloned(),
            detail,
        })
    }
}

enum Probe {
    /// Lexora itself is focused (the badge/panel was clicked) — keep state.
    OwnApp,
    /// No eligible field.
    Nothing(Skipped),
    Field(FieldSnapshot),
}

fn probe(system: &AxElement, own_pid: i32, config: &WatchConfig, cache: &mut AppCache) -> Probe {
    let Some(app_element) = system.copy_element(ATTR_FOCUSED_APP) else {
        return Skipped::probe(ActivityCode::NoField, None, None);
    };
    let Some(pid) = app_element.pid() else {
        return Skipped::probe(ActivityCode::NoField, None, None);
    };
    if pid == own_pid {
        return Probe::OwnApp;
    }
    let app = cache.info(pid);
    if logic::is_app_excluded(app.bundle_id.as_deref(), &config.excluded_apps) {
        return Skipped::probe(ActivityCode::ExcludedApp, Some(&app), app.bundle_id.clone());
    }
    cache.enable_accessibility(&app_element, pid);
    let Some(element) = app_element.copy_element(ATTR_FOCUSED_UI) else {
        cache.retry_accessibility(pid);
        return Skipped::probe(ActivityCode::NoField, Some(&app), None);
    };
    let role = element.copy_string(ATTR_ROLE);
    let subrole = element.copy_string(ATTR_SUBROLE);
    // Role first: the value of a password field is never read.
    if !logic::is_checkable_role(role.as_deref(), subrole.as_deref()) {
        let detail = match (role, subrole) {
            (Some(role), Some(subrole)) => Some(format!("{role} / {subrole}")),
            (role, None) => role,
            (None, subrole) => subrole,
        };
        return Skipped::probe(ActivityCode::UnsupportedField, Some(&app), detail);
    }
    let max_chars = i64::try_from(logic::MAX_CHECK_CHARS).unwrap_or(i64::MAX);
    if element
        .copy_i64(ATTR_CHAR_COUNT)
        .is_some_and(|count| count > max_chars)
    {
        return Skipped::probe(ActivityCode::FieldTooLong, Some(&app), None);
    }
    let Some(text) = element.field_value() else {
        return Skipped::probe(
            ActivityCode::UnsupportedField,
            Some(&app),
            Some("no text value".to_string()),
        );
    };
    Probe::Field(FieldSnapshot {
        element,
        pid,
        app,
        text,
    })
}

// ── Watcher state ────────────────────────────────────────

struct TrackedField {
    element: AxElement,
    pid: i32,
    app: AppInfo,
}

struct Watcher {
    state: WatchState,
    field: Option<TrackedField>,
    /// Field frame the badge was last placed against.
    placed_for: Option<Rect>,
    visible: bool,
    panel_open: bool,
    /// A fix is being written: ticks must not read the half-updated field.
    writing: bool,
}

impl Watcher {
    fn new(now: Instant) -> Self {
        Self {
            state: WatchState::new(now),
            field: None,
            placed_for: None,
            visible: false,
            panel_open: false,
            writing: false,
        }
    }
}

static WATCHER: Mutex<Option<Watcher>> = Mutex::new(None);

fn lock_watcher() -> MutexGuard<'static, Option<Watcher>> {
    // A panic while holding the lock leaves plain data behind — keep going.
    WATCHER
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

enum UiAction {
    Hide,
    /// Show/move the badge (or panel) against the field.
    Place {
        element: AxElement,
        fallback: Option<Rect>,
        panel: bool,
        /// Re-place even if the field did not move (window size changed).
        force: bool,
    },
    /// Focus went back to the app: collapse the panel to the badge.
    Collapse,
}

pub fn spawn_watcher(app: AppHandle) {
    let spawned = thread::Builder::new()
        .name("lexora-grammar-watch".to_string())
        .spawn(move || run(app));
    if let Err(e) = spawned {
        log::warn!("Failed to start writing-check watcher: {e}");
    }
}

fn run(app: AppHandle) {
    let own_pid = i32::try_from(std::process::id()).unwrap_or(-1);
    let mut cache = AppCache::default();
    let mut system: Option<AxElement> = None;
    let mut language_checked = Instant::now();
    loop {
        let config = config_snapshot(&app);
        if !config.enabled {
            report(&app, ActivityCode::Disabled, None, None);
            thread::sleep(IDLE_INTERVAL);
            continue;
        }
        if !crate::hotkeys::accessibility_trusted() {
            report(&app, ActivityCode::NoAccess, None, None);
            thread::sleep(IDLE_INTERVAL);
            continue;
        }
        if language_checked.elapsed() >= LANGUAGE_REFRESH {
            refresh_language(&app);
            language_checked = Instant::now();
        }
        if system.is_none() {
            system = AxElement::system_wide();
        }
        if let Some(system) = system.as_ref() {
            let observed = probe(system, own_pid, &config, &mut cache);
            tick(&app, observed, &config);
        }
        thread::sleep(POLL_INTERVAL);
    }
}

fn tick(app: &AppHandle, observed: Probe, config: &WatchConfig) {
    let now = Instant::now();
    let mut actions: Vec<UiAction> = Vec::new();
    let mut payload: Option<FieldPayload> = None;
    // Typed text or another field: the underlines no longer match the text.
    let stale_marks: bool;
    {
        let mut guard = lock_watcher();
        let watcher = guard.get_or_insert_with(|| Watcher::new(now));
        if watcher.writing {
            return;
        }
        let checkable = |text: &str| logic::text_is_checkable(text, &config.language);
        let mut field_changed = false;
        let decision = match observed {
            // Keep the last report: the user may be reading it in Settings.
            Probe::OwnApp => return,
            Probe::Nothing(skipped) => {
                report(
                    app,
                    skipped.code,
                    skipped.app.as_ref().and_then(|info| info.name.as_deref()),
                    skipped.detail.as_deref(),
                );
                field_changed = watcher.field.is_some();
                watcher.field = None;
                watcher.state.observe(None, checkable, now)
            }
            Probe::Field(snapshot) => {
                let same = watcher
                    .field
                    .as_ref()
                    .is_some_and(|field| field.element.same_as(&snapshot.element));
                let decision = watcher.state.observe(
                    Some(Observation {
                        same_field: same,
                        text: &snapshot.text,
                    }),
                    checkable,
                    now,
                );
                report_field(app, &watcher.state, &snapshot, config, now);
                if !same {
                    field_changed = true;
                    watcher.field = Some(TrackedField {
                        element: snapshot.element,
                        pid: snapshot.pid,
                        app: snapshot.app,
                    });
                    watcher.placed_for = None;
                }
                decision
            }
        };

        stale_marks =
            field_changed || matches!(decision, Decision::Hide | Decision::Pending { .. });
        // The user went back to typing (or moved focus): close the panel.
        // Merely re-focusing the app keeps it — activation on click may lag.
        let collapsed = watcher.panel_open && (field_changed || decision != Decision::Nothing);
        if collapsed {
            watcher.panel_open = false;
            actions.push(UiAction::Collapse);
        }

        match decision {
            Decision::Hide => {
                watcher.visible = false;
                watcher.placed_for = None;
                actions.push(UiAction::Hide);
                payload = Some(FieldPayload::Hidden);
            }
            Decision::Pending { field_id } => {
                payload = Some(FieldPayload::Pending { field_id });
            }
            Decision::Check { field_id, text } => {
                if let Some(field) = watcher.field.as_ref() {
                    watcher.visible = true;
                    actions.push(UiAction::Place {
                        element: field.element.clone(),
                        fallback: watcher.placed_for,
                        panel: false,
                        force: collapsed,
                    });
                    payload = Some(FieldPayload::Check {
                        field_id,
                        text,
                        app_name: field.app.name.clone(),
                        bundle_id: field.app.bundle_id.clone(),
                    });
                }
            }
            Decision::Nothing => {
                if watcher.visible {
                    if let Some(field) = watcher.field.as_ref() {
                        actions.push(UiAction::Place {
                            element: field.element.clone(),
                            fallback: watcher.placed_for,
                            panel: watcher.panel_open,
                            force: collapsed,
                        });
                    }
                }
            }
        }
    }

    if stale_marks {
        clear_marks(app);
    }
    if let Some(payload) = payload {
        publish(app, payload);
    }
    for action in actions {
        run_action(app, action);
    }
    // Follow scrolling, resizing and moving of the field.
    marks::refresh_if_due(app);
}

/// Status line for a readable field: typing, why it is skipped, or checked.
fn report_field(
    app: &AppHandle,
    state: &WatchState,
    snapshot: &FieldSnapshot,
    config: &WatchConfig,
    now: Instant,
) {
    let app_name = snapshot.app.name.as_deref();
    if state.is_settling(now) {
        report(app, ActivityCode::Waiting, app_name, None);
        return;
    }
    match logic::rejection(&snapshot.text, &config.language) {
        Some(logic::Rejection::TooShort) => report(app, ActivityCode::TooShort, app_name, None),
        Some(logic::Rejection::TooLong) => report(app, ActivityCode::FieldTooLong, app_name, None),
        Some(logic::Rejection::OtherLanguage) => report(
            app,
            ActivityCode::OtherLanguage,
            app_name,
            Some(config.language.as_str()),
        ),
        None => report(app, ActivityCode::Shown, app_name, None),
    }
}

fn run_action(app: &AppHandle, action: UiAction) {
    match action {
        UiAction::Hide => hide_window(app),
        UiAction::Collapse => {
            if let Some(window) = app.get_webview_window(GRAMMAR_LABEL) {
                let _ = window.emit(PANEL_EVENT, false);
            }
        }
        UiAction::Place {
            element,
            fallback,
            panel,
            force,
        } => {
            let Some(bounds) = element.bounds().or(fallback) else {
                return;
            };
            let moved = {
                let mut guard = lock_watcher();
                match guard.as_mut() {
                    Some(watcher) => {
                        let moved = watcher.placed_for.is_none_or(|last| {
                            (last.x - bounds.x).abs() > FOLLOW_THRESHOLD
                                || (last.y - bounds.y).abs() > FOLLOW_THRESHOLD
                                || (last.width - bounds.width).abs() > FOLLOW_THRESHOLD
                                || (last.height - bounds.height).abs() > FOLLOW_THRESHOLD
                        });
                        watcher.placed_for = Some(bounds);
                        moved
                    }
                    None => false,
                }
            };
            if moved || force {
                place_window_async(app, bounds, panel);
            }
        }
    }
}

// ── Badge window ─────────────────────────────────────────

fn build_window(app: &AppHandle) -> Result<tauri::WebviewWindow, AppError> {
    let window =
        WebviewWindowBuilder::new(app, GRAMMAR_LABEL, WebviewUrl::App("grammar.html".into()))
            .title(crate::i18n::text(app, "Lexora Writing Check"))
            .inner_size(BADGE_SIZE, BADGE_SIZE)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .background_color(Color(0, 0, 0, 0))
            .resizable(false)
            .always_on_top(true)
            // The first click on the badge must already open the panel.
            .accept_first_mouse(true)
            .visible_on_all_workspaces(true)
            .skip_taskbar(true)
            .focused(false)
            .visible(false)
            .build()?;
    Ok(window)
}

fn clip_corners(view: &NSView, radius: f64) {
    view.setWantsLayer(true);
    let Some(layer) = view.layer() else {
        return;
    };
    layer.setOpaque(false);
    layer.setCornerRadius(radius);
    layer.setMasksToBounds(true);
    layer.setCornerCurve(unsafe { kCACornerCurveContinuous });
}

fn configure_ns_window(ns_window: &NSWindow, radius: f64) {
    // MoveToActiveSpace: the panel follows the user's current Space instead of
    // staying on the Space where it was last shown.
    ns_window.setCollectionBehavior(
        NSWindowCollectionBehavior::MoveToActiveSpace
            | NSWindowCollectionBehavior::Transient
            | NSWindowCollectionBehavior::IgnoresCycle
            | NSWindowCollectionBehavior::FullScreenAuxiliary,
    );
    ns_window.setHidesOnDeactivate(false);
    ns_window.setLevel(NSPopUpMenuWindowLevel);
    ns_window.setOpaque(false);
    ns_window.setBackgroundColor(Some(&NSColor::clearColor()));
    ns_window.setHasShadow(false);
    if let Some(content) = ns_window.contentView() {
        clip_corners(&content, radius);
        for subview in content.subviews() {
            clip_corners(&subview, radius);
        }
    }
}

fn place_window_async(app: &AppHandle, field: Rect, panel: bool) {
    let handle = app.clone();
    let dispatched = app.run_on_main_thread(move || {
        let Some(mtm) = MainThreadMarker::new() else {
            return;
        };
        if let Err(e) = place_window(&handle, mtm, field, panel) {
            log::debug!("Writing-check badge placement skipped: {e}");
        }
    });
    if let Err(e) = dispatched {
        log::debug!("Failed to dispatch badge placement: {e}");
    }
}

fn place_window(
    app: &AppHandle,
    mtm: MainThreadMarker,
    field: Rect,
    panel: bool,
) -> Result<(), AppError> {
    let window = match app.get_webview_window(GRAMMAR_LABEL) {
        Some(window) => window,
        None => build_window(app)?,
    };
    let ns_window_ptr = window.ns_window()?;
    let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr.cast::<NSWindow>()) }) else {
        return Err(AppError::Io("Badge NSWindow is unavailable".to_string()));
    };
    configure_ns_window(
        &ns_window,
        if panel {
            PANEL_CORNER_RADIUS
        } else {
            BADGE_SIZE / 2.0
        },
    );

    // Accessibility frames are top-left based (Y down) from the primary
    // display; Cocoa frames are bottom-left based (Y up).
    let screens = NSScreen::screens(mtm);
    let Some(primary) = screens.iter().next() else {
        return Err(AppError::Io(
            "No screen available for the badge".to_string(),
        ));
    };
    let primary_frame = primary.frame();
    let primary_top = primary_frame.origin.y + primary_frame.size.height;
    let visible: Vec<LogicalBounds> = screens
        .iter()
        .map(|screen| {
            let frame = screen.visibleFrame();
            LogicalBounds {
                x: frame.origin.x,
                y: primary_top - (frame.origin.y + frame.size.height),
                width: frame.size.width,
                height: frame.size.height,
            }
        })
        .collect();
    let (center_x, center_y) = field.center();
    let Some(screen) = pick_bounds_for_point(center_x, center_y, &visible) else {
        return Err(AppError::Io(
            "No screen available for the badge".to_string(),
        ));
    };
    let screen = Rect {
        x: screen.x,
        y: screen.y,
        width: screen.width,
        height: screen.height,
    };

    let badge = logic::badge_frame(&field, BADGE_SIZE, &screen);
    let frame = if panel {
        logic::panel_frame(&badge, PANEL_WIDTH, PANEL_HEIGHT, &screen)
    } else {
        badge
    };
    let rect = NSRect::new(
        NSPoint::new(frame.x, primary_top - (frame.y + frame.height)),
        NSSize::new(frame.width, frame.height),
    );
    ns_window.setFrame_display(rect, true);
    // Never activate Lexora here: the user keeps typing in their app.
    ns_window.orderFrontRegardless();
    if panel {
        ns_window.makeKeyWindow();
    }
    Ok(())
}

fn hide_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(GRAMMAR_LABEL) {
        if let Err(e) = window.hide() {
            log::debug!("Failed to hide writing-check badge: {e}");
        }
    }
}

// ── Commands ─────────────────────────────────────────────

/// Forget the field and hide the badge (feature off, app excluded).
pub fn reset(app: &AppHandle) {
    *lock_watcher() = None;
    hide_window(app);
}

fn current_field(field_id: u64) -> Result<(AxElement, i32, Option<Rect>), AppError> {
    let guard = lock_watcher();
    let watcher = guard
        .as_ref()
        .filter(|watcher| watcher.state.field_id() == Some(field_id))
        .ok_or_else(|| AppError::Validation("The text field is no longer focused".to_string()))?;
    let field = watcher
        .field
        .as_ref()
        .ok_or_else(|| AppError::Validation("The text field is no longer focused".to_string()))?;
    Ok((field.element.clone(), field.pid, watcher.placed_for))
}

fn return_focus(app: &AppHandle, pid: i32) {
    crate::popup::activate_app_pid(app, pid);
}

pub fn set_panel_open(app: &AppHandle, open: bool) -> Result<(), AppError> {
    let (element, pid, fallback) = {
        let mut guard = lock_watcher();
        let watcher = guard
            .as_mut()
            .filter(|watcher| watcher.visible)
            .ok_or_else(|| AppError::Validation("No text field is being checked".to_string()))?;
        let field = watcher
            .field
            .as_ref()
            .ok_or_else(|| AppError::Validation("No text field is being checked".to_string()))?;
        watcher.panel_open = open;
        (field.element.clone(), field.pid, watcher.placed_for)
    };
    if let Some(bounds) = element.bounds().or(fallback) {
        place_window_async(app, bounds, open);
    }
    if !open {
        return_focus(app, pid);
    }
    Ok(())
}

pub fn snooze(app: &AppHandle, field_id: u64) {
    let pid = {
        let mut guard = lock_watcher();
        let Some(watcher) = guard
            .as_mut()
            .filter(|watcher| watcher.state.field_id() == Some(field_id))
        else {
            return;
        };
        let _ = watcher.state.snooze();
        watcher.visible = false;
        watcher.panel_open = false;
        watcher.placed_for = None;
        watcher.field.as_ref().map(|field| field.pid)
    };
    clear_marks(app);
    hide_window(app);
    publish(app, FieldPayload::Hidden);
    if let Some(pid) = pid {
        return_focus(app, pid);
    }
}

pub fn apply_fix(
    app: &AppHandle,
    field_id: u64,
    checked: &str,
    corrected: &str,
) -> Result<(), AppError> {
    let (element, pid, _) = current_field(field_id)?;
    set_writing(true);
    let result = write_text(app, &element, pid, checked, corrected);
    {
        let mut guard = lock_watcher();
        if let Some(watcher) = guard.as_mut() {
            watcher.writing = false;
            if let Ok(new_text) = result.as_ref() {
                if watcher.state.field_id() == Some(field_id) {
                    watcher.state.expect_text(new_text, Instant::now());
                }
            }
        }
    }
    result.map(|_| ())
}

fn set_writing(writing: bool) {
    if let Some(watcher) = lock_watcher().as_mut() {
        watcher.writing = writing;
    }
}

// ── Writing into the field ───────────────────────────────

fn wait_for_value(element: &AxElement, expected: &str) -> bool {
    let started = Instant::now();
    loop {
        if element.field_value().as_deref() == Some(expected) {
            return true;
        }
        if started.elapsed() >= VALUE_SETTLE_TIMEOUT {
            return false;
        }
        thread::sleep(VALUE_SETTLE_STEP);
    }
}

fn restore_selection(element: &AxElement, selection: Option<(usize, usize)>, edit: &TextEdit) {
    if let Some((location, length)) = selection {
        let (location, length) = logic::shift_selection(location, length, edit);
        let _ = element.set_range(location, length);
    }
}

/// Write the fix with the least intrusive method that works in this app:
/// 1. replace only the changed span (keeps formatting and the app's undo);
/// 2. set the whole value (plain fields that ignore selection writes);
/// 3. focus the app and paste over the span / the whole field.
///
/// Returns the new full field value.
fn write_text(
    app: &AppHandle,
    element: &AxElement,
    pid: i32,
    checked: &str,
    corrected: &str,
) -> Result<String, AppError> {
    let current = element
        .field_value()
        .ok_or_else(|| AppError::Validation("Could not read the text field".to_string()))?;
    let new_text = logic::rebuild_field_text(&current, checked, corrected).ok_or_else(|| {
        AppError::Validation(
            "The text changed after the check — wait for the new result".to_string(),
        )
    })?;
    let Some(edit) = logic::word_aligned_edit(&current, &new_text) else {
        return Ok(new_text);
    };
    let selection = element.selected_range();

    if element.set_range(edit.start, edit.removed)
        && element.set_string(ATTR_SELECTED_TEXT, &edit.inserted)
        && wait_for_value(element, &new_text)
    {
        restore_selection(element, selection, &edit);
        return Ok(new_text);
    }

    match element.field_value() {
        Some(value) if value == new_text => {
            restore_selection(element, selection, &edit);
            return Ok(new_text);
        }
        Some(value)
            if value == current
                && element.set_string(ATTR_VALUE, &new_text)
                && wait_for_value(element, &new_text) =>
        {
            restore_selection(element, selection, &edit);
            return Ok(new_text);
        }
        _ => {}
    }

    // Never paste over a field that already changed in an unknown way.
    match element.field_value() {
        Some(value) if value == new_text => return Ok(new_text),
        Some(value) if value == current => {}
        _ => {
            return Err(AppError::Validation(
                "The text changed while applying the fix".to_string(),
            ))
        }
    }
    paste_fallback(app, element, pid, &edit, &new_text)?;
    if wait_for_value(element, &new_text) {
        Ok(new_text)
    } else {
        Err(AppError::Io(
            "This app did not accept the fix. Select the text and use the Lexora hotkey instead."
                .to_string(),
        ))
    }
}

fn focused_element_of(pid: i32) -> Option<AxElement> {
    AxElement::application(pid)?.copy_element(ATTR_FOCUSED_UI)
}

fn post_key(key: u16, flags: CGEventFlags) -> bool {
    let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) else {
        return false;
    };
    let Ok(down) = CGEvent::new_keyboard_event(source.clone(), key, true) else {
        return false;
    };
    let Ok(up) = CGEvent::new_keyboard_event(source, key, false) else {
        return false;
    };
    down.set_flags(flags);
    up.set_flags(flags);
    down.post(CGEventTapLocation::HID);
    up.post(CGEventTapLocation::HID);
    true
}

fn read_clipboard_text() -> Option<String> {
    let pasteboard = NSPasteboard::generalPasteboard();
    pasteboard
        .stringForType(unsafe { NSPasteboardTypeString })
        .map(|text| text.to_string())
}

fn write_clipboard_text(text: &str) {
    let pasteboard = NSPasteboard::generalPasteboard();
    pasteboard.clearContents();
    let value = NSString::from_str(text);
    let _ = pasteboard.setString_forType(&value, unsafe { NSPasteboardTypeString });
}

fn paste_fallback(
    app: &AppHandle,
    element: &AxElement,
    pid: i32,
    edit: &TextEdit,
    new_text: &str,
) -> Result<(), AppError> {
    return_focus(app, pid);
    thread::sleep(FOCUS_RETURN_DELAY);
    // Keystrokes must land in the same field, not wherever focus went.
    let same_field = focused_element_of(pid).is_some_and(|focused| focused.same_as(element));
    if !same_field {
        return Err(AppError::Validation(
            "The text field is no longer focused".to_string(),
        ));
    }

    let (payload, select_all) = if element.set_range(edit.start, edit.removed) {
        (edit.inserted.as_str(), false)
    } else {
        (new_text, true)
    };
    if select_all && !post_key(KeyCode::ANSI_A, CGEventFlags::CGEventFlagCommand) {
        return Err(AppError::Permission(
            "Enable Accessibility for Lexora to apply fixes".to_string(),
        ));
    }
    if payload.is_empty() {
        post_key(KeyCode::DELETE, CGEventFlags::CGEventFlagNull);
        return Ok(());
    }
    // The clipboard carries the fix for a moment; the user's text is put
    // back afterwards (non-text clipboard content cannot be restored).
    let previous = read_clipboard_text();
    write_clipboard_text(payload);
    let pasted = post_key(KeyCode::ANSI_V, CGEventFlags::CGEventFlagCommand);
    thread::sleep(PASTE_SETTLE);
    if let Some(previous) = previous {
        write_clipboard_text(&previous);
    }
    if pasted {
        Ok(())
    } else {
        Err(AppError::Permission(
            "Enable Accessibility for Lexora to apply fixes".to_string(),
        ))
    }
}

// ── Underlines and hover card ────────────────────────────
// Everything is in points with the origin at the top-left of the primary
// display (the space Accessibility uses), so the scale is always 1.

/// Accessibility needs no per-thread setup.
pub(super) fn prepare_thread() {}

/// Where each flagged word of the tracked field is drawn. `text` is the
/// checked (trimmed) text; words that cannot be located reliably are left out.
pub(super) fn mark_geometry(
    field_id: u64,
    text: &str,
    marks: &[MarkInput],
) -> Option<MarkGeometry> {
    let (element, _, fallback) = current_field(field_id)
        .inspect_err(|e| log::debug!("Grammar marks: {e}"))
        .ok()?;
    let Some(current) = element.field_value() else {
        log::debug!("Grammar marks: the field has no text value");
        return None;
    };
    // The field must still hold the text the offsets refer to.
    let Some(lead) = logic::body_offset_utf16(&current, text) else {
        log::debug!(
            "Grammar marks: the field text ({} chars) differs from the checked text ({} chars)",
            current.chars().count(),
            text.chars().count()
        );
        return None;
    };
    let Some(field_bounds) = element.bounds().or(fallback) else {
        log::debug!("Grammar marks: the field has no frame");
        return None;
    };
    let mut regions = Vec::new();
    let mut runs: Option<Vec<TextRun>> = None;
    for mark in marks {
        let Some(fragment) = logic::utf16_slice(text, mark.start, mark.end) else {
            continue;
        };
        let location = lead + mark.start;
        let mut rects = element.fragment_rects(location, &fragment);
        rects.retain(|rect| is_word_rect(rect, &field_bounds));
        if rects.is_empty() {
            let runs = runs.get_or_insert_with(|| {
                let runs = element.text_runs(&current);
                log_once(&format!("{} text node(s) below the field", runs.len()));
                if !CAPABILITIES_LOGGED.swap(true, Ordering::Relaxed) {
                    for run in runs.iter().take(3) {
                        log::debug!(
                            "Grammar marks: text node {}+{} {:?} frame {:?}",
                            run.start,
                            run.len,
                            run.text,
                            run.element.frame()
                        );
                    }
                }
                runs
            });
            rects = run_rects(runs, location, &fragment);
            rects.retain(|rect| is_word_rect(rect, &field_bounds));
        }
        if !rects.is_empty() {
            regions.push((mark.id, rects));
        }
    }
    Some(MarkGeometry {
        field_bounds,
        regions,
    })
}

/// Pointer position in points, top-left origin (the space of the AX rects).
pub(super) fn cursor_position() -> Option<(f64, f64)> {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok()?;
    let location = CGEvent::new(source).ok()?.location();
    Some((location.x, location.y))
}

/// Visible area (points) of the screen that holds the point; the scale is 1
/// because everything here is already in points.
pub(super) fn screen_at(app: &AppHandle, x: f64, y: f64) -> Option<(Rect, f64)> {
    let monitors = app.available_monitors().ok()?;
    let areas: Vec<LogicalBounds> = monitors
        .iter()
        .map(|monitor| {
            let area = monitor.work_area();
            let scale = monitor.scale_factor();
            LogicalBounds {
                x: f64::from(area.position.x) / scale,
                y: f64::from(area.position.y) / scale,
                width: f64::from(area.size.width) / scale,
                height: f64::from(area.size.height) / scale,
            }
        })
        .collect();
    let screen = pick_bounds_for_point(x, y, &areas)?;
    Some((
        Rect {
            x: screen.x,
            y: screen.y,
            width: screen.width,
            height: screen.height,
        },
        1.0,
    ))
}

fn build_overlay(app: &AppHandle, overlay: Overlay) -> Result<tauri::WebviewWindow, AppError> {
    let window =
        WebviewWindowBuilder::new(app, overlay.label(), WebviewUrl::App(overlay.url().into()))
            .title(crate::i18n::text(app, "Lexora Writing Check"))
            .inner_size(BADGE_SIZE, BADGE_SIZE)
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .background_color(Color(0, 0, 0, 0))
            .resizable(false)
            .always_on_top(true)
            // The first click on the card's buttons must already act.
            .accept_first_mouse(true)
            .visible_on_all_workspaces(true)
            .skip_taskbar(true)
            .focused(false)
            .visible(false)
            .build()?;
    Ok(window)
}

/// Show an overlay window at `frame` (points) without taking the focus.
pub(super) fn show_overlay(app: &AppHandle, overlay: Overlay, frame: Rect) {
    let handle = app.clone();
    let dispatched = app.run_on_main_thread(move || {
        let Some(mtm) = MainThreadMarker::new() else {
            return;
        };
        if let Err(e) = place_overlay(&handle, mtm, overlay, frame) {
            log::debug!("Writing-check overlay placement skipped: {e}");
        }
    });
    if let Err(e) = dispatched {
        log::debug!("Failed to dispatch overlay placement: {e}");
    }
}

fn place_overlay(
    app: &AppHandle,
    mtm: MainThreadMarker,
    overlay: Overlay,
    frame: Rect,
) -> Result<(), AppError> {
    let window = match app.get_webview_window(overlay.label()) {
        Some(window) => window,
        None => build_overlay(app, overlay)?,
    };
    let ns_window_ptr = window.ns_window()?;
    let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr.cast::<NSWindow>()) }) else {
        return Err(AppError::Io("Overlay NSWindow is unavailable".to_string()));
    };
    configure_ns_window(&ns_window, 0.0);
    // Underlines never catch clicks: the text below stays editable.
    ns_window.setIgnoresMouseEvents(overlay == Overlay::Marks);
    let screens = NSScreen::screens(mtm);
    let Some(primary) = screens.iter().next() else {
        return Err(AppError::Io(
            "No screen available for the overlay".to_string(),
        ));
    };
    let primary_frame = primary.frame();
    let primary_top = primary_frame.origin.y + primary_frame.size.height;
    let rect = NSRect::new(
        NSPoint::new(frame.x, primary_top - (frame.y + frame.height)),
        NSSize::new(frame.width, frame.height),
    );
    ns_window.setFrame_display(rect, true);
    // Never activate Lexora: the user keeps typing in their app.
    ns_window.orderFrontRegardless();
    Ok(())
}

/// Hidden on the main thread like `show_overlay`, so a hide always lands
/// after the show it follows.
pub(super) fn hide_overlay(app: &AppHandle, overlay: Overlay) {
    let handle = app.clone();
    let dispatched = app.run_on_main_thread(move || {
        if let Some(window) = handle.get_webview_window(overlay.label()) {
            if let Err(e) = window.hide() {
                log::debug!("Failed to hide writing-check overlay: {e}");
            }
        }
    });
    if let Err(e) = dispatched {
        log::debug!("Failed to dispatch overlay hide: {e}");
    }
}
