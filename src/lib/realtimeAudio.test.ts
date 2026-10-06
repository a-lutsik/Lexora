import { describe, expect, it } from 'vitest';
import {
  base64ToPcm16,
  createChunker,
  createResampler,
  floatToPcm16,
  pcm16ToBase64,
  pcm16ToFloat,
} from './realtimeAudio';

describe('createResampler', () => {
  it('decimates 48 kHz to 16 kHz by averaging groups of three', () => {
    const resample = createResampler(48_000, 16_000);
    const out = resample(Float32Array.from([0, 0.3, 0.6, 1, 1, 1]));
    expect(Array.from(out).map((v) => Number(v.toFixed(3)))).toEqual([0.3, 1]);
  });

  it('keeps leftovers between chunks so streamed output matches one-shot output', () => {
    const input = Float32Array.from({ length: 4410 }, (_, i) => Math.sin(i / 7));
    const oneShot = createResampler(44_100, 16_000)(input);

    const streamed = createResampler(44_100, 16_000);
    const parts: number[] = [];
    for (let i = 0; i < input.length; i += 1000) {
      parts.push(...streamed(input.subarray(i, i + 1000)));
    }
    expect(parts.length).toBe(oneShot.length);
    expect(parts.length).toBe(1600);
    parts.forEach((v, i) => expect(v).toBeCloseTo(oneShot[i] ?? NaN, 6));
  });

  it('passes samples through at equal rates', () => {
    const resample = createResampler(16_000, 16_000);
    expect(Array.from(resample(Float32Array.from([0.1, -0.2])))).toEqual([
      expect.closeTo(0.1, 6),
      expect.closeTo(-0.2, 6),
    ]);
  });
});

describe('PCM16 conversions', () => {
  it('clamps and scales floats to int16 and back', () => {
    const pcm = floatToPcm16(Float32Array.from([-2, -1, 0, 0.5, 1, 2]));
    expect(Array.from(pcm)).toEqual([-32768, -32768, 0, 16384, 32767, 32767]);
    const back = pcm16ToFloat(pcm);
    expect(back[0]).toBe(-1);
    expect(back[4]).toBe(1);
    expect(back[3]).toBeCloseTo(0.5, 3);
  });

  it('round-trips through little-endian base64', () => {
    const pcm = Int16Array.from([0, 1, -1, 32767, -32768, 258]);
    const encoded = pcm16ToBase64(pcm);
    // 258 = 0x0102 → bytes 02 01 (little-endian)
    expect(atob(encoded).charCodeAt(10)).toBe(0x02);
    expect(atob(encoded).charCodeAt(11)).toBe(0x01);
    expect(Array.from(base64ToPcm16(encoded))).toEqual(Array.from(pcm));
  });

  it('ignores a dangling odd byte', () => {
    expect(Array.from(base64ToPcm16(btoa('\u0001\u0000\u0007')))).toEqual([1]);
  });
});

describe('createChunker', () => {
  it('emits only full chunks and carries the remainder', () => {
    const chunker = createChunker(4);
    expect(chunker.push(Int16Array.from([1, 2, 3]))).toEqual([]);
    const chunks = chunker.push(Int16Array.from([4, 5, 6, 7, 8, 9]));
    expect(chunks.map((c) => Array.from(c))).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    expect(chunker.push(Int16Array.from([10, 11, 12])).map((c) => Array.from(c))).toEqual([
      [9, 10, 11, 12],
    ]);
  });
});
