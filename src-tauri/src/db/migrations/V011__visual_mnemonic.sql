-- ============================================================
-- LEXORA — V011: Visual mnemonic association metadata
-- Persists sense / association / prompt so style can be re-rendered
-- later without re-inventing the mnemonic (regenerate still re-runs
-- the concept pipeline by product choice).
-- ============================================================

ALTER TABLE lexeme ADD COLUMN visual_sense TEXT;
ALTER TABLE lexeme ADD COLUMN visual_association TEXT;
ALTER TABLE lexeme ADD COLUMN visual_memory_hook TEXT;
ALTER TABLE lexeme ADD COLUMN visual_image_prompt TEXT;
ALTER TABLE lexeme ADD COLUMN visual_photo_query TEXT;
