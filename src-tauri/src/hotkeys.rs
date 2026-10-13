// ============================================================
// LEXORA — Global Shortcuts & Selection Capture
// Глобальные хоткеи (настраиваются в Settings, см. миграцию V004):
// перевод выделения (popup) и переключение стикеров.
// Захват: AXSelectedText, затем Cmd+C через CGEvent после
// отпускания модификаторов (не osascript — Shift ещё зажат).
// Если выделения нет — открывается пустой переводчик, без clipboard.
// ============================================================

use std::sync::RwLock;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::commands::settings::AppSettings;
use crate::error::AppError;

/// Хоткей быстрого перевода выделения по умолчанию.
pub const TRANSLATE_SHORTCUT: &str = "CmdOrCtrl+Shift+L";

/// Хоткей переключения стикеров по умолчанию.
pub const STICKERS_SHORTCUT: &str = "CmdOrCtrl+Shift+S";

/// Максимальная длина захваченного текста (по символам, не по байтам).
#[cfg(any(target_os = "macos", target_os = "windows", test))]
const MAX_CAPTURE_CHARS: usize = 8000;
/// Пауза после скрытия popup, чтобы фокус вернулся в исходное приложение.
const FOCUS_RETURN_DELAY: Duration = Duration::from_millis(90);

/// Действие, привязанное к глобальному хоткею.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HotkeyAction {
    TranslateSelection,
    ToggleStickers,
}

/// Текущие привязки «хоткей → действие» (managed state). Обновляются
/// при смене настроек; читаются в общем обработчике плагина.
#[derive(Default)]
pub struct HotkeyState {
    bindings: RwLock<Vec<(Shortcut, HotkeyAction)>>,
}

impl HotkeyState {
    /// Действие для нажатого хоткея (None, если хоткей не привязан).
    pub fn action_for(&self, shortcut: &Shortcut) -> Option<HotkeyAction> {
        self.bindings
            .read()
            .ok()?
            .iter()
            .find(|(s, _)| s == shortcut)
            .map(|(_, action)| *action)
    }

    fn set_bindings(&self, translate: Shortcut, stickers: Shortcut) {
        if let Ok(mut bindings) = self.bindings.write() {
            *bindings = vec![
                (translate, HotkeyAction::TranslateSelection),
                (stickers, HotkeyAction::ToggleStickers),
            ];
        }
    }
}

/// Текущие строки хоткеев из настроек: (translate, stickers).
pub fn current_shortcuts(settings: &AppSettings) -> (String, String) {
    (
        settings.hotkey_translate.clone(),
        settings.hotkey_stickers.clone(),
    )
}

/// Распарсить строку хоткея в Shortcut; невалидный формат — AppError::Validation.
fn parse_shortcut(value: &str, field: &str) -> Result<Shortcut, AppError> {
    value
        .parse::<Shortcut>()
        .map_err(|e| AppError::Validation(format!("Invalid hotkey {field} ('{value}'): {e}")))
}

/// Проверить пару хоткеев: оба должны парситься и не совпадать.
/// Вызывается ДО сохранения настроек — невалидные значения не пишутся в БД.
pub fn validate_shortcuts(
    translate: &str,
    stickers: &str,
) -> Result<(Shortcut, Shortcut), AppError> {
    let translate = parse_shortcut(translate, "hotkeyTranslate")?;
    let stickers = parse_shortcut(stickers, "hotkeyStickers")?;
    if translate == stickers {
        return Err(AppError::Validation(
            "hotkeyTranslate and hotkeyStickers must be different".to_string(),
        ));
    }
    Ok((translate, stickers))
}

/// Перерегистрировать глобальные хоткеи: снять все старые, привязать новые
/// и обновить HotkeyState для диспетчеризации в обработчике плагина.
pub fn register_shortcuts(
    app: &AppHandle,
    translate: &str,
    stickers: &str,
) -> Result<(), AppError> {
    let (translate, stickers) = validate_shortcuts(translate, stickers)?;

    let manager = app.global_shortcut();
    manager
        .unregister_all()
        .map_err(|e| AppError::Validation(format!("Failed to reset global shortcuts: {e}")))?;
    manager
        .register(translate)
        .map_err(|e| AppError::Validation(format!("Failed to register translate hotkey: {e}")))?;
    manager
        .register(stickers)
        .map_err(|e| AppError::Validation(format!("Failed to register stickers hotkey: {e}")))?;

    if let Some(state) = app.try_state::<HotkeyState>() {
        state.set_bindings(translate, stickers);
    }
    Ok(())
}

