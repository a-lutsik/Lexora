import { describe, expect, it } from 'vitest';
import { computeSessionStats } from './sessionScore';

describe('computeSessionStats', () => {
  it('averages scores and counts passes at the 90% threshold', () => {
    const stats = computeSessionStats([92, 84, 90]);
    expect(stats.average).toBe(89);
    expect(stats.passed).toBe(2);
    expect(stats.total).toBe(3);
    expect(stats.threshold).toBe(90);
  });

  it('returns null average for an empty session', () => {
    const stats = computeSessionStats([]);
    expect(stats.average).toBeNull();
    expect(stats.passed).toBe(0);
    expect(stats.total).toBe(0);
  });
});
