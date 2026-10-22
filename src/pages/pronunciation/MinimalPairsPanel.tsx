import { useI18n } from "../../hooks/useI18n";
import { t as tUi } from "../../i18n";
// ============================================================
// LEXORA — Minimal Pairs studio panel
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PhonemeFeedback } from '../../components/domain/PhonemeFeedback';
import { Icon } from '../../components/ui/Icon';
import {
  useArticulationTip,
  useEvaluatePronunciation,
  useMinimalPairs,
  useSaveAudioRecording,
} from '../../hooks/usePronunciation';
import { usePairsSpaceHold } from '../../hooks/usePairsSpaceHold';
import { useMicrophoneRecorder } from '../../hooks/useMicrophoneRecorder';
import { useWordImage } from '../../hooks/useWordImage';
import { evaluatePronunciationClip } from '../../lib/evaluatePronunciationClip';
import { formatIpcError } from '../../lib/utils';
import { ipc } from '../../lib/ipc';
import { revokeObjectUrl } from '../../lib/audioRecorder';
import type { MinimalPairDto, PronunciationAttemptDto } from '../../lib/types';
import { MatchRing } from './MatchRing';
import { PairsWaveform } from './PairsWaveform';
import { SessionWaveCompare } from './SessionWaveCompare';
import { seededWaveHeights } from '../../lib/seededWaveHeights';

type MinimalPairsPanelProps = {
  language: string;
};

type ContrastKey = string;

function contrastKey(pair: MinimalPairDto): ContrastKey {
  return `${pair.contrastPhonemeA}|${pair.contrastPhonemeB}`;
}

function contrastLabel(pair: MinimalPairDto): string {
  return `/${pair.contrastPhonemeA}/ vs /${pair.contrastPhonemeB}/`;
}

function contrastTypeLabel(type: string): string {
  if (type === 'vowel') return tUi("Vowels");
  if (type === 'consonant') return tUi("Consonants");
  return type;
}

function mutationErrorMessage(error: unknown): string {
  return formatIpcError(
    error,
    tUi("Could not score this pair. Check the AI provider in Settings."),
  );
}

type PairWordCardProps = {
  phoneme: string;
  word: string;
  ipa: string;
  isTarget: boolean;
  language: string;
  onSelect: () => void;
  onListen: () => void;
};