/// Trim + отсечение слишком длинного захвата. Пустая строка → None.
#[cfg(any(target_os = "macos", target_os = "windows", test))]
pub(crate) fn normalize_captured(text: &str) -> Option<String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed.chars().count() <= MAX_CAPTURE_CHARS {
        Some(trimmed.to_string())
    } else {
        Some(trimmed.chars().take(MAX_CAPTURE_CHARS).collect())
    }
}

fn hide_popup_for_capture(app: &AppHandle) {
    let app_hide = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Some(window) = app_hide.get_webview_window(crate::popup::POPUP_LABEL) {
            let _ = window.hide();
        }
    });
}

/// Новый захват из буфера только если содержимое реально изменилось.
/// Старый буфер не выдаём за выделение (частый false-positive Cmd+C).
#[cfg(any(target_os = "macos", target_os = "windows", test))]
pub(crate) fn capture_from_clipboard_delta(
    before: Option<&str>,
    after: Option<&str>,
) -> Option<String> {
    let after = after.and_then(normalize_captured)?;
    match before.and_then(normalize_captured) {
        Some(prev) if prev == after => None,
        _ => Some(after),
    }
}

/// Захватить выделенный текст в активном приложении.
#[cfg(target_os = "macos")]
pub fn capture_selected_text() -> Option<String> {
    macos::capture_selected_text()
}

/// На остальных платформах (кроме macOS и Windows) захват не поддержан.
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn capture_selected_text() -> Option<String> {
    log::warn!("capture_selected_text is only implemented for macOS");
    None
}

/// Захватить выделение и показать popup. Захват блокирующий —
/// работаем в отдельном потоке, показ окна — на main thread.
pub fn translate_selection(app: &AppHandle) {
    let app = app.clone();
    let cursor = crate::popup::snapshot_cursor_anchor();
    crate::popup::remember_source_app();
    thread::spawn(move || {
        // Скрыть предыдущий popup до AX/Cmd+C, иначе фокус остаётся в WKWebView
        // и захват читает пустой инпут вместо выделенного слова.
        hide_popup_for_capture(&app);
        thread::sleep(FOCUS_RETURN_DELAY);

        #[cfg(target_os = "macos")]
        macos::prompt_accessibility_if_needed(&app);

        #[cfg(target_os = "windows")]
        let text = win::capture_selected_text(&app);
        #[cfg(not(target_os = "windows"))]
        let text = capture_selected_text();
        let app_ui = app.clone();
        if let Err(e) = app.run_on_main_thread(move || {
            if let Err(err) = crate::popup::show_popup_anchored(&app_ui, text, cursor) {
                log::warn!("Failed to show popup from hotkey: {err}");
            }
        }) {
            log::warn!("Failed to dispatch popup to main thread: {e}");
        }
    });
}

#[cfg(target_os = "macos")]
pub use macos::{
    prompt_accessibility_if_needed, replace_selected_text, simulate_paste, write_clipboard,
};

#[cfg(not(target_os = "macos"))]
pub fn write_clipboard(_text: Option<&str>) {}

#[cfg(target_os = "windows")]
pub use win::{focus_window, foreground_window_handle, simulate_paste};

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn simulate_paste() -> bool {
    false
}

#[cfg(not(target_os = "macos"))]
pub fn replace_selected_text(_text: &str) -> bool {
    false
}

#[cfg(target_os = "macos")]
pub fn accessibility_trusted() -> bool {
    macos::is_trusted()
}

