-- ============================================================
-- LEXORA — V032: Advanced model mode
-- Additive: a separate switch that shows per-role model editors
-- (e.g. translation via DeepSeek, voice via Gemini). Users who
-- already picked models per role keep the editors visible.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN advanced_models INTEGER NOT NULL DEFAULT 0;

UPDATE user_settings SET advanced_models = 1 WHERE model_package = 'custom';
