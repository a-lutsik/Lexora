import { describe, expect, it } from 'vitest';
import { VISION_MAX_SIDE, VISION_PASSTHROUGH_BYTES, fitWithin, needsReencode } from './imagePrepare';

describe('fitWithin', () => {
  it('scales a 12 MP photo down to the vision limit, keeping the aspect ratio', () => {
    expect(fitWithin(4032, 3024, VISION_MAX_SIDE)).toEqual({ width: 2048, height: 1536, scaled: true });
    expect(fitWithin(3024, 4032, VISION_MAX_SIDE)).toEqual({ width: 1536, height: 2048, scaled: true });
  });

  it('leaves images that already fit untouched', () => {
    expect(fitWithin(1280, 720, VISION_MAX_SIDE)).toEqual({ width: 1280, height: 720, scaled: false });
    expect(fitWithin(0, 0, VISION_MAX_SIDE)).toEqual({ width: 0, height: 0, scaled: false });
  });
});

describe('needsReencode', () => {
  it('passes small supported screenshots through', () => {
    expect(needsReencode('image/png', 300_000, 1440, 900)).toBe(false);
    expect(needsReencode('image/jpeg', 2_000_000, 2048, 1536)).toBe(false);
  });

  it('re-encodes HEIC and other formats vision APIs reject', () => {
    expect(needsReencode('image/heic', 1_500_000, 1000, 800)).toBe(true);
    expect(needsReencode('image/tiff', 1_000, 10, 10)).toBe(true);
    expect(needsReencode('', 1_000, 10, 10)).toBe(true);
  });

  it('re-encodes heavy or oversized images', () => {
    expect(needsReencode('image/jpeg', VISION_PASSTHROUGH_BYTES + 1, 1000, 1000)).toBe(true);
    expect(needsReencode('image/png', 500_000, 4032, 3024)).toBe(true);
  });
});
