// ============================================================
// LEXORA — Circular neon match gauge for Minimal Pairs
// ============================================================

type MatchRingProps = {
  score: number;
  label?: string;
};

const SIZE = 140;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MatchRing({ score, label = 'Pronunciation score' }: MatchRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      className="pairs-match-ring"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <svg className="pairs-match-ring-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          className="pairs-match-ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className="pairs-match-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span className="pairs-match-ring-value">{clamped}%</span>
    </div>
  );
}
