-- ============================================================
-- LEXORA — V008: Writing Privacy Mode
-- Adds a flag that disables persistence of writing checks:
-- sensitive text is never written to writing_check /
-- writing_issue / writing_error_pattern.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN writing_privacy_mode INTEGER NOT NULL DEFAULT 0;
