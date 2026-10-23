// ============================================================
// LEXORA — System-wide writing check, Windows backend.
// Watches the focused text field of other apps through UI
// Automation, shows the badge next to it after a typing pause and
// writes accepted fixes back (ValuePattern, or select + paste).
// Mirrors `macos.rs`; all decisions live in `logic.rs`.
//
// Geometry is physical pixels end to end: UI Automation reports
// physical screen coordinates and so do Tauri monitors.
// ============================================================

use super::logic::{self, Decision, Observation, Rect, TextEdit, WatchState};
use super::marks::{self, MarkGeometry, Overlay};
use super::{
    clear_marks, config_snapshot, publish, refresh_language, report, ActivityCode, FieldPayload,
    MarkInput, WatchConfig, BADGE_SIZE, GRAMMAR_LABEL, PANEL_EVENT, PANEL_HEIGHT, PANEL_WIDTH,
};
use crate::display::{pick_bounds_for_point, LogicalBounds};
use crate::error::AppError;
use std::collections::HashMap;
use std::ffi::c_void;
use std::mem::size_of;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant};
use tauri::window::Color;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_clipboard_manager::ClipboardExt;
use windows::core::{BSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{CreateEllipticRgn, SetWindowRgn};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED, SAFEARRAY,
};
use windows::Win32::System::Ole::{
    SafeArrayAccessData, SafeArrayDestroy, SafeArrayGetLBound, SafeArrayGetUBound,
    SafeArrayUnaccessData,
};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};
use windows::Win32::System::SystemInformation::GetTickCount;
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Accessibility::{
    CUIAutomation, IUIAutomation, IUIAutomationCacheRequest, IUIAutomationElement,
    IUIAutomationTextPattern, IUIAutomationTextRange, IUIAutomationValuePattern,
    TextPatternRangeEndpoint_End, TextPatternRangeEndpoint_Start, TextUnit_Character,
    UIA_ClassNamePropertyId, UIA_ComboBoxControlTypeId, UIA_ControlTypePropertyId,
    UIA_DocumentControlTypeId, UIA_EditControlTypeId, UIA_IsPasswordPropertyId,
    UIA_IsReadOnlyAttributeId, UIA_NamePropertyId, UIA_NativeWindowHandlePropertyId,
    UIA_ProcessIdPropertyId, UIA_RuntimeIdPropertyId, UIA_TextPatternId, UIA_ValuePatternId,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetLastInputInfo, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
    KEYEVENTF_KEYUP, LASTINPUTINFO, VIRTUAL_KEY, VK_A, VK_CONTROL, VK_DELETE, VK_V,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetClassNameW, GetCursorPos, GetForegroundWindow, GetGUIThreadInfo, GetWindowLongPtrW,
    GetWindowRect,
    GetWindowThreadProcessId, SendMessageTimeoutW, SetForegroundWindow, SetWindowLongPtrW,
    SetWindowPos, GUITHREADINFO, GWL_EXSTYLE, HWND_TOPMOST, SMTO_ABORTIFHUNG, SWP_FRAMECHANGED, SWP_NOACTIVATE, SWP_SHOWWINDOW, WM_GETTEXT,
    WM_GETTEXTLENGTH, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};

const POLL_INTERVAL: Duration = Duration::from_millis(200);
const IDLE_INTERVAL: Duration = Duration::from_secs(1);
const LANGUAGE_REFRESH: Duration = Duration::from_secs(10);
const VALUE_SETTLE_TIMEOUT: Duration = Duration::from_millis(500);
const VALUE_SETTLE_STEP: Duration = Duration::from_millis(30);
const FOCUS_RETURN_DELAY: Duration = Duration::from_millis(150);
const PASTE_SETTLE: Duration = Duration::from_millis(200);
/// Moves smaller than this (physical px) do not re-place the badge.
const FOLLOW_THRESHOLD: f64 = 1.0;

// Scintilla (Notepad++, SciTE, ...) draws its own text and has no UI
// Automation provider. Text is read with the standard WM_GETTEXT (the system
// marshals the buffer between processes); the selection is driven by
// pointer-free SCI_* messages.
const SCINTILLA_CLASS: &str = "Scintilla";
const SCI_TIMEOUT_MS: u32 = 300;
const SCI_SELECTALL: u32 = 2013;
const SCI_GETCODEPAGE: u32 = 2137;
const SCI_GETREADONLY: u32 = 2140;
const SCI_GETSELECTIONSTART: u32 = 2143;
const SCI_GETSELECTIONEND: u32 = 2145;
const SCI_SETSEL: u32 = 2160;
const SCI_CODEPAGE_UTF8: isize = 65001;

/// Apps that are never checked (password managers, terminals); exact
/// lowercase executable names, on top of the user's exclusion list.
const BUILTIN_EXCLUDED: &[&str] = &[
    "1password.exe",
    "bitwarden.exe",
    "keepass.exe",
    "keepassxc.exe",
    "lastpass.exe",
    "dashlane.exe",
    "windowsterminal.exe",
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe",
    "conhost.exe",
    "mintty.exe",
];

// Role names understood by `logic::is_checkable_role`.
const ROLE_TEXT_AREA: &str = "AXTextArea";
const ROLE_TEXT_FIELD: &str = "AXTextField";
const ROLE_COMBO_BOX: &str = "AXComboBox";
const ROLE_SECURE: &str = "AXSecureTextField";

// ── UI Automation helpers ────────────────────────────────

/// A UIA element that can sit in the shared watcher state. UIA objects
/// created on an MTA thread are agile, so moving them between the watcher
/// and the IPC threads is sound.
#[derive(Clone)]
enum Elem {
    /// A UI Automation element.
    Uia(UiaElem),
    /// A plain Win32 window driven by window messages only (Scintilla):
    /// UI Automation is never called for it, because its provider chain
    /// crashed the process while typing in Notepad++.
    Win32(HWND),
}

/// A UI Automation element and, once it is the tracked field, its control
/// patterns. Every call on them is served on the watched app's UI thread,
/// so they are fetched once per focused element, not on every probe.
/// Pattern objects are as agile as the element (see `Elem`).
#[derive(Clone)]
struct UiaElem {
    element: IUIAutomationElement,
    /// `None` until `Elem::with_patterns`; the getters then ask the element.
    patterns: Option<Patterns>,
}

#[derive(Clone)]
struct Patterns {
    value: Option<IUIAutomationValuePattern>,
    text: Option<IUIAutomationTextPattern>,
}

impl Elem {
    fn from_uia(element: IUIAutomationElement) -> Self {
        Elem::Uia(UiaElem {
            element,
            patterns: None,
        })
    }

    fn uia(&self) -> Option<&IUIAutomationElement> {
        match self {
            Elem::Uia(uia) => Some(&uia.element),
            Elem::Win32(_) => None,
        }
    }

    /// Fetch the control patterns once and keep them with the element.
    fn with_patterns(mut self) -> Self {
        self.ensure_patterns();
        self
    }

