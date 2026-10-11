// ============================================================
// LEXORA — Shadowing drill panel
// Vocabulary queue (read-only). Say / Space → model → record → score.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { PhonemeFeedback } from '../../components/domain/PhonemeFeedback';
import { useLanguages, resolveLanguageId } from '../../hooks/useLanguages';
import { useShadowDrill } from '../../hooks/useShadowDrill';
import { useVocabulary } from '../../hooks/useVocabulary';
import { DEFAULT_VOCABULARY_FILTERS } from '../../lib/constants';
import { ipc } from '../../lib/ipc';
import { computeSessionStats } from '../../lib/sessionScore';
import { PRONUNCIATION_PASS_SCORE } from '../../lib/pronunciationScore';
import type { VocabularyEntryDto } from '../../lib/types';
import { PronunciationDrill } from './PronunciationDrill';

export type ShadowingPanelProps = {
  language: string;
};

const SHADOW_QUEUE_PAGE = 100;

function nextQueueIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current + 1) % length;
}

export function ShadowingPanel({ language }: ShadowingPanelProps) {
  const { data: languages } = useLanguages();
  const languageId = resolveLanguageId(languages, language);
  const { data: entries } = useVocabulary({
    ...DEFAULT_VOCABULARY_FILTERS,
    languageId,
    perPage: SHADOW_QUEUE_PAGE,
    sortBy: 'due_date',
    sortDir: 'asc',
  });

  const queue = useMemo(
    () => (entries ?? []).filter((entry) => entry.lexeme.text.trim().length > 0),
    [entries],
  );

  const [index, setIndex] = useState(0);
  const lastRecordedId = useRef<number | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  useEffect(() => {
    setIndex((current) => (queue.length === 0 || current < queue.length ? current : 0));
  }, [queue.length]);

  const current: VocabularyEntryDto | undefined = queue[index] ?? queue[0];
  const targetText = current?.lexeme.text ?? '';
  const targetIpa = current?.lexeme.phonetic ?? '';
  const lexemeId = current?.lexemeId ?? null;

  const advance = () => {
    setIndex((currentIndex) => nextQueueIndex(currentIndex, queue.length));
  };

  const drill = useShadowDrill({
    targetText,
    targetIpa: targetIpa.trim() || null,
    language,
    lexemeId,
    onAdvance: advance,
  });

  useEffect(() => {
    const latest = drill.latest;
    if (!latest || drill.phase !== 'feedback') return;
    if (lastRecordedId.current === latest.id) return;
    lastRecordedId.current = latest.id;
    setSessionScores((prev) => [...prev, latest.overallScore]);
  }, [drill.latest, drill.phase]);

  const session = computeSessionStats(sessionScores);
  const showPostpone = drill.phase === 'feedback' && !drill.passed;
  const sayLabel =
    drill.phase === 'playing'
      ? 'Listening…'
      : drill.phase === 'recording'
        ? 'Stop'
        : drill.phase === 'scoring'
          ? 'Scoring…'
          : 'Say / Record';
  const sayAria =
    drill.phase === 'recording'
      ? 'Stop recording'
      : drill.phase === 'playing'
        ? 'Listening to model…'
        : drill.phase === 'scoring'
          ? 'Scoring pronunciation'
          : 'Say phrase';
  const phaseMessage =
    drill.phase === 'recording'
      ? 'Speak now'
      : drill.phase === 'playing'
        ? 'Listening to model…'
        : drill.phase === 'scoring'
          ? 'Scoring your pronunciation…'
          : null;

  const handleListen = () => {
    const phrase = targetText.trim();
    if (!phrase) return;
    void ipc.media.playTts(phrase, language);
  };

  return (
    <PronunciationDrill
      sceneTitle="Shadowing Drill: Advanced Pronunciation"
      targetText={targetText}
      targetIpa={targetIpa}
      phraseEditable={false}
      emptyPhraseHint="Add words to Vocabulary to start shadowing."
      phraseInputId="pron-shadow-target"
      phraseInputLabel="Phrase to shadow"
      currentScore={drill.latest?.overallScore ?? null}
      sessionAverage={session.average}
      sessionPassed={session.passed}
      sessionTotal={session.total}
      analyser={drill.analyser}
      waveActive={drill.phase === 'recording'}
      onPrimary={() => {
        void drill.say();
      }}
      primaryLabel={sayLabel}
      primaryAriaLabel={sayAria}
      primaryDisabled={!drill.canSay && drill.phase !== 'recording'}
      primaryLoading={drill.phase === 'playing' || drill.phase === 'scoring'}
      onListen={handleListen}
      listenDisabled={!targetText.trim() || drill.phase === 'playing' || drill.phase === 'recording'}
      showPostpone={showPostpone}
      onPostpone={drill.postpone}
      onNextPhrase={drill.postpone}
      spaceHint={queue.length > 0}
      spaceHintText="Press Spacebar to Shadow"
      phaseMessage={phaseMessage}
      error={drill.error}
    >
      {(drill.latest || drill.noSpeech) && drill.phase !== 'playing' && (
        <section className="pronunciation-result pronunciation-result--inline" aria-live="polite">
          {drill.noSpeech && (
            <p className="text-secondary">
              No speech detected. Please speak clearly into the microphone and try again.
            </p>
          )}
          {drill.latest && (
            <>
              <p className="pronunciation-pass-line">
                {drill.passed
                  ? 'Passed'
                  : `Need ${PRONUNCIATION_PASS_SCORE}% to pass`}
              </p>
              {drill.attempt > 0 && (
                <div className="pronunciation-shadow-meta" aria-live="polite">
                  Attempt {drill.attempt}
                </div>
              )}
              {drill.latest.summary && <p className="text-secondary">{drill.latest.summary}</p>}
              {drill.latest.recognizedText && (
                <p className="text-sm">
                  Heard: <span className="pronunciation-heard">{drill.latest.recognizedText}</span>
                </p>
              )}
              {drill.latest.stressFeedback && (
                <p className="text-sm text-muted">{drill.latest.stressFeedback}</p>
              )}
              <PhonemeFeedback phonemes={drill.latest.phonemes} />
              {drill.tipPending && (
                <p className="text-muted text-sm">Getting a tip…</p>
              )}
              {drill.tip && (
                <p className="text-sm pronunciation-auto-tip">
                  {drill.tip.tip}
                  {drill.tip.tonguePosition ? ` Tongue: ${drill.tip.tonguePosition}` : ''}
                  {drill.tip.lipPosition ? ` Lips: ${drill.tip.lipPosition}` : ''}
                </p>
              )}
            </>
          )}
          {drill.playbackUrl && (
            <details className="pronunciation-playback-wrap">
              <summary>Your recording</summary>
              <audio
                className="pronunciation-playback"
                controls
                src={drill.playbackUrl}
                aria-label="Your recording"
              >
                <track kind="captions" />
              </audio>
            </details>
          )}
        </section>
      )}
    </PronunciationDrill>
  );
}
