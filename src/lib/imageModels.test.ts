import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FALLBACK_IMAGE_MODEL,
  DEFAULT_IMAGE_MODEL,
  IMAGE_MODELS,
  NONE_IMAGE_MODEL,
  imageModelProvider,
  imageModelsUseProvider,
} from './imageModels';

describe('imageModels', () => {
  it('catalog ids encode a known provider', () => {
    for (const preset of IMAGE_MODELS) {
      expect(imageModelProvider(preset.id)).toBe(preset.provider);
    }
  });

  it('defaults are in the catalog', () => {
    expect(IMAGE_MODELS.some((m) => m.id === DEFAULT_IMAGE_MODEL)).toBe(true);
    expect(IMAGE_MODELS.some((m) => m.id === DEFAULT_FALLBACK_IMAGE_MODEL)).toBe(true);
  });

  it('treats none / empty as no provider', () => {
    expect(imageModelProvider(NONE_IMAGE_MODEL)).toBeNull();
    expect(imageModelProvider('')).toBeNull();
    expect(imageModelProvider(null)).toBeNull();
  });

  it('detects whether Cloudflare is used for images', () => {
    expect(
      imageModelsUseProvider(DEFAULT_IMAGE_MODEL, DEFAULT_FALLBACK_IMAGE_MODEL, 'cloudflare'),
    ).toBe(true);
    expect(imageModelsUseProvider('openai:gpt-image-1', NONE_IMAGE_MODEL, 'cloudflare')).toBe(
      false,
    );
  });
});