function PairWordCard({
  phoneme,
  word,
  ipa,
  isTarget,
  language,
  onSelect,
  onListen,
}: PairWordCardProps) {
  const { t: tUi } = useI18n();
  const { data: imageUrl, isLoading } = useWordImage(word, language);
  const initial = word.trim().charAt(0).toUpperCase() || phoneme;

  return (
    <div className={`pairs-card card${isTarget ? ' is-target is-selected' : ''}`}>
      <div className="pairs-card-header">
        <button
          type="button"
          className="pairs-card-select"
          aria-pressed={isTarget}
          aria-label={isTarget ? tUi("{word}, /{phoneme}/, target", { word, phoneme }) : `${word}, /${phoneme}/`}
          onClick={onSelect}
        >
          <span className="pairs-card-phoneme">/{phoneme}/</span>
          <span className="pairs-card-word">{word}</span>
          <span className="pairs-card-ipa">{ipa}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="pairs-listen-btn"
          aria-label={tUi("Listen to {word}", { word: word })}
          onClick={onListen}
        >
          <Icon name="volume_up" size={17} />
          {tUi("Listen")}
        </Button>
      </div>
      <button
        type="button"
        className="pairs-card-media-btn"
        aria-label={tUi("Select {word} as target", { word: word })}
        aria-pressed={isTarget}
        onClick={onSelect}
      >
        <div className="pairs-card-media">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="pairs-card-image" />
          ) : (
            <div
              className={`pairs-card-placeholder${isLoading ? ' is-loading' : ''}`}
              aria-hidden="true"
            >
              <span className="pairs-card-placeholder-glyph">/{phoneme}/</span>
              <span className="pairs-card-placeholder-letter">{initial}</span>
            </div>
          )}
          {isTarget && (
            <span className="pairs-target-badge tag tag--accent">
              <Icon name="check_circle" size={14} />
              <span>{tUi("Target")}</span>
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

export function MinimalPairsPanel({ language }: MinimalPairsPanelProps) {
  const { t: tUi } = useI18n();
  const [contrastFilter, setContrastFilter] = useState<ContrastKey | 'all'>('all');
  const [pairIndex, setPairIndex] = useState(0);
  const [pairTarget, setPairTarget] = useState<'a' | 'b'>('a');
  const [latest, setLatest] = useState<PronunciationAttemptDto | undefined>(undefined);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [userWave, setUserWave] = useState<number[] | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const saveMutation = useSaveAudioRecording();
  const evaluateMutation = useEvaluatePronunciation();
  const tipMutation = useArticulationTip();

  const { data: pairs } = useMinimalPairs(language, null, 200);

  const contrastOptions = useMemo(() => {
    if (!pairs || pairs.length === 0) return [];
    const seen = new Map<ContrastKey, MinimalPairDto>();
    for (const pair of pairs) {
      const key = contrastKey(pair);
      if (!seen.has(key)) seen.set(key, pair);
    }
    return Array.from(seen.entries()).map(([value, pair]) => ({
      value,
      label: contrastLabel(pair),
    }));
  }, [pairs]);

  const filteredPairs = useMemo(() => {
    if (!pairs) return [];
    if (contrastFilter === 'all') return pairs;
    return pairs.filter((p) => contrastKey(p) === contrastFilter);
  }, [pairs, contrastFilter]);

  const currentPair: MinimalPairDto | undefined = filteredPairs[pairIndex];

  useEffect(() => {
    if (filteredPairs.length === 0) {
      setPairIndex(0);
      return;
    }
    if (pairIndex >= filteredPairs.length) {
      setPairIndex(0);
    }
  }, [filteredPairs, pairIndex]);

  useEffect(() => {
    if (contrastOptions.length === 0) return;
    if (contrastFilter !== 'all' && !contrastOptions.some((o) => o.value === contrastFilter)) {
      setContrastFilter('all');
    }
  }, [contrastOptions, contrastFilter]);

  useEffect(() => () => revokeObjectUrl(playbackUrl), [playbackUrl]);

  const targetWord = currentPair
    ? pairTarget === 'a'
      ? currentPair.wordA
      : currentPair.wordB
    : '';
  const targetIpa = currentPair
    ? pairTarget === 'a'
      ? currentPair.ipaA
      : currentPair.ipaB
    : '';
  const targetPhoneme = currentPair
    ? pairTarget === 'a'
      ? currentPair.contrastPhonemeA
      : currentPair.contrastPhonemeB
    : '';

  const busy = saveMutation.isPending || evaluateMutation.isPending;

  const handleClip = async (clip: {
    blob: Blob;
    mimeType: string;
    objectUrl: string;
    heardSpeech: boolean;
  }) => {
    if (!currentPair || !targetWord) return;
    revokeObjectUrl(playbackUrl);
    setPlaybackUrl(clip.objectUrl);
    try {
      const result = await evaluatePronunciationClip(clip, targetWord, language, {
        targetIpa: targetIpa || null,
        lexemeId: null,
        saveRecording: (input) => saveMutation.mutateAsync(input),
        evaluate: (input) => evaluateMutation.mutateAsync(input),
      });
      setLatest(result);
      setSessionScores((prev) => [...prev, result.overallScore]);
      setUserWave(seededWaveHeights(`user-attempt|${result.overallScore}|${targetWord}`));
    } catch {
      // surfaced via mutation error
    }
  };

  const recorder = useMicrophoneRecorder({
    onAutoStop: (clip) => {
      void handleClip(clip);
    },
  });

  const isRecording = recorder.status === 'recording';
  const isBusy = recorder.status === 'stopping' || busy;

  const startRecording = async () => {
    if (isBusy || isRecording || !currentPair) return;
    await recorder.start();
  };

  const stopRecording = async () => {
    if (recorder.status !== 'recording') return;
    try {
      const clip = await recorder.stop({ forceHeard: true });
      await handleClip(clip);
    } catch {
      // error via hook
    }
  };

  usePairsSpaceHold({
    enabled: Boolean(currentPair) && !busy,
    onStart: startRecording,
    onStop: stopRecording,
  });

  const playPairWord = (side: 'a' | 'b') => {
    if (!currentPair) return;
    const text = side === 'a' ? currentPair.wordA : currentPair.wordB;
    void ipc.media.playTts(text, language);
  };

  const goNextPair = () => {
    if (filteredPairs.length === 0) return;
    setPairIndex((i) => (i + 1) % filteredPairs.length);
    setPairTarget(Math.random() < 0.5 ? 'a' : 'b');
    setLatest(undefined);
    setUserWave(null);
  };

  const sessionAvg =
    sessionScores.length === 0
      ? 0
      : Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);

  const matchScore = latest?.overallScore ?? 0;
  const recognized = latest?.recognizedText?.trim();
  const worstPhoneme = latest?.phonemes.find((p) => p.status !== 'ok') ?? latest?.phonemes[0];

  const selectOptions = [
    { value: 'all', label: tUi("All contrasts") },
    ...contrastOptions,
  ];

  const selectValue =
    contrastFilter === 'all'
      ? 'all'
      : contrastOptions.some((o) => o.value === contrastFilter)
        ? contrastFilter
        : 'all';

  const evalError =
    saveMutation.error ?? evaluateMutation.error
      ? mutationErrorMessage(saveMutation.error ?? evaluateMutation.error)
      : null;

  return (
    <div className="pairs-studio">
      <header className="pairs-studio-header">
        <div>
          <h2 className="pairs-studio-title">{tUi("Pronunciation: Minimal Pairs")}</h2>
          {currentPair ? (
            <p className="pairs-studio-subtitle">{tUi("Phoneme Contrast: ")}{contrastLabel(currentPair)} (
              {contrastTypeLabel(currentPair.contrastType)})
            </p>
          ) : (
            <p className="pairs-studio-subtitle">{tUi("Load phoneme contrasts to begin.")}</p>
          )}
        </div>
        <div className="pairs-studio-toolbar">
          <Select
            ariaLabel={tUi("Phoneme contrast")}
            value={selectValue}
            onChange={(value) => {
              setContrastFilter(value === 'all' ? 'all' : value);
              setPairIndex(0);
              setLatest(undefined);
              setUserWave(null);
            }}
            options={selectOptions}
          />
          <Button type="button" variant="secondary" size="md" onClick={goNextPair}>
            <Icon name="arrow_forward" size={17} />
            {tUi("Next pair")}
          </Button>
        </div>
      </header>

      {evalError && (
        <p className="pronunciation-error inline-error" role="alert">
          {evalError}
        </p>
      )}

      {!currentPair && (
        <div className="empty">
          <Icon name="hearing" size={28} />
          <p>{tUi("No minimal pairs loaded yet.")}</p>
        </div>
      )}

      {currentPair && (
        <div className="pairs-studio-grid">
          <div className="pairs-studio-main">
            <div className="pairs-card-grid">
              <PairWordCard
                phoneme={currentPair.contrastPhonemeA}
                word={currentPair.wordA}
                ipa={currentPair.ipaA}
                isTarget={pairTarget === 'a'}
                language={language}
                onSelect={() => {
                  setPairTarget('a');
                  setLatest(undefined);
                  setUserWave(null);
                }}
                onListen={() => playPairWord('a')}
              />
              <PairWordCard
                phoneme={currentPair.contrastPhonemeB}
                word={currentPair.wordB}
                ipa={currentPair.ipaB}
                isTarget={pairTarget === 'b'}
                language={language}
                onSelect={() => {
                  setPairTarget('b');
                  setLatest(undefined);
                  setUserWave(null);
                }}
                onListen={() => playPairWord('b')}
              />
            </div>

            <PairsWaveform isRecording={isRecording} analyser={recorder.analyser} />

            <div className="pairs-action-bar">
              <div className="pairs-record-wrap">
                <button
                  type="button"
                  className={`pairs-record-btn${isRecording ? ' is-recording' : ''}`}
                  data-state={isRecording ? 'recording' : busy ? 'loading' : 'idle'}
                  disabled={isBusy && !isRecording}
                  aria-label={isRecording ? tUi("Stop recording") : tUi("Say / Record")}
                  onClick={() => {
                    if (isRecording) {
                      void stopRecording();
                    } else {
                      void startRecording();
                    }
                  }}
                >
                  <Icon name={isRecording ? 'stop' : 'mic'} size={17} />
                  <span>{isRecording ? tUi("Stop") : busy ? tUi("Scoring…") : tUi("Say / Record")}</span>
                </button>
                {isRecording && (
                  <span className="record-control-live pairs-live" aria-live="polite">
                    <span className="pairs-live-dot" aria-hidden="true" />
                    {tUi("Recording…")}
                  </span>
                )}
              </div>
              <p className="pairs-space-pill hint" aria-live="polite">
                <kbd className="pairs-space-kbd kbd">{tUi("Space")}</kbd>
                {tUi("Press or hold to say ")}<strong>{targetWord}</strong>
              </p>
            </div>
            {recorder.error && (
              <p className="record-control-error inline-error" role="alert">
                {recorder.error}
              </p>
            )}
          </div>

          <aside className="pairs-studio-sidebar">
            <section className="pairs-side-card pairs-side-card--match">
              <h3 className="pairs-side-heading">{tUi("Current Match")}</h3>
              <MatchRing score={matchScore} />
              <p className="pairs-side-match-text" aria-live="polite">
                {latest ? (
                  <>
                    {recognized ? tUi("{recognized} recognized", { recognized: recognized }) : tUi("{targetWord} scored", { targetWord: targetWord })}
                    <br />
                    <span className="pairs-side-match-detail">
                      {matchScore}{tUi("% match, /")}{targetPhoneme}/
                    </span>
                  </>
                ) : (
                  <span className="pairs-side-match-empty">{tUi("Say the target word")}</span>
                )}
              </p>
              {latest && latest.phonemes.length > 0 && (
                <PhonemeFeedback phonemes={latest.phonemes} />
              )}
              {worstPhoneme && worstPhoneme.status !== 'ok' && (
                <div className="pairs-tip-block">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={tipMutation.isPending}
                    onClick={() =>
                      tipMutation.mutate({ phoneme: worstPhoneme.targetPhoneme, language })
                    }
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
                      {tipMutation.data.lipPosition
                        ? tUi(" Lips: {value1}", { value1: tipMutation.data.lipPosition })
                        : ''}
                    </p>
                  )}
                </div>
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

            <section className="pairs-side-card">
              <h3 className="pairs-side-heading">{tUi("Total Session Score:")}{' '}
                <span className="pairs-session-pct">{sessionAvg}%</span>
              </h3>
              <SessionWaveCompare
                nativeLabel={targetWord}
                phoneme={targetPhoneme}
                userHeights={userWave}
                hasAttempt={Boolean(latest)}
              />
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
