-- ============================================================
-- LEXORA — V005: Fallback AI Provider
-- Adds fallback provider and model columns for automatic failover.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN fallback_ai_provider TEXT DEFAULT 'gemini';

ALTER TABLE user_settings
    ADD COLUMN fallback_ai_model TEXT DEFAULT 'gemini-3.6-flash';

ALTER TABLE user_settings
    ADD COLUMN fallback_enabled INTEGER NOT NULL DEFAULT 1;