    /// Fetch the control patterns unless one is already kept. An app that
    /// builds its accessibility tree lazily may expose none at first, so a
    /// later read asks again. `true` when a pattern was obtained just now.
    fn ensure_patterns(&mut self) -> bool {
        let Elem::Uia(uia) = self else {
            return false;
        };
        if uia
            .patterns
            .as_ref()
            .is_some_and(|patterns| patterns.value.is_some() || patterns.text.is_some())
        {
            return false;
        }
        let element = &uia.element;
        let patterns = Patterns {
            value: unsafe {
                element.GetCurrentPatternAs::<IUIAutomationValuePattern>(UIA_ValuePatternId)
            }
            .ok(),
            text: unsafe {
                element.GetCurrentPatternAs::<IUIAutomationTextPattern>(UIA_TextPatternId)
            }
            .ok(),
        };
        let obtained = patterns.value.is_some() || patterns.text.is_some();
        uia.patterns = Some(patterns);
        obtained
    }
}

/// A property fetched with the focus query (`focus_cache_request`), or asked
/// live when the element came without it. Reading a cached value is local.
fn cached_or_current<T>(
    cached: windows::core::Result<T>,
    current: impl FnOnce() -> windows::core::Result<T>,
) -> Option<T> {
    cached.or_else(|_| current()).ok()
}

fn window_class(window: HWND) -> String {
    let mut class = [0u16; 64];
    let length = usize::try_from(unsafe { GetClassNameW(window, &mut class) }).unwrap_or(0);
    String::from_utf16_lossy(&class[..length.min(class.len())])
}

unsafe impl Send for Elem {}
unsafe impl Sync for Elem {}

fn ensure_com() {
    // Already initialised (possibly as STA by the host): nothing to do.
    let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
}

fn automation() -> Option<IUIAutomation> {
    ensure_com();
    unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok() }
}

fn normalize_newlines(text: &str) -> String {
    text.replace("\r\n", "\n")
        .replace('\r', "\n")
        .replace('\u{a0}', " ")
}

/// Send a message to a window of another process without risking a hang.
fn sci_send(window: HWND, message: u32, wparam: usize, lparam: isize) -> Option<isize> {
    let mut result: usize = 0;
    let reply = unsafe {
        SendMessageTimeoutW(
            window,
            message,
            WPARAM(wparam),
            LPARAM(lparam),
            SMTO_ABORTIFHUNG,
            SCI_TIMEOUT_MS,
            Some(&mut result),
        )
    };
    (reply.0 != 0).then_some(result as isize)
}

/// Document text of a Scintilla control with `\n` newlines; at most
/// `MAX_CHECK_CHARS + 1` chars. Only UTF-8 documents (or pure ASCII) are
/// read: other code pages would be decoded wrongly.
fn scintilla_read(window: HWND) -> Option<String> {
    let length = usize::try_from(sci_send(window, WM_GETTEXTLENGTH, 0, 0)?).ok()?;
    let wanted = length.min((logic::MAX_CHECK_CHARS + 1) * 4);
    // Scintilla windows are Unicode, so Windows marshals WM_GETTEXT across
    // processes as `wparam` UTF-16 units and copies `(copied + 1) * 2` bytes
    // back into this buffer. A buffer sized in bytes would be overrun (heap
    // corruption, crash later in ntdll): size it in UTF-16 units, with slack.
    let units = wanted + 1;
    let mut buffer = vec![0u8; units * size_of::<u16>() + 16];
    let copied = usize::try_from(sci_send(
        window,
        WM_GETTEXT,
        units,
        buffer.as_mut_ptr() as isize,
    )?)
    .ok()?;
    buffer.truncate(copied.min(wanted));
    if sci_send(window, SCI_GETCODEPAGE, 0, 0)? != SCI_CODEPAGE_UTF8 && !buffer.is_ascii() {
        return None;
    }
    let text = String::from_utf8_lossy(&buffer);
    let limited: String = text.chars().take(logic::MAX_CHECK_CHARS + 1).collect();
    Some(normalize_newlines(&limited))
}

/// UTF-16 unit offset in `text` → UTF-8 byte offset (Scintilla counts bytes).
fn utf16_to_utf8_offset(text: &str, units: usize) -> Option<usize> {
    let mut seen = 0usize;
    let mut bytes = 0usize;
    for ch in text.chars() {
        if seen == units {
            return Some(bytes);
        }
        seen += ch.len_utf16();
        bytes += ch.len_utf8();
    }
    (seen == units).then_some(bytes)
}

impl Elem {
    /// The Scintilla window behind this element, if it is one.
    fn scintilla(&self) -> Option<HWND> {
        match self {
            Elem::Win32(window) => Some(*window),
            Elem::Uia(uia) => {
                if !self.class_name().eq_ignore_ascii_case(SCINTILLA_CLASS) {
                    return None;
                }
                let element = &uia.element;
                let window =
                    cached_or_current(unsafe { element.CachedNativeWindowHandle() }, || unsafe {
                        element.CurrentNativeWindowHandle()
                    })?;
                (!window.0.is_null()).then_some(window)
            }
        }
    }

    /// Select `removed` UTF-16 units from `start` in a Scintilla document
    /// with no line breaks and check the selection landed exactly there.
    fn scintilla_select_span(&self, current: &str, start: usize, removed: usize) -> bool {
        let Some(window) = self.scintilla() else {
            return false;
        };
        let (Some(from), Some(to)) = (
            utf16_to_utf8_offset(current, start),
            utf16_to_utf8_offset(current, start + removed),
        ) else {
            return false;
        };
        let (Ok(from_arg), Ok(to_arg)) = (isize::try_from(from), isize::try_from(to)) else {
            return false;
        };
        sci_send(window, SCI_SETSEL, from, to_arg).is_some()
            && sci_send(window, SCI_GETSELECTIONSTART, 0, 0) == Some(from_arg)
            && sci_send(window, SCI_GETSELECTIONEND, 0, 0) == Some(to_arg)
    }
}

impl Elem {
    fn same_as(&self, other: &Elem, automation: &IUIAutomation) -> bool {
        match (self, other) {
            (Elem::Uia(a), Elem::Uia(b)) => {
                unsafe { automation.CompareElements(&a.element, &b.element) }
                    .map(|same| same.as_bool())
                    .unwrap_or(false)
            }
            (Elem::Win32(a), Elem::Win32(b)) => a == b,
            _ => false,
        }
    }

    fn pid(&self) -> Option<u32> {
        match self {
            Elem::Uia(uia) => {
                let element = &uia.element;
                cached_or_current(unsafe { element.CachedProcessId() }, || unsafe {
                    element.CurrentProcessId()
                })
                .and_then(|pid| u32::try_from(pid).ok())
            }
            Elem::Win32(window) => {
                let mut pid = 0u32;
                unsafe { GetWindowThreadProcessId(*window, Some(&mut pid)) };
                (pid != 0).then_some(pid)
            }
        }
    }

    fn class_name(&self) -> String {
        match self {
            Elem::Uia(uia) => {
                let element = &uia.element;
                cached_or_current(unsafe { element.CachedClassName() }, || unsafe {
                    element.CurrentClassName()
                })
                .map(|name| name.to_string())
                .unwrap_or_default()
            }
            Elem::Win32(window) => window_class(*window),
        }
    }

    fn name(&self) -> String {
        self.uia()
            .and_then(|element| {
                cached_or_current(unsafe { element.CachedName() }, || unsafe {
                    element.CurrentName()
                })
            })
            .map(|name| name.to_string())
            .unwrap_or_default()
    }

    fn is_password(&self) -> bool {
        self.uia()
            .and_then(|element| {
                cached_or_current(unsafe { element.CachedIsPassword() }, || unsafe {
                    element.CurrentIsPassword()
                })
            })
            .is_some_and(|flag| flag.as_bool())
    }

