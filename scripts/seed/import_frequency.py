#!/usr/bin/env python3
"""
LEXORA seed — frequency vocabulary ('Top 5000 Words' collection).

Reads scripts/seed/data/top5000.csv (columns: word,pos,rank) and emits
INSERT OR IGNORE statements for lexeme + collection_item.
Run directly to regenerate the full V002 migration:
    python3 scripts/seed/import_frequency.py
"""
import seed_common as sc


def section():
    rows = sc.read_csv("top5000.csv")
    words = []
    for row in rows:
        word = row["word"].strip()
        if not word:
            continue
        words.append((word, sc.normalize(word), row["pos"].strip(), int(row["rank"])))

    lines = [
        "-- ── Section 1: Top 5000 Words (frequency lexicon) ──────────",
        f"-- {len(words)} lexemes, source: scripts/seed/data/top5000.csv",
        "",
    ]

    for chunk in sc.chunked(words, 100):
        values = ",\n    ".join(
            "({lang}, {text}, {norm}, {pos}, {rank}, 1)".format(
                lang=sc.EN_LANGUAGE_ID,
                text=sc.sql_str(text),
                norm=sc.sql_str(norm),
                pos=sc.sql_str(pos) if pos else "NULL",
                rank=rank,
            )
            for text, norm, pos, rank in chunk
        )
        lines.append(
            "INSERT OR IGNORE INTO lexeme\n"
            "    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)\n"
            f"VALUES\n    {values};"
        )

    lines.append("")
    lines.append(sc.collection_items_section("Top 5000 Words", [w[1] for w in words]))
    return "\n".join(lines)


if __name__ == "__main__":
    sc.build_migration()
