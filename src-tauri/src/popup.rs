// ============================================================
// LEXORA — Popup Translator Window
// Создание/переиспользование окна быстрого перевода, позиция
// у курсора, событие `lexora:popup-text` для фронтенда.
// ============================================================

#[cfg(not(target_os = "macos"))]
use crate::display::{anchor_near_cursor_physical, LogicalBounds};
use crate::error::AppError;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::window::Color;
#[cfg(not(target_os = "macos"))]
use tauri::PhysicalPosition;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_notification::NotificationExt;

/// Снимок курсора в момент хоткея.
/// На macOS хранит **CGEventGetLocation** (origin сверху-слева у primary, Y вниз,
/// пункты). В Cocoa переводится на main thread через высоту `NSScreen.frame`,
/// не через `CGDisplayPixelsHigh()` — иначе на Retina окно уезжает на другой монитор.
#[derive(Debug, Clone, Copy)]
pub struct CursorAnchor {
    pub x: f64,
    pub y: f64,
}

pub const POPUP_LABEL: &str = "popup";
const DICTIONARY_WIDTH: f64 = 460.0;
const DICTIONARY_HEIGHT: f64 = 600.0;
const ASSISTANT_WIDTH: f64 = 720.0;
const ASSISTANT_HEIGHT: f64 = 420.0;
const ASSISTANT_MIN_WIDTH: f64 = 680.0;
const ASSISTANT_MIN_HEIGHT: f64 = 320.0;
const ASSISTANT_MAX_WIDTH: f64 = 1440.0; // 2× default
const ASSISTANT_MAX_HEIGHT: f64 = 840.0;
const MIN_POPUP_WIDTH: f64 = 320.0;
const MAX_POPUP_WIDTH: f64 = ASSISTANT_MAX_WIDTH;
const MIN_POPUP_HEIGHT: f64 = 240.0;
const MAX_POPUP_HEIGHT: f64 = ASSISTANT_MAX_HEIGHT;
/// Matches `--radius-xl` in `src/styles/tokens.css`.
#[cfg(target_os = "macos")]
const POPUP_CORNER_RADIUS: f64 = 20.0;
/// Задержка перед AX-заменой / Cmd+V, чтобы фокус вернулся в исходное приложение.
const PASTE_DELAY: Duration = Duration::from_millis(55);
/// Отступ от курсора и от краёв монитора (логические пиксели).
const POPUP_MARGIN: f64 = 12.0;

/// Событие с захваченным выделенным текстом для popup-фронтенда.
pub const POPUP_TEXT_EVENT: &str = "lexora:popup-text";

/// Хранилище отложенного текста для окна перевода (гарантирует доставку даже до готовности React).
#[derive(Default)]
pub struct PendingPopupText(pub Mutex<Option<String>>);

/// Последний якорь курсора: нужен после resize (фронт меняет размер без нового хоткея).
static LAST_CURSOR_ANCHOR: Mutex<Option<CursorAnchor>> = Mutex::new(None);

/// Приложение, активное в момент хоткея (pid). Клик по popup активирует Lexora —
/// перед заменой текста и при закрытии фокус возвращается туда, как у Grammarly.
static SOURCE_APP_PID: Mutex<Option<i32>> = Mutex::new(None);

fn set_source_app(pid: Option<i32>) {
    if let Ok(mut lock) = SOURCE_APP_PID.lock() {
        *lock = pid;
    }
}

/// Запомнить активное приложение до показа popup (вызывается из хоткея).
pub fn remember_source_app() {
    #[cfg(target_os = "macos")]
    set_source_app(macos::frontmost_app_pid());
    #[cfg(target_os = "windows")]
    if let Ok(mut lock) = SOURCE_WINDOW.lock() {
        *lock = crate::hotkeys::foreground_window_handle();
    }
}

/// Window (HWND) active at the hotkey — the Windows counterpart of `SOURCE_APP_PID`.
#[cfg(target_os = "windows")]
static SOURCE_WINDOW: Mutex<isize> = Mutex::new(0);

/// Если клик по popup сделал Lexora активной — вернуть фокус исходному
/// приложению, чтобы вставка попала в его текстовое поле.
fn return_focus_to_source_app(app: &AppHandle) {
    #[cfg(target_os = "windows")]
    if let Ok(handle) = SOURCE_WINDOW.lock() {
        let _ = app;
        crate::hotkeys::focus_window(*handle);
    }
    #[cfg(not(target_os = "windows"))]
    {
        let Some(pid) = SOURCE_APP_PID.lock().ok().and_then(|guard| *guard) else {
            return;
        };
        #[cfg(target_os = "macos")]
        macos::activate_app_dispatch(app, pid);
        #[cfg(not(target_os = "macos"))]
        let _ = (app, pid);
    }
}

