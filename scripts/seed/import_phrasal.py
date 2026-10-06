#!/usr/bin/env python3
"""
LEXORA seed — phrasal verbs ('Phrasal Verbs' collection).

Reads scripts/seed/data/phrasal_verbs.csv (columns: verb,translation_ru,example)
and emits idempotent inserts for lexeme, translation, example, collection_item.
Run directly to regenerate the full V002 migration:
    python3 scripts/seed/import_phrasal.py
"""
import seed_common as sc


def section():
    rows = sc.read_csv("phrasal_verbs.csv")
    verbs = []
    for row in rows:
        verb = row["verb"].strip()
        if not verb:
            continue
        verbs.append((verb, sc.normalize(verb), row["translation_ru"].strip(), row["example"].strip()))

    lines = [
        "-- ── Section 2: Phrasal Verbs ───────────────────────────────",
        f"-- {len(verbs)} lexemes + RU translations + examples, source: scripts/seed/data/phrasal_verbs.csv",
        "",
    ]

    for chunk in sc.chunked(verbs, 50):
        values = ",\n    ".join(
            f"({sc.EN_LANGUAGE_ID}, {sc.sql_str(verb)}, {sc.sql_str(norm)}, 'phrasal_verb', 1)"
            for verb, norm, _, _ in chunk
        )
        lines.append(
            "INSERT OR IGNORE INTO lexeme\n"
            "    (language_id, text, normalized_text, part_of_speech, is_system)\n"
            f"VALUES\n    {values};"
        )

    lines.append("")
    lines.append("-- RU translations (guarded by NOT EXISTS: no UNIQUE constraint on translation)")
    for verb, norm, translation_ru, _ in verbs:
        lines.append(
            "INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)\n"
            f"SELECT l.id, {sc.RU_LANGUAGE_ID}, {sc.sql_str(translation_ru)}, 'seed', 1.0\n"
            "FROM lexeme l\n"
            f"WHERE l.language_id = {sc.EN_LANGUAGE_ID} AND l.normalized_text = {sc.sql_str(norm)}\n"
            "  AND NOT EXISTS (\n"
            "      SELECT 1 FROM translation t\n"
            "      WHERE t.lexeme_id = l.id\n"
            f"        AND t.target_language_id = {sc.RU_LANGUAGE_ID}\n"
            "        AND t.source = 'seed'\n"
            "  );"
        )

    lines.append("")
    lines.append("-- Usage examples (guarded by NOT EXISTS)")
    for verb, norm, _, example in verbs:
        if not example:
            continue
        lines.append(
            "INSERT INTO example (lexeme_id, sentence, source, difficulty)\n"
            f"SELECT l.id, {sc.sql_str(example)}, 'seed', 2\n"
            "FROM lexeme l\n"
            f"WHERE l.language_id = {sc.EN_LANGUAGE_ID} AND l.normalized_text = {sc.sql_str(norm)}\n"
            "  AND NOT EXISTS (\n"
            "      SELECT 1 FROM example e\n"
            "      WHERE e.lexeme_id = l.id AND e.source = 'seed'\n"
            "  );"
        )

    lines.append("")
    lines.append(sc.collection_items_section("Phrasal Verbs", [v[1] for v in verbs]))
    return "\n".join(lines)


if __name__ == "__main__":
    sc.build_migration()
