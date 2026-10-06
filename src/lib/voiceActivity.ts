// ============================================================
// LEXORA — Voice-activity helpers for auto-stop recording
// Pure: same samples + clock → same stop decision.
// ============================================================

export const VAD_SPEECH_THRESHOLD = 0.02;
export const VAD_MIN_SPEECH_MS = 250;
export const VAD_SILENCE_MS = 700;
export const POST_TTS_GAP_MS = 250;

export type VadSnapshot = {
  heardSpeech: boolean;
  speechStartedAt: number | null;
  silenceStartedAt: number | null;
};

export const INITIAL_VAD: VadSnapshot = {
  heardSpeech: false,
  speechStartedAt: null,
  silenceStartedAt: null,
};

export function timeDomainPeak(samples: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.abs(samples[i] ?? 0);
    if (sample > peak) peak = sample;
  }
  return peak;
}

export function nextVadState(
  prev: VadSnapshot,
  peak: number,
  nowMs: number,
  options?: {
    speechThreshold?: number;
    minSpeechMs?: number;
    silenceMs?: number;
  },
): { state: VadSnapshot; shouldStop: boolean } {
  const speechThreshold = options?.speechThreshold ?? VAD_SPEECH_THRESHOLD;
  const minSpeechMs = options?.minSpeechMs ?? VAD_MIN_SPEECH_MS;
  const silenceMs = options?.silenceMs ?? VAD_SILENCE_MS;
  const speaking = peak >= speechThreshold;

  if (speaking) {
    const speechStartedAt = prev.speechStartedAt ?? nowMs;
    const state: VadSnapshot = {
      heardSpeech: true,
      speechStartedAt,
      silenceStartedAt: null,
    };
    return { state, shouldStop: false };
  }

  if (!prev.heardSpeech || prev.speechStartedAt === null) {
    return { state: prev, shouldStop: false };
  }

  const silenceStartedAt = prev.silenceStartedAt ?? nowMs;
  const spokenMs = silenceStartedAt - prev.speechStartedAt;
  const silentMs = nowMs - silenceStartedAt;
  const state: VadSnapshot = {
    heardSpeech: true,
    speechStartedAt: prev.speechStartedAt,
    silenceStartedAt,
  };
  return {
    state,
    shouldStop: spokenMs >= minSpeechMs && silentMs >= silenceMs,
  };
}