/// Hand focus back to `pid` if Lexora took it (writing-check panel).
#[cfg(target_os = "macos")]
pub(crate) fn activate_app_pid(app: &AppHandle, pid: i32) {
    macos::activate_app_dispatch(app, pid);
}

fn remember_cursor_anchor(cursor: Option<CursorAnchor>) {
    if let Ok(mut lock) = LAST_CURSOR_ANCHOR.lock() {
        *lock = cursor;
    }
}

fn last_cursor_anchor() -> Option<CursorAnchor> {
    LAST_CURSOR_ANCHOR.lock().ok().and_then(|guard| *guard)
}

fn current_pending_text(app: &AppHandle) -> Option<Option<String>> {
    let state = app.try_state::<PendingPopupText>()?;
    state.0.lock().ok().map(|guard| guard.clone())
}

fn emit_popup_text(app: &AppHandle, text: &str) {
    let _ = app.emit(POPUP_TEXT_EVENT, &text);
    if let Some(window) = app.get_webview_window(POPUP_LABEL) {
        let _ = window.emit(POPUP_TEXT_EVENT, text);
    }
}

/// Повторяем emit, пока pending не сменился: окно может быть ещё не готово,
/// React Strict Mode перемонтирует слушатель. Пустой payload тоже ретраим,
/// чтобы reused-окно очищалось при ручном открытии.
fn schedule_popup_text_retries(app: &AppHandle, expected: Option<String>) {
    let app_handle = app.clone();
    thread::spawn(move || {
        for delay_ms in [80_u64, 280] {
            thread::sleep(Duration::from_millis(delay_ms));
            let still_current =
                current_pending_text(&app_handle).is_some_and(|pending| pending == expected);
            if !still_current {
                return;
            }
            let value = expected.clone().unwrap_or_default();
            emit_popup_text(&app_handle, &value);
        }
    });
}

/// Снимок позиции курсора. На macOS — CGEventGetLocation (любой поток).
pub fn snapshot_cursor_anchor() -> Option<CursorAnchor> {
    #[cfg(target_os = "macos")]
    {
        macos::snapshot_cursor()
    }
    #[cfg(not(target_os = "macos"))]
    {
        None
    }
}

/// Позиция рядом с курсором (физические пиксели), с clamp по work area.
#[cfg(not(target_os = "macos"))]
fn popup_position_physical(app: &AppHandle, width: f64, height: f64) -> Option<(i32, i32)> {
    let cursor = app.cursor_position().ok()?;
    let monitor = match app.monitor_from_point(cursor.x, cursor.y) {
        Ok(Some(monitor)) => monitor,
        _ => app.primary_monitor().ok()??,
    };
    let area = monitor.work_area();
    let work = LogicalBounds {
        x: f64::from(area.position.x),
        y: f64::from(area.position.y),
        width: f64::from(area.size.width),
        height: f64::from(area.size.height),
    };
    Some(anchor_near_cursor_physical(
        cursor.x,
        cursor.y,
        width,
        height,
        &work,
        POPUP_MARGIN,
        monitor.scale_factor(),
    ))
}

/// Fallback: центр work area primary/cursor monitor.
#[cfg(not(target_os = "macos"))]
fn popup_position_fallback(app: &AppHandle, width: f64, height: f64) -> Option<(i32, i32)> {
    let monitor = app.primary_monitor().ok()??;
    let area = monitor.work_area();
    let scale = monitor.scale_factor();
    let scale = if scale <= 0.0 { 1.0 } else { scale };
    let w = width * scale;
    let h = height * scale;
    let x = f64::from(area.position.x) + (f64::from(area.size.width) - w) / 2.0;
    let y = f64::from(area.position.y) + (f64::from(area.size.height) - h) / 2.0;
    Some((x.round() as i32, y.round() as i32))
}

