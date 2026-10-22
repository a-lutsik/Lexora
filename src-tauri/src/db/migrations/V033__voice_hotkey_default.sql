-- ============================================================
-- LEXORA — V033: Voice translate hotkey default → Cmd/Ctrl+Shift+V
-- Data-only: V031 shipped Cmd/Ctrl+Shift+Space, which is easy to clash
-- with system and launcher shortcuts. Rows that still hold the old
-- default move to the new one; any custom combination is left alone.
-- ============================================================

UPDATE user_settings
   SET hotkey_voice_translate = 'CmdOrCtrl+Shift+V'
 WHERE hotkey_voice_translate = 'CmdOrCtrl+Shift+Space';