/// Windows reads the selection and pastes without a separate permission.
#[cfg(target_os = "windows")]
pub fn accessibility_trusted() -> bool {
    true
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn accessibility_trusted() -> bool {
    false
}

#[cfg(target_os = "windows")]
mod win {
    use super::{capture_from_clipboard_delta, normalize_captured};
    use std::mem::size_of;
    use std::thread;
    use std::time::{Duration, Instant};
    use tauri::AppHandle;
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationTextPattern, UIA_TextPatternId,
    };
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT,
        KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_C, VK_CONTROL, VK_LWIN, VK_MENU,
        VK_RWIN, VK_SHIFT, VK_V,
    };
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

    const MODIFIER_TIMEOUT: Duration = Duration::from_millis(900);
    const CLIPBOARD_TIMEOUT: Duration = Duration::from_millis(600);

    /// Active window right now (0 — none). A number, so it fits in a static.
    pub fn foreground_window_handle() -> isize {
        let hwnd = unsafe { GetForegroundWindow() };
        hwnd.0 as isize
    }

    /// Give the focus back to a window remembered by `foreground_window_handle`.
    pub fn focus_window(handle: isize) {
        if handle != 0 {
            let _ = unsafe { SetForegroundWindow(HWND(handle as *mut _)) };
        }
    }

    fn modifier_keys_down() -> bool {
        [VK_CONTROL, VK_SHIFT, VK_MENU, VK_LWIN, VK_RWIN]
            .iter()
            .any(|key| (unsafe { GetAsyncKeyState(i32::from(key.0)) } as u16 & 0x8000) != 0)
    }

    /// The hotkey (Ctrl+Shift+L) is still held: otherwise Ctrl+C would
    /// arrive as Ctrl+Shift+C.
    fn wait_modifiers_released() {
        let started = Instant::now();
        while modifier_keys_down() && started.elapsed() < MODIFIER_TIMEOUT {
            thread::sleep(Duration::from_millis(16));
        }
        thread::sleep(Duration::from_millis(40));
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

    fn press_ctrl(key: VIRTUAL_KEY) -> bool {
        let inputs = [
            key_event(VK_CONTROL, false),
            key_event(key, false),
            key_event(key, true),
            key_event(VK_CONTROL, true),
        ];
        let sent = unsafe { SendInput(&inputs, size_of::<INPUT>() as i32) };
        usize::try_from(sent).is_ok_and(|sent| sent == inputs.len())
    }

    pub fn simulate_paste() -> bool {
        press_ctrl(VK_V)
    }

    /// Selection through UI Automation (TextPattern); passwords are not read.
    fn uia_selected_text() -> Option<String> {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
            let automation: IUIAutomation =
                CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok()?;
            let element = automation.GetFocusedElement().ok()?;
            if element.CurrentIsPassword().ok()?.as_bool() {
                return None;
            }
            let pattern = element
                .GetCurrentPatternAs::<IUIAutomationTextPattern>(UIA_TextPatternId)
                .ok()?;
            let selection = pattern.GetSelection().ok()?;
            if selection.Length().ok()? == 0 {
                return None;
            }
            let text = selection.GetElement(0).ok()?.GetText(8001).ok()?;
            normalize_captured(&text.to_string())
        }
    }

    /// Ctrl+C and read the clipboard; the previous text is put back.
    fn capture_via_copy(app: &AppHandle) -> Option<String> {
        wait_modifiers_released();
        let previous = app.clipboard().read_text().ok();
        let previous_seq = unsafe { GetClipboardSequenceNumber() };
        if !press_ctrl(VK_C) {
            log::warn!("Failed to send Ctrl+C for selection capture");
            return None;
        }
        let started = Instant::now();
        while unsafe { GetClipboardSequenceNumber() } == previous_seq
            && started.elapsed() < CLIPBOARD_TIMEOUT
        {
            thread::sleep(Duration::from_millis(20));
        }
        if unsafe { GetClipboardSequenceNumber() } == previous_seq {
            return None;
        }
        let captured = app.clipboard().read_text().ok();
        let result = capture_from_clipboard_delta(previous.as_deref(), captured.as_deref());
        if let Some(previous) = previous {
            let _ = app.clipboard().write_text(previous);
        }
        result
    }

    pub fn capture_selected_text(app: &AppHandle) -> Option<String> {
        uia_selected_text().or_else(|| capture_via_copy(app))
    }
}

