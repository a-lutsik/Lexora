-- ============================================================
-- LEXORA — Migration V010: Translation Hub
-- Tables for text, image, document, and audio translation history.
-- ============================================================

CREATE TABLE IF NOT EXISTS translation_history (
    id                  INTEGER PRIMARY KEY,
    mode                TEXT    NOT NULL,                  -- 'text'|'image'|'document'|'audio'
    source_language     TEXT    NOT NULL,
    target_language     TEXT    NOT NULL,
    original_text       TEXT    NOT NULL,
    translated_text     TEXT    NOT NULL,
    metadata_json       TEXT,                              -- JSON: bboxes, doc name, audio duration
    is_favorite         INTEGER NOT NULL DEFAULT 0,        -- 0/1
    created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
    deleted_at          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_translation_history_mode
    ON translation_history(mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translation_history_created
    ON translation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translation_history_fav
    ON translation_history(is_favorite, created_at DESC);
