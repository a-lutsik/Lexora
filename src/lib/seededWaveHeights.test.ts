import { describe, expect, it } from 'vitest';
import { seededWaveHeights } from './seededWaveHeights';

describe('seededWaveHeights', () => {
  it('is deterministic for the same seed', () => {
    expect(seededWaveHeights('sheep|iː')).toEqual(seededWaveHeights('sheep|iː'));
  });

  it('differs across seeds and stays in range', () => {
    const a = seededWaveHeights('ship|ɪ', 8);
    const b = seededWaveHeights('sheep|iː', 8);
    expect(a).not.toEqual(b);
    for (const h of a) {
      expect(h).toBeGreaterThanOrEqual(0.12);
      expect(h).toBeLessThanOrEqual(1);
    }
  });
});