#[cfg(target_os = "macos")]
mod macos {
    use super::{capture_from_clipboard_delta, normalize_captured};
    use core_foundation::base::{CFGetTypeID, CFTypeRef, TCFType};
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::string::{CFString, CFStringRef};
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, KeyCode};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
    use objc2_app_kit::{NSPasteboard, NSPasteboardTypeString};
    use objc2_foundation::NSString;
    use std::ptr;
    use std::sync::Once;
    use std::thread;
    use std::time::{Duration, Instant};
    use tauri::AppHandle;

    type AXUIElementRef = CFTypeRef;
    type AXError = i32;

    const AX_ERROR_SUCCESS: AXError = 0;
    const AX_ERROR_API_DISABLED: AXError = -25211;

    const ATTR_FOCUSED_UI: &str = "AXFocusedUIElement";
    const ATTR_FOCUSED_APP: &str = "AXFocusedApplication";
    const ATTR_SELECTED_TEXT: &str = "AXSelectedText";

    const MODIFIER_TIMEOUT: Duration = Duration::from_millis(700);
    const PASTEBOARD_TIMEOUT: Duration = Duration::from_millis(500);

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXUIElementCreateSystemWide() -> AXUIElementRef;
        fn AXUIElementCopyAttributeValue(
            element: AXUIElementRef,
            attribute: CFStringRef,
            value: *mut CFTypeRef,
        ) -> AXError;
        fn AXUIElementSetAttributeValue(
            element: AXUIElementRef,
            attribute: CFStringRef,
            value: CFTypeRef,
        ) -> AXError;
        fn AXUIElementSetMessagingTimeout(
            element: AXUIElementRef,
            timeout_in_seconds: f32,
        ) -> AXError;
        fn AXIsProcessTrusted() -> u8;
        fn AXIsProcessTrustedWithOptions(options: CFTypeRef) -> u8;
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceKeyState(state_id: i32, key: u16) -> u8;
    }

    struct AxRef(AXUIElementRef);

    impl AxRef {
        fn system_wide() -> Option<Self> {
            let raw = unsafe { AXUIElementCreateSystemWide() };
            if raw.is_null() {
                None
            } else {
                let _ = unsafe { AXUIElementSetMessagingTimeout(raw, 0.4) };
                Some(Self(raw))
            }
        }

        fn as_ptr(&self) -> AXUIElementRef {
            self.0
        }
    }

    impl Drop for AxRef {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe { core_foundation::base::CFRelease(self.0) };
            }
        }
    }

    pub(super) fn is_trusted() -> bool {
        unsafe { AXIsProcessTrusted() != 0 }
    }

    /// Показать системный диалог Accessibility один раз за процесс.
    pub fn prompt_accessibility_if_needed(app: &AppHandle) {
        if is_trusted() {
            return;
        }
        static PROMPT: Once = Once::new();
        let app = app.clone();
        PROMPT.call_once(move || {
            log::warn!(
                "Lexora is not in Accessibility; selected-text capture needs System Settings → Privacy & Security → Accessibility"
            );
            let _ = app.run_on_main_thread(|| {
                let key = CFString::new("AXTrustedCheckOptionPrompt");
                let dict: CFDictionary<CFString, CFBoolean> =
                    CFDictionary::from_CFType_pairs(&[(key, CFBoolean::true_value())]);
                let _ =
                    unsafe { AXIsProcessTrustedWithOptions(dict.as_CFTypeRef()) };
            });
        });
    }

    fn ax_copy_value(element: AXUIElementRef, attr: &str) -> Result<CFTypeRef, AXError> {
        let name = CFString::new(attr);
        let mut value: CFTypeRef = ptr::null();
        let err = unsafe {
            AXUIElementCopyAttributeValue(element, name.as_concrete_TypeRef(), &mut value)
        };
        if err != AX_ERROR_SUCCESS || value.is_null() {
            return Err(err);
        }
        Ok(value)
    }

    fn ax_copy_string(element: AXUIElementRef, attr: &str) -> Option<String> {
        let value = match ax_copy_value(element, attr) {
            Ok(v) => v,
            Err(err) => {
                if err == AX_ERROR_API_DISABLED {
                    log::warn!("AXSelectedText unavailable — Accessibility permission denied");
                }
                return None;
            }
        };
        if unsafe { CFGetTypeID(value) } != CFString::type_id() {
            unsafe { core_foundation::base::CFRelease(value) };
            return None;
        }
        let cf_str = unsafe { CFString::wrap_under_create_rule(value as CFStringRef) };
        normalize_captured(&cf_str.to_string())
    }

    fn ax_copy_element(element: AXUIElementRef, attr: &str) -> Option<AxRef> {
        let value = ax_copy_value(element, attr).ok()?;
        Some(AxRef(value))
    }

    fn focused_ui_element() -> Option<AxRef> {
        let system = AxRef::system_wide()?;
        if let Some(focused) = ax_copy_element(system.as_ptr(), ATTR_FOCUSED_UI) {
            return Some(focused);
        }
        let app = ax_copy_element(system.as_ptr(), ATTR_FOCUSED_APP)?;
        ax_copy_element(app.as_ptr(), ATTR_FOCUSED_UI)
    }

    /// Прочитать AXSelectedText у сфокусированного элемента (без Cmd+C).
    fn ax_selected_text() -> Option<String> {
        let focused = focused_ui_element()?;
        ax_copy_string(focused.as_ptr(), ATTR_SELECTED_TEXT)
    }

    fn ax_set_string(element: AXUIElementRef, attr: &str, text: &str) -> Result<(), AXError> {
        let name = CFString::new(attr);
        let value = CFString::new(text);
        let err = unsafe {
            AXUIElementSetAttributeValue(element, name.as_concrete_TypeRef(), value.as_CFTypeRef())
        };
        if err == AX_ERROR_SUCCESS {
            Ok(())
        } else {
            Err(err)
        }
    }

    fn set_ax_selected_text(text: &str) -> bool {
        let Some(focused) = focused_ui_element() else {
            return false;
        };
        match ax_set_string(focused.as_ptr(), ATTR_SELECTED_TEXT, text) {
            Ok(()) => true,
            Err(err) => {
                if err == AX_ERROR_API_DISABLED {
                    log::warn!("AXSelectedText set unavailable — Accessibility permission denied");
                } else {
                    log::debug!("AXSelectedText set failed with error {err}");
                }
                false
            }
        }
    }

    /// Replace the current selection in the focused app via AXSelectedText.
    /// Retries briefly so focus can return after the popup hides.
    pub fn replace_selected_text(text: &str) -> bool {
        if text.is_empty() || !is_trusted() {
            return false;
        }
        for attempt in 0..4 {
            if set_ax_selected_text(text) {
                return true;
            }
            if attempt + 1 < 4 {
                thread::sleep(Duration::from_millis(40));
            }
        }
        false
    }

    fn modifier_keys_down() -> bool {
        // CombinedSessionState = 0. Virtual key codes: Cmd/Shift/Opt/Ctrl + right variants.
        const KEYS: [u16; 8] = [
            KeyCode::COMMAND,
            KeyCode::RIGHT_COMMAND,
            KeyCode::SHIFT,
            KeyCode::RIGHT_SHIFT,
            KeyCode::OPTION,
            KeyCode::RIGHT_OPTION,
            KeyCode::CONTROL,
            KeyCode::RIGHT_CONTROL,
        ];
        KEYS.iter()
            .any(|&key| unsafe { CGEventSourceKeyState(0, key) } != 0)
    }

    fn wait_modifiers_released() {
        let started = Instant::now();
        while modifier_keys_down() && started.elapsed() < MODIFIER_TIMEOUT {
            thread::sleep(Duration::from_millis(16));
        }
        // Дать ОС обработать отпускание, иначе синтетический Cmd+C сливается с Shift.
        thread::sleep(Duration::from_millis(40));
    }

    fn simulate_copy() -> bool {
        let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) else {
            return false;
        };
        let Ok(key_down) = CGEvent::new_keyboard_event(source.clone(), KeyCode::ANSI_C, true)
        else {
            return false;
        };
        key_down.set_flags(CGEventFlags::CGEventFlagCommand);
        let Ok(key_up) = CGEvent::new_keyboard_event(source, KeyCode::ANSI_C, false) else {
            return false;
        };
        key_up.set_flags(CGEventFlags::CGEventFlagCommand);
        key_down.post(CGEventTapLocation::HID);
        key_up.post(CGEventTapLocation::HID);
        true
    }

    pub fn simulate_paste() -> bool {
        let Ok(source) = CGEventSource::new(CGEventSourceStateID::HIDSystemState) else {
            return false;
        };
        let Ok(key_down) = CGEvent::new_keyboard_event(source.clone(), KeyCode::ANSI_V, true)
        else {
            return false;
        };
        key_down.set_flags(CGEventFlags::CGEventFlagCommand);
        let Ok(key_up) = CGEvent::new_keyboard_event(source, KeyCode::ANSI_V, false) else {
            return false;
        };
        key_up.set_flags(CGEventFlags::CGEventFlagCommand);
        key_down.post(CGEventTapLocation::HID);
        key_up.post(CGEventTapLocation::HID);
        true
    }

    fn read_clipboard() -> Option<String> {
        let pasteboard = NSPasteboard::generalPasteboard();
        let raw = pasteboard.stringForType(unsafe { NSPasteboardTypeString })?;
        normalize_captured(&raw.to_string())
    }

    pub fn write_clipboard(text: Option<&str>) {
        let pasteboard = NSPasteboard::generalPasteboard();
        pasteboard.clearContents();
        if let Some(text) = text {
            let ns = NSString::from_str(text);
            let _ = pasteboard.setString_forType(&ns, unsafe { NSPasteboardTypeString });
        }
    }

    fn pasteboard_change_count() -> isize {
        NSPasteboard::generalPasteboard().changeCount()
    }

    fn capture_via_copy() -> Option<String> {
        wait_modifiers_released();

        let previous = read_clipboard();
        let previous_count = pasteboard_change_count();

        if !simulate_copy() {
            log::warn!("Failed to synthesize Cmd+C — check Accessibility permission for Lexora");
            return None;
        }

        let started = Instant::now();
        while pasteboard_change_count() == previous_count && started.elapsed() < PASTEBOARD_TIMEOUT
        {
            thread::sleep(Duration::from_millis(20));
        }

        let captured = read_clipboard();
        if pasteboard_change_count() != previous_count {
            let result = capture_from_clipboard_delta(previous.as_deref(), captured.as_deref());
            write_clipboard(previous.as_deref());
            return result;
        }

        // Буфер не изменился — это не выделение. Не подставляем stale clipboard.
        None
    }

    pub fn capture_selected_text() -> Option<String> {
        if let Some(text) = ax_selected_text() {
            return Some(text);
        }
        capture_via_copy()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_translate_shortcut_parses() {
        assert!(TRANSLATE_SHORTCUT.parse::<Shortcut>().is_ok());
    }

    #[test]
    fn default_stickers_shortcut_parses() {
        assert!(STICKERS_SHORTCUT.parse::<Shortcut>().is_ok());
    }

    #[test]
    fn validate_accepts_distinct_defaults() {
        let (translate, stickers) =
            validate_shortcuts(TRANSLATE_SHORTCUT, STICKERS_SHORTCUT).expect("defaults are valid");
        assert_ne!(translate, stickers);
    }

    #[test]
    fn validate_rejects_duplicate_hotkeys() {
        let result = validate_shortcuts(TRANSLATE_SHORTCUT, TRANSLATE_SHORTCUT);
        assert!(matches!(result, Err(AppError::Validation(_))));
    }

    #[test]
    fn validate_rejects_invalid_format() {
        assert!(validate_shortcuts("NotAKey!!!", STICKERS_SHORTCUT).is_err());
        assert!(validate_shortcuts(TRANSLATE_SHORTCUT, "").is_err());
        assert!(validate_shortcuts("Ctrl+Shift+L+M", STICKERS_SHORTCUT).is_err());
    }

    #[test]
    fn normalize_captured_trims_and_rejects_blank() {
        assert_eq!(normalize_captured("  hello  ").as_deref(), Some("hello"));
        assert_eq!(normalize_captured(" \n\t "), None);
        assert_eq!(normalize_captured(""), None);
    }

    #[test]
    fn normalize_captured_truncates_long_text() {
        let long = "ж".repeat(MAX_CAPTURE_CHARS + 20);
        let out = normalize_captured(&long).expect("non-empty");
        assert_eq!(out.chars().count(), MAX_CAPTURE_CHARS);
    }

    #[test]
    fn replace_selected_text_rejects_empty() {
        assert!(!replace_selected_text(""));
    }

    #[test]
    fn clipboard_delta_ignores_unchanged_buffer() {
        assert_eq!(capture_from_clipboard_delta(Some("old"), Some("old")), None);
        assert_eq!(
            capture_from_clipboard_delta(Some("old"), Some("  new  ")).as_deref(),
            Some("new")
        );
        assert_eq!(
            capture_from_clipboard_delta(None, Some("fresh")).as_deref(),
            Some("fresh")
        );
        assert_eq!(capture_from_clipboard_delta(Some("x"), Some("   ")), None);
    }
}
