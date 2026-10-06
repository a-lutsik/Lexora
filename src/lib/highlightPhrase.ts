// ============================================================
// LEXORA — Phrase tokenization for cyan content-word underlines
// ============================================================

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'to',
  'of',
  'in',
  'on',
  'at',
  'for',
  'and',
  'or',
  'but',
  'if',
  'as',
  'by',
  'with',
  'from',
  'into',
  'that',
  'this',
  'these',
  'those',
  'it',
  'its',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'our',
  'their',
  'not',
  'no',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'will',
  'would',
  'can',
  'could',
  'should',
  'may',
  'might',
  'must',
]);

export type PhraseToken = {
  text: string;
  highlight: boolean;
};

/** Split phrase into tokens; content words get highlight: true. */
export function tokenizePhrase(phrase: string): PhraseToken[] {
  if (!phrase) return [];
  const parts = phrase.split(/(\s+)/);
  return parts.map((part) => {
    if (/^\s+$/.test(part)) {
      return { text: part, highlight: false };
    }
    const core = part.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
    const normalized = core.toLowerCase();
    const highlight = normalized.length > 0 && !STOP_WORDS.has(normalized);
    return { text: part, highlight };
  });
}
