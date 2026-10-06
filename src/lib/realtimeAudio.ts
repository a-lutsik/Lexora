// ============================================================
// LEXORA — Realtime voice audio (Gemini Live)
// Mic → mono PCM16 16 kHz, base64 chunks of 100 ms.
// Model audio (PCM16, 24 kHz) → gapless playback queue that is
// flushed on barge-in.
// ============================================================

import { createUnlockedAudioContext, getUserMediaFn } from './audioRecorder';

export const REALTIME_INPUT_RATE = 16_000;
export const REALTIME_CHUNK_MS = 100;
/** Small lead so the first buffer is not scheduled in the past. */
const PLAYBACK_LEAD_SECONDS = 0.03;
/** ~43 ms at 48 kHz — short enough for 100 ms chunks. */
const PROCESSOR_BUFFER_SIZE = 2048;

function concatFloat32(a: Float32Array, b: Float32Array): Float32Array {
  if (a.length === 0) return b;
  const merged = new Float32Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  return merged;
}

/**
 * Stateful resampler for streamed chunks: box-filter averaging when
 * decimating (48/44.1 kHz → 16 kHz), nearest sample when upsampling.
 * Leftover input is kept for the next chunk, so timing does not drift.
 */
export function createResampler(inputRate: number, outputRate: number) {
  // Absolute integer indices: output k covers input [k·in/out, (k+1)·in/out).
  // No accumulated floating-point drift across chunks.
  const inputStart = (k: number) => Math.floor((k * inputRate) / outputRate);
  let pending = new Float32Array(0);
  let pendingStart = 0;
  let produced = 0;

  return (chunk: Float32Array): Float32Array => {
    const merged = concatFloat32(pending, chunk);
    const available = pendingStart + merged.length;
    const out: number[] = [];
    for (;;) {
      const start = inputStart(produced);
      const end = inputStart(produced + 1);
      if (Math.max(end, start + 1) > available) break;
      if (end <= start) {
        out.push(merged[start - pendingStart] ?? 0);
      } else {
        let sum = 0;
        for (let i = start; i < end; i++) {
          sum += merged[i - pendingStart] ?? 0;
        }
        out.push(sum / (end - start));
      }
      produced += 1;
    }
    const nextStart = inputStart(produced);
    pending = merged.slice(nextStart - pendingStart);
    pendingStart = nextStart;
    return Float32Array.from(out);
  };
}

export function floatToPcm16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    pcm[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return pcm;
}

export function pcm16ToFloat(pcm: Int16Array): Float32Array {
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const v = pcm[i] ?? 0;
    samples[i] = v < 0 ? v / 0x8000 : v / 0x7fff;
  }
  return samples;
}

/** Little-endian PCM16 → base64 (the wire format of Gemini Live). */
export function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(i * 2, pcm[i] ?? 0, true);
  }
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export function base64ToPcm16(data: string): Int16Array {
  const binary = atob(data);
  const view = new DataView(new ArrayBuffer(binary.length - (binary.length % 2)));
  for (let i = 0; i < view.byteLength; i++) {
    view.setUint8(i, binary.charCodeAt(i));
  }
  const pcm = new Int16Array(view.byteLength / 2);
  for (let i = 0; i < pcm.length; i++) {
    pcm[i] = view.getInt16(i * 2, true);
  }
  return pcm;
}

/** Cuts a PCM stream into fixed-size chunks (100 ms = 1600 samples at 16 kHz). */
export function createChunker(samplesPerChunk: number) {
  let buffer = new Int16Array(0);
  return {
    push(pcm: Int16Array): Int16Array[] {
      const merged = new Int16Array(buffer.length + pcm.length);
      merged.set(buffer, 0);
      merged.set(pcm, buffer.length);
      const chunks: Int16Array[] = [];
      let offset = 0;
      while (merged.length - offset >= samplesPerChunk) {
        chunks.push(merged.slice(offset, offset + samplesPerChunk));
        offset += samplesPerChunk;
      }
      buffer = merged.slice(offset);
      return chunks;
    },
  };
}

