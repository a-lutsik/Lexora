import { t } from '../i18n';
// ============================================================
// LEXORA — useMicrophoneRecorder
// Start/stop capture with an auto-stop ceiling and optional VAD.
// Uses MediaRecorder when present, otherwise PCM WAV (WKWebView).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_RECORDING_MS,
  beginWavCapture,
  createUnlockedAudioContext,
  getUserMediaFn,
  microphoneErrorMessage,
  type AudioCaptureSession,
} from '../lib/audioRecorder';
import { INITIAL_VAD, nextVadState, timeDomainPeak, type VadSnapshot } from '../lib/voiceActivity';

export type RecorderStatus = 'idle' | 'recording' | 'stopping';

/** Ignore sub-second taps so Whisper gets a usable clip. */
export const MIN_RECORDING_MS = 1_000;

export type RecordedClip = {
  blob: Blob;
  mimeType: string;
  objectUrl: string;
  heardSpeech: boolean;
};

export type UseMicrophoneRecorderOptions = {
  vadAutoStop?: boolean;
  onAutoStop?: (clip: RecordedClip) => void;
};

export function useMicrophoneRecorder(options: UseMicrophoneRecorderOptions = {}) {
  const { vadAutoStop = false } = options;
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const captureRef = useRef<AudioCaptureSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const vadRef = useRef<VadSnapshot>(INITIAL_VAD);
  const recordingStartedAtRef = useRef(0);
  const stopLockRef = useRef(false);
  const onAutoStopRef = useRef(options.onAutoStop);
  onAutoStopRef.current = options.onAutoStop;

  const stopVadLoop = useCallback(() => {
    if (vadRafRef.current !== null) {
      window.cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    stopVadLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    captureRef.current = null;
    stopLockRef.current = false;
    setAnalyser(null);
  }, [stopVadLoop]);

  useEffect(() => () => {
    captureRef.current?.cancel();
    cleanupStream();
  }, [cleanupStream]);

  const stop = useCallback((options?: { forceHeard?: boolean }): Promise<RecordedClip> => {
    const capture = captureRef.current;
    const heardSpeech = Boolean(options?.forceHeard) || vadRef.current.heardSpeech;
    if (!capture || stopLockRef.current) {
      setStatus('idle');
      return Promise.reject(new Error('Not recording'));
    }
    stopLockRef.current = true;
    setStatus('stopping');

    const finish = () =>
      capture
        .stop()
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          cleanupStream();
          setStatus('idle');
          return { blob, mimeType: capture.mimeType, objectUrl, heardSpeech };
        })
        .catch((err: unknown) => {
          cleanupStream();
          setStatus('idle');
          throw err;
        });

    const elapsed = performance.now() - recordingStartedAtRef.current;
    if (elapsed < MIN_RECORDING_MS) {
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          void finish().then(resolve, reject);
        }, MIN_RECORDING_MS - elapsed);
      });
    }
    return finish();
  }, [cleanupStream]);

  const stopAndNotify = useCallback(() => {
    void stop()
      .then((clip) => {
        onAutoStopRef.current?.(clip);
      })
      .catch(() => undefined);
  }, [stop]);

  const startVadLoop = useCallback(() => {
    stopVadLoop();
    const tick = () => {
      const analyserNode = captureRef.current?.analyser;
      if (!analyserNode) return;
      const samples = new Float32Array(analyserNode.fftSize);
      analyserNode.getFloatTimeDomainData(samples);
      const next = nextVadState(vadRef.current, timeDomainPeak(samples), performance.now());
      vadRef.current = next.state;
      if (vadAutoStop && next.shouldStop) {
        stopAndNotify();
        return;
      }
      vadRafRef.current = window.requestAnimationFrame(tick);
    };
    vadRafRef.current = window.requestAnimationFrame(tick);
  }, [stopAndNotify, stopVadLoop, vadAutoStop]);

  const start = useCallback(async (): Promise<boolean> => {
    if (status === 'recording' || status === 'stopping') return false;
    const getUserMedia = getUserMediaFn();
    if (!getUserMedia) {
      setError(t('Recording is not supported in this environment.'));
      return false;
    }
    setError(null);
    vadRef.current = INITIAL_VAD;
    try {
      // Unlock AudioContext in the same user-gesture turn so AnalyserNode
      // is not stuck at silence in WKWebView / Safari (Tauri).
      const audioContext = createUnlockedAudioContext();
      if (audioContext?.state === 'suspended') {
        await audioContext.resume();
      }
      const stream = await getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      // WAV: Whisper/Gemini accept it reliably; MediaRecorder webm from WKWebView
      // often looks playable in <audio> but transcribes as empty.
      const capture = beginWavCapture(stream, audioContext);
      captureRef.current = capture;
      recordingStartedAtRef.current = performance.now();
      setAnalyser(capture.analyser);
      setStatus('recording');
      timerRef.current = window.setTimeout(() => {
        if (captureRef.current) {
          stopAndNotify();
        }
      }, MAX_RECORDING_MS);
      if (capture.analyser) {
        startVadLoop();
      }
      return true;
    } catch (err) {
      captureRef.current?.cancel();
      cleanupStream();
      setStatus('idle');
      setError(microphoneErrorMessage(err));
      return false;
    }
  }, [cleanupStream, startVadLoop, status, stopAndNotify]);

  return { status, error, analyser, start, stop };
}