    fn value_pattern(&self) -> Option<IUIAutomationValuePattern> {
        let Elem::Uia(uia) = self else {
            return None;
        };
        match uia.patterns.as_ref() {
            Some(patterns) => patterns.value.clone(),
            None => unsafe {
                uia.element
                    .GetCurrentPatternAs::<IUIAutomationValuePattern>(UIA_ValuePatternId)
            }
            .ok(),
        }
    }

    fn text_pattern(&self) -> Option<IUIAutomationTextPattern> {
        let Elem::Uia(uia) = self else {
            return None;
        };
        match uia.patterns.as_ref() {
            Some(patterns) => patterns.text.clone(),
            None => unsafe {
                uia.element
                    .GetCurrentPatternAs::<IUIAutomationTextPattern>(UIA_TextPatternId)
            }
            .ok(),
        }
    }

    fn is_read_only(&self) -> bool {
        if self.scintilla().is_some() {
            return self.quick_read_only();
        }
        self.quick_read_only() || self.text_is_read_only()
    }

    /// The read-only signals that cost one call: checked before every fresh
    /// read (Notepad++ switches documents inside one Scintilla window).
    fn quick_read_only(&self) -> bool {
        if let Some(window) = self.scintilla() {
            return sci_send(window, SCI_GETREADONLY, 0, 0).is_none_or(|flag| flag != 0);
        }
        self.value_pattern()
            .and_then(|pattern| unsafe { pattern.CurrentIsReadOnly() }.ok())
            .is_some_and(|flag| flag.as_bool())
    }

    /// Word-style editors (Outlook) have no ValuePattern: ask the text range.
    /// A mixed or unknown attribute counts as editable.
    fn text_is_read_only(&self) -> bool {
        let Some(pattern) = self.text_pattern() else {
            return false;
        };
        unsafe {
            pattern
                .DocumentRange()
                .and_then(|range| range.GetAttributeValue(UIA_IsReadOnlyAttributeId))
        }
        .ok()
        .and_then(|value| bool::try_from(&value).ok())
        .unwrap_or(false)
    }

    /// Field text with `\n` newlines; at most `MAX_CHECK_CHARS + 1` chars.
    fn read_text(&self) -> Option<String> {
        if let Some(window) = self.scintilla() {
            return scintilla_read(window);
        }
        if let Some(pattern) = self.value_pattern() {
            if let Ok(value) = unsafe { pattern.CurrentValue() } {
                return Some(normalize_newlines(&value.to_string()));
            }
        }
        let pattern = self.text_pattern()?;
        let limit = i32::try_from(logic::MAX_CHECK_CHARS + 1).unwrap_or(i32::MAX);
        let range = unsafe { pattern.DocumentRange() }.ok()?;
        let text = unsafe { range.GetText(limit) }.ok()?;
        Some(normalize_newlines(&text.to_string()))
    }

    fn bounds(&self) -> Option<Rect> {
        let rect = match self {
            Elem::Uia(uia) => unsafe { uia.element.CurrentBoundingRectangle() }.ok()?,
            Elem::Win32(window) => {
                let mut rect = RECT::default();
                unsafe { GetWindowRect(*window, &mut rect) }.ok()?;
                rect
            }
        };
        let bounds = Rect {
            x: f64::from(rect.left),
            y: f64::from(rect.top),
            width: f64::from(rect.right - rect.left),
            height: f64::from(rect.bottom - rect.top),
        };
        bounds.is_usable().then_some(bounds)
    }

    /// Select `removed` characters from `start` (document order) and check
    /// that the selection holds exactly `expected`.
    fn select_span(&self, start: usize, removed: usize, expected: &str) -> bool {
        let Some(pattern) = self.text_pattern() else {
            return false;
        };
        let (Ok(start), Ok(removed)) = (i32::try_from(start), i32::try_from(removed)) else {
            return false;
        };
        let select = || -> Option<bool> {
            let range = unsafe { pattern.DocumentRange() }.ok()?;
            unsafe {
                range
                    .MoveEndpointByRange(
                        TextPatternRangeEndpoint_End,
                        &range,
                        TextPatternRangeEndpoint_Start,
                    )
                    .ok()?;
                range.Move(TextUnit_Character, start).ok()?;
                range
                    .MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, removed)
                    .ok()?;
                let selected = range.GetText(-1).ok()?;
                if normalize_newlines(&selected.to_string()) != expected {
                    return Some(false);
                }
                range.Select().ok()?;
            }
            Some(true)
        };
        select().unwrap_or(false)
    }

    fn select_all(&self) -> bool {
        if let Some(window) = self.scintilla() {
            return sci_send(window, SCI_SELECTALL, 0, 0).is_some();
        }
        let Some(pattern) = self.text_pattern() else {
            return false;
        };
        unsafe { pattern.DocumentRange().and_then(|range| range.Select()) }.is_ok()
    }
}

/// Measures the flagged words of one field in document order with a single
/// text range that walks from word to word. Moving a range by N characters
/// costs the watched app O(N) (the Word editor of Outlook walks its text),
/// so starting every word from the document start made long texts freeze.
struct RangeWalker {
    pattern: IUIAutomationTextPattern,
    /// A range whose start sits `.1` characters (as the control counts
    /// them) into the document, left behind by the previous word.
    cursor: Option<(IUIAutomationTextRange, i32)>,
}

impl RangeWalker {
    fn new(element: &Elem) -> Option<Self> {
        Some(Self {
            pattern: element.text_pattern()?,
            cursor: None,
        })
    }

    /// Screen rectangles (physical px, one per line) of `len` UTF-16 units
    /// from `start`, walking on from the previous word. The range must hold
    /// exactly `expected`: a control that counts characters differently
    /// (line breaks, hidden markup) would otherwise put the underline under
    /// the wrong words.
    fn walk(&mut self, start: usize, len: usize, expected: &str) -> Option<Vec<Rect>> {
        let (start, len) = (i32::try_from(start).ok()?, i32::try_from(len).ok()?);
        let (range, at) = self.cursor.take()?;
        self.measure(range, at, start, len, expected, true)
    }

    /// Like `walk`, from a fresh range at the document start (the first
    /// word, or the walk lost its way).
    fn anchored(&mut self, start: usize, len: usize, expected: &str) -> Option<Vec<Rect>> {
        let (start, len) = (i32::try_from(start).ok()?, i32::try_from(len).ok()?);
        let range = unsafe { self.pattern.DocumentRange() }.ok()?;
        self.measure(range, 0, start, len, expected, false)
    }

    /// Move `range` (its start at `at`) to `start`, cover `len` characters
    /// and measure them. `strict`: a move by another count than asked fails
    /// (see `logic::range_move_outcome`).
    fn measure(
        &mut self,
        range: IUIAutomationTextRange,
        at: i32,
        start: i32,
        len: i32,
        expected: &str,
        strict: bool,
    ) -> Option<Vec<Rect>> {
        let delta = start.checked_sub(at)?;
        unsafe {
            range
                .MoveEndpointByRange(
                    TextPatternRangeEndpoint_End,
                    &range,
                    TextPatternRangeEndpoint_Start,
                )
                .ok()?;
            let moved = if delta == 0 {
                0
            } else {
                range.Move(TextUnit_Character, delta).ok()?
            };
            match logic::range_move_outcome(delta, moved, strict) {
                // The start is exact, whatever the text check below says:
                // the next word walks on from here.
                logic::RangeMove::Exact => self.cursor = Some((range.clone(), start)),
                logic::RangeMove::Unverified => {}
                logic::RangeMove::Abort => return None,
            }
            range
                .MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, len)
                .ok()?;
            let covered = range.GetText(-1).ok()?;
            if normalize_newlines(&covered.to_string()) != expected {
                return None;
            }
            read_rectangles(range.GetBoundingRectangles().ok()?)
        }
    }
}

