// ============================================================
// LEXORA — lib.rs
// Точка входа библиотеки. Инициализация Tauri, плагинов,
// БД-пула и регистрация всех IPC-команд.
// ============================================================

pub mod api_keys;
pub mod commands;
pub mod db;
pub mod display;
pub mod error;
pub mod grammar_watch;
pub mod hotkeys;
pub mod i18n;
pub mod popup;
pub mod pronunciation;
pub mod providers;
pub mod services;
pub mod srs;
pub mod stickers;
pub mod tray;
pub mod window_layout;

use crate::error::AppError;
use std::sync::Arc;
use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging in dev mode
    #[cfg(debug_assertions)]
    env_logger::init();

    tauri::Builder::default()
        // ── Plugins ──────────────────────────────────────
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    // Срабатываем только на Pressed, иначе действие
                    // продублируется на Released
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    let action = app
                        .try_state::<hotkeys::HotkeyState>()
                        .and_then(|state| state.action_for(shortcut));
                    match action {
                        Some(hotkeys::HotkeyAction::TranslateSelection) => {
                            hotkeys::translate_selection(app);
                        }
                        Some(hotkeys::HotkeyAction::ToggleStickers) => {
                            if let Err(e) = stickers::toggle_stickers_inner(app) {
                                log::warn!("Failed to toggle stickers from hotkey: {e}");
                            }
                        }
                        None => {}
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(popup::panel_plugin())
        .on_window_event(|window, event| {
            window_layout::on_window_event(window, event);
            stickers::on_window_event(window, event);
        })
        // ── Setup ─────────────────────────────────────────
        .setup(|app| {
            i18n::initialize(app.handle())?;

            // Initialize SQLite connection pool
            let app_dir = app.path().app_data_dir()?;

            std::fs::create_dir_all(&app_dir)?;
            if let Err(e) = crate::pronunciation::audio_cache::ensure_attempts_dir(&app_dir) {
                log::warn!("Failed to create audio_attempts dir: {e}");
            }

            let db_path = app_dir.join("lexora.db");

            // ── M6: integrity check + offline recovery ──────
            // Битая БД карантинируется (не удаляется), данные
            // восстанавливаются из последнего бэкапа, если он есть.
            let health = db::backup::verify_and_recover(&db_path)?;
            if !matches!(
                health.status,
                db::backup::DbHealthStatus::Ok | db::backup::DbHealthStatus::Clean
            ) {
                log::warn!("Database recovery: {}", health.message);
                // Ошибка уведомления не фатальна — приложение должно стартовать.
                use tauri_plugin_notification::NotificationExt;
                if let Err(e) = app
                    .notification()
                    .builder()
                    .title("Lexora")
                    .body(i18n::text(app.handle(), match health.status {
                        db::backup::DbHealthStatus::RecoveredFromBackup => "Database was corrupt and restored from backup.",
                        _ => "Database was corrupt and no usable backup found; starting with an empty database. The original file was preserved for recovery.",
                    }))
                    .show()
                {
                    log::warn!("Failed to show recovery notification: {e}");
                }
            }

            let pool = Arc::new(db::create_pool(&db_path)?);

            // Run migrations
            db::run_migrations(&pool)?;

            // V023: seed per-role AI model routes once (non-fatal on error).
            match pool.get() {
                Ok(mut conn) => {
                    if let Err(e) = providers::models::ensure_routes(&mut conn) {
                        log::warn!("Failed to seed AI model routes: {e}");
                    }
                }
                Err(e) => log::warn!("Failed to open DB for model routes: {e}"),
            }

            let media_dir = app_dir.join("media");
            // Only seed SVG placeholders for words already in the user's vocabulary —
            // system packs stay empty until the user clicks Load.
            if let Err(e) = crate::providers::media::seed_image::ensure_seed_images_for_vocabulary(
                &pool, &media_dir,
            ) {
                log::warn!("Failed to seed associative images: {e}");
            }

            // ── M6: авто-бэкап не чаще раза в сутки ─────────
            // Ошибки бэкапа не фатальны — только логируем.
            let backups_dir = db::backup::backups_dir_for(&db_path);
            let backup_is_fresh = db::backup::latest_backup(&backups_dir)
                .ok()
                .flatten()
                .and_then(|p| std::fs::metadata(p).ok())
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.elapsed().ok())
                .map(|age| age < std::time::Duration::from_secs(24 * 60 * 60))
                .unwrap_or(false);
            if !backup_is_fresh {
                match db::backup::create_backup(&db_path, &backups_dir)
                    .and_then(|_| db::backup::rotate_backups(&backups_dir, 3))
                {
                    Ok(()) => log::info!("Automatic daily backup completed"),
                    Err(e) => log::warn!("Automatic backup failed (non-fatal): {e}"),
                }
            }

            app.manage(pool.clone());
            app.manage(providers::realtime::RealtimeSessions::default());
            app.manage(stickers::new_roster_state());
            app.manage(stickers::new_windows_state());
            stickers::restore_window_rects(app.handle());
            crate::providers::media::prefetch::spawn_prefetch_stock_images(
                app.handle().clone(),
                pool,
                media_dir,
            );

            // Load persisted API keys into env for AI providers
            if let Err(e) = api_keys::load_api_keys_into_env(app.handle()) {
                log::warn!("Failed to load API keys from store: {e}");
            }

            // System tray
            if let Err(e) = tray::build_tray(app.handle()) {
                log::warn!("Failed to build system tray: {e}");
            }

            // Desktop stickers (по настройкам, с учётом quiet hours)
            if let Err(e) = stickers::spawn_stickers(app.handle()) {
                log::warn!("Failed to spawn stickers: {e}");
            }
            stickers::start_quiet_hours_watcher(app.handle());

            // Global hotkeys из настроек (fallback на дефолты при ошибке чтения).
            // HotkeyState должен быть managed до регистрации — register_shortcuts
            // обновляет в нём привязки для диспетчеризации в обработчике плагина.
            app.manage(hotkeys::HotkeyState::default());
            let (hotkey_translate, hotkey_stickers) = {
                let pool = app.state::<Arc<db::DbPool>>();
                match pool
                    .get()
                    .map_err(AppError::from)
                    .and_then(|conn| db::repos::settings::SettingsRepo::get(&conn))
                {
                    Ok(settings) => hotkeys::current_shortcuts(&settings),
                    Err(e) => {
                        log::warn!("Failed to load hotkey settings, using defaults: {e}");
                        (
                            hotkeys::TRANSLATE_SHORTCUT.to_string(),
                            hotkeys::STICKERS_SHORTCUT.to_string(),
                        )
                    }
                }
            };
            if let Err(e) =
                hotkeys::register_shortcuts(app.handle(), &hotkey_translate, &hotkey_stickers)
            {
                log::warn!("Failed to register global shortcuts: {e}");
            }

            // macOS Services (контекстное меню «Службы» для выделенного текста)
            if let Err(e) = services::register(app.handle()) {
                log::warn!("Failed to register macOS services: {e}");
            }

            // Хранилище отложенного текста для popup окна
            app.manage(popup::PendingPopupText::default());

            // Проверка текста в других приложениях (opt-in, macOS)
            grammar_watch::start(app.handle());

            if let Some(main) = app.get_webview_window("main") {
                window_layout::prepare_main_window(&main);
            }

            Ok(())
        })
        // ── IPC Commands ───────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            commands::interface::set_interface_locale,
            // Vocabulary
            commands::categories::list_categories,
            commands::categories::create_category,
            commands::categories::rename_category,
            commands::categories::delete_category,
            commands::categories::move_vocabulary_to_category,
            commands::vocabulary::list_vocabulary,
            commands::vocabulary::get_vocabulary_entry,
            commands::vocabulary::add_to_vocabulary,
            commands::collocations::get_collocations,
            commands::collocations::add_collocations_to_vocabulary,
            commands::vocabulary::add_vocabulary_batch,
            commands::vocabulary::import_word_list,
            commands::vocabulary::remove_from_vocabulary,
            commands::vocabulary::remove_vocabulary_batch,
            commands::vocabulary::toggle_favorite,
            commands::vocabulary::update_vocabulary_notes,
            commands::vocabulary::update_vocabulary_entry,
            commands::vocabulary::count_vocabulary,
            // Export / Import
            commands::export_import::export_vocabulary,
            commands::export_import::import_vocabulary,
            // Translation
            commands::translate::translate_text,
            commands::translate::test_provider_connection,
            // Честная проверка соединения: реальный вызов провайдера,
            // ошибка возвращается verbatim в TestConnectionResult.message
            commands::translate::test_ai_connection,
            // Writing assistant
            commands::writing::check_writing,
            commands::writing::rewrite_text,
            commands::writing::update_writing_issue_status,
            commands::writing::accept_all_issues,
            commands::writing::get_writing_error_patterns,
            commands::writing_exercises::generate_writing_exercises,
            // System-wide writing check («Grammarly mode»)
            commands::grammar_watch::get_grammar_watch_settings,
            commands::grammar_watch::update_grammar_watch_settings,
            commands::grammar_watch::get_grammar_watch_status,
            commands::grammar_watch::request_grammar_watch_access,
            commands::grammar_watch::get_grammar_field,
            commands::grammar_watch::apply_grammar_fix,
            commands::grammar_watch::set_grammar_panel_open,
            commands::grammar_watch::snooze_grammar_field,
            commands::grammar_watch::exclude_grammar_app,
            // Pronunciation coach
            commands::pronunciation::save_audio_recording,
            commands::pronunciation::evaluate_pronunciation,
            commands::pronunciation::get_articulation_tip,
            commands::pronunciation::resolve_pronunciation_model,
            commands::pronunciation::get_pronunciation_history,
            commands::pronunciation::get_problem_phonemes,
            commands::pronunciation::get_minimal_pairs,
            // AI Dialogue
            commands::dialogue::list_dialogue_scenarios,
            commands::dialogue::generate_dialogue_scenarios,
            commands::dialogue::create_dialogue_scenario,
            commands::dialogue::delete_dialogue_scenario,
            commands::dialogue::start_dialogue_session,
            commands::dialogue::send_dialogue_turn,
            commands::dialogue::get_dialogue_session,
            commands::dialogue::end_dialogue_session,
            // Study
            commands::study::get_study_queue,
            commands::study::evaluate_answer,
            commands::study::submit_review,
            commands::study::get_review_history,
            commands::study::get_due_count,
            // Collections
            commands::collections::list_collections,
            commands::collections::ensure_system_packs_cmd,
            commands::collections::load_system_pack,
            commands::collections::toggle_collection,
            commands::collections::create_collection,
            // Languages
            commands::vocabulary::list_languages,
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::set_api_key,
            commands::settings::get_api_keys_status,
            commands::settings::apply_setup_preset,
            // AI model routing (V023)
            commands::models::get_model_catalog,
            commands::models::get_model_routes,
            commands::models::get_ai_usage,
            commands::models::apply_model_package,
            commands::models::set_role_route,
            commands::models::test_model_role,
            // Realtime voice (Gemini Live)
            commands::realtime::realtime_start,
            commands::realtime::realtime_send_audio,
            commands::realtime::realtime_send_text,
            commands::realtime::realtime_stop,
            // Media
            commands::media::get_audio_path,
            commands::media::get_image_path,
            commands::media::play_tts,
            commands::media::regenerate_lexeme_image,
            commands::media::resolve_word_image,
            commands::media::test_image_connection,
            // Stats
            commands::stats::get_stats_summary,
            commands::stats::get_daily_activity,
            commands::stats::get_error_breakdown,
            commands::stats::get_hardest_words,
            commands::stats::get_words_added_stats,
            // Window / OS integration
            popup::open_popup_window,
            popup::close_popup_window,
            popup::get_pending_popup_text,
            popup::open_main_window,
            popup::resize_popup_window,
            popup::accept_and_replace,
            stickers::toggle_stickers,
            stickers::show_sticker_window,
            stickers::set_sticker_pinned,
            stickers::get_sticker_card,
            stickers::dismiss_sticker_card,
            // Translation Hub (Stage 4)
            commands::translation_hub::translate_text_hub,
            commands::translation_hub::translate_image_hub,
            commands::translation_hub::translate_document_chunk_hub,
            commands::translation_hub::translate_audio_hub,
            commands::translation_hub::transcribe_audio_hub,
            commands::translation_hub::list_translation_history,
            commands::translation_hub::toggle_translation_history_favorite,
            commands::translation_hub::delete_translation_history_entry,
            commands::translation_hub::clear_translation_history,
            // DB backup / recovery (M6)
            db::backup::get_db_health,
            db::backup::create_db_backup,
        ])
        .run(tauri::generate_context!())
        // Unrecoverable startup failure: the event loop cannot start,
        // so there is no meaningful way to continue or recover (per AGENTS.md §14).
        .expect("Error while running Lexora");
}
