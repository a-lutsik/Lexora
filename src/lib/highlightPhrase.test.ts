import { describe, expect, it } from 'vitest';
import { tokenizePhrase } from './highlightPhrase';

describe('tokenizePhrase', () => {
  it('highlights content words and skips stop words', () => {
    const tokens = tokenizePhrase('Technological singularity is approaching.');
    const highlighted = tokens.filter((t) => t.highlight).map((t) => t.text);
    expect(highlighted).toEqual(['Technological', 'singularity', 'approaching.']);
  });

  it('preserves whitespace tokens without highlighting them', () => {
    const tokens = tokenizePhrase('hello world');
    expect(tokens).toEqual([
      { text: 'hello', highlight: true },
      { text: ' ', highlight: false },
      { text: 'world', highlight: true },
    ]);
  });

  it('returns an empty list for an empty phrase', () => {
    expect(tokenizePhrase('')).toEqual([]);
  });
});
