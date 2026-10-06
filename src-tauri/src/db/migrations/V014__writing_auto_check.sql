-- ============================================================
-- LEXORA — V014: Writing Auto-Check Mode
-- Opt-in flag: when enabled, the Writing Assistant page
-- automatically runs check_writing after a typing pause.
-- Default OFF — auto-sending text to AI is privacy-sensitive.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN writing_auto_check INTEGER NOT NULL DEFAULT 0;
