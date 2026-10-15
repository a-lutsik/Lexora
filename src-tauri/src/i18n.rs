//! Native surfaces share the frontend catalogs and keep the interface language
//! independently of learning/translation language preferences.
use crate::error::AppError;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::menu::MenuItemKind;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "interface.json";
const STORE_KEY: &str = "locale";
const CATALOGS: &[(&str, &str)] = &[
    ("en", include_str!("../../src/i18n/en.json")),
    ("ru", include_str!("../../src/i18n/ru.json")),
    ("uk", include_str!("../../src/i18n/uk.json")),
    ("es", include_str!("../../src/i18n/es.json")),
    ("fr", include_str!("../../src/i18n/fr.json")),
    ("it", include_str!("../../src/i18n/it.json")),
];

type Dictionary = HashMap<String, String>;

struct ApplicationMenuLabels(Vec<(MenuItemKind<tauri::Wry>, String)>);

fn capture_menu_labels(
    items: Vec<MenuItemKind<tauri::Wry>>,
    labels: &mut ApplicationMenuLabels,
) -> Result<(), AppError> {
    for item in items {
        let source = match &item {
            MenuItemKind::Submenu(submenu) => {
                capture_menu_labels(submenu.items()?, labels)?;
                submenu.text()?
            }
            MenuItemKind::Predefined(item) => item.text()?,
            MenuItemKind::MenuItem(item) => item.text()?,
            MenuItemKind::Check(item) => item.text()?,
            MenuItemKind::Icon(item) => item.text()?,
        };
        let source = menu_source(&source);
        if !source.is_empty() {
            labels.0.push((item, source));
        }
    }
    Ok(())
}

// muda appends the running process name, which can be lowercase or absent in dev.
fn menu_source(value: &str) -> String {
    let source = value.replace('&', "");
    if source == "Edit" {
        "Edit menu".to_string()
    } else if source == "Zoom" {
        "Zoom window".to_string()
    } else if source == "Maximize" {
        "Maximize window".to_string()
    } else if source == "Exit" {
        "Exit app".to_string()
    } else if source == "About" || source.starts_with("About ") {
        "About Lexora".to_string()
    } else if source == "Hide" || (source.starts_with("Hide ") && source != "Hide Others") {
        "Hide Lexora".to_string()
    } else if source == "Quit" || source.starts_with("Quit ") {
        "Quit Lexora".to_string()
    } else {
        source
    }
}

fn refresh_application_menu(app: &AppHandle) -> Result<(), AppError> {
    if let Some(labels) = app.try_state::<ApplicationMenuLabels>() {
        for (item, source) in &labels.0 {
            let translated = text(app, source);
            match item {
                MenuItemKind::Submenu(item) => item.set_text(&translated)?,
                MenuItemKind::Predefined(item) => item.set_text(&translated)?,
                MenuItemKind::MenuItem(item) => item.set_text(&translated)?,
                MenuItemKind::Check(item) => item.set_text(&translated)?,
                MenuItemKind::Icon(item) => item.set_text(&translated)?,
            }
        }
    }
    Ok(())
}

struct InterfaceLocale {
    locale: Mutex<String>,
    dictionaries: HashMap<&'static str, Dictionary>,
}

fn normalize_locale(value: &str) -> &'static str {
    let normalized = value.trim().to_ascii_lowercase().replace('_', "-");
    match normalized.split('-').next() {
        Some("ru") => "ru",
        Some("uk") => "uk",
        Some("es") => "es",
        Some("fr") => "fr",
        Some("it") => "it",
        _ => "en",
    }
}

fn load_dictionaries() -> Result<HashMap<&'static str, Dictionary>, AppError> {
    CATALOGS
        .iter()
        .map(|(locale, json)| Ok((*locale, serde_json::from_str(json)?)))
        .collect()
}

fn translated(dictionaries: &HashMap<&str, Dictionary>, locale: &str, source: &str) -> String {
    let english = dictionaries
        .get("en")
        .and_then(|dictionary| dictionary.get(source))
        .map(String::as_str)
        .unwrap_or(source);
    dictionaries
        .get(locale)
        .and_then(|dictionary| dictionary.get(source).or_else(|| dictionary.get(english)))
        .filter(|value| !value.is_empty())
        .map(String::as_str)
        .unwrap_or(english)
        .to_string()
}

pub fn initialize(app: &AppHandle) -> Result<(), AppError> {
    let locale = match app.store(STORE_FILE) {
        Ok(store) => store
            .get(STORE_KEY)
            .and_then(|value| value.as_str().map(normalize_locale))
            .unwrap_or("en"),
        Err(error) => {
            log::warn!("Failed to load interface language: {error}");
            "en"
        }
    };
    app.manage(InterfaceLocale {
        locale: Mutex::new(locale.to_string()),
        dictionaries: load_dictionaries()?,
    });
    let mut labels = ApplicationMenuLabels(Vec::new());
    if let Some(menu) = app.menu() {
        if let Err(error) = menu
            .items()
            .map_err(AppError::from)
            .and_then(|items| capture_menu_labels(items, &mut labels))
        {
            log::warn!("Failed to read application menu labels: {error}");
        }
    }
    app.manage(labels);
    if let Err(error) = refresh_application_menu(app) {
        log::warn!("Failed to localize application menu: {error}");
    }
    if let Err(error) = refresh_windows(app) {
        log::warn!("Failed to localize window titles: {error}");
    }
    Ok(())
}

