import { describe, expect, it } from 'vitest';
import { findPasteRisks, stripInvisibleChars } from './pasteSafety';

describe('stripInvisibleChars', () => {
  it('removes zero-width, bidi and Unicode tag characters', () => {
    const hidden = 'pay\u200B to\u202E evil\u2066 \u{E0049}\u{E0047}acct\uFEFF';
    expect(stripInvisibleChars(hidden)).toBe('pay to evil acct');
  });

  it('keeps ordinary text, emoji and Cyrillic intact', () => {
    const text = 'Привет, мир! 👋 Line one\nline two';
    expect(stripInvisibleChars(text)).toBe(text);
  });
});

describe('findPasteRisks', () => {
  it('flags a link that is not in the source text', () => {
    expect(findPasteRisks('Please review the invoice.', 'Review it at https://pay.example.invalid/x')).toEqual([
      'new-link',
    ]);
  });

  it('does not flag a link already present in the source', () => {
    const source = 'Docs: https://example.com/guide';
    expect(findPasteRisks(source, 'See the docs: https://example.com/guide')).toEqual([]);
  });

  it('flags added line breaks', () => {
    expect(findPasteRisks('ls the folder', 'ls the folder\nrm -rf ~')).toEqual(['new-line']);
  });

  it('does not flag line breaks the source already had', () => {
    expect(findPasteRisks('a\nb', 'A\nB')).toEqual([]);
  });

  it('returns no risks for a plain rewrite', () => {
    expect(findPasteRisks('i has a apple', 'I have an apple.')).toEqual([]);
  });
});
