// ============================================================
// LEXORA — Drill waveform (vertical neon bars for Practice/Shadowing)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import './domain.css';

const BAR_COUNT = 28;
const SVG_WIDTH = 420;
const SVG_HEIGHT = 72;
const BAR_GAP = 4;
const BAR_WIDTH = (SVG_WIDTH - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

const IDLE_HEIGHTS = [
  0.22, 0.35, 0.48, 0.62, 0.78, 0.9, 0.72, 0.55, 0.4, 0.28, 0.38, 0.55, 0.7, 0.85, 0.95, 0.85, 0.7,
  0.55, 0.38, 0.28, 0.4, 0.55, 0.72, 0.9, 0.78, 0.62, 0.48, 0.35,
];

type DrillWaveformProps = {
  isActive: boolean;
  analyser?: AnalyserNode | null;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DrillWaveform({ isActive, analyser = null }: DrillWaveformProps) {
  const [heights, setHeights] = useState<number[]>(() => [...IDLE_HEIGHTS]);
  const heightsRef = useRef(heights);
  heightsRef.current = heights;

  useEffect(() => {
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
            const wobble = 0.12 * Math.sin(phase + i * 0.45);
            return Math.min(1, Math.max(0.12, base + wobble));
          }),
        );
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [analyser, isActive]);

  return (
    <svg
      className="drill-waveform"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      width="100%"
      height={SVG_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="drill-wave-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-neon-cyan)" />
          <stop offset="100%" stopColor="var(--color-neon-magenta)" />
        </linearGradient>
        <filter id="drill-wave-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {heights.map((height, index) => {
        const barHeight = Math.max(4, height * (SVG_HEIGHT - 4));
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
            fill="url(#drill-wave-grad)"
            filter="url(#drill-wave-glow)"
          />
        );
      })}
    </svg>
  );
}