fn reposition_popup_near_cursor(
    app: &AppHandle,
    window: &tauri::WebviewWindow,
    width: f64,
    height: f64,
    cursor: Option<CursorAnchor>,
    bring_front: bool,
) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        macos::reposition_near_cursor_dispatch(app, window, cursor, width, height, bring_front)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (cursor, bring_front);
        let (x, y) = popup_position_physical(app, width, height)
            .or_else(|| popup_position_fallback(app, width, height))
            .ok_or_else(|| AppError::Io("No monitor available for popup position".to_string()))?;
        window.set_position(PhysicalPosition::new(x, y))?;
        Ok(())
    }
}

fn apply_popup_size(
    window: &tauri::WebviewWindow,
    width: f64,
    height: f64,
    resizable: bool,
) -> Result<(), AppError> {
    window.set_resizable(resizable)?;
    if resizable {
        window.set_min_size(Some(LogicalSize::new(
            ASSISTANT_MIN_WIDTH,
            ASSISTANT_MIN_HEIGHT,
        )))?;
        window.set_max_size(Some(LogicalSize::new(
            ASSISTANT_MAX_WIDTH,
            ASSISTANT_MAX_HEIGHT,
        )))?;
    } else {
        window.set_min_size(Some(LogicalSize::new(width, height)))?;
        window.set_max_size(Some(LogicalSize::new(width, height)))?;
    }
    // On macOS tao queues setContentSize asynchronously and then
    // makeKeyAndOrderFront relocates the window. Size is applied natively.
    #[cfg(not(target_os = "macos"))]
    window.set_size(LogicalSize::new(width, height))?;
    Ok(())
}

/// 1–2 слова → словарная карточка; предложение/абзац → инлайн AI-помощник.
pub(crate) fn is_inline_assistant_text(text: &str) -> bool {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return false;
    }
    trimmed.split_whitespace().count() > 2
}

fn popup_size_for_text(text: Option<&str>) -> (f64, f64) {
    if text.is_some_and(is_inline_assistant_text) {
        (ASSISTANT_WIDTH, ASSISTANT_HEIGHT)
    } else {
        (DICTIONARY_WIDTH, DICTIONARY_HEIGHT)
    }
}

fn validate_popup_size(width: f64, height: f64) -> Result<(f64, f64), AppError> {
    if !width.is_finite() || !height.is_finite() {
        return Err(AppError::Validation(
            "Invalid popup window size".to_string(),
        ));
    }
    Ok((
        width.clamp(MIN_POPUP_WIDTH, MAX_POPUP_WIDTH),
        height.clamp(MIN_POPUP_HEIGHT, MAX_POPUP_HEIGHT),
    ))
}

/// Создать (если нет) или переиспользовать popup-окно, спозиционировать
/// у курсора, отправить текст событием, показать и сфокусировать.
pub fn show_popup(app: &AppHandle, text: Option<String>) -> Result<(), AppError> {
    // Opened from Lexora itself (tray, main window) — no app to return to.
    set_source_app(None);
    show_popup_anchored(app, text, snapshot_cursor_anchor())
}

