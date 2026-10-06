// ============================================================
// LEXORA — Main window webview ↔ native frame sync
//
// На macOS переход в полноэкранный режим (зелёная кнопка) или
// zoom иногда оставляет WKWebView на предыдущем кадре окна
// (высота из tauri.conf, 800px). Снизу остаётся чёрная полоса,
// сайдбар и контент обрезаются. Принудительно растягиваем
// webview до bounds contentView и ставим autoresizing mask.
// ============================================================

use tauri::{Window, WindowEvent};

const MAIN_WINDOW: &str = "main";
const RESYNC_DELAY_MS: u64 = 400;

/// Первый проход после создания окна — до того, как пользователь
/// успеет развернуть его на весь экран.
pub fn prepare_main_window(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    macos::sync_webview_frame(window);
    let _ = window;
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    if window.label() != MAIN_WINDOW {
        return;
    }
    match event {
        WindowEvent::Resized(_) | WindowEvent::ScaleFactorChanged { .. } => {
            #[cfg(target_os = "macos")]
            macos::schedule_sync(window);
        }
        _ => {}
    }
}

#[cfg(target_os = "macos")]
mod macos {
    use super::{MAIN_WINDOW, RESYNC_DELAY_MS};
    use objc2::rc::Retained;
    use objc2::runtime::AnyObject;
    use objc2_app_kit::{NSAutoresizingMaskOptions, NSView, NSWindow};
    use std::sync::atomic::{AtomicU64, Ordering};
    use tauri::{Manager, WebviewWindow, Window};

    static SYNC_GEN: AtomicU64 = AtomicU64::new(0);

    pub fn schedule_sync(window: &Window) {
        if let Some(webview) = window.app_handle().get_webview_window(MAIN_WINDOW) {
            sync_webview_frame(&webview);
        }

        let gen = SYNC_GEN.fetch_add(1, Ordering::Relaxed) + 1;
        let handle = window.app_handle().clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(RESYNC_DELAY_MS)).await;
            if SYNC_GEN.load(Ordering::Relaxed) != gen {
                return;
            }
            if let Some(webview) = handle.get_webview_window(MAIN_WINDOW) {
                let webview_for_sync = webview.clone();
                let _ = webview.run_on_main_thread(move || {
                    sync_webview_frame(&webview_for_sync);
                });
            }
        });
    }

    pub fn sync_webview_frame(window: &WebviewWindow) {
        let Ok(ns_window_ptr) = window.ns_window() else {
            return;
        };
        let Some(ns_window) = (unsafe { Retained::retain(ns_window_ptr as *mut NSWindow) }) else {
            return;
        };
        let Some(content_view) = ns_window.contentView() else {
            return;
        };

        stretch_children(&content_view, true);
    }

    fn stretch_children(parent: &NSView, extra_level: bool) {
        let bounds = parent.bounds();
        let mask = NSAutoresizingMaskOptions::ViewWidthSizable
            | NSAutoresizingMaskOptions::ViewHeightSizable;

        for child in parent.subviews().iter() {
            child.setAutoresizingMask(mask);
            child.setFrame(bounds);
            child.setNeedsLayout(true);
            child.setNeedsDisplay(true);

            if extra_level && !is_wkwebview(&child) {
                stretch_children(&child, false);
            }
        }
    }

    fn is_wkwebview(view: &NSView) -> bool {
        let object: &AnyObject = view;
        object
            .class()
            .name()
            .to_str()
            .map(|name| name.contains("WebView"))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn main_window_label_matches_tauri_config() {
        assert_eq!(super::MAIN_WINDOW, "main");
    }
}
