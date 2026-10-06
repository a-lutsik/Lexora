// ============================================================
// LEXORA — Symmetric neon bar waveform for Minimal Pairs
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { IconMic } from '../../components/ui/LuminousIcons';

const BAR_COUNT = 18;

type PairsWaveformProps = {
  isRecording: boolean;
  analyser?: AnalyserNode | null;
};

function idleHeights(seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    const t = i / (BAR_COUNT - 1);
    const envelope = Math.sin(t * Math.PI);
    const wobble = 0.55 + 0.45 * Math.sin(seed * 0.7 + i * 0.85);
    out.push(Math.max(0.18, envelope * wobble));
  }
  return out;
}

function readHeights(analyser: AnalyserNode): number[] {
  const samples = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(samples);
  const out: number[] = [];
  const chunk = Math.max(1, Math.floor(samples.length / BAR_COUNT));
  for (let i = 0; i < BAR_COUNT; i += 1) {
    let peak = 0;
    const start = i * chunk;
    const end = Math.min(samples.length, start + chunk);
    for (let j = start; j < end; j += 1) {
      const v = Math.abs(samples[j] ?? 0);
      if (v > peak) peak = v;
    }
    out.push(Math.min(1, 0.16 + peak * 7));
  }
  return out;
}

export function PairsWaveform({ isRecording, analyser = null }: PairsWaveformProps) {
  const [heights, setHeights] = useState(() => idleHeights(1));
  const left = useMemo(() => heights, [heights]);
  const right = useMemo(() => [...heights].reverse(), [heights]);

  useEffect(() => {
    if (!isRecording || !analyser) {
      let frame = 0;
      let raf = 0;
      const tick = () => {
        frame += 1;
        setHeights(idleHeights(frame * 0.08));
        raf = window.requestAnimationFrame(tick);
      };
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setHeights(idleHeights(1));
        return;
      }
      raf = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(raf);
    }

    let raf = 0;
    const tick = () => {
      setHeights(readHeights(analyser));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [analyser, isRecording]);

  return (
    <div className="pairs-waveform" aria-hidden="true">
      <div className="pairs-waveform-bars">
        {left.map((h, i) => (
          <span
            key={`l-${i}`}
            className="pairs-waveform-bar"
            style={{ ['--bar-scale' as string]: String(h) }}
          />
        ))}
      </div>
      <div className="pairs-waveform-mic">
        <IconMic size={28} />
      </div>
      <div className="pairs-waveform-bars">
        {right.map((h, i) => (
          <span
            key={`r-${i}`}
            className="pairs-waveform-bar"
            style={{ ['--bar-scale' as string]: String(h) }}
          />
        ))}
      </div>
    </div>
  );
}
