import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Shared Practice / Shadowing drill scene
// Stage (hero word, IPA, model / you waveforms, phoneme chips,
// record) on the left, score + written feedback in a side column.
// ============================================================

import { type KeyboardEvent, type ReactNode, type Ref, useEffect, useMemo, useRef, useState } from 'react';
import { DRILL_WAVE_BAR_COUNT, DrillWaveform } from '../../components/domain/DrillWaveform';
import { ScoreGauge } from '../../components/domain/PhonemeFeedback';
import { Icon } from '../../components/ui/Icon';
import { PRONUNCIATION_PASS_SCORE } from '../../lib/pronunciationScore';
import { seededWaveHeights } from '../../lib/seededWaveHeights';

/** Hero word steps down at these lengths so long phrases never overflow. */
const HERO_LONG_CHARS = 14;
const HERO_PHRASE_CHARS = 24;

type HeroSize = 'hero' | 'long' | 'phrase' | 'placeholder';

function heroSize(text: string): HeroSize {
  const length = text.trim().length;
  if (length === 0) return 'placeholder';
  if (length >= HERO_PHRASE_CHARS) return 'phrase';
  if (length >= HERO_LONG_CHARS) return 'long';
  return 'hero';
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function suppressSpaceKey(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
  }
}

export type PronunciationDrillProps = {
  sceneTitle: string;
  targetText: string;
  onTargetTextChange?: (value: string) => void;
  targetIpa: string;
  onTargetIpaChange?: (value: string) => void;
  showIpaField?: boolean;
  phraseEditable?: boolean;
  emptyPhraseHint?: string;
  phraseInputId: string;
  phraseInputLabel: string;
  ipaInputId?: string;
  phraseInputRef?: Ref<HTMLInputElement>;
  inputLocked?: boolean;
  currentScore: number | null;
  sessionAverage: number | null;
  /** Scored attempts on the current phrase (0 = none yet). */
  attempt?: number;
  analyser: AnalyserNode | null;
  waveActive: boolean;
  onPrimary: () => void;
  primaryLabel: string;
  primaryAriaLabel: string;
  primaryDisabled: boolean;
  primaryLoading?: boolean;
  onListen: () => void;
  listenDisabled: boolean;
  showPostpone: boolean;
  onPostpone?: () => void;
  onNextPhrase: () => void;
  spaceHint?: boolean;
  /** Words before the Space key in the hint ("Hold"). */
  spaceHintLead?: string;
  /** Words after the Space key in the hint ("to record"). */
  spaceHintText?: string;
  phaseMessage?: string | null;
  error?: string | null;
  /** Result shown on the stage under the waveform (phoneme chips). */
  children?: ReactNode;
  /** Written feedback in the side column (summary, tip, playback). */
  feedback?: ReactNode;
  /** Extra side-column section (e.g. problem sounds). */
  asideExtra?: ReactNode;
};

