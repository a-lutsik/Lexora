// ============================================================
// LEXORA — Pronunciation Coach page
// Practice, Shadowing, Minimal Pairs, History.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PhonemeFeedback } from '../../components/domain/PhonemeFeedback';
import {
  useArticulationTip,
  useEvaluatePronunciation,
  useProblemPhonemes,
  usePronunciationHistory,
  useSaveAudioRecording,
} from '../../hooks/usePronunciation';
import { useMicrophoneRecorder } from '../../hooks/useMicrophoneRecorder';
import type { RecordedClip } from '../../hooks/useMicrophoneRecorder';
import { useSettings } from '../../hooks/useSettings';
import { usePairsSpaceHold } from '../../hooks/usePairsSpaceHold';
import { revokeObjectUrl } from '../../lib/audioRecorder';
import { evaluatePronunciationClip } from '../../lib/evaluatePronunciationClip';
import { formatIpcError } from '../../lib/utils';
import { ipc } from '../../lib/ipc';
import { isEmptySpeechAttempt } from '../../lib/pronunciationScore';
import { computeSessionStats } from '../../lib/sessionScore';
import type { PronunciationAttemptDto } from '../../lib/types';
import { MinimalPairsPanel } from './MinimalPairsPanel';
import { PronunciationDrill } from './PronunciationDrill';
import { ShadowingPanel } from './ShadowingPanel';
import './pronunciation.css';

type CoachTab = 'practice' | 'shadowing' | 'pairs' | 'history';

const TAB_OPTIONS: { id: CoachTab; label: string }[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'shadowing', label: 'Shadowing' },
  { id: 'pairs', label: 'Minimal pairs' },
  { id: 'history', label: 'History' },
];

function mutationErrorMessage(error: unknown): string {
  return formatIpcError(
    error,
    'Could not score pronunciation. Check the AI provider in Settings.',
  );
}

