#!/usr/bin/env python3
"""
LEXORA seed — irregular verbs ('Irregular Verbs' collection).

Reads scripts/seed/data/irregular_verbs.csv
(columns: base,past,participle,translation_ru).

Representation: the lexeme is the BASE form only (pos='verb').
Past / participle forms are stored in translation.sense as
"past: <past>; participle: <participle>" next to the RU translation —
no separate lexemes are created for the derived forms.

Run directly to regenerate the full V002 migration:
    python3 scripts/seed/import_irregular.py
"""
import seed_common as sc


def section():
    rows = sc.read_csv("irregular_verbs.csv")
    verbs = []
    for row in rows:
        base = row["base"].strip()
        if not base:
            continue
        verbs.append(
            (
                base,
                sc.normalize(base),
                row["past"].strip(),
                row["participle"].strip(),
                row["translation_ru"].strip(),
            )
        )

    lines = [
        "-- ── Section 3: Irregular Verbs ─────────────────────────────",
        f"-- {len(verbs)} base-form lexemes; past/participle live in translation.sense",
        "-- source: scripts/seed/data/irregular_verbs.csv",
        "",
    ]

    for chunk in sc.chunked(verbs, 50):
        values = ",\n    ".join(
            f"({sc.EN_LANGUAGE_ID}, {sc.sql_str(base)}, {sc.sql_str(norm)}, 'verb', 1)"
            for base, norm, _, _, _ in chunk
        )
        lines.append(
            "INSERT OR IGNORE INTO lexeme\n"
            "    (language_id, text, normalized_text, part_of_speech, is_system)\n"
            f"VALUES\n    {values};"
        )

    lines.append("")
    lines.append("-- RU translations + verb forms in sense (guarded by NOT EXISTS)")
    for base, norm, past, participle, translation_ru in verbs:
        sense = f"past: {past}; participle: {participle}"
        lines.append(
            "INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)\n"
            f"SELECT l.id, {sc.RU_LANGUAGE_ID}, {sc.sql_str(translation_ru)}, {sc.sql_str(sense)}, 'seed', 1.0\n"
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
    lines.append(sc.collection_items_section("Irregular Verbs", [v[1] for v in verbs]))
    return "\n".join(lines)


if __name__ == "__main__":
    sc.build_migration()
