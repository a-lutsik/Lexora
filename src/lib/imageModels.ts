// ============================================================
// LEXORA — Image generation model catalog (Settings)
// Ids encode provider: `cloudflare:…` | `gemini:…` | `openai:…`
// ============================================================

export type ImageModelProvider = 'cloudflare' | 'gemini' | 'openai';

export type ImageModelPreset = {
  id: string;
  name: string;
  badge?: string;
  provider: ImageModelProvider;
};

export const NONE_IMAGE_MODEL = 'none';

export const DEFAULT_IMAGE_MODEL =
  'cloudflare:@cf/black-forest-labs/flux-1-schnell';

export const DEFAULT_FALLBACK_IMAGE_MODEL = 'gemini:gemini-3.1-flash-image';

export const IMAGE_MODELS: ImageModelPreset[] = [
  {
    id: DEFAULT_IMAGE_MODEL,
    name: 'FLUX.1 Schnell (Cloudflare)',
    badge: 'Free Daily',
    provider: 'cloudflare',
  },
  {
    id: 'gemini:gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    badge: 'Paid API',
    provider: 'gemini',
  },
  {
    id: 'gemini:gemini-3.1-flash-lite-image',
    name: 'Gemini 3.1 Flash Lite Image',
    badge: 'Paid API',
    provider: 'gemini',
  },
  {
    id: 'gemini:gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    badge: 'Paid API',
    provider: 'gemini',
  },
  {
    id: 'openai:gpt-image-1',
    name: 'GPT Image 1 (OpenAI)',
    badge: 'Paid API',
    provider: 'openai',
  },
];

export function imageModelProvider(id: string | null | undefined): ImageModelProvider | null {
  const trimmed = id?.trim() ?? '';
  if (!trimmed || trimmed.toLowerCase() === NONE_IMAGE_MODEL) {
    return null;
  }
  const colon = trimmed.indexOf(':');
  if (colon > 0) {
    const provider = trimmed.slice(0, colon).toLowerCase();
    if (provider === 'cloudflare' || provider === 'gemini' || provider === 'openai') {
      return provider;
    }
  }
  if (trimmed.startsWith('@cf/')) return 'cloudflare';
  if (trimmed.includes('gemini') && trimmed.includes('image')) return 'gemini';
  if (trimmed.startsWith('gpt-image') || trimmed.startsWith('dall-e')) return 'openai';
  return null;
}

export function imageModelsUseProvider(
  primary: string | null | undefined,
  fallback: string | null | undefined,
  provider: ImageModelProvider,
): boolean {
  return imageModelProvider(primary) === provider || imageModelProvider(fallback) === provider;
}
