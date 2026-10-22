// ============================================================
// LEXORA — Writing score ring (0–100) for the issues panel.
// The arc is an SVG stroke (dasharray attribute), no inline style.
// ============================================================

type WritingScoreRingProps = {
  score: number;
};

/** pathLength of the ring: the arc length equals the score. */
const RING_LENGTH = 100;
const RING_VIEWBOX = 36;
const RING_RADIUS = 16;
const RING_CENTER = RING_VIEWBOX / 2;

function scoreTone(score: number): 'ok' | 'warn' | 'live' {
  if (score >= 85) return 'ok';
  if (score >= 60) return 'warn';
  return 'live';
}

export function WritingScoreRing({ score }: WritingScoreRingProps) {
  const value = Math.max(0, Math.min(RING_LENGTH, Math.round(score)));
  return (
    <span className={`writing-score writing-score--${scoreTone(value)}`}>
      <svg
        className="writing-score__ring"
        viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
        aria-hidden="true"
      >
        <circle className="writing-score__track" cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS} />
        <circle
          className="writing-score__arc"
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          pathLength={RING_LENGTH}
          strokeDasharray={`${value} ${RING_LENGTH}`}
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
      </svg>
      <span className="writing-score__value">{score}</span>
    </span>
  );
}
