-- ============================================================
-- LEXORA — V015: Sticker word-source filter
-- JSON array of tokens: "all" | "mine" | "c:<collectionId>"
-- Default "all" keeps the previous "every due word" behaviour.
-- ============================================================

ALTER TABLE user_settings
    ADD COLUMN sticker_sources TEXT NOT NULL DEFAULT '["all"]';
