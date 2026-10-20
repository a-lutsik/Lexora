import { t } from '../i18n';
// ============================================================
// LEXORA — Microphone recording helpers
// Capture a short clip, encode as base64 for IPC.
// WKWebView often has getUserMedia without MediaRecorder — WAV fallback.
// ============================================================

export const MAX_RECORDING_MS = 8_000;

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  success: (stream: MediaStream) => void,
  error: (err: Error) => void,
) => void;

type NavigatorWithLegacyMedia = Navigator & {
  webkitGetUserMedia?: LegacyGetUserMedia;
  mozGetUserMedia?: LegacyGetUserMedia;
  getUserMedia?: LegacyGetUserMedia;
};

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type AudioPcmSlice = {
  blob: Blob;
  nextOffset: number;
};

export type AudioCaptureSession = {
  mimeType: string;
  analyser: AnalyserNode | null;
  stop: () => Promise<Blob>;
  cancel: () => void;
  /** Encode PCM from `fromSample` without stopping. WAV sessions only. */
  sliceFrom: (fromSample: number) => AudioPcmSlice | null;
};

export function getUserMediaFn(): ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null {
  if (typeof navigator === 'undefined') return null;
  const devices = navigator.mediaDevices;
  if (devices && typeof devices.getUserMedia === 'function') {
    return (constraints) => devices.getUserMedia(constraints);
  }
  const nav = navigator as NavigatorWithLegacyMedia;
  const legacy = nav.webkitGetUserMedia ?? nav.mozGetUserMedia ?? nav.getUserMedia;
  if (typeof legacy !== 'function') return null;
  return (constraints) =>
    new Promise((resolve, reject) => {
      legacy.call(navigator, constraints, resolve, reject);
    });
}

export function isRecordingSupported(): boolean {
  return getUserMediaFn() !== null;
}

/** Browser-native mime, or null to let MediaRecorder pick a default. */
export function pickRecorderMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
}

export function beginAudioCapture(
  stream: MediaStream,
  audioContext?: AudioContext | null,
): AudioCaptureSession {
  try {
    if (typeof MediaRecorder !== 'undefined') {
      return createMediaRecorderSession(stream, audioContext);
    }
  } catch {
    // WKWebView / Safari may expose MediaRecorder but reject the mime type.
  }
  return createWavSession(stream, audioContext);
}

/** PCM WAV capture — Whisper/Gemini/Groq all accept this mime reliably. */
export function beginWavCapture(
  stream: MediaStream,
  audioContext?: AudioContext | null,
): AudioCaptureSession {
  return createWavSession(stream, audioContext);
}

export function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return t('Microphone permission denied. Allow access in system settings.');
    }
    if (error.name === 'NotFoundError') {
      return t('No microphone found.');
    }
    if (error.name === 'NotReadableError') {
      return t('Microphone is already in use.');
    }
  }
  if (error instanceof Error && error.message) {
    return t(error.message);
  }
  return t('Could not access the microphone.');
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await readBlobBytes(blob);
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read audio bytes'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio bytes'));
    reader.readAsArrayBuffer(blob);
  });
}

export function revokeObjectUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function createMediaRecorderSession(
  stream: MediaStream,
  audioContext?: AudioContext | null,
): AudioCaptureSession {
  const preferredMime = pickRecorderMime();
  const recorder = preferredMime
    ? new MediaRecorder(stream, { mimeType: preferredMime })
    : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  let stopResolve: ((blob: Blob) => void) | null = null;
  const monitor = attachMicMonitor(stream, audioContext);

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  recorder.onstop = () => {
    const type = recorder.mimeType || preferredMime || 'audio/webm';
    const resolve = stopResolve;
    stopResolve = null;
    resolve?.(new Blob(chunks, { type }));
  };
  recorder.start(100);

  return {
    mimeType: recorder.mimeType || preferredMime || 'audio/webm',
    analyser: monitor?.analyser ?? null,
    stop: () =>
      new Promise((resolve, reject) => {
        if (recorder.state === 'inactive') {
          monitor?.stop();
          reject(new Error('Not recording'));
          return;
        }
        stopResolve = resolve;
        try {
          recorder.stop();
          monitor?.stop();
        } catch (err) {
          stopResolve = null;
          monitor?.stop();
          reject(err);
        }
      }),
    cancel: () => {
      monitor?.stop();
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // already stopped
        }
      }
    },
    sliceFrom: () => null,
  };
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  if (typeof window === 'undefined') return null;
  return (window as WindowWithWebkitAudio).webkitAudioContext ?? null;
}

