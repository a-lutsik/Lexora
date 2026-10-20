-- ============================================================
-- LEXORA — V031: Voice translate hotkey
-- Additive: global shortcut that opens the popup in voice mode
-- (record speech → translate → Accept inserts into the field).
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN hotkey_voice_translate TEXT NOT NULL DEFAULT 'CmdOrCtrl+Shift+Space';
