-- ============================================================
-- LEXORA — V006: Lexeme synonyms + enrichment marker
-- Additive: source/target synonyms for word cards; enriched_at
-- marks when example/media were cached so we skip re-LLM.
-- ============================================================

CREATE TABLE IF NOT EXISTS lexeme_synonym (
    id              INTEGER PRIMARY KEY,
    lexeme_id       INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    language_id     INTEGER NOT NULL REFERENCES language(id),
    text            TEXT    NOT NULL,
    normalized_text TEXT    NOT NULL,
    source          TEXT,
    created_at      DATETIME DEFAULT (unixepoch()),
    UNIQUE(lexeme_id, language_id, normalized_text)
);

CREATE INDEX IF NOT EXISTS idx_lexeme_synonym_lexeme
    ON lexeme_synonym(lexeme_id, language_id);

-- When example / media enrichment finished (unix epoch).
ALTER TABLE lexeme ADD COLUMN enriched_at DATETIME;