/// `GetBoundingRectangles` answer: a SAFEARRAY of doubles, four per line
/// (left, top, width, height). Frees the array.
fn read_rectangles(array: *mut SAFEARRAY) -> Option<Vec<Rect>> {
    if array.is_null() {
        return None;
    }
    let rects = unsafe {
        let measured = (|| {
            let lower = SafeArrayGetLBound(array, 1).ok()?;
            let upper = SafeArrayGetUBound(array, 1).ok()?;
            let count = usize::try_from(upper.checked_sub(lower)?.checked_add(1)?).ok()?;
            let mut data: *mut c_void = std::ptr::null_mut();
            SafeArrayAccessData(array, &mut data).ok()?;
            let rects = if data.is_null() {
                Vec::new()
            } else {
                std::slice::from_raw_parts(data as *const f64, count)
                    .chunks_exact(4)
                    .map(|line| Rect {
                        x: line[0],
                        y: line[1],
                        width: line[2],
                        height: line[3],
                    })
                    .filter(Rect::is_usable)
                    .collect()
            };
            let _ = SafeArrayUnaccessData(array);
            Some(rects)
        })();
        let _ = SafeArrayDestroy(array);
        measured
    };
    rects.filter(|rects: &Vec<Rect>| !rects.is_empty())
}

fn process_exe(pid: u32) -> Option<String> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buffer = [0u16; 520];
        let mut length = u32::try_from(buffer.len()).unwrap_or(520);
        let queried = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(buffer.as_mut_ptr()),
            &mut length,
        );
        let _ = CloseHandle(handle);
        queried.ok()?;
        let path = String::from_utf16_lossy(&buffer[..usize::try_from(length).ok()?]);
        path.rsplit(['\\', '/']).next().map(str::to_lowercase)
    }
}

fn foreground_window() -> Option<(HWND, u32)> {
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.0.is_null() {
        return None;
    }
    let mut pid = 0u32;
    unsafe { GetWindowThreadProcessId(hwnd, Some(&mut pid)) };
    (pid != 0).then_some((hwnd, pid))
}

// ── Focused field probe ──────────────────────────────────

#[derive(Debug, Clone, Default)]
struct AppInfo {
    /// Lowercase executable name — the Windows counterpart of a bundle id.
    bundle_id: Option<String>,
    name: Option<String>,
}

fn app_info(pid: u32) -> AppInfo {
    let exe = process_exe(pid);
    let name = exe.as_deref().map(|exe| {
        let stem = exe.strip_suffix(".exe").unwrap_or(exe);
        let mut chars = stem.chars();
        match chars.next() {
            Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            None => String::new(),
        }
    });
    AppInfo {
        bundle_id: exe,
        name,
    }
}

struct FieldSnapshot {
    element: Elem,
    window: Option<HWND>,
    app: AppInfo,
    text: String,
    /// `FocusMemo::id` of the element: the same id is the same field.
    focus_id: u64,
    /// The text was read on this probe (not reused: no input since).
    read: bool,
}

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
    /// Lexora itself is focused (badge/panel clicked) — keep state.
    OwnApp,
    Nothing(Skipped),
    Field(FieldSnapshot),
}

/// UIA control type → the role vocabulary of `logic`. Rich-edit style
/// documents (Notepad, WordPad) are text areas; web page roots are not.
fn role_of(element: &Elem) -> Option<&'static str> {
    if element.is_password() {
        return Some(ROLE_SECURE);
    }
    if element.scintilla().is_some() {
        return Some(ROLE_TEXT_AREA);
    }
    let uia = element.uia()?;
    let control = cached_or_current(unsafe { uia.CachedControlType() }, || unsafe {
        uia.CurrentControlType()
    })?;
    if control == UIA_EditControlTypeId {
        Some(ROLE_TEXT_FIELD)
    } else if control == UIA_ComboBoxControlTypeId {
        Some(ROLE_COMBO_BOX)
    } else if control == UIA_DocumentControlTypeId
        && is_rich_editor_class(&element.class_name())
    {
        Some(ROLE_TEXT_AREA)
    } else {
        None
    }
}

/// Window classes of editable document controls: rich-edit boxes (Notepad,
/// WordPad) and the Word editor (`_WwG`: Outlook / Word message bodies).
fn is_rich_editor_class(class: &str) -> bool {
    let class = class.to_lowercase();
    class.contains("richedit") || class == "_wwg"
}

fn looks_like_search(name: &str) -> bool {
    let name = name.to_lowercase();
    name.contains("search") || name.contains("поиск") || name.contains("find")
}

/// Parent process of every running process (one snapshot).
fn parent_processes() -> Option<HashMap<u32, u32>> {
    unsafe {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0).ok()?;
        let mut entry = PROCESSENTRY32W {
            dwSize: size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };
        let mut parents = HashMap::new();
        if Process32FirstW(snapshot, &mut entry).is_ok() {
            loop {
                parents.insert(entry.th32ProcessID, entry.th32ParentProcessID);
                if Process32NextW(snapshot, &mut entry).is_err() {
                    break;
                }
            }
        }
        let _ = CloseHandle(snapshot);
        Some(parents)
    }
}

/// The focused element belongs to the foreground app: same process, or a
/// descendant of it. WebView2 apps (Teams, new Outlook, ...) own the window
/// in one process and render their text fields in a child `msedgewebview2`.
/// `None` when the process snapshot failed (it can, transiently).
fn is_same_app(element_pid: u32, foreground_pid: u32) -> Option<bool> {
    if element_pid == foreground_pid {
        return Some(true);
    }
    logic::same_app_verdict(element_pid, foreground_pid, parent_processes().as_ref())
}

/// The focused Scintilla control of the foreground window (Notepad++, SciTE).
/// UI Automation shows it as an unfocusable pane and never reports it as the
/// focused element, so ask the window's GUI thread which child has the focus.
fn focused_scintilla(window: HWND) -> Option<Elem> {
    let thread = unsafe { GetWindowThreadProcessId(window, None) };
    let mut info = GUITHREADINFO {
        cbSize: size_of::<GUITHREADINFO>() as u32,
        ..Default::default()
    };
    unsafe { GetGUIThreadInfo(thread, &mut info) }.ok()?;
    let focus = info.hwndFocus;
    if focus.0.is_null() {
        return None;
    }
    window_class(focus)
        .eq_ignore_ascii_case(SCINTILLA_CLASS)
        .then_some(Elem::Win32(focus))
}

/// The focused text control of the foreground window: Scintilla through its
/// window handle, anything else through UI Automation. With `request` the
/// static facts of the element arrive in the same call (`Cached*`).
fn focused_element(
    automation: &IUIAutomation,
    window: HWND,
    request: Option<&IUIAutomationCacheRequest>,
) -> Option<Elem> {
    focused_scintilla(window).or_else(|| {
        let focused = match request {
            Some(request) => unsafe { automation.GetFocusedElementBuildCache(request) }
                .or_else(|_| unsafe { automation.GetFocusedElement() }),
            None => unsafe { automation.GetFocusedElement() },
        };
        focused.ok().map(Elem::from_uia)
    })
}

