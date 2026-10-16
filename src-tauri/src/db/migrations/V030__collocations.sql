-- ============================================================
-- LEXORA — V030: Word collocations
-- Additive: AI-generated collocations cached per (word, target
-- language). A collocation promoted to its own vocabulary card
-- links to that phrase lexeme via collocation_lexeme_id.
-- ============================================================

CREATE TABLE IF NOT EXISTS lexeme_collocation (
    id                    INTEGER PRIMARY KEY,
    lexeme_id             INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    target_language_id    INTEGER NOT NULL REFERENCES language(id),
    text                  TEXT    NOT NULL,
    normalized_text       TEXT    NOT NULL,
    pattern               TEXT,
    translation           TEXT    NOT NULL,
    example               TEXT,
    focus                 TEXT,             -- partner word blanked in study mode
    distractors           TEXT    NOT NULL DEFAULT '[]', -- JSON array of wrong partners
    nuance                TEXT,             -- how it differs from similar collocations
    sort_order            INTEGER NOT NULL DEFAULT 0,
    collocation_lexeme_id INTEGER REFERENCES lexeme(id) ON DELETE SET NULL,
    source                TEXT,
    created_at            DATETIME DEFAULT (unixepoch()),
    UNIQUE(lexeme_id, target_language_id, normalized_text)
);

CREATE INDEX IF NOT EXISTS idx_collocation_lexeme_target
    ON lexeme_collocation(lexeme_id, target_language_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_collocation_phrase_lexeme
    ON lexeme_collocation(collocation_lexeme_id);

-- When collocations were generated for a (word, target language); stops
-- repeat LLM calls for words that have none in that language.
CREATE TABLE IF NOT EXISTS lexeme_collocation_check (
    lexeme_id          INTEGER NOT NULL REFERENCES lexeme(id) ON DELETE CASCADE,
    target_language_id INTEGER NOT NULL REFERENCES language(id),
    checked_at         DATETIME NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (lexeme_id, target_language_id)
);
