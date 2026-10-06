// ============================================================
// LEXORA — Document text tokenizer
// Splits a segment into clickable words vs whitespace/punct.
// ============================================================

export type DocumentTextToken =
  | { kind: 'word'; value: string }
  | { kind: 'other'; value: string };

/**
 * Unicode-aware split so each word can be inspected / saved as a card.
 */
export function tokenizeDocumentText(text: string): DocumentTextToken[] {
  if (!text) return [];
  const tokens: DocumentTextToken[] = [];
  const pattern = /(\p{L}[\p{L}\p{M}'’-]*|\s+|.)/gu;
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const value = match[1] ?? '';
    if (/^\p{L}/u.test(value)) {
      tokens.push({ kind: 'word', value });
    } else if (value.length > 0) {
      tokens.push({ kind: 'other', value });
    }
    match = pattern.exec(text);
  }
  return tokens;
}

export function isGlossaryTerm(word: string, sources: readonly string[]): boolean {
  const needle = word.toLocaleLowerCase();
  return sources.some((s) => s.toLocaleLowerCase() === needle);
}