export function PronunciationDrill({
  sceneTitle,
  targetText,
  onTargetTextChange,
  targetIpa,
  onTargetIpaChange,
  showIpaField = false,
  phraseEditable = true,
  emptyPhraseHint = 'Type a word or phrase…',
  phraseInputId,
  phraseInputLabel,
  ipaInputId = 'pron-ipa',
  phraseInputRef,
  inputLocked = false,
  currentScore,
  sessionAverage,
  attempt = 0,
  analyser,
  waveActive,
  onPrimary,
  primaryLabel,
  primaryAriaLabel,
  primaryDisabled,
  primaryLoading = false,
  onListen,
  listenDisabled,
  showPostpone,
  onPostpone,
  onNextPhrase,
  spaceHint = false,
  spaceHintLead,
  spaceHintText = 'Press Spacebar to Shadow',
  phaseMessage = null,
  error = null,
  children,
  feedback,
  asideExtra,
}: PronunciationDrillProps) {
  const { t: tUi } = useI18n();
  const phrase = targetText.trim();
  const size = heroSize(targetText);

  // No model envelope exists: after "Listen" the model row shows a
  // deterministic decorative envelope seeded by the phrase.
  const [modelPlayedFor, setModelPlayedFor] = useState<string | null>(null);
  const modelHeights = useMemo(
    () =>
      phrase && modelPlayedFor === phrase
        ? seededWaveHeights(`model|${phrase}`, DRILL_WAVE_BAR_COUNT)
        : null,
    [modelPlayedFor, phrase],
  );

  const handleListen = () => {
    if (phrase) setModelPlayedFor(phrase);
    onListen();
  };

  // → advances to the next phrase unless the learner is typing.
  const onNextPhraseRef = useRef(onNextPhrase);
  onNextPhraseRef.current = onNextPhrase;
  useEffect(() => {
    if (waveActive) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'ArrowRight' || event.repeat || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isTextField(event.target)) return;
      event.preventDefault();
      onNextPhraseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [waveActive]);

  const verdict =
    currentScore === null
      ? undefined
      : currentScore >= PRONUNCIATION_PASS_SCORE
        ? tUi("Good attempt")
        : tUi("Keep practising");

  const scoreCaption = (
    <>
      <span className="drill-score-pass">
        {attempt > 0
          ? tUi("Pass at {value1} · attempt {value2}", {
              value1: PRONUNCIATION_PASS_SCORE,
              value2: attempt,
            })
          : `${tUi("Pass at ")}${PRONUNCIATION_PASS_SCORE}`}
      </span>
      {sessionAverage !== null && (
        <span className="drill-score-session">
          {tUi("Session")} {sessionAverage}
        </span>
      )}
    </>
  );

  const primaryIcon = waveActive ? 'stop' : 'mic';

  return (
    <div className="pronunciation-drill" data-state={waveActive ? 'recording' : 'idle'}>
      <div className="pronunciation-drill-main">
        <section className="drill-scene" aria-label={sceneTitle}>
          <div className="drill-scene-head">
            <h2 className="drill-scene-title">{sceneTitle}</h2>
            {waveActive && (
              <span className="drill-live" data-state="recording">
                <span className="drill-live-dot" aria-hidden="true" />
                {tUi("Recording…")}
              </span>
            )}
          </div>

          <div className="drill-hero">
            {phraseEditable ? (
              <label className="drill-phrase-field" htmlFor={phraseInputId}>
                <span className="sr-only">{phraseInputLabel}</span>
                <input dir="auto"
                  ref={phraseInputRef}
                  id={phraseInputId}
                  className="drill-phrase-input"
                  data-size={size}
                  value={targetText}
                  onChange={(e) => onTargetTextChange?.(e.target.value)}
                  placeholder={tUi(emptyPhraseHint)}
                  autoComplete="off"
                  disabled={inputLocked}
                  aria-label={tUi(phraseInputLabel)}
                />
              </label>
            ) : (
              <p
                id={phraseInputId}
                className={`drill-phrase-input drill-phrase-input--static${!targetText.trim() ? ' is-placeholder' : ''}`}
                data-size={size}
                aria-label={tUi(phraseInputLabel)}
              >
                {targetText.trim() || tUi(emptyPhraseHint)}
              </p>
            )}

            {showIpaField ? (
              <label className="drill-ipa-field" htmlFor={ipaInputId}>
                <span className="sr-only">{tUi("Target IPA (optional)")}</span>
                <input dir="auto"
                  id={ipaInputId}
                  className="drill-ipa-input"
                  value={targetIpa}
                  onChange={(e) => onTargetIpaChange?.(e.target.value)}
                  placeholder={tUi("/optional IPA/")}
                  autoComplete="off"
                  disabled={inputLocked}
                  aria-label={tUi("Target IPA (optional)")}
                />
              </label>
            ) : (
              targetIpa.trim() && (
                <p className="drill-ipa-display" aria-label={tUi("Target IPA")}>
                  {targetIpa}
                </p>
              )
            )}

            {!showIpaField && !targetIpa.trim() && targetText.trim() ? (
              <p className="drill-ipa-display drill-ipa-display--empty" aria-hidden="true">
                {' '}
              </p>
            ) : null}
          </div>

          <div className="drill-waves">
            {modelHeights && (
              <div className="drill-wave-line" data-tone="model">
                <span className="drill-wave-label">{tUi("Model")}</span>
                <DrillWaveform isActive={false} heights={modelHeights} tone="model" />
              </div>
            )}
            <div className="drill-wave-line" data-tone="user">
              <span className="drill-wave-label">{tUi("You")}</span>
              <DrillWaveform isActive={waveActive} analyser={analyser} tone="user" />
            </div>
          </div>

          {children}

          {phaseMessage && (
            <p className="drill-phase" aria-live="polite">
              {phaseMessage}
            </p>
          )}

          <div className="drill-actions" role="group" aria-label={tUi("Listen, voice, and record")}>
            <button
              type="button"
              className="drill-action-btn"
              onClick={handleListen}
              onKeyDown={suppressSpaceKey}
              disabled={listenDisabled}
              aria-label={tUi("Listen")}
            >
              <Icon name="volume_up" size={17} />
              {tUi("Listen")}
            </button>
            <button
              type="button"
              className={`drill-action-btn drill-action-btn--voice${waveActive ? ' is-active' : ''}`}
              onClick={onPrimary}
              onKeyDown={suppressSpaceKey}
              disabled={primaryDisabled && !waveActive}
              aria-pressed={waveActive}
              aria-label={waveActive ? tUi("Stop") : tUi("Voice")}
            >
              <Icon name={waveActive ? 'stop' : 'record_voice_over'} size={17} />
              {waveActive ? tUi("Stop") : tUi("Voice")}
            </button>
            <button
              type="button"
              className={`drill-cta${primaryLoading ? ' is-loading' : ''}${waveActive ? ' is-recording' : ''}`}
              data-state={waveActive ? 'recording' : primaryLoading ? 'loading' : 'idle'}
              onClick={onPrimary}
              onKeyDown={suppressSpaceKey}
              disabled={primaryDisabled && !waveActive}
              aria-label={tUi(primaryAriaLabel)}
              aria-busy={primaryLoading}
            >
              {primaryLoading ? (
                <span className="drill-cta-spinner animate-spin" aria-hidden="true" />
              ) : (
                <Icon name={primaryIcon} size={17} />
              )}
              <span className="drill-cta-label">{tUi(primaryLabel)}</span>
            </button>
          </div>

          {spaceHint && (
            <p className="drill-space-hint hint">
              {spaceHintLead ? <span>{tUi(spaceHintLead)}</span> : null}{' '}
              <kbd className="kbd">{tUi("Space")}</kbd>{' '}
              <span>{tUi(spaceHintText)}</span>{' '}
              <span aria-hidden="true">·</span>{' '}
              <kbd className="kbd">→</kbd>{' '}
              <span>{tUi("next phrase")}</span>
            </p>
          )}
        </section>

        {error && (
          <p className="pronunciation-error inline-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <aside className="pronunciation-drill-scores" aria-live="polite">
        <ScoreGauge
          score={currentScore}
          variant="ring"
          label={verdict}
          caption={scoreCaption}
          aria-label={tUi("Current pronunciation score")}
        />

        <hr className="divider" />

        {feedback ? (
          <section className="drill-feedback-block" aria-labelledby={`${phraseInputId}-feedback`}>
            <h2 id={`${phraseInputId}-feedback`} className="pronunciation-aside-label">
              {tUi("Feedback")}
            </h2>
            <div className="drill-feedback">{feedback}</div>
          </section>
        ) : null}

        {asideExtra}

        <div className="pronunciation-drill-toolbar" role="group" aria-label={tUi("Drill actions")}>
          {showPostpone && onPostpone && (
            <button
              type="button"
              className="drill-toolbar-btn"
              onClick={onPostpone}
              aria-label={tUi("Postpone phrase")}
            >
              <Icon name="schedule" size={17} />
              {tUi("Postpone")}
            </button>
          )}
          <button
            type="button"
            className="drill-toolbar-btn"
            onClick={onNextPhrase}
            aria-label={tUi("Next phrase")}
          >
            <Icon name="arrow_forward" size={17} />
            {tUi("Next phrase")}
          </button>
        </div>
      </aside>
    </div>
  );
}