/// Properties fetched together with the focused element: one round trip
/// to the watched app instead of one per property.
fn focus_cache_request(automation: &IUIAutomation) -> Option<IUIAutomationCacheRequest> {
    let request = unsafe { automation.CreateCacheRequest() }.ok()?;
    for property in [
        UIA_RuntimeIdPropertyId,
        UIA_ProcessIdPropertyId,
        UIA_ControlTypePropertyId,
        UIA_ClassNamePropertyId,
        UIA_NamePropertyId,
        UIA_IsPasswordPropertyId,
        UIA_NativeWindowHandlePropertyId,
    ] {
        unsafe { request.AddProperty(property) }.ok()?;
    }
    Some(request)
}

/// When the user last pressed a key, clicked, scrolled or moved the pointer
/// (in any app of this session). `None` when unknown: callers then read as
/// if there was input.
pub(super) fn last_input() -> Option<Instant> {
    let mut info = LASTINPUTINFO {
        cbSize: size_of::<LASTINPUTINFO>() as u32,
        dwTime: 0,
    };
    if !unsafe { GetLastInputInfo(&mut info) }.as_bool() {
        return None;
    }
    // Both are milliseconds since boot that wrap after 49.7 days.
    let idle = unsafe { GetTickCount() }.wrapping_sub(info.dwTime);
    Instant::now().checked_sub(Duration::from_millis(u64::from(idle)))
}

/// A fix was written or the watcher was reset: read the field on the next
/// probe even without user input.
static FORCE_READ: AtomicBool = AtomicBool::new(false);

/// Why a field is skipped, as reported to the Settings status line.
type Rejected = (ActivityCode, Option<String>);

#[derive(Clone)]
enum FieldRead {
    Text(String),
    TooLong,
    NoText,
    /// Read-only right now (a cheap signal; may change while focused).
    ReadOnly,
}

impl FieldRead {
    fn of(element: &Elem) -> Self {
        if element.quick_read_only() {
            return FieldRead::ReadOnly;
        }
        match element.read_text() {
            Some(text) if text.chars().count() > logic::MAX_CHECK_CHARS => FieldRead::TooLong,
            Some(text) => FieldRead::Text(text),
            None => FieldRead::NoText,
        }
    }
}

/// Word-style editors without a ValuePattern: the whole-document read-only
/// attribute. Expensive in long texts, so asked once per element (and once
/// more when its patterns show up late). Never asked of Scintilla.
fn document_read_only(element: &Elem) -> bool {
    element.scintilla().is_none() && element.text_is_read_only()
}

fn read_only_rejection() -> Rejected {
    (
        ActivityCode::UnsupportedField,
        Some("read-only".to_string()),
    )
}

/// The focused element of the last probe and what is known about it.
struct FocusMemo {
    /// Identifies the element in `TrackedField` without asking UIA.
    id: u64,
    /// The element, with its patterns once it turned out checkable.
    element: Elem,
    /// Why it is never checked (role, whole-document read-only); `None`
    /// for a checkable field. Fixed while the element stays focused.
    rejected: Option<Rejected>,
    /// The last read of its text and when it started.
    read: Option<(Instant, FieldRead)>,
}

impl FocusMemo {
    /// Everything about a newly focused element that does not change while
    /// it stays focused. The value of a password field is never read.
    fn learn(id: u64, element: Elem) -> Self {
        let role = role_of(&element);
        let subrole = (role == Some(ROLE_TEXT_FIELD) && looks_like_search(&element.name()))
            .then_some("AXSearchField");
        let (element, rejected) = if !logic::is_checkable_role(role, subrole) {
            let detail = role
                .map(str::to_string)
                .or_else(|| Some(element.class_name()))
                .filter(|detail| !detail.is_empty());
            (element, Some((ActivityCode::UnsupportedField, detail)))
        } else {
            // The cheap read-only signals are asked before every read
            // (`FieldRead::of`); only the whole-document one is kept.
            let element = element.with_patterns();
            let rejected = document_read_only(&element).then(read_only_rejection);
            (element, rejected)
        };
        Self {
            id,
            element,
            rejected,
            read: None,
        }
    }
}

/// What the watcher thread remembers between probes, so that a field that
/// stays focused costs the watched app as few calls as possible.
#[derive(Default)]
struct ProbeMemory {
    next_id: u64,
    focus: Option<FocusMemo>,
    /// Executable info of the last foreground process.
    app: Option<(u32, AppInfo)>,
    /// `is_same_app` for the last (element pid, foreground pid) pair: the
    /// process snapshot behind it is taken once per pair, not per probe.
    /// A failed snapshot is not remembered.
    same_app: Option<((u32, u32), bool)>,
}

impl ProbeMemory {
    fn app_info(&mut self, pid: u32) -> AppInfo {
        match self.app.as_ref() {
            Some((known, info)) if *known == pid => info.clone(),
            _ => {
                let info = app_info(pid);
                self.app = Some((pid, info.clone()));
                info
            }
        }
    }

    fn is_same_app(&mut self, element_pid: u32, foreground_pid: u32) -> bool {
        let key = (element_pid, foreground_pid);
        match self.same_app {
            Some((known, same)) if known == key => same,
            _ => match is_same_app(element_pid, foreground_pid) {
                Some(same) => {
                    self.same_app = Some((key, same));
                    same
                }
                None => false,
            },
        }
    }
}

struct ProbeContext<'a> {
    automation: &'a IUIAutomation,
    focus_request: Option<&'a IUIAutomationCacheRequest>,
    own_pid: u32,
    config: &'a WatchConfig,
}

