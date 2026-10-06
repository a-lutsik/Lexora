import { describe, expect, it } from 'vitest';
import { getClipboardImage, normalizeImageMime } from './imageOverlay';

describe('normalizeImageMime', () => {
  it('maps jpg alias and defaults empty mime to png', () => {
    expect(normalizeImageMime('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMime('')).toBe('image/png');
    expect(normalizeImageMime('application/octet-stream')).toBe('image/png');
    expect(normalizeImageMime('image/png;charset=utf-8')).toBe('image/png');
  });
});

describe('getClipboardImage', () => {
  it('returns a named PNG file from clipboard image items', () => {
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
    const file = new File([blob], 'image.png', { type: 'image/png' });

    const dataTransfer = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
      files: [],
    } as unknown as DataTransfer;

    const pasted = getClipboardImage(dataTransfer);
    expect(pasted).not.toBeNull();
    expect(pasted?.type).toBe('image/png');
    expect(pasted?.name).toBe('image.png');
  });

  it('fills missing mime for screenshot-like files', () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: '' });
    const file = new File([blob], 'image.png', { type: '' });

    const dataTransfer = {
      items: [],
      files: [file],
    } as unknown as DataTransfer;

    const pasted = getClipboardImage(dataTransfer);
    expect(pasted?.type).toBe('image/png');
  });
});
