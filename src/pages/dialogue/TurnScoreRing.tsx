// ============================================================
// LEXORA — Turn score ring gauge (AI Dialogue metrics)
// ============================================================

type TurnScoreRingProps = {
  score: number | null;
  label?: string;
};

const SIZE = 112;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function TurnScoreRing({ score, label = 'Current turn score' }: TurnScoreRingProps) {
  const clamped = score == null ? null : Math.max(0, Math.min(100, Math.round(score)));
  const progress = clamped == null ? 0 : clamped / 100;
  const offset = CIRC * (1 - progress);

  return (
    <div
      className="dialogue-score-ring"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped ?? undefined}
      aria-valuetext={clamped == null ? 'No score yet' : `${clamped} percent`}
      aria-label={label}
    >
      <svg className="dialogue-score-ring-svg" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          className="dialogue-score-ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className="dialogue-score-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span className="dialogue-score-ring-value">
        {clamped == null ? '—' : `${clamped}%`}
      </span>
    </div>
  );
}
