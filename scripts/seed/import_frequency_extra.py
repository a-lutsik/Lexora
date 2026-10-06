#!/usr/bin/env python3
"""
LEXORA seed — complete 'Top 5000 Words' (ranks 2001–5000).

V002 already inserted the first ~2000 frequency lexemes. This script
writes an additive V013 migration. Do not fold into V002.

    python3 scripts/seed/import_frequency_extra.py
    python3 scripts/seed/import_frequency_extra.py --download
"""
from __future__ import annotations

import argparse
import csv
import datetime
import pathlib
import re
import urllib.request

import seed_common as sc

FREQ_URL = (
    "https://raw.githubusercontent.com/hermitdave/FrequencyWords/"
    "master/content/2018/en/en_50k.txt"
)
EXTRA_CSV = sc.DATA_DIR / "top5000_extra.csv"
MIGRATION_PATH = (
    sc.SEED_DIR.parent.parent
    / "src-tauri"
    / "src"
    / "db"
    / "migrations"
    / "V013__seed_top5000_complete.sql"
)
TARGET_TOTAL = 5000
WORD_RE = re.compile(r"^[a-z][a-z'-]{0,30}$")
SKIP_WORDS = {
    "don", "didn", "won", "isn", "wasn", "wouldn", "haven", "couldn", "aren",
    "hasn", "weren", "shouldn", "mustn", "doesn", "hadn", "ain", "ain’t",
    "uh", "um", "huh", "ah", "oh", "yeah", "ok", "okay", "hey", "gonna",
    "wanna", "gotta", "doin", "goin", "cuz", "gimme", "lemme", "ya", "yo",
    "nigga", "nigger", "fuck", "shit", "damn", "bitch", "ass", "crap",
    "www", "http", "https", "com", "org", "html", "pdf", "php", "asp",
    "css", "sql", "xml", "rss", "seo", "cms", "url", "gif", "jpeg",
    "mpeg", "jpg", "png", "ebay", "paypal", "hotmail", "yahoo", "phpbb",
    "vbulletin", "netscape", "jan", "feb", "mar", "apr", "jun", "jul",
    "aug", "sep", "oct", "nov", "dec", "re", "ll", "ve", "nt",
}
COMMON_TWO_LETTER = {
    "a", "i", "am", "an", "as", "at", "be", "by", "do", "go", "he", "if",
    "in", "is", "it", "me", "my", "no", "of", "on", "or", "so", "to", "up",
    "us", "we", "ox", "ad", "id",
}


def guess_pos(word: str) -> str:
    if word.endswith("ly") and len(word) > 4:
        return "adv"
    if word.endswith(("tion", "sion", "ness", "ment", "ity", "ance", "ence")):
        return "noun"
    if word.endswith("ing") and len(word) > 5:
        return "verb"
    if word.endswith("ed") and len(word) > 4:
        return "verb"
    if word.endswith(("ous", "ful", "less", "ish", "ive", "able", "ible", "al")):
        return "adj"
    return ""


def existing_normalized() -> set[str]:
    seen = set()
    for row in sc.read_csv("top5000.csv"):
        word = row["word"].strip()
        if word:
            seen.add(sc.normalize(word))
    extra = EXTRA_CSV
    if extra.exists():
        with extra.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                word = row["word"].strip()
                if word:
                    seen.add(sc.normalize(word))
    return seen


