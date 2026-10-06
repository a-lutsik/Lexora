#!/usr/bin/env python3
"""
LEXORA seed — shared helpers for building V002__seed_collections.sql.

Each import_*.py module exposes `section()` -> str (an SQL fragment).
Any of the import_*.py scripts can be run directly: it regenerates the
FULL migration file by assembling the sections of all three modules.
"""
import csv
import datetime
import pathlib

SEED_DIR = pathlib.Path(__file__).resolve().parent
DATA_DIR = SEED_DIR / "data"
MIGRATION_PATH = (
    SEED_DIR.parent.parent / "src-tauri" / "src" / "db" / "migrations"
    / "V002__seed_collections.sql"
)

EN_LANGUAGE_ID = 1
RU_LANGUAGE_ID = 2

HEADER = """-- ============================================================
-- LEXORA — V002: Seed system collections with content
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with any of:
--   python3 scripts/seed/import_frequency.py
--   python3 scripts/seed/import_phrasal.py
--   python3 scripts/seed/import_irregular.py
-- Source data: scripts/seed/data/*.csv
-- Generated at: {timestamp}
--
-- Idempotent: every statement is INSERT OR IGNORE or guarded by
-- NOT EXISTS, so re-applying this migration changes nothing.
--
-- Data representation decisions:
--  * Irregular verbs: the lexeme is the BASE form only (pos='verb');
--    past / participle forms are stored in translation.sense as
--    \"past: <past>; participle: <participle>\" next to the RU
--    translation. No separate lexemes are created for past forms.
--  * Phrasal verbs: one lexeme per phrasal verb (pos='phrasal_verb'),
--    RU translation in translation (source='seed'), usage example
--    in example (source='seed').
--  * Frequency words: lexeme rows with frequency_rank; part_of_speech
--    is filled where known (top function/content words), else NULL.
--  * 'Business English' is filled later by V012 (do not add it here).
-- ============================================================
"""


def read_csv(name):
    """Read a data CSV (with header row) as a list of dicts."""
    path = DATA_DIR / name
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def sql_str(value):
    """Quote a Python string as an SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def normalize(text):
    return text.strip().lower()


def sql_str_list(values):
    return ", ".join(sql_str(v) for v in values)


def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def collection_items_section(collection_name, normalized_texts):
    """INSERT OR IGNORE into collection_item via subquery on collection name."""
    lines = []
    for chunk in chunked(normalized_texts, 400):
        lines.append(
            "INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)\n"
            "SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)\n"
            "FROM collection c\n"
            "JOIN lexeme l ON l.language_id = {lang}\n"
            "WHERE c.name = {name}\n"
            "  AND l.normalized_text IN ({words});".format(
                lang=EN_LANGUAGE_ID,
                name=sql_str(collection_name),
                words=sql_str_list(chunk),
            )
        )
    return "\n\n".join(lines)


def build_migration():
    """Assemble all sections and write V002__seed_collections.sql."""
    import import_frequency
    import import_irregular
    import import_phrasal

    parts = [
        HEADER.format(timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()),
        import_frequency.section(),
        import_phrasal.section(),
        import_irregular.section(),
    ]
    content = "\n\n".join(p.rstrip() for p in parts) + "\n"
    MIGRATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    MIGRATION_PATH.write_text(content, encoding="utf-8")
    size_kb = MIGRATION_PATH.stat().st_size / 1024
    print(f"Wrote {MIGRATION_PATH} ({size_kb:.0f} KB)")
