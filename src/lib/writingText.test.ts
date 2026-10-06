import { describe, expect, it } from 'vitest';
import {
  AUTO_CHECK_DEBOUNCE_MS,
  consumeWritingDraft,
  countWritingChars,
  isLongWritingText,
  MAX_WRITING_CHARS,
  peekWritingDraft,
  saveWritingDraft,
  shouldAutoCheckWriting,
} from './writingText';

describe('isLongWritingText', () => {
  it('treats empty and short lookups as not writing', () => {
    expect(isLongWritingText('')).toBe(false);
    expect(isLongWritingText('   ')).toBe(false);
    expect(isLongWritingText('apple')).toBe(false);
    expect(isLongWritingText('a few words here')).toBe(false);
  });

  it('detects long character counts and word counts', () => {
    expect(isLongWritingText('This sentence is definitely long enough to check.')).toBe(true);
    expect(isLongWritingText('one two three four five six seven eight')).toBe(true);
  });
});

describe('writing draft storage', () => {
  it('saves, peeks, and consumes a draft', () => {
    saveWritingDraft('  Hello world.  ');
    expect(peekWritingDraft()).toBe('Hello world.');
    expect(consumeWritingDraft()).toBe('Hello world.');
    expect(peekWritingDraft()).toBeNull();
  });

  it('ignores empty drafts', () => {
    saveWritingDraft('   ');
    expect(peekWritingDraft()).toBeNull();
  });
});

describe('countWritingChars', () => {
  it('counts unicode scalar values', () => {
    expect(countWritingChars('hi')).toBe(2);
    expect(countWritingChars('Привет')).toBe(6);
  });
});

describe('shouldAutoCheckWriting', () => {
  it('rejects empty, short, and over-limit text', () => {
    expect(shouldAutoCheckWriting('', null)).toBe(false);
    expect(shouldAutoCheckWriting('   ', null)).toBe(false);
    expect(shouldAutoCheckWriting('hi', null)).toBe(false);
    expect(shouldAutoCheckWriting('one two three', null)).toBe(false);
    expect(shouldAutoCheckWriting('a'.repeat(MAX_WRITING_CHARS + 1), null)).toBe(false);
  });

  it('accepts text meeting the char or word threshold', () => {
    expect(shouldAutoCheckWriting('This has twenty+ chars!!', null)).toBe(true);
    expect(shouldAutoCheckWriting('one two three four', null)).toBe(true);
  });

  it('skips when text matches the last successful check', () => {
    const text = 'This sentence is long enough.';
    expect(shouldAutoCheckWriting(text, text)).toBe(false);
    expect(shouldAutoCheckWriting(`  ${text}  `, text)).toBe(false);
    expect(shouldAutoCheckWriting(`${text} extra`, text)).toBe(true);
  });

  it('exports a debounce of at least 2 seconds', () => {
    expect(AUTO_CHECK_DEBOUNCE_MS).toBeGreaterThanOrEqual(2000);
  });
});
