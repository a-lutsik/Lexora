// ============================================================
// LEXORA — Live Speech Wave Visualizer
// Two calm sines whose amplitude follows the shared mic analyser.
// ============================================================

import { useEffect, useRef } from 'react';

const WAVE_WIDTH = 400;
const WAVE_HEIGHT = 160;
const WAVE_POINTS = 128;

const NOISE_FLOOR = 0.006;
const ENERGY_CURVE = 0.5;
const ENERGY_BOOST = 6.5;
const MIN_AMP = 0.14;
const MAX_AMP = 0.64;
const RELEASE_SECONDS = 0.07;
const BASE_SCROLL = 2.6;
const VOICE_SCROLL = 4.2;

const IDLE_CYAN =
  'M 0,80.0 L 8,89.0 L 16,97.3 L 24,104.6 L 32,110.4 L 40,114.2 L 48,115.9 L 56,115.4 L 64,112.6 L 72,107.7 L 80,101.2 L 88,93.3 L 96,84.5 L 104,75.5 L 112,66.7 L 120,58.8 L 128,52.3 L 136,47.4 L 144,44.6 L 152,44.1 L 160,45.8 L 168,49.6 L 176,55.4 L 184,62.7 L 192,71.0 L 200,80.0 L 208,89.0 L 216,97.3 L 224,104.6 L 232,110.4 L 240,114.2 L 248,115.9 L 256,115.4 L 264,112.6 L 272,107.7 L 280,101.2 L 288,93.3 L 296,84.5 L 304,75.5 L 312,66.7 L 320,58.8 L 328,52.3 L 336,47.4 L 344,44.6 L 352,44.1 L 360,45.8 L 368,49.6 L 376,55.4 L 384,62.7 L 392,71.0 L 400,80.0';

const IDLE_MAGENTA =
  'M 0,105.9 L 8,107.7 L 16,107.9 L 24,106.7 L 32,104.0 L 40,100.1 L 48,95.2 L 56,89.5 L 64,83.5 L 72,77.6 L 80,72.0 L 88,67.2 L 96,63.5 L 104,61.0 L 112,60.0 L 120,60.5 L 128,62.5 L 136,65.8 L 144,70.3 L 152,75.6 L 160,81.4 L 168,87.5 L 176,93.3 L 184,98.5 L 192,102.8 L 200,105.9 L 208,107.7 L 216,107.9 L 224,106.7 L 232,104.0 L 240,100.1 L 248,95.2 L 256,89.5 L 264,83.5 L 272,77.6 L 280,72.0 L 288,67.2 L 296,63.5 L 304,61.0 L 312,60.0 L 320,60.5 L 328,62.5 L 336,65.8 L 344,70.3 L 352,75.6 L 360,81.4 L 368,87.5 L 376,93.3 L 384,98.5 L 392,102.8 L 400,105.9';

type LiveSpeechWaveProps = {
  isRecording: boolean;
  isProcessing?: boolean;
  analyser?: AnalyserNode | null;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildSinePath(phase: number, amp: number, cycles: number, yOffset: number): string {
  const mid = WAVE_HEIGHT / 2;
  const last = WAVE_POINTS - 1;
  const swing = WAVE_HEIGHT * 0.34 * amp;
  let d = '';
  for (let i = 0; i < WAVE_POINTS; i += 1) {
    const t = i / last;
    const x = t * WAVE_WIDTH;
    const theta = t * Math.PI * 2 * cycles + phase;
    const wave = Math.sin(theta) + 0.32 * Math.sin(theta * 2.2 + 0.55);
    const y = mid + yOffset + wave * swing;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function speechPeak(timeDomain: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < timeDomain.length; i += 1) {
    const sample = Math.abs(timeDomain[i] ?? 0);
    if (sample > peak) peak = sample;
  }
  return peak;
}

export function LiveSpeechWave({
  isRecording,
  isProcessing = false,
  analyser = null,
}: LiveSpeechWaveProps) {
  const cyanRef = useRef<SVGPathElement>(null);
  const magentaRef = useRef<SVGPathElement>(null);
  const isLive = Boolean(isRecording && analyser);

  useEffect(() => {
    if (!isLive || !analyser) {
      cyanRef.current?.setAttribute('d', IDLE_CYAN);
      magentaRef.current?.setAttribute('d', IDLE_MAGENTA);
      return;
    }

    const timeDomain = new Float32Array(analyser.fftSize);
    let envelope = 0;
    let phase = 0;
    let lastTime = performance.now();
    let raf = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, Math.max(0.008, (now - lastTime) / 1000));
      lastTime = now;

      const ctx = analyser.context;
      if ('resume' in ctx && typeof ctx.resume === 'function' && ctx.state === 'suspended') {
        void ctx.resume();
      }

      analyser.getFloatTimeDomainData(timeDomain);

      const peak = speechPeak(timeDomain);
      const instant = clamp01(Math.pow(Math.max(0, peak - NOISE_FLOOR) * ENERGY_BOOST, ENERGY_CURVE));
      if (instant >= envelope) {
        envelope = instant;
      } else {
        envelope += (instant - envelope) * (1 - Math.exp(-dt / RELEASE_SECONDS));
      }

      const amp = MIN_AMP + (MAX_AMP - MIN_AMP) * envelope;
      phase += (BASE_SCROLL + envelope * VOICE_SCROLL) * dt;

      cyanRef.current?.setAttribute('d', buildSinePath(phase, amp, 2.15, 0));
      magentaRef.current?.setAttribute(
        'd',
        buildSinePath(phase * 0.82 + 1.15, amp * 0.88, 1.7, 6),
      );
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [isLive, analyser]);

  const stateClass = isLive
    ? ' is-recording is-live'
    : isRecording
      ? ' is-recording'
      : isProcessing
        ? ' is-processing'
        : '';

  return (
    <div className={`voice-wave${stateClass}`} aria-hidden="true">
      <svg
        className="voice-wave-svg"
        viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <g className="voice-wave-track">
          <path
            ref={magentaRef}
            className="voice-wave-line voice-wave-line--secondary"
            d={IDLE_MAGENTA}
            fill="none"
          />
          <path
            ref={cyanRef}
            className="voice-wave-line voice-wave-line--primary"
            d={IDLE_CYAN}
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
