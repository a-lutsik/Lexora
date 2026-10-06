// ============================================================
// LEXORA — macOS System Services (NSServices)
// «Перевести» / «Добавить в словарь» / «Озвучить» для
// выделенного текста в любом приложении macOS (пункты меню
// «Службы» в контекстном меню по правому клику).
//
// Реклама сервисов — секция NSServices в src-tauri/Info.plist
// (мержится Tauri CLI в Info.plist .app-бандла).
//
// Интеграция (выполняет координатор в lib.rs):
//   pub mod services;
//   // в .setup():
//   if let Err(e) = services::register(app.handle()) {
//       log::warn!("Failed to register macOS services: {e}");
//   }
// ============================================================

use crate::error::AppError;
use tauri::AppHandle;

/// Зарегистрировать провайдер системных служб macOS.
/// Должно вызываться один раз из `setup()` на main thread.
#[cfg(target_os = "macos")]
pub fn register(app: &AppHandle) -> Result<(), AppError> {
    macos::register(app)
}

/// На не-macOS платформах системные службы не поддержаны.
#[cfg(not(target_os = "macos"))]
pub fn register(_app: &AppHandle) -> Result<(), AppError> {
    log::warn!("System services (NSServices) are only supported on macOS");
    Ok(())
}

#[cfg(target_os = "macos")]
mod macos {
    use crate::commands::media::resolve_tts_language_and_voice;
    use crate::commands::vocabulary::AddVocabularyInput;
    use crate::db::repos::settings::SettingsRepo;
    use crate::db::repos::vocabulary::VocabularyRepo;
    use crate::db::DbPool;
    use crate::error::AppError;
    use objc2::rc::Retained;
    use objc2::runtime::AnyObject;
    use objc2::{define_class, msg_send, ClassType, MainThreadMarker};
    use objc2_app_kit::{
        NSApplication, NSPasteboard, NSPasteboardTypeString, NSUpdateDynamicServices,
    };
    use objc2_foundation::{NSObject, NSProcessInfo, NSString};
    use rusqlite::params;
    use std::sync::{Arc, OnceLock};
    use tauri::{AppHandle, Manager};
    use tauri_plugin_notification::NotificationExt;

    /// Максимальная длина текста в уведомлении/логах.
    const PREVIEW_MAX_CHARS: usize = 60;
    /// Язык по умолчанию, если настройки недоступны.
    const FALLBACK_LANGUAGE: &str = "en";
    /// Значение поля source для записей, добавленных через Services.
    const SERVICE_SOURCE: &str = "macOS Services";

    /// AppHandle, сохранённый при register(); нужен Objective-C колбэкам.
    static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

    define_class!(
        // SAFETY:
        // - Суперкласс NSObject не накладывает требований на сабклассы.
        // - Класс не реализует Drop; ivars — `()` (тривиально thread-safe).
        // - Сервисные колбэки доставляются Cocoa на main thread.
        #[unsafe(super(NSObject))]
        #[name = "LexoraServices"]
        struct LexoraServices;

        impl LexoraServices {
            /// NSServices «Lexora: Translate» — показать popup-переводчик.
            #[unsafe(method(translateSelection:userData:error:))]
            fn translate_selection(
                &self,
                pboard: &NSPasteboard,
                _user_data: Option<&NSString>,
                _error: *mut *mut AnyObject,
            ) {
                let Some(text) = read_pboard_text(pboard) else {
                    return;
                };
                let Some(app) = APP_HANDLE.get() else {
                    log::warn!("Services: app handle is not initialized");
                    return;
                };
                // Колбэк приходит на main thread — окна Tauri доступны напрямую.
                if let Err(e) = crate::popup::show_popup(app, Some(text)) {
                    log::warn!("Services: failed to show popup: {e}");
                }
            }

            /// NSServices «Lexora: Add to Vocabulary» — добавить слово в словарь.
            #[unsafe(method(addToVocabulary:userData:error:))]
            fn add_to_vocabulary(
                &self,
                pboard: &NSPasteboard,
                _user_data: Option<&NSString>,
                _error: *mut *mut AnyObject,
            ) {
                let Some(text) = read_pboard_text(pboard) else {
                    return;
                };
                let Some(app) = APP_HANDLE.get() else {
                    log::warn!("Services: app handle is not initialized");
                    return;
                };
                add_word(app.clone(), text);
            }

            /// NSServices «Lexora: Speak» — озвучить системным TTS.
            #[unsafe(method(speakSelection:userData:error:))]
            fn speak_selection(
                &self,
                pboard: &NSPasteboard,
                _user_data: Option<&NSString>,
                _error: *mut *mut AnyObject,
            ) {
                let Some(text) = read_pboard_text(pboard) else {
                    return;
                };
                let Some(app) = APP_HANDLE.get() else {
                    log::warn!("Services: app handle is not initialized");
                    return;
                };
                speak_text(app.clone(), text);
            }
        }
    );

    /// Прочитать NSString с pasteboard сервисного запроса.
    /// Пустой/пробельный текст игнорируется.
    fn read_pboard_text(pboard: &NSPasteboard) -> Option<String> {
        // SAFETY: NSPasteboardTypeString — системная константа AppKit,
        // всегда указывает на валидный глобальный NSString.
        let raw = pboard.stringForType(unsafe { NSPasteboardTypeString })?;
        let trimmed = raw.to_string();
        let trimmed = trimmed.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    }

    /// Усечь текст для уведомления/лога (по символам, не по байтам).
    fn preview(text: &str) -> String {
        let mut chars = text.chars();
        let head: String = chars.by_ref().take(PREVIEW_MAX_CHARS).collect();
        if chars.next().is_some() {
            format!("{head}…")
        } else {
            head
        }
    }

