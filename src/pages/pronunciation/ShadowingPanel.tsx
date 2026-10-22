import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Shadowing drill panel
// Vocabulary queue (read-only). Say / Space → model → record → score.
// ============================================================

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PhonemeFeedback } from '../../components/domain/PhonemeFeedback';
import { useLanguages, resolveLanguageId } from '../../hooks/useLanguages';
import { useShadowDrill } from '../../hooks/useShadowDrill';
import { useVocabulary } from '../../hooks/useVocabulary';
import { DEFAULT_VOCABULARY_FILTERS } from '../../lib/constants';
import { ipc } from '../../lib/ipc';
import { computeSessionStats } from '../../lib/sessionScore';
import { PRONUNCIATION_PASS_SCORE } from '../../lib/pronunciationScore';
import type { VocabularyEntryDto } from '../../lib/types';
import { Icon } from '../../components/ui/Icon';
import { PronunciationDrill } from './PronunciationDrill';

export type ShadowingPanelProps = {
  language: string;
  /** Extra side-column section rendered by the page (problem sounds). */
  asideExtra?: ReactNode;
};

const SHADOW_QUEUE_PAGE = 100;

function nextQueueIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current + 1) % length;
}

export function ShadowingPanel({ language, asideExtra }: ShadowingPanelProps) {
  const { t: tUi } = useI18n();
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
      ? tUi("Listening…")
      : drill.phase === 'recording'
        ? tUi("Stop")
        : drill.phase === 'scoring'
          ? tUi("Scoring…")
          : tUi("Say / Record");
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
      ? tUi("Speak now")
      : drill.phase === 'playing'
        ? tUi("Listening to model…")
        : drill.phase === 'scoring'
          ? tUi("Scoring your pronunciation…")
          : null;

  const showResult = Boolean(drill.latest || drill.noSpeech) && drill.phase !== 'playing';

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
      phraseInputLabel={tUi("Phrase to shadow")}
      currentScore={drill.latest?.overallScore ?? null}
      sessionAverage={session.average}
      attempt={drill.attempt}
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
      spaceHintText={tUi("Press Spacebar to Shadow")}
      phaseMessage={phaseMessage}
      error={drill.error}
      asideExtra={asideExtra}
      feedback={
        showResult && (drill.latest || drill.playbackUrl) ? (
          <section className="pronunciation-result" aria-live="polite">
            {drill.latest && (
              <>
                <p className={`pronunciation-pass-line${drill.passed ? ' is-passed' : ''}`}>
                  {drill.passed
                    ? tUi("Passed")
                    : tUi("Need {PRONUNCIATION_PASS_SCORE}% to pass", { PRONUNCIATION_PASS_SCORE: PRONUNCIATION_PASS_SCORE })}
                </p>
                {drill.latest.summary && <p className="pronunciation-note">{drill.latest.summary}</p>}
                {drill.latest.recognizedText && (
                  <p className="pronunciation-note">{tUi("Heard: ")}<span className="pronunciation-heard">{drill.latest.recognizedText}</span>
                  </p>
                )}
                {drill.latest.stressFeedback && (
                  <p className="pronunciation-note pronunciation-note--muted">{drill.latest.stressFeedback}</p>
                )}
                {drill.tipPending && (
                  <p className="pronunciation-note pronunciation-note--muted">{tUi("Getting a tip…")}</p>
                )}
                {drill.tip && (
                  <p className="pronunciation-note pronunciation-auto-tip">
                    {drill.tip.tip}
                    {drill.tip.tonguePosition ? tUi(" Tongue: {value1}", { value1: drill.tip.tonguePosition }) : ''}
                    {drill.tip.lipPosition ? tUi(" Lips: {value1}", { value1: drill.tip.lipPosition }) : ''}
                  </p>
                )}
              </>
            )}
            {drill.playbackUrl && (
              <details className="pronunciation-playback-wrap">
                <summary>
                  <Icon name="play_circle" size={17} />
                  {tUi("Your recording")}
                </summary>
                <audio
                  className="pronunciation-playback"
                  controls
                  src={drill.playbackUrl}
                  aria-label={tUi("Your recording")}
                >
                  <track kind="captions" />
                </audio>
              </details>
            )}
          </section>
        ) : null
      }
    >
      {showResult && (
        <div className="pronunciation-stage-result" aria-live="polite">
          {drill.noSpeech && (
            <p className="pronunciation-note">{tUi("No speech detected. Please speak clearly into the microphone and try again.")}</p>
          )}
          {drill.latest && <PhonemeFeedback phonemes={drill.latest.phonemes} />}
        </div>
      )}
    </PronunciationDrill>
  );
}
