// ============================================================
// LEXORA — Live microphone translation (not saved to history)
// Speech chunks → transcript (speech-to-text role); only finished
// sentences are translated, each once — cost grows linearly.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  beginWavCapture,
  blobToBase64,
  createUnlockedAudioContext,
  getUserMediaFn,
  microphoneErrorMessage,
  type AudioCaptureSession,
} from '../lib/audioRecorder';
import { ipc } from '../lib/ipc';
import { nextSegmentEnd } from '../lib/liveSegments';
import { appendTranscript, formatIpcError } from '../lib/utils';

const LIVE_FLUSH_MS = 2_200;

type UseLiveSpeechTranslateArgs = {
  sourceLang: string;
  targetLang: string;
};

export function useLiveSpeechTranslate({ sourceLang, targetLang }: UseLiveSpeechTranslateArgs) {
  const [isLive, setIsLive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(sourceLang === 'auto' ? 'en' : sourceLang);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const captureRef = useRef<AudioCaptureSession | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const clockTimerRef = useRef<number | null>(null);
  const pcmOffsetRef = useRef(0);
  const originalRef = useRef('');
  const translationRef = useRef('');
  /** Transcript index up to which the translation is done. */
  const translatedUpToRef = useRef(0);
  const inFlightRef = useRef(false);
  const generationRef = useRef(0);
  const langsRef = useRef({ sourceLang, targetLang });
  langsRef.current = { sourceLang, targetLang };

  const clearTimers = () => {
    if (flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (clockTimerRef.current) {
      window.clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
  };

  const release = () => {
    captureRef.current?.cancel();
    captureRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setAnalyser(null);
  };

  /** Translate the finished sentences not translated yet (`final`: the whole tail). */
  const translatePending = useCallback(async (generation: number, final: boolean) => {
    const text = originalRef.current;
    const start = translatedUpToRef.current;
    const end = final ? text.length : nextSegmentEnd(text, start);
    if (end <= start) return;
    const segment = text.slice(start, end).trim();
    translatedUpToRef.current = end;
    if (!segment) return;
    const { sourceLang: src, targetLang: tgt } = langsRef.current;
    try {
      const result = await ipc.translationHub.translateText(
        {
          text: segment,
          sourceLanguage: src === 'auto' ? null : src,
          targetLanguage: tgt,
          contextSentence: null,
        },
        false,
      );
      if (generation !== generationRef.current) return;
      translationRef.current = appendTranscript(
        translationRef.current,
        result.translation.mainTranslation,
      );
      setTranslation(translationRef.current);
    } catch (err) {
      // Retry the same sentences on the next chunk.
      if (generation === generationRef.current) translatedUpToRef.current = start;
      throw err;
    }
  }, []);

  const flushChunk = useCallback(async (generation: number) => {
    if (inFlightRef.current) return;
    const session = captureRef.current;
    if (!session) return;
    const slice = session.sliceFrom(pcmOffsetRef.current);
    if (!slice) return;

    inFlightRef.current = true;
    setIsUpdating(true);
    try {
      const audioBase64 = await blobToBase64(slice.blob);
      if (generation !== generationRef.current) return;
      const { sourceLang: src } = langsRef.current;
      const heard = await ipc.translationHub.transcribeAudio({
        audioBase64,
        mimeType: 'audio/wav',
        language: src === 'auto' ? null : src,
      });
      if (generation !== generationRef.current) return;
      pcmOffsetRef.current = slice.nextOffset;

      const piece = heard.text.trim();
      if (!piece) return;

      const nextOriginal = appendTranscript(originalRef.current, piece);
      originalRef.current = nextOriginal;
      setOriginal(nextOriginal);
      setSourceLanguage(heard.language || (src === 'auto' ? 'en' : src));

      await translatePending(generation, false);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(formatIpcError(err, 'Live translation failed. Check the AI provider in Settings.'));
    } finally {
      inFlightRef.current = false;
      if (generation === generationRef.current) {
        setIsUpdating(false);
      }
    }
  }, [translatePending]);

  const stop = useCallback(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    clearTimers();
    release();
    inFlightRef.current = false;
    setIsLive(false);
    setIsUpdating(false);
    // Translate the last, unfinished sentence too.
    void translatePending(generation, true).catch((err: unknown) => {
      if (generation !== generationRef.current) return;
      setError(formatIpcError(err, 'Live translation failed. Check the AI provider in Settings.'));
    });
  }, [translatePending]);

  const start = useCallback(async () => {
    const getUserMedia = getUserMediaFn();
    if (!getUserMedia) {
      setError('Live microphone is not supported here. Use Record or File Upload.');
      return;
    }
    generationRef.current += 1;
    const generation = generationRef.current;
    clearTimers();
    release();
    pcmOffsetRef.current = 0;
    originalRef.current = '';
    translationRef.current = '';
    translatedUpToRef.current = 0;
    setOriginal('');
    setTranslation('');
    setError(null);
    setSeconds(0);

    try {
      const audioContext = createUnlockedAudioContext();
      const stream = await getUserMedia({ audio: true });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const capture = beginWavCapture(stream, audioContext);
      captureRef.current = capture;
      setAnalyser(capture.analyser);
      setIsLive(true);
      flushTimerRef.current = window.setInterval(() => {
        void flushChunk(generation);
      }, LIVE_FLUSH_MS);
      clockTimerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1_000);
      window.setTimeout(() => {
        void flushChunk(generation);
      }, 1_200);
    } catch (err) {
      release();
      setError(microphoneErrorMessage(err));
    }
  }, [flushChunk]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      clearTimers();
      release();
    };
  }, []);

  return {
    isLive,
    isUpdating,
    seconds,
    original,
    translation,
    sourceLanguage,
    analyser,
    error,
    start,
    stop,
    resetCards: () => {
      originalRef.current = '';
      translationRef.current = '';
      translatedUpToRef.current = 0;
      setOriginal('');
      setTranslation('');
      setError(null);
    },
    clearError: () => setError(null),
  };
}