def download_frequency_lines() -> list[str]:
    req = urllib.request.Request(FREQ_URL, headers={"User-Agent": "Lexora-seed/0.1"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8")
    return [line.strip() for line in text.splitlines() if line.strip()]


def build_extra_csv(freq_lines: list[str]) -> list[tuple[str, str, int]]:
    have = set()
    for row in sc.read_csv("top5000.csv"):
        word = row["word"].strip()
        if word:
            have.add(sc.normalize(word))

    extra: list[tuple[str, str, int]] = []
    next_rank = 2001
    for line in freq_lines:
        parts = line.split()
        if not parts:
            continue
        word = parts[0].strip().lower()
        if not WORD_RE.match(word):
            continue
        if word in have or word in SKIP_WORDS:
            continue
        if len(word) <= 2 and word not in COMMON_TWO_LETTER:
            continue
        have.add(word)
        extra.append((word, guess_pos(word), next_rank))
        next_rank += 1
        if next_rank > TARGET_TOTAL:
            break

    if len(extra) < TARGET_TOTAL - 2000:
        raise SystemExit(
            f"Only collected {len(extra)} extra words; need {TARGET_TOTAL - 2000}"
        )

    EXTRA_CSV.parent.mkdir(parents=True, exist_ok=True)
    with EXTRA_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["word", "pos", "rank"])
        writer.writerows(extra)
    return extra


def load_extra() -> list[tuple[str, str, int]]:
    rows = []
    with EXTRA_CSV.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            word = row["word"].strip()
            if not word:
                continue
            rows.append((word, row["pos"].strip(), int(row["rank"])))
    return rows


def build_migration(rows: list[tuple[str, str, int]]) -> None:
    words = [(text, sc.normalize(text), pos, rank) for text, pos, rank in rows]
    header = f"""-- ============================================================
-- LEXORA — V013: Complete Top 5000 Words (ranks 2001–5000)
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with:
--   python3 scripts/seed/import_frequency_extra.py
-- Source data: scripts/seed/data/top5000_extra.csv
-- Generated at: {datetime.datetime.now(datetime.timezone.utc).isoformat()}
--
-- Additive on top of V002 (first 2000 ranks). Existing installs
-- already have those lexemes; this migration inserts the rest
-- and links them to 'Top 5000 Words'.
--
-- Idempotent: INSERT OR IGNORE / guarded UPDATE.
-- Extra lexemes: {len(words)}
-- ============================================================
"""
    lines = [
        header,
        "-- ── Remaining frequency lexemes ───────────────────────────",
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
    lines.append("-- Fill rank when the lexeme already exists (thematic overlap)")
    for text, norm, _pos, rank in words:
        lines.append(
            "UPDATE lexeme SET frequency_rank = COALESCE(frequency_rank, {rank}),\n"
            "    updated_at = unixepoch()\n"
            "WHERE language_id = {lang} AND normalized_text = {norm};".format(
                rank=rank,
                lang=sc.EN_LANGUAGE_ID,
                norm=sc.sql_str(norm),
            )
        )

    lines.append("")
    lines.append(sc.collection_items_section("Top 5000 Words", [w[1] for w in words]))
    lines.append("")
    lines.append(
        "-- Default visual mnemonic fields so every English lexeme can resolve an image"
    )
    lines.append(
        "UPDATE lexeme\n"
        "SET visual_photo_query = COALESCE(NULLIF(TRIM(visual_photo_query), ''), text),\n"
        "    visual_association = COALESCE(\n"
        "        NULLIF(TRIM(visual_association), ''),\n"
        "        'A clear everyday scene that shows what \"' || text || '\" means'\n"
        "    ),\n"
        "    visual_image_prompt = COALESCE(\n"
        "        NULLIF(TRIM(visual_image_prompt), ''),\n"
        "        'Educational illustration of the meaning of \"' || text || "
        "'\". Show the meaning as a clear everyday situation with people "
        "(or animal characters) acting it out. Simple composition, 1–3 "
        "characters, clean expressive educational illustration style. "
        "No text, no captions, no labels.'\n"
        "    ),\n"
        "    visual_memory_hook = COALESCE(NULLIF(TRIM(visual_memory_hook), ''), text),\n"
        "    visual_sense = COALESCE(NULLIF(TRIM(visual_sense), ''), text)\n"
        f"WHERE language_id = {sc.EN_LANGUAGE_ID} AND deleted_at IS NULL;"
    )
    MIGRATION_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    size_kb = MIGRATION_PATH.stat().st_size / 1024
    print(f"Wrote {MIGRATION_PATH} ({size_kb:.0f} KB), {len(words)} extra words")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--download",
        action="store_true",
        help="Refresh top5000_extra.csv from OpenSubtitles frequency list",
    )
    parser.add_argument(
        "--from-file",
        help="Build extra CSV from a local word-count file (word count per line)",
    )
    args = parser.parse_args()
    if args.from_file:
        path = pathlib.Path(args.from_file)
        lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        extra = build_extra_csv(lines)
        print(f"Wrote {EXTRA_CSV} ({len(extra)} rows) from {path}")
    elif args.download or not EXTRA_CSV.exists():
        print(f"Downloading {FREQ_URL}")
        lines = download_frequency_lines()
        extra = build_extra_csv(lines)
        print(f"Wrote {EXTRA_CSV} ({len(extra)} rows)")
    rows = load_extra()
    build_migration(rows)


if __name__ == "__main__":
    main()
