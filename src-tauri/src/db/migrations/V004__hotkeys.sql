-- ============================================================
-- LEXORA — V004: Configurable global hotkeys
-- Adds user-configurable hotkey columns to user_settings.
-- Defaults match the previously hardcoded shortcuts.
-- (Номер V004: V003 занята миграцией deduplicate_collections.)
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN hotkey_translate TEXT NOT NULL DEFAULT 'CmdOrCtrl+Shift+L';

ALTER TABLE user_settings
    ADD COLUMN hotkey_stickers TEXT NOT NULL DEFAULT 'CmdOrCtrl+Shift+S';