// ── Microphone capture ─────────────────────────────────────

export type RealtimeCapture = {
  analyser: AnalyserNode;
  /** Muted capture keeps streaming silence so server-side VAD ends the turn. */
  setMuted: (muted: boolean) => void;
  stop: () => void;
};

export async function startRealtimeCapture(
  onChunk: (base64: string) => void,
): Promise<RealtimeCapture> {
  const getUserMedia = getUserMediaFn();
  if (!getUserMedia) {
    throw new Error('Микрофон недоступен в этом окружении.');
  }
  const stream = await getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = createUnlockedAudioContext();
  if (!ctx) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('Аудио не поддерживается в этом окружении.');
  }

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.6;
  // Fan out in parallel (not after the analyser) — WKWebView feeds
  // ScriptProcessor reliably only this way; see audioRecorder.createWavSession.
  const processor = ctx.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  const resample = createResampler(ctx.sampleRate, REALTIME_INPUT_RATE);
  const chunker = createChunker((REALTIME_INPUT_RATE * REALTIME_CHUNK_MS) / 1000);
  let muted = false;
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    const frame = muted ? new Float32Array(input.length) : input;
    for (const chunk of chunker.push(floatToPcm16(resample(frame)))) {
      onChunk(pcm16ToBase64(chunk));
    }
  };
  source.connect(analyser);
  analyser.connect(silent);
  source.connect(processor);
  processor.connect(silent);
  silent.connect(ctx.destination);
  void ctx.resume();

  return {
    analyser,
    setMuted: (value) => {
      muted = value;
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      processor.onaudioprocess = null;
      processor.disconnect();
      analyser.disconnect();
      source.disconnect();
      silent.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void ctx.close();
    },
  };
}

// ── Playback ───────────────────────────────────────────────

export type PcmPlayer = {
  enqueue: (base64: string, sampleRate: number) => void;
  /** Barge-in: drop everything scheduled. */
  flush: () => void;
  close: () => void;
};

/**
 * Create inside the click handler (before any await) so WebKit unlocks
 * the AudioContext. `onPlayingChange` fires on idle ↔ speaking.
 */
export function createPcmPlayer(onPlayingChange?: (playing: boolean) => void): PcmPlayer | null {
  const ctx = createUnlockedAudioContext();
  if (!ctx) return null;
  const sources = new Set<AudioBufferSourceNode>();
  let playhead = 0;
  let closed = false;

  const setIdleIfDone = () => {
    if (sources.size === 0) {
      playhead = 0;
      onPlayingChange?.(false);
    }
  };

  return {
    enqueue: (data, sampleRate) => {
      if (closed) return;
      const samples = pcm16ToFloat(base64ToPcm16(data));
      if (samples.length === 0) return;
      const buffer = ctx.createBuffer(1, samples.length, sampleRate);
      buffer.getChannelData(0).set(samples);
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime + PLAYBACK_LEAD_SECONDS, playhead);
      node.onended = () => {
        node.disconnect();
        sources.delete(node);
        setIdleIfDone();
      };
      const wasIdle = sources.size === 0;
      sources.add(node);
      node.start(startAt);
      playhead = startAt + buffer.duration;
      if (wasIdle) onPlayingChange?.(true);
    },
    flush: () => {
      for (const node of sources) {
        node.onended = null;
        try {
          node.stop();
        } catch {
          // not started yet / already stopped
        }
        node.disconnect();
      }
      sources.clear();
      setIdleIfDone();
    },
    close: () => {
      if (closed) return;
      closed = true;
      for (const node of sources) {
        node.onended = null;
        try {
          node.stop();
        } catch {
          // already stopped
        }
      }
      sources.clear();
      void ctx.close();
    },
  };
}
