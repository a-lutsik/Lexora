// ============================================================
// LEXORA — Live captions: which part of the transcript is ready
// to translate. Only finished sentences are sent, each once, so
// the cost of live translation grows with speech, not quadratically.
// ============================================================

/** Speech without punctuation is cut at a word after this many chars. */
export const MAX_UNPUNCTUATED_SEGMENT = 180;

// Latin stops need a following space (keeps "3.50" whole); CJK stops do not.
const SENTENCE_END = /[.!?…]+["»”’)\]]*(?=\s|$)|[。！？]+[」』）]*/g;

/**
 * End index (exclusive) of the translatable segment that starts at `from`:
 * after the last finished sentence, or at a word boundary when a long run
 * has no punctuation. -1 = nothing ready yet.
 */
export function nextSegmentEnd(
  text: string,
  from: number,
  maxUnpunctuated = MAX_UNPUNCTUATED_SEGMENT,
): number {
  const pending = text.slice(from);
  let end = -1;
  for (const match of pending.matchAll(SENTENCE_END)) {
    end = (match.index ?? 0) + match[0].length;
  }
  if (end > 0) return from + end;
  if (pending.trim().length <= maxUnpunctuated) return -1;
  const cut = pending.lastIndexOf(' ', maxUnpunctuated);
  return cut > 0 ? from + cut : from + maxUnpunctuated;
}
