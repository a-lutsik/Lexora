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
use super::{
    config_snapshot, publish, refresh_language, report, ActivityCode, FieldPayload, WatchConfig,
    BADGE_SIZE, GRAMMAR_LABEL, PANEL_EVENT, PANEL_HEIGHT, PANEL_WIDTH,
};
use crate::display::{pick_bounds_for_point, LogicalBounds};
use crate::error::AppError;
use std::collections::HashMap;
use std::mem::size_of;
use std::sync::{Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant};
use tauri::window::Color;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_clipboard_manager::ClipboardExt;
use windows::core::{BSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HWND, RECT, LPARAM, WPARAM};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Accessibility::{
    CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationTextPattern,
    IUIAutomationValuePattern, TextPatternRangeEndpoint_End, TextPatternRangeEndpoint_Start,
    TextUnit_Character, UIA_ComboBoxControlTypeId, UIA_DocumentControlTypeId,
    UIA_EditControlTypeId, UIA_IsReadOnlyAttributeId, UIA_TextPatternId, UIA_ValuePatternId,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP,
    VIRTUAL_KEY, VK_A, VK_CONTROL, VK_DELETE, VK_V,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetClassNameW, GetForegroundWindow, GetGUIThreadInfo, GetWindowLongPtrW, GetWindowRect,
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
    Uia(IUIAutomationElement),
    /// A plain Win32 window driven by window messages only (Scintilla):
    /// UI Automation is never called for it, because its provider chain
    /// crashed the process while typing in Notepad++.
    Win32(HWND),
}

impl Elem {
    fn uia(&self) -> Option<&IUIAutomationElement> {
        match self {
            Elem::Uia(element) => Some(element),
            Elem::Win32(_) => None,
        }
    }
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
            Elem::Uia(element) => {
                if !self.class_name().eq_ignore_ascii_case(SCINTILLA_CLASS) {
                    return None;
                }
                let window = unsafe { element.CurrentNativeWindowHandle() }.ok()?;
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
            (Elem::Uia(a), Elem::Uia(b)) => unsafe { automation.CompareElements(a, b) }
                .map(|same| same.as_bool())
                .unwrap_or(false),
            (Elem::Win32(a), Elem::Win32(b)) => a == b,
            _ => false,
        }
    }

    fn pid(&self) -> Option<u32> {
        match self {
            Elem::Uia(element) => unsafe { element.CurrentProcessId() }
                .ok()
                .and_then(|pid| u32::try_from(pid).ok()),
            Elem::Win32(window) => {
                let mut pid = 0u32;
                unsafe { GetWindowThreadProcessId(*window, Some(&mut pid)) };
                (pid != 0).then_some(pid)
            }
        }
    }

    fn class_name(&self) -> String {
        match self {
            Elem::Uia(element) => unsafe { element.CurrentClassName() }
                .map(|name| name.to_string())
                .unwrap_or_default(),
            Elem::Win32(window) => window_class(*window),
        }
    }

    fn name(&self) -> String {
        self.uia()
            .and_then(|element| unsafe { element.CurrentName() }.ok())
            .map(|name| name.to_string())
            .unwrap_or_default()
    }

    fn is_password(&self) -> bool {
        self.uia()
            .and_then(|element| unsafe { element.CurrentIsPassword() }.ok())
            .is_some_and(|flag| flag.as_bool())
    }

    fn value_pattern(&self) -> Option<IUIAutomationValuePattern> {
        let element = self.uia()?;
        unsafe { element.GetCurrentPatternAs::<IUIAutomationValuePattern>(UIA_ValuePatternId) }.ok()
    }

    fn text_pattern(&self) -> Option<IUIAutomationTextPattern> {
        let element = self.uia()?;
        unsafe { element.GetCurrentPatternAs::<IUIAutomationTextPattern>(UIA_TextPatternId) }.ok()
    }

    fn is_read_only(&self) -> bool {
        if let Some(window) = self.scintilla() {
            return sci_send(window, SCI_GETREADONLY, 0, 0).is_none_or(|flag| flag != 0);
        }
        let value_read_only = self
            .value_pattern()
            .and_then(|pattern| unsafe { pattern.CurrentIsReadOnly() }.ok())
            .is_some_and(|flag| flag.as_bool());
        value_read_only || self.text_is_read_only()
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
            Elem::Uia(element) => unsafe { element.CurrentBoundingRectangle() }.ok()?,
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
    let control = unsafe { element.uia()?.CurrentControlType() }.ok()?;
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
fn is_same_app(element_pid: u32, foreground_pid: u32) -> bool {
    if element_pid == foreground_pid {
        return true;
    }
    let Some(parents) = parent_processes() else {
        return false;
    };
    let mut current = element_pid;
    for _ in 0..6 {
        match parents.get(&current) {
            Some(&parent) if parent == foreground_pid => return true,
            Some(&parent) if parent != 0 && parent != current => current = parent,
            _ => return false,
        }
    }
    false
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
/// window handle, anything else through UI Automation.
fn focused_element(automation: &IUIAutomation, window: HWND) -> Option<Elem> {
    focused_scintilla(window).or_else(|| {
        unsafe { automation.GetFocusedElement() }
            .ok()
            .map(Elem::Uia)
    })
}

fn probe(automation: &IUIAutomation, own_pid: u32, config: &WatchConfig) -> Probe {
    let Some((window, pid)) = foreground_window() else {
        return Skipped::probe(ActivityCode::NoField, None, None);
    };
    if pid == own_pid {
        return Probe::OwnApp;
    }
    let app = app_info(pid);
    let exe = app.bundle_id.as_deref();
    if exe.is_some_and(|exe| BUILTIN_EXCLUDED.contains(&exe))
        || logic::is_app_excluded(exe, &config.excluded_apps)
    {
        return Skipped::probe(ActivityCode::ExcludedApp, Some(&app), app.bundle_id.clone());
    }
    let Some(element) = focused_element(automation, window) else {
        return Skipped::probe(ActivityCode::NoField, Some(&app), None);
    };
    if !element.pid().is_some_and(|element_pid| is_same_app(element_pid, pid)) {
        return Skipped::probe(ActivityCode::NoField, Some(&app), None);
    }
    let role = role_of(&element);
    // Role first: the value of a password field is never read.
    let subrole = (role == Some(ROLE_TEXT_FIELD) && looks_like_search(&element.name()))
        .then_some("AXSearchField");
    if !logic::is_checkable_role(role, subrole) {
        let detail = role
            .map(str::to_string)
            .or_else(|| Some(element.class_name()))
            .filter(|detail| !detail.is_empty());
        return Skipped::probe(ActivityCode::UnsupportedField, Some(&app), detail);
    }
    if element.is_read_only() {
        return Skipped::probe(
            ActivityCode::UnsupportedField,
            Some(&app),
            Some("read-only".to_string()),
        );
    }
    let Some(text) = element.read_text() else {
        return Skipped::probe(
            ActivityCode::UnsupportedField,
            Some(&app),
            Some("no text value".to_string()),
        );
    };
    if text.chars().count() > logic::MAX_CHECK_CHARS {
        return Skipped::probe(ActivityCode::FieldTooLong, Some(&app), None);
    }
    Probe::Field(FieldSnapshot {
        element,
        window: Some(window),
        app,
        text,
    })
}

// ── Watcher state ────────────────────────────────────────

struct TrackedField {
    element: Elem,
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
    let mut language_checked = Instant::now();
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
        }
        match automation.as_ref() {
            Some(automation) => {
                let observed = probe(automation, own_pid, &config);
                tick(&app, automation, observed, &config);
            }
            None => report(&app, ActivityCode::NoAccess, None, None),
        }
        thread::sleep(POLL_INTERVAL);
    }
}

