import { getLocale } from '../../i18n';
import { useI18n } from "../../hooks/useI18n";
import { t as tUi } from "../../i18n";
// ============================================================
// LEXORA — Speak (pronunciation) page
// Practice, Shadowing, Minimal Pairs, History.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
import { isEmptySpeechAttempt, scoreTone } from '../../lib/pronunciationScore';
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
    tUi("Could not score pronunciation. Check the AI provider in Settings."),
  );
}

function formatWhen(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(getLocale());
}

export default function PronunciationPage() {
  const { t: tUi } = useI18n();
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
  const [phraseAttempts, setPhraseAttempts] = useState(0);
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
      setPhraseAttempts(0);
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
          setPhraseAttempts((count) => count + 1);
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
    setPhraseAttempts(0);
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
    ? tUi("Stop")
    : isPracticeProcessing
      ? tUi("Scoring…")
      : tUi("Hold to record");
  const practicePrimaryAria = isPracticeRecording
    ? 'Stop recording'
    : isPracticeProcessing
      ? 'Scoring pronunciation'
      : 'Hold to record';

  const evalError =
    saveMutation.error ?? evaluateMutation.error
      ? mutationErrorMessage(saveMutation.error ?? evaluateMutation.error)
      : null;

  const problemSounds =
    problemPhonemes && problemPhonemes.length > 0 ? (
      <section className="pronunciation-problems" aria-labelledby="pron-problems-title">
        <h2 id="pron-problems-title" className="pronunciation-aside-label">{tUi("Problem sounds")}</h2>
        <ul className="pronunciation-problems-list">
          {problemPhonemes.map((pattern) => (
            <li key={pattern.id} className="tag pronunciation-problem" data-status="miss">
              <span className="pronunciation-problem-ipa">/{pattern.phoneme}/</span>
              <span className="pronunciation-problem-count">×{pattern.occurrenceCount}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="pronunciation-page page animate-fade-in">
      <header className="page-header" data-tauri-drag-region>
        <div className="page-header__text">
          <h1 className="page-title">{tUi("Speak")}</h1>
          <p className="page-subtitle">{tUi("Record, get phoneme feedback, shadow a model, and drill minimal pairs.")}</p>
        </div>
        <div className="page-actions">
          <div className="seg pronunciation-tabs" role="tablist" aria-label={tUi("Pronunciation modes")}>
            {TAB_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`pron-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`pron-panel-${item.id}`}
                className={`seg__item pronunciation-tab${tab === item.id ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {tUi(item.label)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="pronunciation-body">
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
                setPhraseAttempts(0);
              }}
              targetIpa={targetIpa}
              onTargetIpaChange={(value) => {
                ipaManualRef.current = value.trim().length > 0;
                setTargetIpa(value);
              }}
              showIpaField
              phraseInputId="pron-target"
              phraseInputLabel={tUi("Word or phrase")}
              ipaInputId="pron-ipa"
              phraseInputRef={practiceInputRef}
              inputLocked={isPracticeRecording || practiceScoring}
              currentScore={latest?.overallScore ?? null}
              sessionAverage={practiceSession.average}
              attempt={phraseAttempts}
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
              spaceHintLead={tUi("Hold")}
              spaceHintText={tUi("to record")}
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
              asideExtra={problemSounds}
              feedback={
                latest || (practiceNoSpeech && playbackUrl) ? (
                  <section className="pronunciation-result" aria-live="polite">
                    {latest && (
                      <>
                        {latest.summary && <p className="pronunciation-note">{latest.summary}</p>}
                        {latest.recognizedText && (
                          <p className="pronunciation-note">{tUi("Heard: ")}<span className="pronunciation-heard">{latest.recognizedText}</span>
                          </p>
                        )}
                        {latest.stressFeedback && (
                          <p className="pronunciation-note pronunciation-note--muted">{latest.stressFeedback}</p>
                        )}
                        {worstPhoneme && worstPhoneme.status !== 'ok' && (
                          <div className="pronunciation-tip-block">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              isLoading={tipMutation.isPending}
                              onClick={requestTip}
                              aria-label={tUi("Get articulation tip for {value1}", { value1: worstPhoneme.targetPhoneme })}
                            >
                              <Icon name="hearing" size={17} />
                              {tUi("Tip for /")}{worstPhoneme.targetPhoneme}/
                            </Button>
                            {tipMutation.data && (
                              <p className="pronunciation-note">
                                {tipMutation.data.tip}
                                {tipMutation.data.tonguePosition
                                  ? tUi(" Tongue: {value1}", { value1: tipMutation.data.tonguePosition })
                                  : ''}
                                {tipMutation.data.lipPosition ? tUi(" Lips: {value1}", { value1: tipMutation.data.lipPosition }) : ''}
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
                        aria-label={tUi("Your recording")}
                      >
                        <track kind="captions" />
                      </audio>
                    )}
                  </section>
                ) : null
              }
            >
              {(latest || practiceNoSpeech) && (
                <div className="pronunciation-stage-result" aria-live="polite">
                  {practiceNoSpeech && (
                    <p className="pronunciation-note">{tUi("No speech detected. Please try recording again and speak clearly.")}</p>
                  )}
                  {latest && <PhonemeFeedback phonemes={latest.phonemes} />}
                </div>
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
            <ShadowingPanel language={language} asideExtra={problemSounds} />
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
            className="pronunciation-panel pronunciation-panel--history"
            role="tabpanel"
            id="pron-panel-history"
            aria-labelledby="pron-tab-history"
          >
            {!history || history.length === 0 ? (
              <div className="empty">
                <Icon name="graphic_eq" size={28} />
                <p>{tUi("No attempts yet. Record a word to start a history.")}</p>
              </div>
            ) : (
              <ul className="pronunciation-history">
                {history.map((attempt) => (
                  <li key={attempt.id} className="pronunciation-history-row">
                    <span className="pronunciation-history-word">{attempt.targetText}</span>
                    <span className="pronunciation-history-when">{formatWhen(attempt.createdAt)}</span>
                    <span
                      className="pronunciation-history-score"
                      data-tone={scoreTone(attempt.overallScore)}
                    >
                      {attempt.overallScore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {problemSounds}
          </section>
        )}
      </div>
    </div>
  );
}
