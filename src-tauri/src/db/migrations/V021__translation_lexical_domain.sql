-- ============================================================
-- LEXORA — V021: Per-domain translation cache
-- Same lexeme may have different glosses for IT vs General, etc.
-- ============================================================

ALTER TABLE translation
    ADD COLUMN lexical_domain TEXT NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_translation_lexeme_domain
    ON translation(lexeme_id, target_language_id, lexical_domain);
