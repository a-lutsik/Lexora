import { describe, expect, it, vi } from 'vitest';
import { appendTranscript, copyToClipboard, cx, formatIpcError, formatRelativeDate } from './utils';

describe('cx', () => {
  it('joins truthy class names with spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns empty string when nothing truthy', () => {
    expect(cx(false, null, undefined)).toBe('');
    expect(cx()).toBe('');
  });
});

describe('formatRelativeDate', () => {
  const SECONDS_PER_DAY = 86_400;

  // Полдень текущих суток — безопасная опора, чтобы не попасть
  // на границу дня при вычислении timestamps в тесте.
  function noonToday(): number {
    const now = new Date();
    return (
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime() /
      1000
    );
  }

  it('returns Today for the current day', () => {
    expect(formatRelativeDate(noonToday())).toBe('Today');
  });

  it('returns Tomorrow for the next day', () => {
    expect(formatRelativeDate(noonToday() + SECONDS_PER_DAY)).toBe('Tomorrow');
  });

  it('returns Yesterday for the previous day', () => {
    expect(formatRelativeDate(noonToday() - SECONDS_PER_DAY)).toBe('Yesterday');
  });

  it('returns "in N days" for future dates beyond tomorrow', () => {
    expect(formatRelativeDate(noonToday() + 3 * SECONDS_PER_DAY)).toBe(
      'in 3 days'
    );
  });

  it('returns "N days ago" for past dates beyond yesterday', () => {
    expect(formatRelativeDate(noonToday() - 5 * SECONDS_PER_DAY)).toBe(
      '5 days ago'
    );
  });
});

describe('appendTranscript', () => {
  it('returns the new piece when current is empty', () => {
    expect(appendTranscript('', 'hello world')).toBe('hello world');
  });

  it('appends a fresh chunk with a space', () => {
    expect(appendTranscript('hello', 'there')).toBe('hello there');
  });

  it('does not duplicate an overlapping chunk', () => {
    expect(appendTranscript('hello there', 'there')).toBe('hello there');
    expect(appendTranscript('hello there', 'hello there friend')).toBe('hello there friend');
  });
});

describe('formatIpcError', () => {
  it('uses Error.message when present', () => {
    expect(formatIpcError(new Error(' Collection name is required '), 'fallback')).toBe(
      'Collection name is required',
    );
  });

  it('unwraps AppError display strings', () => {
    expect(
      formatIpcError(
        'Invalid input: Collection name is required',
        'fallback',
      ),
    ).toBe('Collection name is required');
  });

  it('reads serialized enum objects from Tauri', () => {
    expect(formatIpcError({ Validation: 'Collection name is required' }, 'fallback')).toBe(
      'Collection name is required',
    );
  });

  it('returns fallback when nothing readable', () => {
    expect(formatIpcError(null, 'Speech translation failed.')).toBe(
      'Speech translation failed.',
    );
  });

  it('maps a missing model / API key to a settings hint', () => {
    expect(
      formatIpcError(
        'Invalid input: Translation needs an AI model. Open Settings, choose a provider, and add an API key.',
        'fallback',
      ),
    ).toMatch(/Open Settings/i);
    expect(formatIpcError('No API key configured for provider gemini', 'fallback')).toMatch(
      /Open Settings/i,
    );
  });

  it('maps 401 / invalid key to a rejected-key hint', () => {
    expect(formatIpcError('AI provider error: Gemini API error 401: invalid key', 'fallback')).toMatch(
      /API key was rejected/i,
    );
  });

  it('maps empty Gemini replies to a retry hint', () => {
    expect(
      formatIpcError('Empty response from Gemini (finishReason: MAX_TOKENS)', 'fallback'),
    ).toMatch(/empty answer/i);
  });

  it('maps timeouts and network failures', () => {
    expect(formatIpcError('Provider did not respond within 15s (timeout)', 'fallback')).toMatch(
      /did not respond/i,
    );
    expect(
      formatIpcError('error sending request for url (https://api.openai.com/v1/chat/completions)', 'fallback'),
    ).toMatch(/internet connection/i);
  });

  it('maps audio / whisper 400 to a retry hint', () => {
    expect(formatIpcError(new Error(' Groq Whisper error 400 '), 'fallback')).toMatch(
      /process this audio/i,
    );
    expect(
      formatIpcError('AI provider error: Groq Whisper error 400: bad mime', 'fallback'),
    ).toMatch(/process this audio/i);
    expect(formatIpcError({ Provider: 'empty transcription' }, 'fallback')).toMatch(
      /empty answer/i,
    );
  });

  it('maps 429 to the shared rate-limit copy', () => {
    expect(formatIpcError('HTTP 429 Too Many Requests', 'fallback')).toMatch(/Too many requests/i);
  });
});

describe('copyToClipboard', () => {
  it('writes trimmed text and returns true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyToClipboard('  apple  ')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('apple');
  });

  it('returns false for empty text without calling the clipboard', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyToClipboard('   ')).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('returns false when the clipboard API rejects', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    await expect(copyToClipboard('apple')).resolves.toBe(false);
  });
});
