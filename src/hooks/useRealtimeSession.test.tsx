import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRealtimeSession } from './useRealtimeSession';
import { ChannelMock, invokeMock } from '../test/mocks';
import { installFakeAudio, type FakeAudio } from '../test/fakeAudio';
import type { DialogueSessionDto, RealtimeEvent } from '../lib/types';

let audio: FakeAudio;
let channel: ChannelMock<RealtimeEvent> | null = null;

function emit(event: RealtimeEvent) {
  act(() => {
    channel?.onmessage(event);
  });
}

/** 100 ms of 48 kHz audio → exactly one 16 kHz chunk. */
function feedMic(value: number) {
  act(() => {
    audio.processor()?.onaudioprocess?.({
      inputBuffer: { getChannelData: () => new Float32Array(4_800).fill(value) },
    });
  });
}

function sentChunks(): string[] {
  return invokeMock.mock.calls
    .filter(([cmd]) => cmd === 'realtime_send_audio')
    .map(([, args]) => (args as { chunk: string }).chunk);
}

function lastChunk(): string {
  const chunks = sentChunks();
  return chunks[chunks.length - 1] ?? '';
}

beforeEach(() => {
  channel = null;
  audio = installFakeAudio();
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'realtime_start') {
      channel = args?.onEvent as ChannelMock<RealtimeEvent>;
      return { sessionId: 7, model: 'gemini-3.8-live', inputSampleRate: 16_000, outputSampleRate: 24_000 };
    }
    return null;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useRealtimeSession', () => {
  it('opens a session, streams 100 ms PCM chunks and builds turns from events', async () => {
    const { result } = renderHook(() => useRealtimeSession());
    await act(async () => {
      await result.current.start({ mode: 'dialogue', dialogueSessionId: 3 });
    });

    expect(invokeMock).toHaveBeenCalledWith('realtime_start', {
      input: { mode: 'dialogue', dialogueSessionId: 3 },
      onEvent: expect.any(ChannelMock),
    });
    expect(result.current.status).toBe('live');

    feedMic(0.5);
    const [chunk] = sentChunks();
    expect(chunk).toBeDefined();
    expect(atob(chunk ?? '').length).toBe(3_200); // 1600 samples × 2 bytes

    emit({ type: 'inputTranscript', text: ' One latte', language: 'en' });
    emit({ type: 'outputTranscript', text: 'Coming right up!', language: null });
    emit({ type: 'turnComplete' });
    expect(result.current.turns).toEqual([
      { id: 1, heard: 'One latte', spoken: 'Coming right up!', typed: false, final: true },
    ]);
  });

  it('plays model audio, flushes it on barge-in and mutes the mic in half-duplex', async () => {
    const { result } = renderHook(() => useRealtimeSession({ halfDuplex: true }));
    await act(async () => {
      await result.current.start({ mode: 'dialogue', dialogueSessionId: 3 });
    });

    emit({ type: 'audio', data: btoa('\u0000@\u0000@'), sampleRate: 24_000 });
    expect(audio.sources).toHaveLength(1);
    expect(audio.sources[0]?.start).toHaveBeenCalled();
    expect(result.current.modelSpeaking).toBe(true);

    feedMic(0.5);
    const muted = lastChunk();
    expect([...atob(muted)].every((c) => c === '\u0000')).toBe(true);

    emit({ type: 'interrupted' });
    expect(audio.sources[0]?.stop).toHaveBeenCalled();
    expect(result.current.modelSpeaking).toBe(false);

    feedMic(0.5);
    const live = lastChunk();
    expect([...atob(live)].some((c) => c !== '\u0000')).toBe(true);
  });

  it('sends typed text and shows it once the backend echoes it', async () => {
    const { result } = renderHook(() => useRealtimeSession());
    await act(async () => {
      await result.current.start({ mode: 'dialogue', dialogueSessionId: 3 });
    });
    await act(async () => {
      await result.current.sendText('  Two flat whites  ');
    });
    expect(invokeMock).toHaveBeenCalledWith('realtime_send_text', {
      sessionId: 7,
      text: 'Two flat whites',
    });
    emit({ type: 'learnerText', text: 'Two flat whites' });
    expect(result.current.turns[0]).toMatchObject({ heard: 'Two flat whites', typed: true });
  });

  it('forwards saved dialogue turns', async () => {
    const onTurnSaved = vi.fn();
    const { result } = renderHook(() => useRealtimeSession({ onTurnSaved }));
    await act(async () => {
      await result.current.start({ mode: 'dialogue', dialogueSessionId: 3 });
    });
    const session: DialogueSessionDto = {
      id: 3,
      scenarioId: 1,
      scenarioTitle: 'Coffee Shop',
      scenarioLevel: 'B2',
      scenarioSlug: 'coffee-shop-london-b2',
      language: 'en',
      sessionScore: null,
      turnCount: 0,
      status: 'active',
      turns: [],
      createdAt: 0,
      updatedAt: 0,
    };
    emit({ type: 'turnSaved', session });
    expect(onTurnSaved).toHaveBeenCalledWith(session);
  });

  it('closes the backend session when the microphone is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });
    const { result } = renderHook(() => useRealtimeSession());
    await act(async () => {
      await result.current.start({ mode: 'interpreter', targetLanguage: 'ru' });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/permission denied/i);
    expect(invokeMock).toHaveBeenCalledWith('realtime_stop', { sessionId: 7 });
  });

  it('reports a backend start failure without touching the mic', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'realtime_start') throw new Error('Validation: Gemini API key is missing');
      return null;
    });
    const { result } = renderHook(() => useRealtimeSession());
    await act(async () => {
      await result.current.start({ mode: 'dialogue', dialogueSessionId: 3 });
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
    expect(audio.getUserMedia).not.toHaveBeenCalled();
  });

  it('returns to idle when the server closes and stops the session on unmount', async () => {
    const { result, unmount } = renderHook(() => useRealtimeSession());
    await act(async () => {
      await result.current.start({ mode: 'interpreter', targetLanguage: 'ru' });
    });
    emit({ type: 'goAway', timeLeft: '50s' });
    expect(result.current.notice).toMatch(/15-minute/);
    emit({ type: 'closed', reason: null });
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(audio.trackStop).toHaveBeenCalled();

    await act(async () => {
      await result.current.start({ mode: 'interpreter', targetLanguage: 'ru' });
    });
    unmount();
    expect(invokeMock).toHaveBeenCalledWith('realtime_stop', { sessionId: 7 });
  });
});
