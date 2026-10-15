// ============================================================
// LEXORA — System Tray
// Иконка в меню-баре с меню Lexora: открыть приложение, пустой
// переводчик, перевести выделение, переключить стикеры, выйти.
// На macOS меню открывается и по левому, и по правому клику.
// ============================================================

use crate::error::AppError;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};

struct TrayMenuItems(Vec<(MenuItem<tauri::Wry>, &'static str)>);

pub fn refresh_locale(app: &AppHandle) -> Result<(), AppError> {
    if let Some(items) = app.try_state::<TrayMenuItems>() {
        for (item, source) in &items.0 {
            item.set_text(crate::i18n::text(app, source))?;
        }
    }
    Ok(())
}

pub fn build_tray(app: &AppHandle) -> Result<(), AppError> {
    let header = MenuItem::with_id(app, "header", "Lexora", false, None::<&str>)?;
    let open_item = MenuItem::with_id(
        app,
        "open",
        crate::i18n::text(app, "Open Lexora"),
        true,
        None::<&str>,
    )?;
    let translator_item = MenuItem::with_id(
        app,
        "translator",
        crate::i18n::text(app, "Open Translator"),
        true,
        None::<&str>,
    )?;
    let translate_item = MenuItem::with_id(
        app,
        "translate",
        crate::i18n::text(app, "Translate Selection"),
        true,
        None::<&str>,
    )?;
    let stickers_item = MenuItem::with_id(
        app,
        "stickers",
        crate::i18n::text(app, "Toggle Stickers"),
        true,
        None::<&str>,
    )?;
    let quit_item = MenuItem::with_id(
        app,
        "quit",
        crate::i18n::text(app, "Quit"),
        true,
        None::<&str>,
    )?;
    let sep_top = PredefinedMenuItem::separator(app)?;
    let sep_bottom = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &header,
            &sep_top,
            &open_item,
            &translator_item,
            &translate_item,
            &stickers_item,
            &sep_bottom,
            &quit_item,
        ],
    )?;

    let mut builder = TrayIconBuilder::new()
        .tooltip("Lexora")
        .title("Lexora")
        .menu(&menu)
        // Default is true; an explicit false left the icon with no menu on left-click.
        .show_menu_on_left_click(true)
        .icon_as_template(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Err(e) = crate::popup::show_main_window(app) {
                    log::warn!("Tray: failed to open main window: {e}");
                }
            }
            "translator" => {
                if let Err(e) = crate::popup::show_popup(app, None) {
                    log::warn!("Tray: failed to open empty translator: {e}");
                }
            }
            "translate" => crate::hotkeys::translate_selection(app),
            "stickers" => {
                if let Err(e) = crate::stickers::toggle_stickers_inner(app) {
                    log::warn!("Tray: failed to toggle stickers: {e}");
                }
            }
            "quit" => app.exit(0),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;
    app.manage(TrayMenuItems(vec![
        (open_item, "Open Lexora"),
        (translator_item, "Open Translator"),
        (translate_item, "Translate Selection"),
        (stickers_item, "Toggle Stickers"),
        (quit_item, "Quit"),
    ]));
    Ok(())
}
