// ============================================================
// LEXORA — Share bar of an error pattern (Your error patterns).
// Width is an SVG attribute, so no inline style is needed.
// ============================================================

type WritingPatternBarProps = {
  /** 0…1 — share relative to the most frequent pattern. */
  share: number;
};

const BAR_WIDTH = 100;
const BAR_HEIGHT = 5;

export function WritingPatternBar({ share }: WritingPatternBarProps) {
  const width = Math.max(0, Math.min(1, share)) * BAR_WIDTH;
  return (
    <svg
      className="writing-pattern-bar"
      viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect className="writing-pattern-bar__track" width={BAR_WIDTH} height={BAR_HEIGHT} />
      <rect className="writing-pattern-bar__fill" width={width} height={BAR_HEIGHT} />
    </svg>
  );
}
