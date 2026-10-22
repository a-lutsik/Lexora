// ============================================================
// LEXORA — Drill waveform (thin bars for Practice/Shadowing)
// Idle: muted bars. Recording: live mic level, tinted as "recording".
// Static mode (`heights`): a fixed envelope, e.g. the model row.
// Colours come from CSS (data-state / data-tone), never from the SVG itself.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import './domain.css';

/** Bars per drill waveform row (live and static rows line up). */
export const DRILL_WAVE_BAR_COUNT = 84;
const BAR_COUNT = DRILL_WAVE_BAR_COUNT;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_MIN_HEIGHT = 3;
const SVG_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
const SVG_HEIGHT = 34;

/** Deterministic speech-like envelope used while the mic is idle. */
function buildIdleHeights(): number[] {
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    const syllable = Math.abs(Math.sin(i * 0.21));
    const detail = 0.7 + 0.3 * Math.sin(i * 0.9 + 1);
    out.push(Math.min(1, Math.max(0.22, 0.2 + syllable * detail * 0.8)));
  }
  return out;
}

const IDLE_HEIGHTS = buildIdleHeights();

type DrillWaveformProps = {
  isActive: boolean;
  analyser?: AnalyserNode | null;
  /** Fixed 0–1 bar heights; when set the row does not animate. */
  heights?: readonly number[] | null;
  /** Which row this is, for styling (model vs the learner). */
  tone?: 'model' | 'user';
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DrillWaveform({
  isActive,
  analyser = null,
  heights: staticHeights = null,
  tone = 'user',
}: DrillWaveformProps) {
  const [liveHeights, setHeights] = useState<number[]>(() => [...IDLE_HEIGHTS]);
  const heightsRef = useRef(liveHeights);
  heightsRef.current = liveHeights;
  const isStatic = staticHeights !== null;
  const heights = staticHeights ?? liveHeights;

  useEffect(() => {
    if (isStatic) return;
    if (prefersReducedMotion()) {
      setHeights([...IDLE_HEIGHTS]);
      return;
    }

    let raf = 0;
    let phase = 0;

    const tick = () => {
      if (isActive && analyser) {
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        const next: number[] = [];
        const chunk = Math.max(1, Math.floor(samples.length / BAR_COUNT));
        for (let i = 0; i < BAR_COUNT; i += 1) {
          let peak = 0;
          const start = i * chunk;
          for (let j = start; j < start + chunk && j < samples.length; j += 1) {
            const sample = Math.abs(samples[j] ?? 0);
            if (sample > peak) peak = sample;
          }
          const live = Math.min(1, 0.18 + peak * 8);
          const prev = heightsRef.current[i] ?? 0.3;
          next.push(prev * 0.55 + live * 0.45);
        }
        setHeights(next);
      } else {
        phase += 0.045;
        setHeights(
          IDLE_HEIGHTS.map((base, i) => {
            const wobble = 0.08 * Math.sin(phase + i * 0.3);
            return Math.min(1, Math.max(0.12, base + wobble));
          }),
        );
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [analyser, isActive, isStatic]);

  return (
    <svg
      className={`drill-waveform${isActive ? ' is-active' : ''}`}
      data-state={isActive ? 'recording' : 'idle'}
      data-tone={tone}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      {heights.map((height, index) => {
        const barHeight = Math.max(BAR_MIN_HEIGHT, height * SVG_HEIGHT);
        const x = index * (BAR_WIDTH + BAR_GAP);
        const y = (SVG_HEIGHT - barHeight) / 2;
        return (
          <rect
            key={index}
            className="drill-waveform-bar"
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={barHeight}
            rx={BAR_WIDTH / 2}
          />
        );
      })}
    </svg>
  );
}
