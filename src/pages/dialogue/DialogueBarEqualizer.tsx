// ============================================================
// LEXORA — Bar equalizer for AI Dialogue voice console
// Thin single-colour bars (Lingora): the colour comes from CSS
// (`color` of .dialogue-eq) — `--live` while recording, else `--ink3`.
// Idle wave + live analyser.
// ============================================================

import { useEffect, useRef } from 'react';

/** Bar geometry from the mockup: 3px bars, 2px gaps. */
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_RADIUS = 1.5;
const MIN_BARS = 8;
const MIN_BAR_HEIGHT = 3;
const FALLBACK_WIDTH = 360;
const FALLBACK_HEIGHT = 26;

type DialogueBarEqualizerProps = {
  isRecording: boolean;
  isProcessing?: boolean;
  analyser?: AnalyserNode | null;
};

function buildIdleHeights(t: number, count: number): number[] {
  const heights: number[] = [];
  const half = Math.max(1, (count - 1) / 2);
  for (let i = 0; i < count; i += 1) {
    const center = Math.abs(i - half) / half;
    const envelope = 1 - center * 0.55;
    const wave = 0.35 + 0.65 * Math.sin(t * 2.2 + i * 0.28) * envelope;
    heights.push(Math.max(0.12, Math.min(1, wave)));
  }
  return heights;
}

export function DialogueBarEqualizer({
  isRecording,
  isProcessing = false,
  analyser = null,
}: DialogueBarEqualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLive = Boolean(isRecording && analyser);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let cancelled = false;
    let phase = 0;
    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const barCount = () => {
      const cssW = canvas.clientWidth || FALLBACK_WIDTH;
      return Math.max(MIN_BARS, Math.floor((cssW + BAR_GAP) / (BAR_WIDTH + BAR_GAP)));
    };

    const paint = (heights: number[]) => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || FALLBACK_WIDTH;
      const cssH = canvas.clientHeight || FALLBACK_HEIGHT;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Token colour resolved by CSS (state classes on the wrapper).
      ctx.fillStyle = window.getComputedStyle(canvas).color;
      const mid = cssH / 2;

      heights.forEach((value, i) => {
        const h = Math.max(MIN_BAR_HEIGHT, value * cssH);
        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = mid - h / 2;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, BAR_WIDTH, h, BAR_RADIUS);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, BAR_WIDTH, h);
        }
      });
    };

    const tick = (now: number) => {
      if (cancelled) return;
      phase = now / 1000;
      const count = barCount();

      if (isLive && analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const idle = buildIdleHeights(phase, count);
        const heights: number[] = [];
        for (let i = 0; i < count; i += 1) {
          const idx = Math.floor((i / count) * freq.length * 0.55);
          const v = (freq[idx] ?? 0) / 255;
          heights.push(Math.max((idle[i] ?? 0.2) * 0.35, Math.min(1, v * 1.35)));
        }
        paint(heights);
      } else if (reducedMotion) {
        paint(buildIdleHeights(0, count));
        return;
      } else {
        const amp = isProcessing ? 0.85 : 1;
        paint(buildIdleHeights(phase, count).map((h) => h * amp));
      }
      raf = window.requestAnimationFrame(tick);
    };

    if (reducedMotion && !isLive) {
      paint(buildIdleHeights(0, barCount()));
      return () => {
        cancelled = true;
      };
    }

    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [analyser, isLive, isProcessing, isRecording]);

  const stateClass = isLive
    ? ' is-recording is-live'
    : isRecording
      ? ' is-recording'
      : isProcessing
        ? ' is-processing'
        : '';

  return (
    <div className={`dialogue-eq${stateClass}`} aria-hidden="true">
      <canvas ref={canvasRef} className="dialogue-eq-canvas" />
    </div>
  );
}
