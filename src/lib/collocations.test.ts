import { describe, expect, it } from 'vitest';
import { buildCollocationGap, canHaveCollocations } from './collocations';

describe('canHaveCollocations', () => {
  it('accepts single words and rejects phrases, long text and non-words', () => {
    expect(canHaveCollocations('end')).toBe(true);
    expect(canHaveCollocations('  Vorteil ')).toBe(true);
    expect(canHaveCollocations('in the end')).toBe(false);
    expect(canHaveCollocations('end', 'phrase')).toBe(false);
    expect(canHaveCollocations('end', 'idiom')).toBe(false);
    expect(canHaveCollocations('a')).toBe(false);
    expect(canHaveCollocations('1234')).toBe(false);
    expect(canHaveCollocations('x'.repeat(41))).toBe(false);
  });
});

describe('buildCollocationGap', () => {
  it('blanks the partner word inside the collocation in the example', () => {
    expect(buildCollocationGap('take advantage of', 'take', 'You should take advantage of the sale.')).toEqual({
      before: 'You should ',
      after: ' advantage of the sale.',
      inExample: true,
    });
  });

  it('ignores the same word elsewhere in the sentence', () => {
    // "In" opens the sentence but the gap belongs to "in the end".
    expect(buildCollocationGap('in the end', 'in', 'In May we argued, but in the end we agreed.')).toEqual({
      before: 'In May we argued, but ',
      after: ' the end we agreed.',
      inExample: true,
    });
  });

  it('matches case-insensitively and keeps the sentence casing', () => {
    expect(buildCollocationGap('in the end', 'in', 'In the end, it worked.')).toEqual({
      before: '',
      after: ' the end, it worked.',
      inExample: true,
    });
  });

  it('falls back to the collocation when the example does not contain it', () => {
    expect(buildCollocationGap('take advantage of', 'take', 'She took advantage of it.')).toEqual({
      before: '',
      after: ' advantage of',
      inExample: false,
    });
    expect(buildCollocationGap('at the end of', 'at', null)).toEqual({
      before: '',
      after: ' the end of',
      inExample: false,
    });
  });

  it('returns null when the focus is not a whole word of the collocation', () => {
    expect(buildCollocationGap('at the end of', 'th', 'at the end of the day')).toBeNull();
    expect(buildCollocationGap('end up', '', 'end up')).toBeNull();
  });
});
