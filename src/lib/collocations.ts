// ============================================================
// LEXORA — Collocation helpers
// ============================================================

import type { PartOfSpeech } from './types';
import { escapeRegExp } from './utils';

const MAX_HEADWORD_CHARS = 40;

/**
 * Collocations are offered for single words only: a phrase such as
 * "in the end" is itself a collocation, and long text is not a word.
 */
export function canHaveCollocations(text: string, partOfSpeech?: PartOfSpeech | null): boolean {
  const word = text.trim();
  if (partOfSpeech === 'phrase' || partOfSpeech === 'idiom') return false;
  return (
    word.length >= 2 &&
    word.length <= MAX_HEADWORD_CHARS &&
    !/\s/.test(word) &&
    /\p{L}/u.test(word)
  );
}

export type CollocationGap = {
  before: string;
  after: string;
  /** True when the gap sits in the example sentence, false for the bare collocation. */
  inExample: boolean;
};

/** Index of `focus` as a whole word inside `text`, case-insensitive; -1 when absent. */
function wholeWordIndex(text: string, focus: string): number {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(focus)})(?=$|[^\\p{L}\\p{N}])`, 'iu');
  const match = pattern.exec(text);
  return match ? match.index + (match[1]?.length ?? 0) : -1;
}

/**
 * Blanks the partner word of a collocation. Uses the example sentence when the
 * collocation occurs there verbatim, otherwise the collocation itself, so the
 * gap never lands on an unrelated "in" elsewhere in the sentence.
 */
export function buildCollocationGap(
  collocation: string,
  focus: string,
  example: string | null | undefined,
): CollocationGap | null {
  const word = focus.trim();
  if (!word) return null;

  const sentence = example?.trim() ?? '';
  const spanStart = sentence ? sentence.toLocaleLowerCase().indexOf(collocation.trim().toLocaleLowerCase()) : -1;
  if (spanStart >= 0) {
    const span = sentence.slice(spanStart, spanStart + collocation.trim().length);
    const inSpan = wholeWordIndex(span, word);
    if (inSpan >= 0) {
      const start = spanStart + inSpan;
      return { before: sentence.slice(0, start), after: sentence.slice(start + word.length), inExample: true };
    }
  }

  const own = collocation.trim();
  const index = wholeWordIndex(own, word);
  if (index < 0) return null;
  return { before: own.slice(0, index), after: own.slice(index + word.length), inExample: false };
}