/// Как `show_popup`, но с заранее снятым снимком курсора (хоткей).
pub fn show_popup_anchored(
    app: &AppHandle,
    text: Option<String>,
    cursor: Option<CursorAnchor>,
) -> Result<(), AppError> {
    if let Some(state) = app.try_state::<PendingPopupText>() {
        if let Ok(mut lock) = state.0.lock() {
            *lock = text.clone();
        }
    }

    remember_cursor_anchor(cursor);

    let (width, height) = popup_size_for_text(text.as_deref());
    let resizable = text.as_deref().is_some_and(is_inline_assistant_text);

    let window = match app.get_webview_window(POPUP_LABEL) {
        Some(window) => window,
        None => WebviewWindowBuilder::new(app, POPUP_LABEL, WebviewUrl::App("popup.html".into()))
            .title("Lexora Quick Translate")
            .inner_size(width, height)
            .min_inner_size(
                if resizable {
                    ASSISTANT_MIN_WIDTH
                } else {
                    width
                },
                if resizable {
                    ASSISTANT_MIN_HEIGHT
                } else {
                    height
                },
            )
            .max_inner_size(
                if resizable {
                    ASSISTANT_MAX_WIDTH
                } else {
                    width
                },
                if resizable {
                    ASSISTANT_MAX_HEIGHT
                } else {
                    height
                },
            )
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .background_color(Color(0, 0, 0, 0))
            .resizable(resizable)
            .always_on_top(true)
            // The popup shows without activating Lexora: the first click must
            // already press «Accept», not just focus the window.
            .accept_first_mouse(true)
            .visible_on_all_workspaces(true)
            .skip_taskbar(true)
            .focused(false)
            .visible(false)
            .build()?,
    };

    // Hide first so AppKit will not constrain the frame to the current screen.
    // Do NOT call Tauri show()/set_focus() on macOS: those map to
    // makeKeyAndOrderFront + activateIgnoringOtherApps, which teleports the
    // window onto Lexora's space (usually the other monitor).
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    }
    apply_popup_size(&window, width, height, resizable)?;
    if let Err(e) = reposition_popup_near_cursor(app, &window, width, height, cursor, true) {
        log::warn!("Popup cursor anchor failed: {e}");
    }

    #[cfg(not(target_os = "macos"))]
    {
        window.show()?;
        window.unminimize()?;
        window.set_focus()?;
    }

    // Re-apply after tao's async style/size callbacks and webview attach.
    #[cfg(target_os = "macos")]
    {
        let app_handle = app.clone();
        let window_label = POPUP_LABEL.to_string();
        std::thread::spawn(move || {
            for delay_ms in [16_u64, 48, 160, 400] {
                std::thread::sleep(std::time::Duration::from_millis(delay_ms));
                let app_ui = app_handle.clone();
                let label = window_label.clone();
                let _ = app_handle.run_on_main_thread(move || {
                    if let Some(window) = app_ui.get_webview_window(&label) {
                        if let Err(e) =
                            macos::reposition_near_cursor(&window, cursor, width, height, true)
                        {
                            log::debug!("Popup re-anchor skipped: {e}");
                        }
                    }
                });
            }
        });
    }

    let expected = text.clone();
    let text_val = text.unwrap_or_default();
    emit_popup_text(app, &text_val);
    schedule_popup_text_retries(app, expected);

    Ok(())
}

/// Показать главное окно; если оно было уничтожено — создать заново
/// с параметрами из tauri.conf.json.
pub fn show_main_window(app: &AppHandle) -> Result<(), AppError> {
    match app.get_webview_window("main") {
        Some(window) => {
            window.show()?;
            window.unminimize()?;
            window.set_focus()?;
        }
        None => {
            let window =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                    .title("Lexora")
                    .inner_size(1280.0, 800.0)
                    .min_inner_size(900.0, 600.0)
                    .center()
                    .build()?;
            window.set_focus()?;
        }
    }
    Ok(())
}

// ── IPC Commands ─────────────────────────────────────────────

#[tauri::command]
pub fn open_popup_window(app: AppHandle) -> Result<(), AppError> {
    show_popup(&app, None)
}

#[tauri::command]
pub fn close_popup_window(app: AppHandle) -> Result<(), AppError> {
    if let Some(window) = app.get_webview_window(POPUP_LABEL) {
        window.hide()?;
    }
    return_focus_to_source_app(&app);
    Ok(())
}

#[tauri::command]
pub fn get_pending_popup_text(state: tauri::State<'_, PendingPopupText>) -> Option<String> {
    // Peek, не take: React Strict Mode монтирует эффект дважды,
    // take() терял текст на втором вызове.
    state.0.lock().ok()?.clone()
}

#[tauri::command]
pub fn open_main_window(app: AppHandle) -> Result<(), AppError> {
    show_main_window(&app)
}

#[tauri::command]
pub fn resize_popup_window(
    app: AppHandle,
    width: f64,
    height: f64,
    resizable: Option<bool>,
) -> Result<(), AppError> {
    let (width, height) = validate_popup_size(width, height)?;
    let resizable = resizable.unwrap_or(width >= ASSISTANT_MIN_WIDTH);
    if let Some(window) = app.get_webview_window(POPUP_LABEL) {
        // Resize then re-apply the hotkey snapshot. Tao's set_size on macOS can
        // snap the window back to the screen where it was created.
        apply_popup_size(&window, width, height, resizable)?;
        let cursor = last_cursor_anchor();
        if let Err(e) = reposition_popup_near_cursor(&app, &window, width, height, cursor, true) {
            log::debug!("Popup re-anchor after resize skipped: {e}");
        }
    }
    Ok(())
}

fn write_system_clipboard(app: &AppHandle, text: &str) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        let _ = app;
        crate::hotkeys::write_clipboard(Some(text));
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        use tauri_plugin_clipboard_manager::ClipboardExt;
        app.clipboard()
            .write_text(text)
            .map_err(|e| AppError::Io(format!("Failed to write clipboard: {e}")))
    }
}

