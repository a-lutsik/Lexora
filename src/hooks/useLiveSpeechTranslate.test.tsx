import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLiveSpeechTranslate } from './useLiveSpeechTranslate';
import { invokeMock } from '../test/mocks';
import { installFakeAudio, type FakeAudio } from '../test/fakeAudio';

let audio: FakeAudio;
const heardPieces: string[] = [];
const TRANSLATIONS: Record<string, string> = {
  'Where is the station?': 'Где вокзал?',
  'I need a taxi.': 'Мне нужно такси.',
  'Thank you': 'Спасибо',
};

/** One second of 48 kHz audio — enough for a live slice. */
function speak() {
  act(() => {
    audio.processor()?.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array(48_000).fill(0.2) },
    });
  });
}

function translatedSegments(): string[] {
  return invokeMock.mock.calls
    .filter(([cmd]) => cmd === 'translate_text_hub')
    .map(([, args]) => (args as { req: { text: string } }).req.text);
}

beforeEach(() => {
  // Only the hook's chunk timers are faked: jsdom's FileReader needs a real setImmediate.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  audio = installFakeAudio();
  heardPieces.length = 0;
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'transcribe_audio_hub') {
      return { text: heardPieces.shift() ?? '', language: 'en' };
    }
    if (cmd === 'translate_text_hub') {
      const text = (args?.req as { text: string }).text;
      return { translation: { mainTranslation: TRANSLATIONS[text] ?? `?${text}` }, historyId: null };
    }
    return null;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useLiveSpeechTranslate', () => {
  it('translates each finished sentence once instead of the whole transcript', async () => {
    const { result } = renderHook(() => useLiveSpeechTranslate({ sourceLang: 'en', targetLang: 'ru' }));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isLive).toBe(true);

    heardPieces.push('Where is the station? I need');
    speak();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
    });
    expect(result.current.original).toBe('Where is the station? I need');
    expect(result.current.translation).toBe('Где вокзал?');

    heardPieces.push('a taxi.');
    speak();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_200);
    });
    expect(result.current.original).toBe('Where is the station? I need a taxi.');
    expect(result.current.translation).toBe('Где вокзал? Мне нужно такси.');

    heardPieces.push('Thank you');
    speak();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_200);
    });
    // No sentence end yet — nothing new is translated until stop.
    expect(translatedSegments()).toEqual(['Where is the station?', 'I need a taxi.']);

    await act(async () => {
      result.current.stop();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(translatedSegments()).toEqual(['Where is the station?', 'I need a taxi.', 'Thank you']);
    expect(result.current.translation).toBe('Где вокзал? Мне нужно такси. Спасибо');
    expect(invokeMock).toHaveBeenCalledWith('transcribe_audio_hub', {
      req: { audioBase64: expect.any(String), mimeType: 'audio/wav', language: 'en' },
    });
  });

  it('retries a sentence whose translation failed', async () => {
    let failOnce = true;
    invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === 'transcribe_audio_hub') return { text: heardPieces.shift() ?? '', language: 'en' };
      if (cmd === 'translate_text_hub') {
        if (failOnce) {
          failOnce = false;
          throw new Error('429 Too Many Requests');
        }
        const text = (args?.req as { text: string }).text;
        return { translation: { mainTranslation: TRANSLATIONS[text] ?? text }, historyId: null };
      }
      return null;
    });
    const { result } = renderHook(() => useLiveSpeechTranslate({ sourceLang: 'en', targetLang: 'ru' }));
    await act(async () => {
      await result.current.start();
    });

    heardPieces.push('Where is the station?');
    speak();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.translation).toBe('');

    heardPieces.push('I need a taxi.');
    speak();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_200);
    });
    expect(translatedSegments()).toEqual([
      'Where is the station?',
      'Where is the station? I need a taxi.',
    ]);
    // The stub echoes unknown text back as its "translation".
    expect(result.current.translation).toBe('Where is the station? I need a taxi.');
  });
});
