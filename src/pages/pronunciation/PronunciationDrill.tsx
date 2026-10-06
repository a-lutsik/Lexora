// ============================================================
// LEXORA — Shared Practice / Shadowing drill scene
// Glass card, hero phrase, waveform + mic, score rings, toolbar.
// ============================================================

import { type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { DrillWaveform } from '../../components/domain/DrillWaveform';
import { ScoreGauge } from '../../components/domain/PhonemeFeedback';
import { IconMic, IconSpeaker } from '../../components/ui/LuminousIcons';
import { tokenizePhrase } from '../../lib/highlightPhrase';
import { PRONUNCIATION_PASS_SCORE } from '../../lib/pronunciationScore';

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
  sessionPassed: number;
  sessionTotal: number;
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
  spaceHintText?: string;
  phaseMessage?: string | null;
  error?: string | null;
  children?: ReactNode;
};

function HighlightedPhrase({ text, className }: { text: string; className?: string }) {
  const tokens = tokenizePhrase(text);
  if (!text.trim()) {
    return <p className={className}>Enter a phrase to begin</p>;
  }
  return (
    <p className={className} aria-hidden="true">
      {tokens.map((token, index) =>
        token.highlight ? (
          <span key={`${index}-${token.text}`} className="drill-word-highlight">
            {token.text}
          </span>
        ) : (
          <span key={`${index}-${token.text}`}>{token.text}</span>
        ),
      )}
    </p>
  );
}

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
  sessionPassed,
  sessionTotal,
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
  spaceHintText = 'Press Spacebar to Shadow',
  phaseMessage = null,
  error = null,
  children,
}: PronunciationDrillProps) {
  const sessionCaption =
    sessionTotal > 0 ? (
      <>
        Passed{' '}
        <span className="score-gauge-ring-pass">
          {sessionPassed}/{sessionTotal}
        </span>{' '}
        ({PRONUNCIATION_PASS_SCORE}% threshold)
      </>
    ) : (
      <>Pass at {PRONUNCIATION_PASS_SCORE}%</>
    );

  const currentLabel =
    currentScore === null ? (
      'Current Score'
    ) : (
      <>
        Current Score:{' '}
        <span className="score-gauge-ring-pass">{currentScore}%</span>
      </>
    );

  return (
    <div className="pronunciation-drill">
      <div className="pronunciation-drill-main">
        <section className="drill-scene" aria-label={sceneTitle}>
          <h2 className="drill-scene-title">{sceneTitle}</h2>

          {phraseEditable ? (
            <label className="drill-phrase-field" htmlFor={phraseInputId}>
              <span className="sr-only">{phraseInputLabel}</span>
              <input
                ref={phraseInputRef}
                id={phraseInputId}
                className="drill-phrase-input"
                value={targetText}
                onChange={(e) => onTargetTextChange?.(e.target.value)}
                placeholder={emptyPhraseHint}
                autoComplete="off"
                disabled={inputLocked}
                aria-label={phraseInputLabel}
              />
            </label>
          ) : (
            <p
              id={phraseInputId}
              className={`drill-phrase-input drill-phrase-input--static${!targetText.trim() ? ' is-placeholder' : ''}`}
              aria-label={phraseInputLabel}
            >
              {targetText.trim() || emptyPhraseHint}
            </p>
          )}

          {showIpaField ? (
            <label className="drill-ipa-field" htmlFor={ipaInputId}>
              <span className="sr-only">Target IPA (optional)</span>
              <input
                id={ipaInputId}
                className="drill-ipa-input"
                value={targetIpa}
                onChange={(e) => onTargetIpaChange?.(e.target.value)}
                placeholder="/optional IPA/"
                autoComplete="off"
                disabled={inputLocked}
                aria-label="Target IPA (optional)"
              />
            </label>
          ) : (
            targetIpa.trim() && (
              <p className="drill-ipa-display phonetic" aria-label="Target IPA">
                {targetIpa}
              </p>
            )
          )}

          {!showIpaField && !targetIpa.trim() && targetText.trim() ? (
            <p className="drill-ipa-display drill-ipa-display--empty" aria-hidden="true">
              {'\u00A0'}
            </p>
          ) : null}

          <div className="drill-wave-row">
            <DrillWaveform isActive={waveActive} analyser={analyser} />
          </div>

          <HighlightedPhrase text={targetText} className="drill-phrase-echo" />

          {spaceHint && (
            <p className="drill-space-hint">
              <kbd className="drill-kbd">Space</kbd>
              {' '}
              {spaceHintText}
            </p>
          )}

          {phaseMessage && (
            <p className="drill-phase" aria-live="polite">
              {phaseMessage}
            </p>
          )}

          <div className="drill-actions" role="group" aria-label="Listen, voice, and record">
            <button
              type="button"
              className="drill-action-btn"
              onClick={onListen}
              onKeyDown={suppressSpaceKey}
              disabled={listenDisabled}
              aria-label="Listen to Model"
            >
              <IconSpeaker size={18} />
              Listen to Model
            </button>
            <button
              type="button"
              className={`drill-action-btn drill-action-btn--voice${waveActive ? ' is-active' : ''}`}
              onClick={onPrimary}
              onKeyDown={suppressSpaceKey}
              disabled={primaryDisabled && !waveActive}
              aria-pressed={waveActive}
              aria-label={waveActive ? 'Stop' : 'Voice'}
            >
              <IconMic size={18} />
              {waveActive ? 'Stop' : 'Voice'}
            </button>
            <button
              type="button"
              className={`drill-cta${primaryLoading ? ' is-loading' : ''}${waveActive ? ' is-recording' : ''}`}
              onClick={onPrimary}
              onKeyDown={suppressSpaceKey}
              disabled={primaryDisabled && !waveActive}
              aria-label={primaryAriaLabel}
              aria-busy={primaryLoading}
            >
              {primaryLoading && (
                <span className="drill-cta-spinner animate-spin" aria-hidden="true" />
              )}
              <span className="drill-cta-label">{primaryLabel}</span>
            </button>
          </div>
        </section>

        {error && (
          <p className="pronunciation-error" role="alert">
            {error}
          </p>
        )}

        {children}
      </div>

      <aside className="pronunciation-drill-scores" aria-live="polite">
        <ScoreGauge
          score={currentScore}
          variant="ring"
          label={currentLabel}
          aria-label="Current pronunciation score"
        />
        <ScoreGauge
          score={sessionAverage}
          variant="ring"
          label="Total Session Score:"
          caption={sessionCaption}
          aria-label="Total session pronunciation score"
        />
      </aside>

      <div className="pronunciation-drill-toolbar" role="group" aria-label="Drill actions">
        <div className="pronunciation-drill-toolbar-end">
          {showPostpone && onPostpone && (
            <button
              type="button"
              className="drill-toolbar-btn"
              onClick={onPostpone}
              aria-label="Postpone phrase"
            >
              Postpone
            </button>
          )}
          <button
            type="button"
            className="drill-toolbar-btn"
            onClick={onNextPhrase}
            aria-label="Next Phrase"
          >
            Next Phrase
          </button>
        </div>
      </div>
    </div>
  );
}