fn notify_paste_fallback(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    let body = if crate::hotkeys::accessibility_trusted() {
        "Text copied. Press Cmd+V to paste."
    } else {
        "Text copied. Enable Accessibility for Lexora to paste automatically."
    };
    #[cfg(not(target_os = "macos"))]
    let body = "Text copied. Press Ctrl+V to paste.";

    if let Err(e) = app
        .notification()
        .builder()
        .title("Lexora")
        .body(body)
        .show()
    {
        log::warn!("Failed to show paste fallback notification: {e}");
    }
}

/// Copy result, hide popup, then replace the source selection.
/// Prefers AXSelectedText write; falls back to Cmd+V. Without Accessibility
/// the text stays on the clipboard and a system notification explains it.
#[tauri::command]
pub fn accept_and_replace(app: AppHandle, text: String) -> Result<(), AppError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Text is empty".to_string()));
    }
    let payload = trimmed.to_string();

    write_system_clipboard(&app, &payload)?;

    if let Some(window) = app.get_webview_window(POPUP_LABEL) {
        if let Err(e) = window.hide() {
            log::warn!("Failed to hide popup before paste: {e}");
        }
    }

    let app_clone = app.clone();
    thread::spawn(move || {
        return_focus_to_source_app(&app_clone);
        thread::sleep(PASTE_DELAY);
        let replaced = crate::hotkeys::replace_selected_text(&payload);
        let pasted = replaced
            || (crate::hotkeys::accessibility_trusted() && crate::hotkeys::simulate_paste());
        if !pasted {
            notify_paste_fallback(&app_clone);
        }
    });

    Ok(())
}

#[cfg(target_os = "macos")]
mod macos {
    use super::{CursorAnchor, POPUP_CORNER_RADIUS, POPUP_MARGIN};
    use crate::display::{
        anchor_popup_cocoa, cocoa_from_cg_flipped, distance_sq_to_bounds, LogicalBounds,
    };
    use crate::error::AppError;
    use objc2::rc::Retained;
    use objc2::runtime::NSObjectProtocol;
    use objc2::{sel, MainThreadMarker};
    use objc2_app_kit::{
        NSApplication, NSApplicationActivationOptions, NSColor, NSEvent, NSPopUpMenuWindowLevel,
        NSRunningApplication, NSScreen, NSView, NSWindow, NSWindowCollectionBehavior,
        NSWorkspace,
    };
    use objc2_foundation::{NSMouseInRect, NSPoint, NSRect, NSSize};
    use objc2_quartz_core::kCACornerCurveContinuous;
    use tauri::{AppHandle, WebviewWindow};

    fn clip_view_corners(view: &NSView) {
        view.setWantsLayer(true);
        let Some(layer) = view.layer() else {
            return;
        };
        layer.setOpaque(false);
        layer.setCornerRadius(POPUP_CORNER_RADIUS);
        layer.setMasksToBounds(true);
        layer.setCornerCurve(unsafe { kCACornerCurveContinuous });
    }

    /// Hide the rectangular NSWindow chrome that otherwise shows as light
    /// triangles behind the CSS rounded card.
    fn apply_popup_window_chrome(ns_window: &NSWindow) {
        ns_window.setOpaque(false);
        ns_window.setBackgroundColor(Some(&NSColor::clearColor()));
        ns_window.setHasShadow(false);
        ns_window.invalidateShadow();
        if let Some(content) = ns_window.contentView() {
            clip_view_corners(&content);
            for subview in content.subviews() {
                clip_view_corners(&subview);
            }
        }
    }

    #[repr(C)]
    struct RawPoint {
        x: f64,
        y: f64,
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventCreate(source: *const std::ffi::c_void) -> *mut std::ffi::c_void;
        fn CGEventGetLocation(event: *mut std::ffi::c_void) -> RawPoint;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFRelease(cf: *mut std::ffi::c_void);
    }

    /// CGEventGetLocation: любой поток, пункты, Y вниз от верха primary.
    /// Не UnflippedLocation — там внутри pixels_high, на Retina Y удваивается.
    pub fn snapshot_cursor() -> Option<CursorAnchor> {
        unsafe {
            let event = CGEventCreate(std::ptr::null());
            if event.is_null() {
                return None;
            }
            let point = CGEventGetLocation(event);
            CFRelease(event);
            if point.x.is_finite() && point.y.is_finite() {
                Some(CursorAnchor {
                    x: point.x,
                    y: point.y,
                })
            } else {
                None
            }
        }
    }