pub fn text(app: &AppHandle, source: &str) -> String {
    let Some(state) = app.try_state::<InterfaceLocale>() else {
        return source.to_string();
    };
    let result = match state.locale.lock() {
        Ok(locale) => translated(&state.dictionaries, &locale, source),
        Err(error) => {
            log::warn!("Failed to read interface language: {error}");
            translated(&state.dictionaries, "en", source)
        }
    };
    result
}

pub fn set_locale(app: &AppHandle, locale: &str) -> Result<(), AppError> {
    let state = app
        .try_state::<InterfaceLocale>()
        .ok_or_else(|| AppError::Io("Interface language has not been initialized".into()))?;
    let normalized = normalize_locale(locale);
    {
        // Serialize updates from independent webviews so persistent and cached
        // locale stay in the same order. Publish only after saving succeeds.
        let mut current = state
            .locale
            .lock()
            .map_err(|error| AppError::Io(error.to_string()))?;
        if *current != normalized {
            let store = app
                .store(STORE_FILE)
                .map_err(|error| AppError::Io(error.to_string()))?;
            let previous = store.get(STORE_KEY);
            store.set(STORE_KEY, serde_json::json!(normalized));
            if let Err(error) = store.save() {
                // Avoid a later autosave publishing a rejected preference.
                match previous {
                    Some(value) => store.set(STORE_KEY, value),
                    None => {
                        store.delete(STORE_KEY);
                    }
                }
                return Err(AppError::Io(error.to_string()));
            }
            *current = normalized.to_string();
        }
    }
    refresh_application_menu(app)?;
    crate::tray::refresh_locale(app)?;
    refresh_windows(app)
}

fn refresh_windows(app: &AppHandle) -> Result<(), AppError> {
    for (label, window) in app.webview_windows() {
        let source = match label.as_str() {
            "popup" => "Lexora Quick Translate",
            "grammar" => "Lexora Writing Check",
            label if label.starts_with("sticker-") => "Lexora Sticker",
            _ => continue,
        };
        window.set_title(&text(app, source))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_only_the_six_interface_languages() {
        for (input, expected) in [
            (" RU_ru ", "ru"),
            ("uk-UA", "uk"),
            ("es-MX", "es"),
            ("fr-CA", "fr"),
            ("it", "it"),
            ("en-US", "en"),
            ("ar", "en"),
            ("", "en"),
        ] {
            assert_eq!(normalize_locale(input), expected);
        }
    }

    #[test]
    fn translates_native_text_and_keeps_runtime_values_out_of_catalog_lookup() {
        let dictionaries = HashMap::from([
            ("en", HashMap::from([("source".into(), "English".into())])),
            (
                "ru",
                HashMap::from([
                    ("Open Lexora".into(), "Открыть Lexora".into()),
                    (
                        "Added to Vocabulary: {word}".into(),
                        "Добавлено в словарь: {word}".into(),
                    ),
                ]),
            ),
        ]);
        assert_eq!(
            translated(&dictionaries, "ru", "Open Lexora"),
            "Открыть Lexora"
        );
        assert_eq!(translated(&dictionaries, "fr", "source"), "English");
        assert_eq!(translated(&dictionaries, "fr", "unknown"), "unknown");
        assert_eq!(
            translated(&dictionaries, "ru", "Added to Vocabulary: {word}")
                .replace("{word}", "hello"),
            "Добавлено в словарь: hello"
        );
    }

    #[test]
    fn menu_sources_keep_system_actions_distinct_and_normalize_process_names() {
        for (input, expected) in [
            ("About lexora", "About Lexora"),
            ("About", "About Lexora"),
            ("&Hide lexora", "Hide Lexora"),
            ("Hide Others", "Hide Others"),
            ("Quit Lexora", "Quit Lexora"),
            ("Select &All", "Select All"),
            ("Edit", "Edit menu"),
            ("Zoom", "Zoom window"),
            ("Maximize", "Maximize window"),
            ("Ma&ximize", "Maximize window"),
            ("Exit", "Exit app"),
            ("&Exit", "Exit app"),
            ("", ""),
        ] {
            assert_eq!(menu_source(input), expected);
        }
    }

    #[test]
    fn all_bundled_native_catalogs_parse() {
        assert_eq!(
            load_dictionaries().expect("valid bundled catalogs").len(),
            6
        );
    }
    #[test]
    fn every_native_surface_has_a_translation_in_all_six_catalogs() {
        let dictionaries = load_dictionaries().expect("valid bundled catalogs");
        let sources = [
            "File", "Edit menu", "View", "Window", "Help", "About Lexora", "Services",
            "Hide Lexora", "Hide Others", "Quit Lexora", "Minimize", "Zoom window", "Maximize window", "Close Window",
            "Undo", "Redo", "Cut", "Copy", "Paste", "Select All", "Toggle Full Screen",
            "Open Lexora", "Open Translator", "Translate Selection", "Toggle Stickers", "Quit", "Exit app",
            "Lexora Quick Translate", "Lexora Sticker", "Lexora Writing Check",
            "Text copied. Press Cmd+V to paste.",
            "Text copied. Enable Accessibility for Lexora to paste automatically.",
            "Text copied. Press Ctrl+V to paste.", "Added to Vocabulary: {word}",
            "Database was corrupt and restored from backup.",
            "Database was corrupt and no usable backup found; starting with an empty database. The original file was preserved for recovery.",
        ];
        for (locale, dictionary) in &dictionaries {
            for source in sources {
                assert!(
                    dictionary
                        .get(source)
                        .is_some_and(|value| !value.trim().is_empty()),
                    "Missing native translation for {locale}: {source}"
                );
            }
            assert!(
                translated(&dictionaries, locale, "Added to Vocabulary: {word}").contains("{word}"),
                "Native value placeholder is preserved for {locale}"
            );
        }
    }
}
