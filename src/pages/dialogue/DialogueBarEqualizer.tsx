// ============================================================
// LEXORA — Bar equalizer for AI Dialogue voice console
// Vertical neon bars (cyan → magenta), idle + live analyser.
// ============================================================

import { useEffect, useRef } from 'react';

const BAR_COUNT = 48;

type DialogueBarEqualizerProps = {
  isRecording: boolean;
  isProcessing?: boolean;
  analyser?: AnalyserNode | null;
};

function buildIdleHeights(t: number): number[] {
  const heights: number[] = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    const center = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
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

    const paint = (heights: number[]) => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || 400;
      const cssH = canvas.clientHeight || 72;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const gap = 3;
      const barW = Math.max(2, (cssW - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      const mid = cssH / 2;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const t = i / (BAR_COUNT - 1);
        const r = Math.round(34 + (232 - 34) * t);
        const g = Math.round(211 + (121 - 211) * t);
        const b = Math.round(238 + (249 - 238) * t);
        const h = Math.max(4, (heights[i] ?? 0.2) * (cssH * 0.92));
        const x = i * (barW + gap);
        const y = mid - h / 2;

        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.65)`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        const radius = Math.min(barW / 2, 3);
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, barW, h, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barW, h);
        }
      }
      ctx.shadowBlur = 0;
    };

    const tick = (now: number) => {
      if (cancelled) return;
      phase = now / 1000;

      if (isLive && analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const heights: number[] = [];
        for (let i = 0; i < BAR_COUNT; i += 1) {
          const idx = Math.floor((i / BAR_COUNT) * freq.length * 0.55);
          const v = (freq[idx] ?? 0) / 255;
          const idle = buildIdleHeights(phase)[i] ?? 0.2;
          heights.push(Math.max(idle * 0.35, Math.min(1, v * 1.35)));
        }
        paint(heights);
      } else if (reducedMotion) {
        paint(buildIdleHeights(0));
        return;
      } else {
        const amp = isProcessing ? 0.85 : 1;
        paint(buildIdleHeights(phase).map((h) => h * amp));
      }
      raf = window.requestAnimationFrame(tick);
    };

    if (reducedMotion && !isLive) {
      paint(buildIdleHeights(0));
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