    /// Frontmost app other than Lexora (the text the user is working on).
    pub fn frontmost_app_pid() -> Option<i32> {
        let pid = NSWorkspace::sharedWorkspace()
            .frontmostApplication()?
            .processIdentifier();
        let own = i32::try_from(std::process::id()).ok();
        (pid > 0 && Some(pid) != own).then_some(pid)
    }

    /// Hand activation back to `pid` — only when Lexora took it (a click on the popup).
    fn activate_app(mtm: MainThreadMarker, pid: i32) {
        let ns_app = NSApplication::sharedApplication(mtm);
        if !ns_app.isActive() {
            return;
        }
        let Some(target) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
        else {
            return;
        };
        // macOS 14+: activation is cooperative — the active app yields first.
        // Older systems (min 12.0) lack the selector; calling it would abort.
        if ns_app.respondsToSelector(sel!(yieldActivationToApplication:)) {
            ns_app.yieldActivationToApplication(&target);
        }
        if !target.activateWithOptions(NSApplicationActivationOptions::empty()) {
            log::debug!("Could not return focus to app {pid}");
        }
    }

    pub fn activate_app_dispatch(app: &AppHandle, pid: i32) {
        if let Some(mtm) = MainThreadMarker::new() {
            activate_app(mtm, pid);
            return;
        }
        let (tx, rx) = std::sync::mpsc::sync_channel(1);
        let dispatched = app.run_on_main_thread(move || {
            if let Some(mtm) = MainThreadMarker::new() {
                activate_app(mtm, pid);
            }
            let _ = tx.send(());
        });
        if dispatched.is_ok() {
            let _ = rx.recv_timeout(std::time::Duration::from_millis(300));
        }
    }

    fn bounds_from_nsrect(rect: NSRect) -> LogicalBounds {
        LogicalBounds {
            x: rect.origin.x,
            y: rect.origin.y,
            width: rect.size.width,
            height: rect.size.height,
        }
    }

    fn screen_for_cursor(mtm: MainThreadMarker, cursor: NSPoint) -> Option<Retained<NSScreen>> {
        let screens = NSScreen::screens(mtm);
        screens
            .iter()
            .find(|screen| NSMouseInRect(cursor, screen.frame(), false))
            .or_else(|| {
                screens.iter().min_by(|a, b| {
                    let da =
                        distance_sq_to_bounds(cursor.x, cursor.y, &bounds_from_nsrect(a.frame()));
                    let db =
                        distance_sq_to_bounds(cursor.x, cursor.y, &bounds_from_nsrect(b.frame()));
                    da.partial_cmp(&db).unwrap_or(std::cmp::Ordering::Equal)
                })
            })
    }

    pub fn reposition_near_cursor_dispatch(
        app: &AppHandle,
        window: &WebviewWindow,
        cursor: Option<CursorAnchor>,
        width: f64,
        height: f64,
        bring_front: bool,
    ) -> Result<(), AppError> {
        if MainThreadMarker::new().is_some() {
            return reposition_near_cursor(window, cursor, width, height, bring_front);
        }
        let window = window.clone();
        let (tx, rx) = std::sync::mpsc::sync_channel(1);
        app.run_on_main_thread(move || {
            let result = reposition_near_cursor(&window, cursor, width, height, bring_front);
            let _ = tx.send(result);
        })
        .map_err(|e| AppError::Io(format!("Failed to dispatch popup anchor: {e}")))?;
        rx.recv()
            .map_err(|e| AppError::Io(format!("Popup anchor did not complete: {e}")))?
    }

