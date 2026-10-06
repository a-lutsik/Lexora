// ============================================================
// LEXORA — Shadowing drill: Say / Space → TTS → record → score
// Stay on the phrase until PRONUNCIATION_PASS_SCORE, else Postpone.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useArticulationTip, useEvaluatePronunciation, useSaveAudioRecording } from './usePronunciation';
import { useMicrophoneRecorder } from './useMicrophoneRecorder';
import type { RecordedClip } from './useMicrophoneRecorder';
import { useStudyContinueHotkey } from './useStudyContinueHotkey';
import { evaluatePronunciationClip } from '../lib/evaluatePronunciationClip';
import { formatIpcError } from '../lib/utils';
import { ipc } from '../lib/ipc';
import { revokeObjectUrl } from '../lib/audioRecorder';
import { POST_TTS_GAP_MS } from '../lib/voiceActivity';
import {
  isEmptySpeechAttempt,
  isPronunciationPass,
} from '../lib/pronunciationScore';
import type { ArticulationTipResult, PronunciationAttemptDto } from '../lib/types';

export type ShadowPhase = 'idle' | 'playing' | 'recording' | 'scoring' | 'feedback';

export type UseShadowDrillArgs = {
  targetText: string;
  targetIpa: string | null;
  language: string;
  lexemeId: number | null;
  onAdvance: () => void;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mutationErrorMessage(error: unknown): string {
  return formatIpcError(
    error,
    'Could not score pronunciation. Check the AI provider in Settings.',
  );
}

export function useShadowDrill({
  targetText,
  targetIpa,
  language,
  lexemeId,
  onAdvance,
}: UseShadowDrillArgs) {
  const [phase, setPhase] = useState<ShadowPhase>('idle');
  const [latest, setLatest] = useState<PronunciationAttemptDto | undefined>(undefined);
  const [tip, setTip] = useState<ArticulationTipResult | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const [passed, setPassed] = useState(false);
  const [noSpeech, setNoSpeech] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useSaveAudioRecording();
  const evaluateMutation = useEvaluatePronunciation();
  const tipMutation = useArticulationTip();

  const runIdRef = useRef(0);
  const phraseRef = useRef(targetText);
  phraseRef.current = targetText;

  useEffect(() => () => revokeObjectUrl(playbackUrl), [playbackUrl]);

  const resetFeedback = useCallback(() => {
    setLatest(undefined);
    setTip(undefined);
    setPassed(false);
    setNoSpeech(false);
    setError(null);
    setAttempt(0);
    setPlaybackUrl((url) => {
      revokeObjectUrl(url);
      return null;
    });
  }, []);

  useEffect(() => {
    runIdRef.current += 1;
    resetFeedback();
    setPhase('idle');
  }, [targetText, resetFeedback]);

  const handleClip = useCallback(
    async (clip: RecordedClip) => {
      revokeObjectUrl(playbackUrl);
      setPlaybackUrl(clip.objectUrl);
      if (!clip.heardSpeech) {
        setNoSpeech(true);
        setLatest(undefined);
        setPassed(false);
        setPhase('feedback');
        setAttempt((n) => n + 1);
        return;
      }

      setPhase('scoring');
      setError(null);
      try {
        const result = await evaluatePronunciationClip(clip, targetText.trim(), language, {
          targetIpa,
          lexemeId,
          saveRecording: (input) => saveMutation.mutateAsync(input),
          evaluate: (input) => evaluateMutation.mutateAsync(input),
        });
        if (isEmptySpeechAttempt(result)) {
          setNoSpeech(true);
          setLatest(undefined);
          setPassed(false);
          setPhase('feedback');
          setAttempt((n) => n + 1);
          return;
        }
        setNoSpeech(false);
        setLatest(result);
        const didPass = isPronunciationPass(result.overallScore);
        setPassed(didPass);
        const worst = result.phonemes.find((phone) => phone.status !== 'ok');
        if (worst) {
          tipMutation.mutate(
            { phoneme: worst.targetPhoneme, language },
            {
              onSuccess: (data) => setTip(data),
              onError: () => setTip(undefined),
            },
          );
        } else {
          setTip(undefined);
        }
        setPhase('feedback');
        setAttempt((n) => n + 1);
      } catch (err) {
        setError(mutationErrorMessage(err));
        setPhase('feedback');
      }
    },
    [
      evaluateMutation,
      language,
      lexemeId,
      playbackUrl,
      saveMutation,
      targetIpa,
      targetText,
      tipMutation,
    ],
  );

  const recorder = useMicrophoneRecorder({
    vadAutoStop: true,
    onAutoStop: (clip) => {
      void handleClip(clip);
    },
  });

  const say = useCallback(async () => {
    const phrase = phraseRef.current.trim();
    if (!phrase) return;
    if (recorder.status === 'recording') {
      try {
        const clip = await recorder.stop({ forceHeard: true });
        await handleClip(clip);
      } catch {
        setPhase('idle');
      }
      return;
    }
    if (phase === 'playing' || phase === 'scoring' || recorder.status === 'stopping') {
      return;
    }

    const runId = ++runIdRef.current;
    setPhase('playing');
    setNoSpeech(false);
    setError(null);
    try {
      await ipc.media.playTts(phrase, language);
      if (runId !== runIdRef.current) return;
      await delay(POST_TTS_GAP_MS);
      if (runId !== runIdRef.current) return;
      setPhase('recording');
      const started = await recorder.start();
      if (!started && runId === runIdRef.current) {
        setPhase('idle');
      }
    } catch (err) {
      if (runId !== runIdRef.current) return;
      setError(mutationErrorMessage(err));
      setPhase('idle');
    }
  }, [handleClip, language, phase, recorder]);

  const postpone = useCallback(() => {
    runIdRef.current += 1;
    resetFeedback();
    setPhase('idle');
    onAdvance();
  }, [onAdvance, resetFeedback]);

  useStudyContinueHotkey(
    phase !== 'playing' && phase !== 'scoring',
    () => {
      void say();
    },
  );

  const busy = phase === 'playing' || phase === 'scoring' || recorder.status === 'stopping';
  const canSay = targetText.trim().length > 0 && !busy;

  return {
    phase,
    latest,
    tip,
    tipPending: tipMutation.isPending,
    attempt,
    passed,
    noSpeech,
    playbackUrl,
    error: error ?? (recorder.error ? recorder.error : null),
    recorderStatus: recorder.status,
    analyser: recorder.analyser,
    canSay,
    say,
    postpone,
  };
}