function configureSpeechAnalyser(analyser: AnalyserNode): void {
  analyser.fftSize = 512;
  analyser.minDecibels = -80;
  analyser.maxDecibels = -28;
  analyser.smoothingTimeConstant = 0;
}

type MicMonitor = {
  analyser: AnalyserNode;
  stop: () => void;
};

export function createUnlockedAudioContext(): AudioContext | null {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;
  const ctx = new Ctor();
  void ctx.resume();
  return ctx;
}

/**
 * WKWebView / Safari leave AnalyserNode at silence unless the graph
 * reaches destination. Clone the stream so MediaRecorder is unaffected.
 */
function attachMicMonitor(
  stream: MediaStream,
  audioContext?: AudioContext | null,
): MicMonitor | null {
  const ctx = audioContext ?? createUnlockedAudioContext();
  if (!ctx) return null;

  const vizStream = typeof stream.clone === 'function' ? stream.clone() : stream;
  const source = ctx.createMediaStreamSource(vizStream);
  const analyser = ctx.createAnalyser();
  configureSpeechAnalyser(analyser);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(analyser);
  analyser.connect(mute);
  mute.connect(ctx.destination);
  void ctx.resume();

  let stopped = false;
  return {
    analyser,
    stop: () => {
      if (stopped) return;
      stopped = true;
      source.disconnect();
      analyser.disconnect();
      mute.disconnect();
      if (vizStream !== stream) {
        vizStream.getTracks().forEach((track) => track.stop());
      }
      void ctx.close();
    },
  };
}

function createWavSession(
  stream: MediaStream,
  audioContext?: AudioContext | null,
): AudioCaptureSession {
  const ctx = audioContext ?? createUnlockedAudioContext();
  if (!ctx) {
    throw new Error('Recording is not supported in this environment.');
  }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  configureSpeechAnalyser(analyser);
  // ScriptProcessor is flaky in WKWebView when chained AFTER AnalyserNode —
  // fan out in parallel so PCM capture and the visualizer both get real samples.
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  const silent = ctx.createGain();
  silent.gain.value = 0;
  source.connect(analyser);
  // WKWebView / Safari leave AnalyserNode at silence unless the graph reaches
  // destination — route it through the muted gain like attachMicMonitor does.
  analyser.connect(silent);
  source.connect(processor);
  processor.connect(silent);
  silent.connect(ctx.destination);
  void ctx.resume();

  const teardown = () => {
    processor.disconnect();
    analyser.disconnect();
    source.disconnect();
    silent.disconnect();
  };

  return {
    mimeType: 'audio/wav',
    analyser,
    stop: async () => {
      const sampleRate = ctx.sampleRate;
      teardown();
      await ctx.close();
      return encodePcm16Wav(mergeFloat32(chunks), sampleRate);
    },
    cancel: () => {
      teardown();
      void ctx.close();
    },
    sliceFrom: (fromSample: number) => {
      const merged = mergeFloat32(chunks);
      const start = Math.max(0, Math.min(fromSample, merged.length));
      const available = merged.length - start;
      const minSamples = Math.floor(ctx.sampleRate * 1);
      if (available < minSamples) return null;
      const maxSamples = Math.floor(ctx.sampleRate * 12);
      const sliceStart = available > maxSamples ? merged.length - maxSamples : start;
      const slice = merged.subarray(sliceStart);
      return {
        blob: encodePcm16Wav(slice, ctx.sampleRate),
        nextOffset: merged.length,
      };
    },
  };
}

export function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function mergeFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
