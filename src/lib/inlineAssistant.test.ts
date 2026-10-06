import { describe, expect, it } from 'vitest';
import {
  assistantKickerTitle,
  classifyPopupText,
  modeFromShortcutKey,
  rewriteModeForAssistant,
  TEXT_COMPOSE_DEBOUNCE_MS,
  textRegisterInstruction,
} from './inlineAssistant';

describe('classifyPopupText', () => {
  it('routes 1–2 words to the dictionary card', () => {
    expect(classifyPopupText('')).toBe('dictionary');
    expect(classifyPopupText('apple')).toBe('dictionary');
    expect(classifyPopupText('hello world')).toBe('dictionary');
  });

  it('routes sentences to the inline assistant', () => {
    expect(classifyPopupText('hello world there')).toBe('assistant');
    expect(
      classifyPopupText('During the daylight saving time transition the event occurs twice.')
    ).toBe('assistant');
  });
});

describe('rewriteModeForAssistant', () => {
  it('maps UI modes onto rewrite_text modes', () => {
    expect(rewriteModeForAssistant('improve')).toBe('clearer');
    expect(rewriteModeForAssistant('rephrase')).toBe('rephrase');
    expect(rewriteModeForAssistant('shorten')).toBe('shorter');
    expect(rewriteModeForAssistant('friendly')).toBe('friendly');
    expect(rewriteModeForAssistant('formal')).toBe('formal');
    expect(rewriteModeForAssistant('custom')).toBe('custom');
  });
});

describe('rate limit helpers', () => {
  it('detects 429 / rate-limit error strings', async () => {
    const { isRateLimitError, formatProviderError } = await import('./inlineAssistant');
    expect(isRateLimitError('OpenAI: Too many requests (429). Wait…')).toBe(true);
    expect(isRateLimitError('Gemini API error 429: rate limit')).toBe(true);
    expect(isRateLimitError('invalid api key')).toBe(false);
    expect(formatProviderError(new Error('HTTP 429 Too Many Requests'))).toMatch(
      /Too many requests/i
    );
    expect(
      formatProviderError(
        new Error(
          'Invalid input: Translation needs an AI model. Open Settings, choose a provider, and add an API key.',
        ),
      ),
    ).toMatch(/Open Settings/i);
    expect(formatProviderError(new Error('Empty response from Gemini (finishReason: MAX_TOKENS)'))).toMatch(
      /empty answer/i,
    );
  });

  it('keeps the image wait hint and does not mention switching modes', async () => {
    const { formatImageProviderError } = await import('./inlineAssistant');
    expect(
      formatImageProviderError(
        new Error('Gemini Image is rate-limited. Wait about 90 seconds, or add an OpenAI API key.')
      )
    ).toMatch(/Wait about 90 seconds/i);
    expect(
      formatImageProviderError(new Error('Gemini Image: Too many requests (429).'))
    ).toMatch(/tap refresh once/i);
    expect(
      formatImageProviderError(new Error('Gemini Image: Too many requests (429).'))
    ).not.toMatch(/switch modes/i);
  });
});

describe('assistantKickerTitle', () => {
  it('labels translate with the target language', () => {
    expect(assistantKickerTitle('translate', 'ru')).toBe('Translate to Russian (RU)');
    expect(assistantKickerTitle('improve', 'ru')).toBe('Improvement Suggestions');
    expect(assistantKickerTitle('formal', 'en')).toBe('Formal Tone Rewrite');
  });

  it('labels the Text tab with English and the active register', () => {
    expect(assistantKickerTitle('text', 'ru')).toBe('Translate to English (EN) · General');
    expect(assistantKickerTitle('text', 'ru', 'official')).toBe(
      'Translate to English (EN) · Official'
    );
  });
});

describe('textRegisterInstruction', () => {
  it('asks the model to translate into English in the chosen register', () => {
    expect(textRegisterInstruction('official')).toMatch(/official register/i);
    expect(textRegisterInstruction('business')).toMatch(/business register/i);
    expect(textRegisterInstruction('colleague')).toMatch(/colleague/i);
    expect(textRegisterInstruction('general')).toMatch(/everyday English/i);
  });
});

describe('text tab debounce', () => {
  it('waits at least two seconds after typing before calling the provider', () => {
    expect(TEXT_COMPOSE_DEBOUNCE_MS).toBeGreaterThanOrEqual(2000);
  });
});

describe('modeFromShortcutKey', () => {
  it('maps digits 1–8 onto the mode tabs', () => {
    expect(modeFromShortcutKey('1')).toBe('translate');
    expect(modeFromShortcutKey('2')).toBe('text');
    expect(modeFromShortcutKey('3')).toBe('improve');
    expect(modeFromShortcutKey('7')).toBe('formal');
    // Fix was added later; it keeps the old keys stable.
    expect(modeFromShortcutKey('8')).toBe('fix');
    expect(modeFromShortcutKey('9')).toBeNull();
  });
});
