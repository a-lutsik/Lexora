-- ============================================================
-- V018: Lazy system packs — pack_key / load_status, strip unused seeds
-- System lexemes not in user_vocabulary are removed so Load is required.
-- ============================================================

-- Pack metadata on collections
ALTER TABLE collection ADD COLUMN pack_key TEXT;
ALTER TABLE collection ADD COLUMN load_status TEXT NOT NULL DEFAULT 'empty';
ALTER TABLE collection ADD COLUMN loaded_at DATETIME;

-- Backfill English system shells by name
UPDATE collection SET pack_key = 'top_5000', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Top 5000 Words' AND pack_key IS NULL;

UPDATE collection SET pack_key = 'phrasal_verbs', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Phrasal Verbs' AND pack_key IS NULL;

UPDATE collection SET pack_key = 'irregular_verbs', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Irregular Verbs' AND pack_key IS NULL;

UPDATE collection SET pack_key = 'business', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Business English' AND pack_key IS NULL;

UPDATE collection SET pack_key = 'academic', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Academic English' AND pack_key IS NULL;

UPDATE collection SET pack_key = 'travel', load_status = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN 'ready' ELSE 'empty' END, loaded_at = CASE WHEN (
    SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id
) > 0 THEN unixepoch() ELSE NULL END
WHERE name = 'Travel English' AND pack_key IS NULL;

-- Unique pack key per language (NULLs allowed for user collections)
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_lang_pack_key
    ON collection(language_id, pack_key)
    WHERE pack_key IS NOT NULL;

-- Strip system seed content that was never added to the user's vocabulary.
-- Keep lexemes that appear in user_vocabulary (any source, including soft-deleted).
DELETE FROM collection_item
WHERE lexeme_id IN (
    SELECT l.id FROM lexeme l
    WHERE l.is_system = 1
      AND NOT EXISTS (
          SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = l.id
      )
);

DELETE FROM translation
WHERE lexeme_id IN (
    SELECT l.id FROM lexeme l
    WHERE l.is_system = 1
      AND NOT EXISTS (
          SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = l.id
      )
);

DELETE FROM example
WHERE lexeme_id IN (
    SELECT l.id FROM lexeme l
    WHERE l.is_system = 1
      AND NOT EXISTS (
          SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = l.id
      )
);

DELETE FROM lexeme_synonym
WHERE lexeme_id IN (
    SELECT l.id FROM lexeme l
    WHERE l.is_system = 1
      AND NOT EXISTS (
          SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = l.id
      )
);

DELETE FROM media
WHERE lexeme_id IN (
    SELECT l.id FROM lexeme l
    WHERE l.is_system = 1
      AND NOT EXISTS (
          SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = l.id
      )
);

DELETE FROM lexeme
WHERE is_system = 1
  AND NOT EXISTS (
      SELECT 1 FROM user_vocabulary uv WHERE uv.lexeme_id = lexeme.id
  );

-- Reset pack status when items were stripped
UPDATE collection
SET load_status = 'empty',
    loaded_at = NULL
WHERE pack_key IS NOT NULL
  AND collection_type = 'system'
  AND (SELECT COUNT(*) FROM collection_item ci WHERE ci.collection_id = collection.id) = 0;