    /// primary_language из настроек (fallback — английский).
    fn primary_language(conn: &rusqlite::Connection) -> String {
        conn.query_row(
            "SELECT primary_language FROM user_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| FALLBACK_LANGUAGE.to_string())
    }

    /// «Добавить в словарь»: запись в БД в фоне + уведомление.
    /// Переиспользует VocabularyRepo::add (та же логика, что у IPC-команды).
    fn add_word(app: AppHandle, text: String) {
        tauri::async_runtime::spawn(async move {
            let Some(pool) = app.try_state::<Arc<DbPool>>() else {
                log::warn!("Services: DB pool is not managed yet");
                return;
            };
            let pool = pool.inner().clone();

            let result = (|| -> Result<(i64, String, String), AppError> {
                let conn = pool.get()?;
                let source_language = primary_language(&conn);
                let input = AddVocabularyInput {
                    lexeme_id: None,
                    text: text.clone(),
                    source_language: source_language.clone(),
                    notes: None,
                    source: Some(SERVICE_SOURCE.to_string()),
                };
                let uv_id = VocabularyRepo::add(&conn, &input)?;
                let (lexeme_id, lexeme_text): (i64, String) = conn.query_row(
                    "SELECT l.id, l.text FROM user_vocabulary uv
                     JOIN lexeme l ON l.id = uv.lexeme_id
                     WHERE uv.id = ?1",
                    params![uv_id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )?;
                Ok((lexeme_id, lexeme_text, source_language))
            })();

            match result {
                Ok((lexeme_id, lexeme_text, source_language)) => {
                    crate::commands::translate::spawn_enrich(
                        app.clone(),
                        pool,
                        lexeme_id,
                        lexeme_text,
                        source_language,
                        "ru".to_string(),
                        String::new(),
                    );
                    log::info!("Services: added to vocabulary: {}", preview(&text));
                    if let Err(e) = app
                        .notification()
                        .builder()
                        .title("Lexora")
                        .body(format!("Added to Vocabulary: {}", preview(&text)))
                        .show()
                    {
                        log::warn!("Services: notification failed: {e}");
                    }
                }
                Err(e) => log::warn!("Services: failed to add to vocabulary: {e}"),
            }
        });
    }

    /// «Озвучить»: системный TTS в фоне (та же логика, что play_tts).
    fn speak_text(app: AppHandle, text: String) {
        tauri::async_runtime::spawn(async move {
            let Some(pool) = app.try_state::<Arc<DbPool>>().map(|p| p.inner().clone()) else {
                log::warn!("Services: DB pool is not managed yet");
                return;
            };
            let settings = pool
                .get()
                .ok()
                .and_then(|conn| SettingsRepo::get(&conn).ok())
                .unwrap_or_default();
            let (language, voice) = resolve_tts_language_and_voice(
                None,
                &settings.primary_language,
                &settings.tts_voice,
            );

            // Same TTS role chain as the app (cloud voice → system voice).
            let chain = crate::commands::media::tts_chain(&app, &pool, &settings);
            if let Err(e) =
                crate::commands::media::speak_with_chain(chain, &text, &language, &voice).await
            {
                log::warn!("Services: TTS failed: {e}");
            }
        });
    }

    /// Зарегистрировать LexoraServices как services provider у NSApplication
    /// и обновить динамический реестр служб.
    pub fn register(app: &AppHandle) -> Result<(), AppError> {
        let Some(mtm) = MainThreadMarker::new() else {
            return Err(AppError::Validation(
                "services::register must be called on the main thread".to_string(),
            ));
        };

        // Повторный вызов (например, при пересоздании окна) — не ошибка.
        if APP_HANDLE.set(app.clone()).is_err() {
            log::warn!("Services: app handle was already registered");
        }

        // SAFETY: `new` у NSObject-подкласса возвращает валидный объект.
        let provider: Retained<AnyObject> = unsafe { msg_send![LexoraServices::class(), new] };

        // Порт NSServices берётся из имени процесса, если нет .app-бандла
        // (`tauri dev` запускает бинарь `lexora`, а не Lexora.app).
        NSProcessInfo::processInfo().setProcessName(&NSString::from_str("Lexora"));

        let ns_app = NSApplication::sharedApplication(mtm);
        // SAFETY: provider — живой NSObject-совместимый объект,
        // методы сервисов объявлены в классе LexoraServices.
        unsafe { ns_app.setServicesProvider(Some(&provider)) };

        // NSApplication не ретейнит services provider — он обязан жить
        // всё время работы приложения, поэтому намеренно «забываем» его.
        std::mem::forget(provider);

        NSUpdateDynamicServices();
        // Сбрасываем кэш pbs, иначе новые пункты не появляются в Services.
        let _ = std::process::Command::new("/System/Library/CoreServices/pbs")
            .arg("-flush")
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn();
        log::info!("macOS Services registered: Translate / Add to Vocabulary / Speak");
        Ok(())
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn preview_keeps_short_text_intact() {
            assert_eq!(preview("hello"), "hello");
        }

        #[test]
        fn preview_truncates_long_text_with_ellipsis() {
            let long = "a".repeat(PREVIEW_MAX_CHARS + 10);
            let out = preview(&long);
            assert_eq!(out.chars().count(), PREVIEW_MAX_CHARS + 1);
            assert!(out.ends_with('…'));
        }

        #[test]
        fn preview_counts_chars_not_bytes() {
            let cyrillic = "п".repeat(PREVIEW_MAX_CHARS + 5);
            let out = preview(&cyrillic);
            assert_eq!(out.chars().count(), PREVIEW_MAX_CHARS + 1);
        }
    }
}
