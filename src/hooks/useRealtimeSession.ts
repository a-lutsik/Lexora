import { t } from '../i18n';
// ============================================================
// LEXORA — useRealtimeSession (Gemini Live via the Rust proxy)
// start(): unlock playback → open the session → stream the mic.
// Events arrive on a Tauri Channel; the API key never leaves Rust.
// ============================================================

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Channel } from '@tauri-apps/api/core';
import { ipc } from '../lib/ipc';
import { microphoneErrorMessage } from '../lib/audioRecorder';
import {
  createPcmPlayer,
  startRealtimeCapture,
  type PcmPlayer,
  type RealtimeCapture,
} from '../lib/realtimeAudio';
import { EMPTY_TRANSCRIPT, transcriptReducer } from '../lib/realtimeTranscript';
import { formatIpcError } from '../lib/utils';
import type { DialogueSessionDto, RealtimeEvent, RealtimeStartInput } from '../lib/types';

export type RealtimeStatus = 'idle' | 'connecting' | 'live' | 'error';

export type UseRealtimeSessionOptions = {
  /** Mute the mic while the model speaks — speakers echo back otherwise. */
  halfDuplex?: boolean;
  /** Play the model's audio (interpreter may show text only). */
  playAudio?: boolean;
  onTurnSaved?: (session: DialogueSessionDto) => void;
};

const SESSION_LIMIT_NOTICE =
  'Сессия скоро завершится — у живого режима лимит 15 минут. Потом начните новую.';

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [modelSpeaking, setModelSpeaking] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [transcript, dispatch] = useReducer(transcriptReducer, EMPTY_TRANSCRIPT);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sessionIdRef = useRef<number | null>(null);
  const captureRef = useRef<RealtimeCapture | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  /** Events of an older session (after stop/start) are ignored. */
  const generationRef = useRef(0);

  const releaseAudio = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    setAnalyser(null);
    setModelSpeaking(false);
  }, []);

  const handleEvent = useCallback(
    (generation: number, event: RealtimeEvent) => {
      if (generation !== generationRef.current) return;
      switch (event.type) {
        case 'ready':
          setModel(event.model);
          return;
        case 'audio':
          if (optionsRef.current.playAudio !== false) {
            playerRef.current?.enqueue(event.data, event.sampleRate);
          }
          return;
        case 'inputTranscript':
          dispatch({ type: 'heard', text: event.text });
          return;
        case 'outputTranscript':
          dispatch({ type: 'spoken', text: event.text });
          return;
        case 'learnerText':
          dispatch({ type: 'typed', text: event.text });
          return;
        case 'interrupted':
          playerRef.current?.flush();
          dispatch({ type: 'endTurn' });
          return;
        case 'turnComplete':
          dispatch({ type: 'endTurn' });
          return;
        case 'goAway':
          setNotice(t(SESSION_LIMIT_NOTICE));
          return;
        case 'turnSaved':
          optionsRef.current.onTurnSaved?.(event.session);
          return;
        case 'error':
          setError(formatIpcError(event.message, 'Ошибка живой сессии'));
          setStatus('error');
          return;
        case 'closed':
          sessionIdRef.current = null;
          releaseAudio();
          dispatch({ type: 'endTurn' });
          setStatus((s) => (s === 'error' ? s : 'idle'));
          if (event.reason) {
            setNotice(t("Session ended: {reason}", { reason: event.reason }));
          }
          return;
      }
    },
    [releaseAudio],
  );

  const stop = useCallback(async () => {
    generationRef.current += 1;
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    releaseAudio();
    dispatch({ type: 'endTurn' });
    setStatus((s) => (s === 'error' ? s : 'idle'));
    if (sessionId != null) {
      try {
        await ipc.realtime.stop(sessionId);
      } catch {
        // already closed on the backend
      }
    }
  }, [releaseAudio]);

  const start = useCallback(
    async (input: RealtimeStartInput) => {
      if (sessionIdRef.current != null || captureRef.current) return;
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      setError(null);
      setNotice(null);
      setModel(null);
      dispatch({ type: 'reset' });
      setStatus('connecting');

      // Before any await: WebKit unlocks audio only inside the click.
      playerRef.current = createPcmPlayer((playing) => {
        if (generation !== generationRef.current) return;
        setModelSpeaking(playing);
        if (optionsRef.current.halfDuplex) {
          captureRef.current?.setMuted(playing);
        }
      });

      const channel = new Channel<RealtimeEvent>();
      channel.onmessage = (event) => handleEvent(generation, event);

      try {
        const started = await ipc.realtime.start(input, channel);
        if (generation !== generationRef.current) {
          void ipc.realtime.stop(started.sessionId).catch(() => undefined);
          return;
        }
        sessionIdRef.current = started.sessionId;
        setModel(started.model);
      } catch (err) {
        if (generation !== generationRef.current) return;
        releaseAudio();
        setError(formatIpcError(err, 'Не удалось начать живую сессию'));
        setStatus('error');
        return;
      }

      try {
        const capture = await startRealtimeCapture((chunk) => {
          const sessionId = sessionIdRef.current;
          if (sessionId == null) return;
          // A dropped chunk under backpressure is fine; "ended" arrives as `closed`.
          void ipc.realtime.sendAudio(sessionId, chunk).catch(() => undefined);
        });
        if (generation !== generationRef.current) {
          capture.stop();
          return;
        }
        captureRef.current = capture;
        setAnalyser(capture.analyser);
        setStatus('live');
      } catch (err) {
        if (generation !== generationRef.current) return;
        const sessionId = sessionIdRef.current;
        sessionIdRef.current = null;
        generationRef.current += 1;
        releaseAudio();
        if (sessionId != null) {
          void ipc.realtime.stop(sessionId).catch(() => undefined);
        }
        setError(microphoneErrorMessage(err));
        setStatus('error');
      }
    },
    [handleEvent, releaseAudio],
  );

  /** Typed message instead of speech (dialogue mode). */
  const sendText = useCallback(async (text: string) => {
    const sessionId = sessionIdRef.current;
    const trimmed = text.trim();
    if (sessionId == null || !trimmed) return;
    // The backend echoes the text as `learnerText` once it is sent.
    playerRef.current?.flush();
    try {
      await ipc.realtime.sendText(sessionId, trimmed);
    } catch (err) {
      setError(formatIpcError(err, 'Не удалось отправить сообщение'));
    }
  }, []);

  // Leaving the page ends the session and frees the mic.
  useEffect(
    () => () => {
      generationRef.current += 1;
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      captureRef.current?.stop();
      captureRef.current = null;
      playerRef.current?.close();
      playerRef.current = null;
      if (sessionId != null) {
        void ipc.realtime.stop(sessionId).catch(() => undefined);
      }
    },
    [],
  );

  return {
    status,
    error,
    notice,
    model,
    modelSpeaking,
    analyser,
    turns: transcript.turns,
    start,
    stop,
    sendText,
  };
}