fn probe(context: &ProbeContext<'_>, memory: &mut ProbeMemory) -> Probe {
    let Some((window, pid)) = foreground_window() else {
        memory.focus = None;
        return Skipped::probe(ActivityCode::NoField, None, None);
    };
    if pid == context.own_pid {
        return Probe::OwnApp;
    }
    // Put back only when this element is probed to the end.
    let known = memory.focus.take();
    let app = memory.app_info(pid);
    let exe = app.bundle_id.as_deref();
    if exe.is_some_and(|exe| BUILTIN_EXCLUDED.contains(&exe))
        || logic::is_app_excluded(exe, &context.config.excluded_apps)
    {
        return Skipped::probe(ActivityCode::ExcludedApp, Some(&app), app.bundle_id.clone());
    }
    let Some(element) = focused_element(context.automation, window, context.focus_request) else {
        return Skipped::probe(ActivityCode::NoField, Some(&app), None);
    };
    if !element
        .pid()
        .is_some_and(|element_pid| memory.is_same_app(element_pid, pid))
    {
        return Skipped::probe(ActivityCode::NoField, Some(&app), None);
    }
    // Asked of the element just focused, on every probe (with the focus
    // cache request it is local): a password field's value is never read,
    // even when a known field turns into one.
    if element.is_password() {
        return Skipped::probe(
            ActivityCode::UnsupportedField,
            Some(&app),
            Some(ROLE_SECURE.to_string()),
        );
    }
    let mut memo = match known.filter(|known| known.element.same_as(&element, context.automation)) {
        Some(known) => known,
        None => {
            memory.next_id = memory.next_id.wrapping_add(1);
            FocusMemo::learn(memory.next_id, element)
        }
    };
    if let Some((code, detail)) = memo.rejected.clone() {
        memory.focus = Some(memo);
        return Skipped::probe(code, Some(&app), detail);
    }
    // The same field and no input since it was read: its text cannot have
    // changed, so the app is not asked again (apart from a rare idle read
    // for text changed by dictation or another app).
    let forced = FORCE_READ.swap(false, Ordering::Relaxed);
    let fresh = forced
        || memo.read.as_ref().is_none_or(|(read_at, _)| {
            logic::text_read_due(last_input(), *read_at, Instant::now())
        });
    if fresh {
        // Patterns missing at focus time (lazy accessibility) are asked
        // for again; ones that show up late get the one-time check too.
        if memo.element.ensure_patterns() && document_read_only(&memo.element) {
            memo.rejected = Some(read_only_rejection());
            memory.focus = Some(memo);
            return Skipped::probe(
                ActivityCode::UnsupportedField,
                Some(&app),
                Some("read-only".to_string()),
            );
        }
        let read_at = Instant::now();
        memo.read = Some((read_at, FieldRead::of(&memo.element)));
    }
    let probe = match memo.read.as_ref().map(|(_, read)| read) {
        Some(FieldRead::Text(text)) => Probe::Field(FieldSnapshot {
            element: memo.element.clone(),
            window: Some(window),
            app,
            text: text.clone(),
            focus_id: memo.id,
            read: fresh,
        }),
        Some(FieldRead::TooLong) => Skipped::probe(ActivityCode::FieldTooLong, Some(&app), None),
        Some(FieldRead::ReadOnly) => {
            let (code, detail) = read_only_rejection();
            Skipped::probe(code, Some(&app), detail)
        }
        Some(FieldRead::NoText) | None => Skipped::probe(
            ActivityCode::UnsupportedField,
            Some(&app),
            Some("no text value".to_string()),
        ),
    };
    memory.focus = Some(memo);
    probe
}

/// App name and whether the text was read, for the probe-cost log.
fn probe_summary(probe: &Probe) -> (Option<String>, bool) {
    match probe {
        Probe::OwnApp => (Some("Lexora".to_string()), false),
        Probe::Nothing(skipped) => (skipped.app.as_ref().and_then(|app| app.name.clone()), false),
        Probe::Field(snapshot) => (snapshot.app.name.clone(), snapshot.read),
    }
}

fn log_probe_cost(summary: &logic::PollSummary, app: Option<&str>, read: bool, next: Duration) {
    log::debug!(
        "Writing check probe: {:?} (slowest {:?}, text read in {} of {} probes), app {}, read now: {read}, next poll in {next:?}",
        summary.last,
        summary.slowest,
        summary.reads,
        summary.probes,
        app.unwrap_or("-"),
    );
}

// ── Watcher state ────────────────────────────────────────

struct TrackedField {
    /// With its patterns: underline measuring and fixes reuse them.
    element: Elem,
    /// `FocusMemo::id` of the element.
    focus_id: u64,
    /// Top-level window of the app, to hand the focus back after the panel.
    window: Option<SendHwnd>,
    app: AppInfo,
}

#[derive(Clone, Copy)]
struct SendHwnd(HWND);

unsafe impl Send for SendHwnd {}

struct Watcher {
    state: WatchState,
    field: Option<TrackedField>,
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
    WATCHER
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

enum UiAction {
    Hide,
    Place {
        element: Elem,
        fallback: Option<Rect>,
        panel: bool,
        force: bool,
    },
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
    let own_pid = std::process::id();
    let mut automation: Option<IUIAutomation> = None;
    let mut focus_request: Option<IUIAutomationCacheRequest> = None;
    let mut memory = ProbeMemory::default();
    let mut language_checked = Instant::now();
    let mut stats = logic::PollStats::new(Instant::now());
    loop {
        let config = config_snapshot(&app);
        if !config.enabled {
            report(&app, ActivityCode::Disabled, None, None);
            thread::sleep(IDLE_INTERVAL);
            continue;
        }
        if language_checked.elapsed() >= LANGUAGE_REFRESH {
            refresh_language(&app);
            language_checked = Instant::now();
        }
        if automation.is_none() {
            automation = self::automation();
            focus_request = automation.as_ref().and_then(focus_cache_request);
        }
        let interval = match automation.as_ref() {
            Some(automation) => {
                let started = Instant::now();
                let context = ProbeContext {
                    automation,
                    focus_request: focus_request.as_ref(),
                    own_pid,
                    config: &config,
                };
                let observed = probe(&context, &mut memory);
                let (app_name, read) = probe_summary(&observed);
                tick(&app, observed, &config);
                let spent = started.elapsed();
                // Every UIA call waits for the watched app's UI thread: a
                // slow app is asked less often.
                let interval =
                    logic::next_poll_interval(spent, POLL_INTERVAL, logic::MAX_POLL_INTERVAL);
                if let Some(summary) = stats.record(spent, read, Instant::now()) {
                    log_probe_cost(&summary, app_name.as_deref(), read, interval);
                }
                interval
            }
            None => {
                report(&app, ActivityCode::NoAccess, None, None);
                POLL_INTERVAL
            }
        };
        thread::sleep(interval);
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
        // No input since the last read: the field has not moved either.
        let mut fresh_read = false;
        let decision = match observed {
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
                fresh_read = snapshot.read;
                let same = watcher
                    .field
                    .as_ref()
                    .is_some_and(|field| field.focus_id == snapshot.focus_id);
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
                    watcher.placed_for = None;
                }
                watcher.field = Some(TrackedField {
                    element: snapshot.element,
                    focus_id: snapshot.focus_id,
                    window: snapshot.window.map(SendHwnd),
                    app: snapshot.app,
                });
                decision
            }
        };

