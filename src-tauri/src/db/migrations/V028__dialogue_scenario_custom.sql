-- ============================================================
-- V028: Dialogue scenarios in any language + user scenarios
--   kind      guided = a concrete situation, free = talk about anything
--   origin    builtin (seed, English) | generated (AI translation of a
--             builtin) | custom (written by the learner)
--   base_slug slug of the English builtin a generated row localizes
--   deleted_at soft delete (sessions keep referencing the row)
-- ============================================================

ALTER TABLE dialogue_scenario ADD COLUMN kind TEXT NOT NULL DEFAULT 'guided';
ALTER TABLE dialogue_scenario ADD COLUMN origin TEXT NOT NULL DEFAULT 'builtin';
ALTER TABLE dialogue_scenario ADD COLUMN base_slug TEXT;
ALTER TABLE dialogue_scenario ADD COLUMN deleted_at DATETIME;

-- One localization of a builtin scenario per language.
CREATE UNIQUE INDEX IF NOT EXISTS idx_dialogue_scenario_base_language
    ON dialogue_scenario(base_slug, language)
    WHERE base_slug IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dialogue_scenario_live
    ON dialogue_scenario(language, deleted_at, sort_order);
