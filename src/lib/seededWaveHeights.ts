// ============================================================
// LEXORA — Deterministic decorative waveform heights
// ============================================================

/** Deterministic decorative bars from a string seed (not real TTS DSP). */
export function seededWaveHeights(seed: string, count = 28): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const t = i / Math.max(1, count - 1);
    const envelope = 0.35 + 0.65 * Math.sin(t * Math.PI);
    const noise = ((h >>> 0) % 1000) / 1000;
    out.push(Math.max(0.12, Math.min(1, envelope * (0.45 + noise * 0.55))));
  }
  return out;
}