fn tick(app: &AppHandle, automation: &IUIAutomation, observed: Probe, config: &WatchConfig) {
    let now = Instant::now();
    let mut actions: Vec<UiAction> = Vec::new();
    let mut payload: Option<FieldPayload> = None;
    {
        let mut guard = lock_watcher();
        let watcher = guard.get_or_insert_with(|| Watcher::new(now));
        if watcher.writing {
            return;
        }
        let checkable = |text: &str| logic::text_is_checkable(text, &config.language);
        let mut field_changed = false;
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
                let same = watcher
                    .field
                    .as_ref()
                    .is_some_and(|field| field.element.same_as(&snapshot.element, automation));
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
                    window: snapshot.window.map(SendHwnd),
                    app: snapshot.app,
                });
                decision
            }
        };

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

    if let Some(payload) = payload {
        publish(app, payload);
    }
    for action in actions {
        run_action(app, action);
    }
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

fn place_window(app: &AppHandle, field: Rect, panel: bool) -> Result<(), AppError> {
    let window = match app.get_webview_window(GRAMMAR_LABEL) {
        Some(window) => window,
        None => build_window(app)?,
    };
    let monitors = app.available_monitors()?;
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
    let (center_x, center_y) = field.center();
    let no_screen = || AppError::Io("No screen available for the badge".to_string());
    let screen = pick_bounds_for_point(center_x, center_y, &areas).ok_or_else(no_screen)?;
    let scale = areas
        .iter()
        .zip(&monitors)
        .find(|(area, _)| area.x == screen.x && area.y == screen.y)
        .map_or(1.0, |(_, monitor)| monitor.scale_factor());
    let screen = Rect {
        x: screen.x,
        y: screen.y,
        width: screen.width,
        height: screen.height,
    };

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
        SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            frame.x.round() as i32,
            frame.y.round() as i32,
            frame.width.round() as i32,
            frame.height.round() as i32,
            flags,
        )
        .map_err(|e| AppError::Io(format!("Could not place the badge: {e}")))?;
        if panel {
            let _ = SetForegroundWindow(hwnd);
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

// ── Commands ─────────────────────────────────────────────

pub fn reset(app: &AppHandle) {
    *lock_watcher() = None;
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
            let focused = focused_element(&automation, foreground)?;
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
