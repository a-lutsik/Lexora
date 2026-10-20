import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — PhonemeFeedback
// Color-coded IPA chips + overall score gauge.
// ============================================================

import type { PhonemeScoreDto } from '../../lib/types';
import { phonemeStatusClass, scoreTone } from '../../lib/pronunciationScore';
import type { ReactNode } from 'react';
import './domain.css';

type ScoreGaugeProps = {
  score: number | null;
  variant?: 'compact' | 'hero' | 'ring';
  label?: ReactNode;
  caption?: ReactNode;
  'aria-label'?: string;
};

const RING_SIZE = 120;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ScoreGauge({
  score,
  variant = 'compact',
  label,
  caption,
  'aria-label': ariaLabel,
}: ScoreGaugeProps) {
  const { t: tUi } = useI18n();
  const value = score ?? 0;
  const tone = score === null ? 'empty' : scoreTone(value);
  const progress = score === null ? 0 : Math.min(100, Math.max(0, score)) / 100;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  if (variant === 'ring') {
    return (
      <div className={`score-gauge-ring score-gauge-ring--${tone}`}>
        {label ? <p className="score-gauge-ring-label">{label}</p> : null}
        <div
          className="score-gauge-ring-meter"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score === null ? 0 : value}
          aria-label={ariaLabel ?? tUi("Pronunciation score")}
        >
          <svg
            className="score-gauge-ring-svg"
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
            focusable="false"
          >
            <circle
              className="score-gauge-ring-track"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
            />
            <circle
              className="score-gauge-ring-progress"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </svg>
          <div className="score-gauge-ring-center">
            <span className="score-gauge-ring-value">{score === null ? '—' : `${value}%`}</span>
            {caption ? <span className="score-gauge-ring-caption">{caption}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`score-gauge score-gauge--${tone} score-gauge--${variant}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={ariaLabel ?? tUi("Pronunciation score")}
    >
      <span className="score-gauge-value">{value}%</span>
    </div>
  );
}

type PhonemeFeedbackProps = {
  phonemes: PhonemeScoreDto[];
};

export function PhonemeFeedback({ phonemes }: PhonemeFeedbackProps) {
  const { t: tUi } = useI18n();
  if (phonemes.length === 0) {
    return <p className="text-muted text-sm">{tUi("No phoneme breakdown for this attempt.")}</p>;
  }

  return (
    <ul className="phoneme-row" aria-label={tUi("Phoneme scores")}>
      {phonemes.map((phone) => {
        const status = phonemeStatusClass(phone.status);
        return (
          <li
            key={`${phone.id}-${phone.position}`}
            className={`phoneme-chip phoneme-chip--${status}`}
          >
            <span className="phoneme-chip-ipa">/{phone.targetPhoneme}/</span>
            {phone.recognizedPhoneme && phone.recognizedPhoneme !== phone.targetPhoneme && (
              <span className="phoneme-chip-heard">{tUi("heard /")}{phone.recognizedPhoneme}/</span>
            )}
            <span className="phoneme-chip-acc">{phone.accuracy}%</span>
          </li>
        );
      })}
    </ul>
  );
}