        stale_marks = field_changed
            || matches!(decision, Decision::Hide | Decision::Pending { .. });
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
                if watcher.visible && (fresh_read || collapsed) {
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
            .accept_first_mouse(true)
            .skip_taskbar(true)
            .focused(false)
            .visible(false)
            .build()?;
    Ok(window)
}

fn place_window_async(app: &AppHandle, field: Rect, panel: bool) {
    let handle = app.clone();
    let dispatched = app.run_on_main_thread(move || {
        if let Err(e) = place_window(&handle, field, panel) {
            log::debug!("Writing-check badge placement skipped: {e}");
        }
    });
    if let Err(e) = dispatched {
        log::debug!("Failed to dispatch badge placement: {e}");
    }
}

/// Visible work area (physical px) and scale factor of the screen that
/// holds the point.
pub(super) fn screen_at(app: &AppHandle, x: f64, y: f64) -> Option<(Rect, f64)> {
    let monitors = app.available_monitors().ok()?;
    let areas: Vec<LogicalBounds> = monitors
        .iter()
        .map(|monitor| {
            let area = monitor.work_area();
            LogicalBounds::from_physical(
                area.position.x,
                area.position.y,
                area.size.width,
                area.size.height,
                1.0,
            )
        })
        .collect();
    let screen = pick_bounds_for_point(x, y, &areas)?;
    let scale = areas
        .iter()
        .zip(&monitors)
        .find(|(area, _)| area.x == screen.x && area.y == screen.y)
        .map_or(1.0, |(_, monitor)| monitor.scale_factor());
    let visible = Rect {
        x: screen.x,
        y: screen.y,
        width: screen.width,
        height: screen.height,
    };
    Some((visible, scale))
}

fn place_window(app: &AppHandle, field: Rect, panel: bool) -> Result<(), AppError> {
    let window = match app.get_webview_window(GRAMMAR_LABEL) {
        Some(window) => window,
        None => build_window(app)?,
    };
    let (center_x, center_y) = field.center();
    let no_screen = || AppError::Io("No screen available for the badge".to_string());
    let (screen, scale) = screen_at(app, center_x, center_y).ok_or_else(no_screen)?;

    let badge = logic::badge_frame(&field, BADGE_SIZE * scale, &screen);
    let frame = if panel {
        logic::panel_frame(&badge, PANEL_WIDTH * scale, PANEL_HEIGHT * scale, &screen)
    } else {
        badge
    };

    let hwnd = window.hwnd()?;
    unsafe {
        // Never take the focus from the user's app — except for the panel,
        // which must receive keys (Escape) after the click that opened it.
        let mut style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        style |= WS_EX_TOOLWINDOW.0 as isize;
        if panel {
            style &= !(WS_EX_NOACTIVATE.0 as isize);
        } else {
            style |= WS_EX_NOACTIVATE.0 as isize;
        }
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style);
        let mut flags = SWP_FRAMECHANGED | SWP_SHOWWINDOW;
        if !panel {
            flags |= SWP_NOACTIVATE;
        }
        let (width, height) = (frame.width.round() as i32, frame.height.round() as i32);
        SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            frame.x.round() as i32,
            frame.y.round() as i32,
            width,
            height,
            flags,
        )
        .map_err(|e| AppError::Io(format!("Could not place the badge: {e}")))?;
        // The badge is a circle: clip the window to one so nothing square
        // (shadow, webview background) can show around it. The panel is
        // a rectangle again.
        if panel {
            SetWindowRgn(hwnd, None, true);
            let _ = SetForegroundWindow(hwnd);
        } else {
            // The system owns the region after this call.
            SetWindowRgn(hwnd, Some(CreateEllipticRgn(0, 0, width, height)), true);
        }
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

// ── Underlines and hover card ────────────────────────────

/// Talk to UI Automation from the calling thread (watcher, blocking pool).
pub(super) fn prepare_thread() {
    ensure_com();
}

/// Pointer position in physical screen px (the space UI Automation uses).
pub(super) fn cursor_position() -> Option<(f64, f64)> {
    let mut point = POINT::default();
    unsafe { GetCursorPos(&mut point) }.ok()?;
    Some((f64::from(point.x), f64::from(point.y)))
}

/// Where each flagged word of the tracked field is drawn. `text` is the
/// checked (trimmed) text; words that cannot be located reliably are left out.
pub(super) fn mark_geometry(
    field_id: u64,
    text: &str,
    marks: &[MarkInput],
) -> Option<MarkGeometry> {
    let (element, _, fallback) = current_field(field_id).ok()?;
    // Only UI Automation can measure text; Scintilla windows cannot.
    element.uia()?;
    let current = element.read_text()?;
    // The field must still hold the text the offsets refer to.
    let lead = logic::body_offset_utf16(&current, text)?;
    let field_bounds = element.bounds().or(fallback)?;
    let mut walker = RangeWalker::new(&element)?;
    // Measured front to back so the range only ever walks forward; the
    // regions keep the order of `marks`.
    let mut order: Vec<usize> = (0..marks.len()).collect();
    order.sort_by_key(|&index| marks.get(index).map_or(0, |mark| mark.start));
    let mut measured: Vec<Option<Vec<Rect>>> = vec![None; marks.len()];
    for index in order {
        let Some(mark) = marks.get(index) else {
            continue;
        };
        let Some(fragment) = logic::utf16_slice(text, mark.start, mark.end) else {
            continue;
        };
        let start = lead + mark.start;
        let len = mark.end - mark.start;
        // Some controls count every line break as two characters.
        let shifted = start + logic::newlines_before_utf16(&current, start);
        let offsets = if shifted == start {
            vec![start]
        } else {
            vec![start, shifted]
        };
        let rects = offsets
            .iter()
            .find_map(|&offset| walker.walk(offset, len, &fragment))
            .or_else(|| {
                offsets
                    .iter()
                    .find_map(|&offset| walker.anchored(offset, len, &fragment))
            });
        if let Some(slot) = measured.get_mut(index) {
            *slot = rects;
        }
    }
    let regions = marks
        .iter()
        .zip(measured)
        .filter_map(|(mark, rects)| {
            rects
                .filter(|rects| !rects.is_empty())
                .map(|rects| (mark.id, rects))
        })
        .collect();
    Some(MarkGeometry {
        field_bounds,
        regions,
    })
}

fn build_overlay(app: &AppHandle, overlay: Overlay) -> Result<tauri::WebviewWindow, AppError> {
    let window = WebviewWindowBuilder::new(app, overlay.label(), WebviewUrl::App(overlay.url().into()))
        .title(crate::i18n::text(app, "Lexora Writing Check"))
        .inner_size(BADGE_SIZE, BADGE_SIZE)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .background_color(Color(0, 0, 0, 0))
        .resizable(false)
        .always_on_top(true)
        .accept_first_mouse(true)
        .skip_taskbar(true)
        .focused(false)
        .visible(false)
        .build()?;
    if overlay == Overlay::Marks {
        // Underlines never catch clicks: the text below stays editable.
        window.set_ignore_cursor_events(true)?;
    }
    Ok(window)
}

/// Show an overlay window at `frame` (physical px) without taking the focus.
pub(super) fn show_overlay(app: &AppHandle, overlay: Overlay, frame: Rect) {
    let handle = app.clone();
    let dispatched = app.run_on_main_thread(move || {
        if let Err(e) = place_overlay(&handle, overlay, frame) {
            log::debug!("Writing-check overlay placement skipped: {e}");
        }
    });
    if let Err(e) = dispatched {
        log::debug!("Failed to dispatch overlay placement: {e}");
    }
}

fn place_overlay(app: &AppHandle, overlay: Overlay, frame: Rect) -> Result<(), AppError> {
    let window = match app.get_webview_window(overlay.label()) {
        Some(window) => window,
        None => build_overlay(app, overlay)?,
    };
    let hwnd = window.hwnd()?;
    let target_scale = screen_at(app, frame.x + frame.width / 2.0, frame.y + frame.height / 2.0)
        .map(|(_, scale)| scale);
    let position = |hwnd: HWND| unsafe {
        SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            frame.x.round() as i32,
            frame.y.round() as i32,
            frame.width.round() as i32,
            frame.height.round() as i32,
            SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOACTIVATE,
        )
    };
    unsafe {
        let mut style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        style |= (WS_EX_TOOLWINDOW.0 | WS_EX_NOACTIVATE.0) as isize;
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style);
    }
    position(hwnd).map_err(|e| AppError::Io(format!("Could not place the overlay: {e}")))?;
    // Moving to a screen with another DPI makes the window resize itself
    // to keep its logical size: put it back to the exact frame.
    if window.scale_factor().ok() != target_scale {
        let _ = position(hwnd);
    }
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

// ── Commands ─────────────────────────────────────────────

pub fn reset(app: &AppHandle) {
    *lock_watcher() = None;
    FORCE_READ.store(true, Ordering::Relaxed);
    hide_window(app);
}

