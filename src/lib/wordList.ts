// ============================================================
// LEXORA — Word-list parser for bulk vocabulary add
// One word/phrase per line; trim, skip blanks, dedupe.
// ============================================================

export const MAX_BULK_WORDS = 100;
export const MAX_CHARS_PER_LINE = 200;

export type ParseWordListResult = {
  words: string[];
  truncated: boolean;
  skippedLong: number;
};

/**
 * Parse a newline-separated word list.
 * Empty lines are skipped. Duplicates (case-insensitive) keep the first form.
 * Lines longer than MAX_CHARS_PER_LINE are skipped.
 * At most MAX_BULK_WORDS entries are returned.
 */
export function parseWordList(raw: string): ParseWordListResult {
  const seen = new Set<string>();
  const words: string[] = [];
  let truncated = false;
  let skippedLong = 0;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if ([...trimmed].length > MAX_CHARS_PER_LINE) {
      skippedLong += 1;
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    if (words.length >= MAX_BULK_WORDS) {
      truncated = true;
      break;
    }
    seen.add(key);
    words.push(trimmed);
  }

  return { words, truncated, skippedLong };
}
