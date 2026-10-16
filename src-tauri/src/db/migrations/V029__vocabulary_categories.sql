-- Flat, language-scoped organization independent of collection membership.
CREATE TABLE IF NOT EXISTS vocabulary_category (
    id INTEGER PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES language(id),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    is_general INTEGER NOT NULL DEFAULT 0 CHECK (is_general IN (0, 1)),
    created_at DATETIME DEFAULT (unixepoch()),
    deleted_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_language_name
    ON vocabulary_category(language_id, normalized_name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_general
    ON vocabulary_category(language_id) WHERE is_general = 1 AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_category_deleted ON vocabulary_category(deleted_at);

INSERT OR IGNORE INTO vocabulary_category(language_id, name, normalized_name, is_general)
SELECT id, 'General', 'general', 1 FROM language;

ALTER TABLE user_vocabulary ADD COLUMN category_id INTEGER REFERENCES vocabulary_category(id);
CREATE INDEX IF NOT EXISTS idx_uv_category ON user_vocabulary(category_id, deleted_at);
UPDATE user_vocabulary SET category_id = (
    SELECT c.id FROM vocabulary_category c JOIN lexeme l ON l.language_id = c.language_id
    WHERE l.id = user_vocabulary.lexeme_id AND c.is_general = 1 AND c.deleted_at IS NULL
) WHERE category_id IS NULL;

-- Keep future languages and legacy/raw SQL insertion paths covered.
CREATE TRIGGER IF NOT EXISTS language_general_category AFTER INSERT ON language BEGIN
    INSERT OR IGNORE INTO vocabulary_category(language_id, name, normalized_name, is_general)
    VALUES (NEW.id, 'General', 'general', 1);
END;
CREATE TRIGGER IF NOT EXISTS uv_default_category AFTER INSERT ON user_vocabulary
WHEN NEW.category_id IS NULL BEGIN
    UPDATE user_vocabulary SET category_id = (
        SELECT c.id FROM vocabulary_category c JOIN lexeme l ON l.language_id = c.language_id
        WHERE l.id = NEW.lexeme_id AND c.is_general = 1 AND c.deleted_at IS NULL
    ) WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS uv_validate_category_insert BEFORE INSERT ON user_vocabulary
WHEN NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vocabulary_category c JOIN lexeme l ON l.language_id = c.language_id
    WHERE c.id = NEW.category_id AND l.id = NEW.lexeme_id AND c.deleted_at IS NULL
) BEGIN SELECT RAISE(ABORT, 'Vocabulary category must belong to the word language'); END;
CREATE TRIGGER IF NOT EXISTS uv_validate_category_update BEFORE UPDATE OF category_id, lexeme_id ON user_vocabulary
WHEN NEW.category_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM vocabulary_category c JOIN lexeme l ON l.language_id = c.language_id
    WHERE c.id = NEW.category_id AND l.id = NEW.lexeme_id AND c.deleted_at IS NULL
) BEGIN SELECT RAISE(ABORT, 'Vocabulary category must belong to the word language'); END;