function formatWhen(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function PronunciationPage() {
  const [searchParams] = useSearchParams();
  const { data: settings } = useSettings();
  const language = settings?.primaryLanguage ?? 'en';

  const [tab, setTab] = useState<CoachTab>('practice');
  const [targetText, setTargetText] = useState('');
  const [targetIpa, setTargetIpa] = useState('');
  const [lexemeId, setLexemeId] = useState<number | null>(null);
  const [latest, setLatest] = useState<PronunciationAttemptDto | undefined>(undefined);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [practiceScores, setPracticeScores] = useState<number[]>([]);
  const [practiceScoring, setPracticeScoring] = useState(false);
  const [practiceNoSpeech, setPracticeNoSpeech] = useState(false);
  const practiceInputRef = useRef<HTMLInputElement>(null);
  const practiceAttemptIds = useRef<Set<number>>(new Set());
  const ipaManualRef = useRef(false);

  const saveMutation = useSaveAudioRecording();
  const evaluateMutation = useEvaluatePronunciation();
  const tipMutation = useArticulationTip();

  const { data: history } = usePronunciationHistory(null, language, 20);
  const { data: problemPhonemes } = useProblemPhonemes(language, 8);

  useEffect(() => {
    const word = searchParams.get('word');
    const ipa = searchParams.get('ipa');
    const idParam = searchParams.get('lexemeId');
    if (word && word.trim()) {
      setTargetText(word.trim());
      setTab('practice');
    }
    const providedIpa = ipa?.trim() ?? '';
    setTargetIpa(providedIpa);
    ipaManualRef.current = providedIpa.length > 0;
    if (idParam) {
      const parsed = Number(idParam);
      setLexemeId(Number.isFinite(parsed) ? parsed : null);
    } else {
      setLexemeId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const phrase = targetText.trim();
    if (!phrase || ipaManualRef.current) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void ipc.pronunciation
        .resolveModel(phrase, language)
        .then((model) => {
          if (cancelled || ipaManualRef.current) return;
          setTargetIpa(model.ipa ?? '');
        })
        .catch(() => {
          // Offline / missing model: TTS still expands spoken form.
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [language, targetText]);

  useEffect(() => () => revokeObjectUrl(playbackUrl), [playbackUrl]);

  const busy = saveMutation.isPending || evaluateMutation.isPending || practiceScoring;
  const canRecord = targetText.trim().length > 0 && !busy;

  const worstPhoneme = useMemo(
    () => latest?.phonemes.find((p) => p.status !== 'ok') ?? latest?.phonemes[0],
    [latest],
  );

  const handlePracticeRecorded = useCallback(
    async (clip: RecordedClip) => {
      setPracticeScoring(true);
      setPracticeNoSpeech(false);
      revokeObjectUrl(playbackUrl);
      setPlaybackUrl(clip.objectUrl);
      if (clip.blob.size < 64) {
        setPracticeNoSpeech(true);
        setLatest(undefined);
        setPracticeScoring(false);
        return;
      }
      try {
        const result = await evaluatePronunciationClip(clip, targetText.trim(), language, {
          targetIpa: targetIpa.trim() || null,
          lexemeId,
          saveRecording: (input) => saveMutation.mutateAsync(input),
          evaluate: (input) => evaluateMutation.mutateAsync(input),
        });
        if (isEmptySpeechAttempt(result)) {
          setPracticeNoSpeech(true);
          setLatest(undefined);
          return;
        }
        setLatest(result);
        if (!practiceAttemptIds.current.has(result.id)) {
          practiceAttemptIds.current.add(result.id);
          setPracticeScores((prev) => [...prev, result.overallScore]);
        }
      } catch {
        // errors surface via mutation state
      } finally {
        setPracticeScoring(false);
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
    ],
  );

  const practiceRecorder = useMicrophoneRecorder({
    onAutoStop: (clip) => {
      void handlePracticeRecorded(clip);
    },
  });

  const handlePracticePrimary = async () => {
    if (practiceRecorder.status === 'recording' || practiceRecorder.status === 'stopping') {
      try {
        const clip = await practiceRecorder.stop({ forceHeard: true });
        await handlePracticeRecorded(clip);
      } catch {
        // surfaced via recorder.error
      }
      return;
    }
    if (!canRecord) return;
    setPracticeNoSpeech(false);
    await practiceRecorder.start();
  };

  const startPracticeHold = async () => {
    if (!canRecord || practiceRecorder.status === 'recording' || practiceRecorder.status === 'stopping') {
      return;
    }
    setPracticeNoSpeech(false);
    await practiceRecorder.start();
  };

  const stopPracticeHold = async () => {
    try {
      const clip = await practiceRecorder.stop({ forceHeard: true });
      await handlePracticeRecorded(clip);
    } catch {
      // Not recording yet, or already stopped
    }
  };

  usePairsSpaceHold({
    enabled: tab === 'practice' && !practiceScoring && practiceRecorder.status !== 'stopping',
    onStart: startPracticeHold,
    onStop: stopPracticeHold,
  });

  const requestTip = () => {
    const phoneme = worstPhoneme?.targetPhoneme;
    if (!phoneme) return;
    tipMutation.mutate({ phoneme, language });
  };

  const clearPracticePhrase = () => {
    ipaManualRef.current = false;
    setTargetText('');
    setTargetIpa('');
    setLatest(undefined);
    setPracticeNoSpeech(false);
    setPlaybackUrl((url) => {
      revokeObjectUrl(url);
      return null;
    });
    tipMutation.reset();
    practiceInputRef.current?.focus();
  };

  const handleListenModel = () => {
    const phrase = targetText.trim();
    if (!phrase) return;
    void ipc.media.playTts(phrase, language);
  };

  const practiceSession = computeSessionStats(practiceScores);
  const isPracticeRecording = practiceRecorder.status === 'recording';
  const isPracticeProcessing =
    practiceScoring || practiceRecorder.status === 'stopping' || busy;
  const practicePrimaryLabel = isPracticeRecording
    ? 'Stop'
    : isPracticeProcessing
      ? 'Scoring…'
      : 'Say / Record';
  const practicePrimaryAria = isPracticeRecording
    ? 'Stop recording'
    : isPracticeProcessing
      ? 'Scoring pronunciation'
      : 'Record attempt';

  const evalError =
    saveMutation.error ?? evaluateMutation.error
      ? mutationErrorMessage(saveMutation.error ?? evaluateMutation.error)
      : null;

  return (
    <div className="pronunciation-page animate-fade-in">
      <header className="pronunciation-header">
        <div>
          <h1 className="pronunciation-title">Pronunciation Coach</h1>
          <p className="text-secondary text-sm">
            Record, get phoneme feedback, shadow a model, and drill minimal pairs.
          </p>
        </div>
      </header>

      <div className="pronunciation-tabs" role="tablist" aria-label="Pronunciation modes">
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`pron-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`pron-panel-${item.id}`}
            className={`pronunciation-tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'practice' && (
        <section
          className="pronunciation-panel pronunciation-panel--drill"
          role="tabpanel"
          id="pron-panel-practice"
          aria-labelledby="pron-tab-practice"
        >
          <PronunciationDrill
            sceneTitle="Practice: Pronunciation"
            targetText={targetText}
            onTargetTextChange={(value) => {
              ipaManualRef.current = false;
              setTargetText(value);
            }}
            targetIpa={targetIpa}
            onTargetIpaChange={(value) => {
              ipaManualRef.current = value.trim().length > 0;
              setTargetIpa(value);
            }}
            showIpaField
            phraseInputId="pron-target"
            phraseInputLabel="Word or phrase"
            ipaInputId="pron-ipa"
            phraseInputRef={practiceInputRef}
            inputLocked={isPracticeRecording || practiceScoring}
            currentScore={latest?.overallScore ?? null}
            sessionAverage={practiceSession.average}
            sessionPassed={practiceSession.passed}
            sessionTotal={practiceSession.total}
            analyser={practiceRecorder.analyser}
            waveActive={isPracticeRecording}
            onPrimary={() => {
              void handlePracticePrimary();
            }}
            primaryLabel={practicePrimaryLabel}
            primaryAriaLabel={practicePrimaryAria}
            primaryDisabled={!canRecord && !isPracticeRecording}
            primaryLoading={isPracticeProcessing && !isPracticeRecording}
            onListen={handleListenModel}
            listenDisabled={!targetText.trim() || isPracticeRecording}
            showPostpone={false}
            onNextPhrase={clearPracticePhrase}
            spaceHint
            spaceHintText="Hold Spacebar to record"
            phaseMessage={
              isPracticeRecording
                ? 'Recording… keep holding Space, then release'
                : isPracticeProcessing
                  ? 'Scoring your pronunciation…'
                  : null
            }
            error={
              practiceRecorder.error ??
              (evalError ? evalError : null)
            }
          >
            {(latest || practiceNoSpeech) && (
              <section className="pronunciation-result pronunciation-result--inline" aria-live="polite">
                {practiceNoSpeech && (
                  <p className="text-secondary">
                    No speech detected. Please try recording again and speak clearly.
                  </p>
                )}
                {latest && (
                  <>
                    {latest.summary && <p className="text-secondary">{latest.summary}</p>}
                    {latest.recognizedText && (
                      <p className="text-sm">
                        Heard: <span className="pronunciation-heard">{latest.recognizedText}</span>
                      </p>
                    )}
                    {latest.stressFeedback && (
                      <p className="text-sm text-muted">{latest.stressFeedback}</p>
                    )}
                    <PhonemeFeedback phonemes={latest.phonemes} />
                    {worstPhoneme && worstPhoneme.status !== 'ok' && (
                      <div className="pronunciation-tip-block">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={tipMutation.isPending}
                          onClick={requestTip}
                          aria-label={`Get articulation tip for ${worstPhoneme.targetPhoneme}`}
                        >
                          Tip for /{worstPhoneme.targetPhoneme}/
                        </Button>
                        {tipMutation.data && (
                          <p className="text-sm">
                            {tipMutation.data.tip}
                            {tipMutation.data.tonguePosition
                              ? ` Tongue: ${tipMutation.data.tonguePosition}`
                              : ''}
                            {tipMutation.data.lipPosition ? ` Lips: ${tipMutation.data.lipPosition}` : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {playbackUrl && (
                  <audio
                    className="pronunciation-playback"
                    controls
                    src={playbackUrl}
                    aria-label="Your recording"
                  >
                    <track kind="captions" />
                  </audio>
                )}
              </section>
            )}
          </PronunciationDrill>
        </section>
      )}

      {tab === 'shadowing' && (
        <section
          className="pronunciation-panel pronunciation-panel--drill"
          role="tabpanel"
          id="pron-panel-shadowing"
          aria-labelledby="pron-tab-shadowing"
        >
          <ShadowingPanel language={language} />
        </section>
      )}

      {tab === 'pairs' && (
        <section
          className="pronunciation-panel pronunciation-panel--drill"
          role="tabpanel"
          id="pron-panel-pairs"
          aria-labelledby="pron-tab-pairs"
        >
          <MinimalPairsPanel language={language} />
        </section>
      )}

      {tab === 'history' && (
        <section
          className="pronunciation-panel"
          role="tabpanel"
          id="pron-panel-history"
          aria-labelledby="pron-tab-history"
        >
          {!history || history.length === 0 ? (
            <p className="text-muted">No attempts yet. Record a word to start a history.</p>
          ) : (
            <ul className="pronunciation-history">
              {history.map((attempt) => (
                <li key={attempt.id} className="pronunciation-history-row">
                  <span className="pronunciation-history-word">{attempt.targetText}</span>
                  <span className="text-muted text-xs">{formatWhen(attempt.createdAt)}</span>
                  <span className="pronunciation-history-score">{attempt.overallScore}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {problemPhonemes && problemPhonemes.length > 0 && tab !== 'pairs' && (
        <aside className="pronunciation-problems">
          <h2 className="pronunciation-subtitle">Problem sounds</h2>
          <ul className="phoneme-row">
            {problemPhonemes.map((pattern) => (
              <li key={pattern.id} className="phoneme-chip phoneme-chip--miss">
                <span className="phoneme-chip-ipa">/{pattern.phoneme}/</span>
                <span className="phoneme-chip-acc">×{pattern.occurrenceCount}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
