import { describe, expect, it } from 'vitest';
import { nextSegmentEnd } from './liveSegments';

describe('nextSegmentEnd', () => {
  it('waits while the sentence is still being spoken', () => {
    expect(nextSegmentEnd('Where is the', 0)).toBe(-1);
  });

  it('takes everything up to the last finished sentence', () => {
    const text = 'Hello there. Where is the station? I need';
    const end = nextSegmentEnd(text, 0);
    expect(text.slice(0, end)).toBe('Hello there. Where is the station?');
  });

  it('continues from the already translated part only', () => {
    const text = 'Hello there. Where is the station? I need a taxi!';
    const first = 'Hello there. Where is the station?'.length;
    expect(text.slice(first, nextSegmentEnd(text, first)).trim()).toBe('I need a taxi!');
  });

  it('keeps closing quotes with the sentence and ignores decimals', () => {
    const quoted = 'He said "stop." Then';
    expect(quoted.slice(0, nextSegmentEnd(quoted, 0))).toBe('He said "stop."');
    expect(nextSegmentEnd('It costs 3.50 euros', 0)).toBe(-1);
  });

  it('handles CJK full stops', () => {
    const text = '駅はどこですか。タクシー';
    expect(text.slice(0, nextSegmentEnd(text, 0))).toBe('駅はどこですか。');
  });

  it('cuts long unpunctuated speech at a word boundary', () => {
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');
    const end = nextSegmentEnd(words, 0, 50);
    expect(end).toBeGreaterThan(0);
    expect(end).toBeLessThanOrEqual(50);
    expect(words[end]).toBe(' ');
  });
});
