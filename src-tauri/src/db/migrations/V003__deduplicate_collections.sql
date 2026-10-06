-- ============================================================
-- LEXORA — V003: Deduplicate collections and add UNIQUE constraint
-- Ensures only one collection exists per (language_id, name)
-- and creates a unique index to prevent future duplicates.
-- ============================================================

-- 1. Re-map collection_item rows from duplicate collection IDs to the primary collection ID
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT prime.id, ci.lexeme_id, ci.sort_order
FROM collection_item ci
JOIN collection dupe ON dupe.id = ci.collection_id
JOIN (
    SELECT MIN(id) AS id, language_id, name
    FROM collection
    GROUP BY language_id, name
) prime ON prime.language_id = dupe.language_id AND prime.name = dupe.name
WHERE dupe.id != prime.id;

-- 2. Delete duplicate collection_item rows referencing duplicate collections
DELETE FROM collection_item
WHERE collection_id NOT IN (
    SELECT MIN(id)
    FROM collection
    GROUP BY language_id, name
);

-- 3. Delete duplicate collections, keeping only the primary (lowest ID) for each (language_id, name)
DELETE FROM collection
WHERE id NOT IN (
    SELECT MIN(id)
    FROM collection
    GROUP BY language_id, name
);

-- 4. Create UNIQUE index to guarantee idempotency and prevent duplicates permanently
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_lang_name ON collection(language_id, name);
