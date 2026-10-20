// ============================================================
// LEXORA — Writing text helpers (draft + long-text detection)
// ============================================================

export const MAX_WRITING_CHARS = 8_000;
export const WRITING_DRAFT_KEY = 'lexora-writing-draft';
export const OPEN_WRITING_EVENT = 'lexora:open-writing';

/** Pause before auto-check fires (matches popup compose debounce). */
export const AUTO_CHECK_DEBOUNCE_MS = 2_000;

/** Words or characters above these counts are treated as writing, not a lookup. */
const LONG_TEXT_MIN_CHARS = 50;
const LONG_TEXT_MIN_WORDS = 8;

export function countWritingChars(text: string): number {
  return Array.from(text).length;
}

export function countWritingWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function isLongWritingText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (countWritingChars(trimmed) >= LONG_TEXT_MIN_CHARS) return true;
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  return words.length >= LONG_TEXT_MIN_WORDS;
}

/**
 * Whether the Writing page should fire an automatic check for `text`.
 * Any non-empty text within the length limit qualifies. Does not consider
 * settings flags (auto-check on / offline) — those are gated by the caller.
 */
export function shouldAutoCheckWriting(
  text: string,
  lastCheckedText: string | null
): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (countWritingChars(trimmed) > MAX_WRITING_CHARS) return false;
  if (lastCheckedText !== null && trimmed === lastCheckedText.trim()) {
    return false;
  }
  return true;
}

export function saveWritingDraft(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  localStorage.setItem(WRITING_DRAFT_KEY, trimmed);
}

export function peekWritingDraft(): string | null {
  const raw = localStorage.getItem(WRITING_DRAFT_KEY);
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function consumeWritingDraft(): string | null {
  const draft = peekWritingDraft();
  localStorage.removeItem(WRITING_DRAFT_KEY);
  return draft;
}
