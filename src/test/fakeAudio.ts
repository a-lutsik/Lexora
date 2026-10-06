// ============================================================
// LEXORA — Web Audio + getUserMedia stand-ins for jsdom tests
// (live voice: mic capture via ScriptProcessor, PCM playback).
// ============================================================

import { vi } from 'vitest';

export type FakeProcessor = {
  connect: () => void;
  disconnect: () => void;
  onaudioprocess: ((event: { inputBuffer: { getChannelData: () => Float32Array } }) => void) | null;
};

export type FakeSource = {
  connect: () => void;
  disconnect: () => void;
  buffer: unknown;
  onended: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

export type FakeAudio = {
  processor: () => FakeProcessor | null;
  sources: FakeSource[];
  trackStop: ReturnType<typeof vi.fn>;
  getUserMedia: ReturnType<typeof vi.fn>;
};

function node() {
  return { connect: vi.fn(), disconnect: vi.fn() };
}

/** Installs AudioContext + navigator.mediaDevices; undo with vi.unstubAllGlobals(). */
export function installFakeAudio(): FakeAudio {
  let processor: FakeProcessor | null = null;
  const sources: FakeSource[] = [];
  const trackStop = vi.fn();

  class FakeAudioContext {
    sampleRate = 48_000;
    currentTime = 0;
    destination = {};
    createMediaStreamSource = () => node();
    state = 'running';
    createAnalyser = () => ({
      ...node(),
      context: this,
      fftSize: 32,
      smoothingTimeConstant: 0,
      frequencyBinCount: 16,
      getByteFrequencyData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
    });
    createGain = () => ({ ...node(), gain: { value: 1 } });
    createScriptProcessor = () => {
      processor = { ...node(), onaudioprocess: null };
      return processor;
    };
    createBuffer = (_channels: number, length: number, rate: number) => {
      const data = new Float32Array(length);
      return { duration: length / rate, getChannelData: () => data };
    };
    createBufferSource = () => {
      const source: FakeSource = { ...node(), buffer: null, onended: null, start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    };
    resume = () => Promise.resolve();
    close = () => Promise.resolve();
  }

  vi.stubGlobal('AudioContext', FakeAudioContext);
  const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  return { processor: () => processor, sources, trackStop, getUserMedia };
}
