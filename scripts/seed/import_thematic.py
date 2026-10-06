#!/usr/bin/env python3
"""
LEXORA seed — English thematic collections (Business / Academic / Travel).

Reads scripts/seed/data/english_thematic.csv and writes an additive
migration V012__seed_english_thematic.sql. Do not fold this into V002:
that migration is already applied on existing installs.

    python3 scripts/seed/import_thematic.py
"""
import datetime
import pathlib
import sys

import seed_common as sc

MIGRATION_PATH = (
    sc.SEED_DIR.parent.parent / "src-tauri" / "src" / "db" / "migrations"
    / "V012__seed_english_thematic.sql"
)

NEW_COLLECTIONS = [
    ("Academic English", "University and exam vocabulary", 5),
    ("Travel English", "Travel and hospitality vocabulary", 6),
]


def load_rows():
    rows = []
    seen = set()
    for row in sc.read_csv("english_thematic.csv"):
        collection = row["collection"].strip()
        word = row["word"].strip()
        if not collection or not word:
            continue
        key = (collection, sc.normalize(word))
        if key in seen:
            raise SystemExit(f"Duplicate thematic row: {collection} / {word}")
        seen.add(key)
        rows.append(
            {
                "collection": collection,
                "word": word,
                "norm": sc.normalize(word),
                "pos": row["pos"].strip() or None,
                "translation_ru": row["translation_ru"].strip(),
                "example": row["example"].strip(),
            }
        )
    return rows


def section(rows):
    unique_lexemes = {}
    for row in rows:
        unique_lexemes.setdefault(row["norm"], row)

    lines = [
        "-- ── New English system collections (Business already exists in V001) ──",
    ]
    values = ",\n    ".join(
        f"({sc.sql_str(name)}, {sc.sql_str(desc)}, 'system', {sc.EN_LANGUAGE_ID}, {order})"
        for name, desc, order in NEW_COLLECTIONS
    )
    lines.append(
        "INSERT OR IGNORE INTO collection\n"
        "    (name, description, collection_type, language_id, sort_order)\n"
        f"VALUES\n    {values};"
    )

    lines.append("")
    lines.append(
        f"-- ── Lexemes ({len(unique_lexemes)} unique; overlap with Top 5000 is INSERT OR IGNORE) ──"
    )
    lexeme_list = list(unique_lexemes.values())
    for chunk in sc.chunked(lexeme_list, 50):
        values = ",\n    ".join(
            "({lang}, {text}, {norm}, {pos}, 1)".format(
                lang=sc.EN_LANGUAGE_ID,
                text=sc.sql_str(row["word"]),
                norm=sc.sql_str(row["norm"]),
                pos="NULL" if not row["pos"] else sc.sql_str(row["pos"]),
            )
            for row in chunk
        )
        lines.append(
            "INSERT OR IGNORE INTO lexeme\n"
            "    (language_id, text, normalized_text, part_of_speech, is_system)\n"
            f"VALUES\n    {values};"
        )

    lines.append("")
    lines.append("-- RU translations (guarded by NOT EXISTS)")
    for row in lexeme_list:
        if not row["translation_ru"]:
            continue
        lines.append(
            "INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)\n"
            f"SELECT l.id, {sc.RU_LANGUAGE_ID}, {sc.sql_str(row['translation_ru'])}, 'seed', 1.0\n"
            "FROM lexeme l\n"
            f"WHERE l.language_id = {sc.EN_LANGUAGE_ID} AND l.normalized_text = {sc.sql_str(row['norm'])}\n"
            "  AND NOT EXISTS (\n"
            "      SELECT 1 FROM translation t\n"
            "      WHERE t.lexeme_id = l.id\n"
            f"        AND t.target_language_id = {sc.RU_LANGUAGE_ID}\n"
            "        AND t.source = 'seed'\n"
            "  );"
        )

    lines.append("")
    lines.append("-- Usage examples (skip if a seed example already exists)")
    for row in lexeme_list:
        if not row["example"]:
            continue
        lines.append(
            "INSERT INTO example (lexeme_id, sentence, source, difficulty)\n"
            f"SELECT l.id, {sc.sql_str(row['example'])}, 'seed', 2\n"
            "FROM lexeme l\n"
            f"WHERE l.language_id = {sc.EN_LANGUAGE_ID} AND l.normalized_text = {sc.sql_str(row['norm'])}\n"
            "  AND NOT EXISTS (\n"
            "      SELECT 1 FROM example e\n"
            "      WHERE e.lexeme_id = l.id AND e.source = 'seed'\n"
            "  );"
        )

    by_collection = {}
    for row in rows:
        by_collection.setdefault(row["collection"], []).append(row)

    for collection_name, items in by_collection.items():
        lines.append("")
        lines.append(f"-- Link {len(items)} items → {collection_name}")
        for index, row in enumerate(items, start=1):
            lines.append(
                "INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)\n"
                f"SELECT c.id, l.id, {index}\n"
                "FROM collection c\n"
                "JOIN lexeme l ON l.language_id = {lang} AND l.normalized_text = {norm}\n"
                "WHERE c.name = {name};".format(
                    lang=sc.EN_LANGUAGE_ID,
                    norm=sc.sql_str(row["norm"]),
                    name=sc.sql_str(collection_name),
                )
            )

    return "\n".join(lines)


def build_migration():
    rows = load_rows()
    counts = {}
    for row in rows:
        counts[row["collection"]] = counts.get(row["collection"], 0) + 1

    header = f"""-- ============================================================
-- LEXORA — V012: Seed English thematic collections
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with:
--   python3 scripts/seed/import_thematic.py
-- Source data: scripts/seed/data/english_thematic.csv
-- Generated at: {datetime.datetime.now(datetime.timezone.utc).isoformat()}
--
-- Additive on top of V002. Existing installs already have an empty
-- 'Business English' row; this migration fills it and adds
-- 'Academic English' + 'Travel English'.
--
-- Idempotent: INSERT OR IGNORE / NOT EXISTS throughout.
-- Counts: {", ".join(f"{name}={n}" for name, n in counts.items())}
-- ============================================================
"""
    content = header + "\n" + section(rows) + "\n"
    MIGRATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    MIGRATION_PATH.write_text(content, encoding="utf-8")
    size_kb = MIGRATION_PATH.stat().st_size / 1024
    print(f"Wrote {MIGRATION_PATH} ({size_kb:.0f} KB)")
    for name, n in counts.items():
        print(f"  {name}: {n} items")


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    build_migration()
