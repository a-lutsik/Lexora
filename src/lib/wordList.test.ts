import { describe, expect, it } from 'vitest';
import { MAX_BULK_WORDS, MAX_CHARS_PER_LINE, parseWordList } from './wordList';

describe('parseWordList', () => {
  it('trims lines, skips blanks, and preserves order', () => {
    expect(parseWordList('  apple  \n\nget along\nbe pesky\n').words).toEqual([
      'apple',
      'get along',
      'be pesky',
    ]);
  });

  it('dedupes case-insensitively and keeps the first spelling', () => {
    expect(parseWordList('Apple\napple\nAPPLE').words).toEqual(['Apple']);
  });

  it('skips lines longer than the character limit', () => {
    const long = 'a'.repeat(MAX_CHARS_PER_LINE + 1);
    const result = parseWordList(`ok\n${long}\nfine`);
    expect(result.words).toEqual(['ok', 'fine']);
    expect(result.skippedLong).toBe(1);
  });

  it('caps at MAX_BULK_WORDS and marks truncated', () => {
    const lines = Array.from({ length: MAX_BULK_WORDS + 5 }, (_, i) => `word${i}`).join('\n');
    const result = parseWordList(lines);
    expect(result.words).toHaveLength(MAX_BULK_WORDS);
    expect(result.truncated).toBe(true);
  });

  it('handles CRLF line endings', () => {
    expect(parseWordList('one\r\ntwo\r\n').words).toEqual(['one', 'two']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseWordList('  \n\t\n ').words).toEqual([]);
    expect(parseWordList('').truncated).toBe(false);
  });
});