    pub fn reposition_near_cursor(
        window: &WebviewWindow,
        cursor: Option<CursorAnchor>,
        width: f64,
        height: f64,
        bring_front: bool,
    ) -> Result<(), AppError> {
        let Some(mtm) = MainThreadMarker::new() else {
            return Err(AppError::Io(
                "Popup cursor anchor must run on the main thread".to_string(),
            ));
        };
        let ns_window_ptr = window.ns_window()?;
        let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr as *mut NSWindow) }) else {
            return Err(AppError::Io("Popup NSWindow is unavailable".to_string()));
        };

        ns_window.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::Transient
                | NSWindowCollectionBehavior::IgnoresCycle
                | NSWindowCollectionBehavior::FullScreenAuxiliary,
        );
        ns_window.setHidesOnDeactivate(false);
        ns_window.setLevel(NSPopUpMenuWindowLevel);
        apply_popup_window_chrome(&ns_window);

        let screens = NSScreen::screens(mtm);
        let from_hotkey = cursor.and_then(|c| {
            let primary = screens.iter().next()?;
            let (x, y) = cocoa_from_cg_flipped(c.x, c.y, &bounds_from_nsrect(primary.frame()));
            Some(NSPoint::new(x, y))
        });
        let live = NSEvent::mouseLocation();
        let cursor = match from_hotkey {
            Some(point)
                if screens
                    .iter()
                    .any(|screen| NSMouseInRect(point, screen.frame(), false)) =>
            {
                point
            }
            _ if screens
                .iter()
                .any(|screen| NSMouseInRect(live, screen.frame(), false)) =>
            {
                live
            }
            Some(point) => point,
            None => live,
        };

        let Some(screen) = screen_for_cursor(mtm, cursor) else {
            return Err(AppError::Io("No screen available for popup".to_string()));
        };

        if width >= 32.0 && height >= 32.0 {
            ns_window.setContentSize(NSSize::new(width, height));
        }

        let mut size = ns_window.frame().size;
        if size.width < 32.0 || size.height < 32.0 {
            size = NSSize::new(width.max(32.0), height.max(32.0));
        }

        let visible = screen.visibleFrame();
        let visible_bounds = bounds_from_nsrect(visible);
        let (x, y) = anchor_popup_cocoa(
            cursor.x,
            cursor.y,
            size.width,
            size.height,
            &visible_bounds,
            POPUP_MARGIN,
        );
        let dest = NSRect::new(NSPoint::new(x, y), size);
        let dest = ns_window.constrainFrameRect_toScreen(dest, Some(&screen));
        // Bind the window to the cursor's screen first — otherwise AppKit keeps
        // it on the screen of the last key window (Lexora's other monitor).
        ns_window.setFrame_display(NSRect::new(visible.origin, size), false);
        ns_window.setFrame_display(dest, bring_front);
        if bring_front {
            ns_window.orderFrontRegardless();
            ns_window.makeKeyWindow();
        }
        log::debug!(
            "Popup anchored at cocoa ({:.0}, {:.0}) near cursor ({:.0}, {:.0}) screen ({:.0},{:.0} {:.0}x{:.0})",
            dest.origin.x,
            dest.origin.y,
            cursor.x,
            cursor.y,
            visible.origin.x,
            visible.origin.y,
            visible.size.width,
            visible.size.height
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assistant_text_requires_more_than_two_words() {
        assert!(!is_inline_assistant_text(""));
        assert!(!is_inline_assistant_text("   "));
        assert!(!is_inline_assistant_text("apple"));
        assert!(!is_inline_assistant_text("hello world"));
        assert!(is_inline_assistant_text("hello world there"));
        assert!(is_inline_assistant_text(
            "During the daylight saving time transition the event occurs twice."
        ));
    }

    #[test]
    fn popup_size_matches_text_kind() {
        assert_eq!(
            popup_size_for_text(None),
            (DICTIONARY_WIDTH, DICTIONARY_HEIGHT)
        );
        assert_eq!(
            popup_size_for_text(Some("apple")),
            (DICTIONARY_WIDTH, DICTIONARY_HEIGHT)
        );
        assert_eq!(
            popup_size_for_text(Some("one two three four")),
            (ASSISTANT_WIDTH, ASSISTANT_HEIGHT)
        );
        assert_eq!(ASSISTANT_MAX_WIDTH, ASSISTANT_WIDTH * 2.0);
        assert_eq!(ASSISTANT_MAX_HEIGHT, ASSISTANT_HEIGHT * 2.0);
    }

    #[test]
    fn validate_popup_size_clamps_and_rejects_non_finite() {
        let (w, h) = validate_popup_size(10.0, 10.0).expect("finite");
        assert_eq!(w, MIN_POPUP_WIDTH);
        assert_eq!(h, MIN_POPUP_HEIGHT);
        let (w, h) = validate_popup_size(5000.0, 5000.0).expect("finite");
        assert_eq!(w, MAX_POPUP_WIDTH);
        assert_eq!(h, MAX_POPUP_HEIGHT);
        assert!(validate_popup_size(f64::NAN, 300.0).is_err());
        assert!(validate_popup_size(680.0, f64::INFINITY).is_err());
    }
}