fn current_field(field_id: u64) -> Result<(Elem, Option<SendHwnd>, Option<Rect>), AppError> {
    let guard = lock_watcher();
    let gone = || AppError::Validation("The text field is no longer focused".to_string());
    let watcher = guard
        .as_ref()
        .filter(|watcher| watcher.state.field_id() == Some(field_id))
        .ok_or_else(gone)?;
    let field = watcher.field.as_ref().ok_or_else(gone)?;
    Ok((field.element.clone(), field.window, watcher.placed_for))
}

fn return_focus(window: Option<SendHwnd>) {
    if let Some(SendHwnd(hwnd)) = window {
        let _ = unsafe { SetForegroundWindow(hwnd) };
    }
}

pub fn set_panel_open(app: &AppHandle, open: bool) -> Result<(), AppError> {
    let (element, window, fallback) = {
        let mut guard = lock_watcher();
        let none = || AppError::Validation("No text field is being checked".to_string());
        let watcher = guard
            .as_mut()
            .filter(|watcher| watcher.visible)
            .ok_or_else(none)?;
        let field = watcher.field.as_ref().ok_or_else(none)?;
        watcher.panel_open = open;
        (field.element.clone(), field.window, watcher.placed_for)
    };
    if let Some(bounds) = element.bounds().or(fallback) {
        place_window_async(app, bounds, open);
    }
    if !open {
        return_focus(window);
    }
    Ok(())
}

pub fn snooze(app: &AppHandle, field_id: u64) {
    let window = {
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
        watcher.field.as_ref().and_then(|field| field.window)
    };
    clear_marks(app);
    hide_window(app);
    publish(app, FieldPayload::Hidden);
    return_focus(window);
}

pub fn apply_fix(
    app: &AppHandle,
    field_id: u64,
    checked: &str,
    corrected: &str,
) -> Result<(), AppError> {
    let (element, window, _) = current_field(field_id)?;
    set_writing(true);
    let result = write_text(app, &element, window, checked, corrected);
    // The field changed without user input: the next probe must read it.
    FORCE_READ.store(true, Ordering::Relaxed);
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

fn wait_for_value(element: &Elem, expected: &str) -> bool {
    let started = Instant::now();
    loop {
        if element.read_text().as_deref() == Some(expected) {
            return true;
        }
        if started.elapsed() >= VALUE_SETTLE_TIMEOUT {
            return false;
        }
        thread::sleep(VALUE_SETTLE_STEP);
    }
}

fn set_value(element: &Elem, text: &str) -> bool {
    let Some(pattern) = element.value_pattern() else {
        return false;
    };
    // Plain Win32 edit controls need CRLF to show line breaks.
    let native = text.replace('\n', "\r\n");
    unsafe { pattern.SetValue(&BSTR::from(native)) }.is_ok()
}

/// Write the fix with the least intrusive method that works in this app:
/// 1. set the field value through UI Automation (plain edit controls);
/// 2. select the changed span (or everything) and paste over it.
///
/// Returns the new full field value.
fn write_text(
    app: &AppHandle,
    element: &Elem,
    window: Option<SendHwnd>,
    checked: &str,
    corrected: &str,
) -> Result<String, AppError> {
    ensure_com();
    let current = element
        .read_text()
        .ok_or_else(|| AppError::Validation("Could not read the text field".to_string()))?;
    let new_text = logic::rebuild_field_text(&current, checked, corrected).ok_or_else(|| {
        AppError::Validation(
            "The text changed after the check — wait for the new result".to_string(),
        )
    })?;
    let Some(edit) = logic::word_aligned_edit(&current, &new_text) else {
        return Ok(new_text);
    };

    if !element.is_read_only() && set_value(element, &new_text) && wait_for_value(element, &new_text)
    {
        return Ok(new_text);
    }

    // Never paste over a field that already changed in an unknown way.
    match element.read_text() {
        Some(value) if value == new_text => return Ok(new_text),
        Some(value) if value == current => {}
        _ => {
            return Err(AppError::Validation(
                "The text changed while applying the fix".to_string(),
            ))
        }
    }
    paste_fallback(app, element, window, &current, &edit, &new_text)?;
    if wait_for_value(element, &new_text) {
        Ok(new_text)
    } else {
        Err(AppError::Io(
            "This app did not accept the fix. Select the text and use the Lexora hotkey instead."
                .to_string(),
        ))
    }
}

fn key_event(key: VIRTUAL_KEY, up: bool) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: key,
                wScan: 0,
                dwFlags: if up {
                    KEYEVENTF_KEYUP
                } else {
                    KEYBD_EVENT_FLAGS(0)
                },
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn send_keys(inputs: &[INPUT]) -> bool {
    let sent = unsafe { SendInput(inputs, size_of::<INPUT>() as i32) };
    usize::try_from(sent).is_ok_and(|sent| sent == inputs.len())
}

fn press_ctrl(key: VIRTUAL_KEY) -> bool {
    send_keys(&[
        key_event(VK_CONTROL, false),
        key_event(key, false),
        key_event(key, true),
        key_event(VK_CONTROL, true),
    ])
}

fn paste_fallback(
    app: &AppHandle,
    element: &Elem,
    window: Option<SendHwnd>,
    current: &str,
    edit: &TextEdit,
    new_text: &str,
) -> Result<(), AppError> {
    return_focus(window);
    thread::sleep(FOCUS_RETURN_DELAY);
    // Keystrokes must land in the same field, not wherever focus went.
    let same_field = automation()
        .and_then(|automation| {
            let (foreground, _) = foreground_window()?;
            let focused = focused_element(&automation, foreground, None)?;
            Some(focused.same_as(element, &automation))
        })
        .unwrap_or(false);
    if !same_field {
        return Err(AppError::Validation(
            "The text field is no longer focused".to_string(),
        ));
    }

    // Offsets are exact only without line breaks (UIA counts CRLF its own way).
    let span_selected = !current.contains('\n') && {
        let removed: String = {
            let units: Vec<u16> = current.encode_utf16().collect();
            String::from_utf16_lossy(&units[edit.start..edit.start + edit.removed])
        };
        if element.scintilla().is_some() {
            element.scintilla_select_span(current, edit.start, edit.removed)
        } else {
            element.select_span(edit.start, edit.removed, &removed)
        }
    };
    let (payload, select_all) = if span_selected {
        (edit.inserted.as_str(), false)
    } else {
        (new_text, true)
    };
    if select_all && !element.select_all() && !press_ctrl(VK_A) {
        return Err(AppError::Permission(
            "Windows blocked sending keystrokes to this app".to_string(),
        ));
    }
    if payload.is_empty() {
        send_keys(&[key_event(VK_DELETE, false), key_event(VK_DELETE, true)]);
        return Ok(());
    }
    // The clipboard carries the fix for a moment; the user's text is put
    // back afterwards (non-text clipboard content cannot be restored).
    let previous = app.clipboard().read_text().ok();
    app.clipboard()
        .write_text(payload.to_string())
        .map_err(|e| AppError::Io(format!("Could not use the clipboard: {e}")))?;
    let pasted = press_ctrl(VK_V);
    thread::sleep(PASTE_SETTLE);
    if let Some(previous) = previous {
        let _ = app.clipboard().write_text(previous);
    }
    if pasted {
        Ok(())
    } else {
        Err(AppError::Permission(
            "Windows blocked sending keystrokes to this app".to_string(),
        ))
    }
}
