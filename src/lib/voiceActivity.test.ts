import { describe, expect, it } from 'vitest';
import {
  INITIAL_VAD,
  VAD_MIN_SPEECH_MS,
  VAD_SILENCE_MS,
  nextVadState,
  timeDomainPeak,
} from './voiceActivity';

describe('voiceActivity', () => {
  it('computes a peak from time-domain samples', () => {
    expect(timeDomainPeak([0, -0.4, 0.2])).toBe(0.4);
    expect(timeDomainPeak([])).toBe(0);
  });

  it('does not stop on leading silence', () => {
    const first = nextVadState(INITIAL_VAD, 0.001, 0);
    expect(first.state.heardSpeech).toBe(false);
    expect(first.shouldStop).toBe(false);
    const later = nextVadState(first.state, 0.001, VAD_SILENCE_MS + 50);
    expect(later.shouldStop).toBe(false);
  });

  it('stops after enough speech followed by enough silence', () => {
    const speaking = nextVadState(INITIAL_VAD, 0.3, 1_000);
    expect(speaking.state.heardSpeech).toBe(true);
    expect(speaking.shouldStop).toBe(false);

    const stillSpeaking = nextVadState(speaking.state, 0.25, 1_000 + VAD_MIN_SPEECH_MS);
    expect(stillSpeaking.shouldStop).toBe(false);

    const justSilent = nextVadState(stillSpeaking.state, 0.001, 1_000 + VAD_MIN_SPEECH_MS + 10);
    expect(justSilent.shouldStop).toBe(false);

    const done = nextVadState(
      justSilent.state,
      0.001,
      1_000 + VAD_MIN_SPEECH_MS + 10 + VAD_SILENCE_MS,
    );
    expect(done.shouldStop).toBe(true);
    expect(done.state.heardSpeech).toBe(true);
  });

  it('does not stop if speech was shorter than the minimum', () => {
    const speaking = nextVadState(INITIAL_VAD, 0.4, 0);
    const silent = nextVadState(speaking.state, 0, 80);
    const still = nextVadState(silent.state, 0, 80 + VAD_SILENCE_MS);
    expect(still.shouldStop).toBe(false);
  });
});
