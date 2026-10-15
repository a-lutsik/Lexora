import { describe, expect, it } from 'vitest';
import {
  MODEL_PACKAGES,
  estimateUsageCost,
  formatUsd,
  usageAmount,
  MODEL_ROLES,
  ROLE_ENGINES,
  groupLevel,
  isCloudflareAccountIdInvalid,
  modelsForRole,
  packageMeta,
  parseTargetKey,
  providersNeedingKeys,
  statusNote,
  statusesByGroup,
  targetKey,
  targetLabel,
} from './modelRouting';
import type { AiUsageRow, ModelSpec, RoleStatus } from './types';

const CATALOG: ModelSpec[] = [
  {
    provider: 'gemini',
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    capabilities: ['text', 'vision', 'audio_input', 'transcription'],
    tier: 'free_tier',
    status: { kind: 'stable' },
    price: null,
  },
  {
    provider: 'gemini',
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    capabilities: ['text', 'vision', 'audio_input', 'transcription'],
    tier: 'free_tier',
    status: { kind: 'retired' },
    price: null,
  },
  {
    provider: 'openai',
    id: 'gpt-realtime-2.1-mini',
    label: 'GPT Realtime 2.1 mini',
    capabilities: ['realtime_voice'],
    tier: 'paid',
    status: { kind: 'stable' },
    price: null,
  },
  {
    provider: 'gemini',
    id: 'gemini-3.8-live',
    label: 'Gemini 3.8 Live',
    capabilities: ['realtime_voice'],
    tier: 'free_tier',
    status: { kind: 'stable' },
    price: null,
  },
  {
    provider: 'openai',
    id: 'gpt-image-1',
    label: 'GPT Image 1',
    capabilities: ['image_generation'],
    tier: 'paid',
    status: { kind: 'deprecated', shutdown: '2026-12-01' },
    price: null,
  },
];

function status(overrides: Partial<RoleStatus>): RoleStatus {
  return {
    role: 'text_fast',
    group: 'text',
    state: 'ready',
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    modelLabel: 'Gemini 3.8 Flash',
    message: '',
    usingFallback: false,
    chain: [{ provider: 'gemini', model: 'gemini-3.8-flash' }],
    ...overrides,
  };
}

describe('modelsForRole', () => {
  it('keeps models with the role capability and a live engine, drops retired ones', () => {
    expect(modelsForRole(CATALOG, 'text_quality').map((m) => m.id)).toEqual(['gemini-3.8-flash']);
    expect(modelsForRole(CATALOG, 'speech_to_text').map((m) => m.id)).toEqual(['gemini-3.8-flash']);
  });

  it('offers realtime models only for providers Lexora can stream', () => {
    expect(modelsForRole(CATALOG, 'realtime_voice').map((m) => m.id)).toEqual(['gemini-3.8-live']);
  });

  it('keeps deprecated models selectable until shutdown', () => {
    expect(modelsForRole(CATALOG, 'image_gen').map((m) => m.id)).toEqual(['gpt-image-1']);
  });

  it('has an engine list for every role', () => {
    for (const role of MODEL_ROLES) {
      expect(ROLE_ENGINES[role].length).toBeGreaterThan(0);
    }
  });
});

describe('groupLevel', () => {
  it('summarises a group by its role states', () => {
    expect(groupLevel([])).toBe('off');
    expect(groupLevel([status({}), status({ role: 'text_quality' })])).toBe('ready');
    expect(groupLevel([status({}), status({ state: 'needs_key' })])).toBe('partial');
    expect(groupLevel([status({ state: 'needs_key' }), status({ state: 'off' })])).toBe('needs_key');
    expect(groupLevel([status({ state: 'off' }), status({ state: 'unsupported' })])).toBe('off');
  });

  it('groups statuses by their backend group', () => {
    const grouped = statusesByGroup([
      status({}),
      status({ role: 'tts', group: 'voice' }),
      status({ role: 'realtime_voice', group: 'voice' }),
    ]);
    expect(grouped.text).toHaveLength(1);
    expect(grouped.voice.map((s) => s.role)).toEqual(['tts', 'realtime_voice']);
    expect(grouped.images).toEqual([]);
  });
});

describe('targets', () => {
  it('round-trips keys whose model id contains a colon', () => {
    const target = { provider: 'openrouter', model: 'google/gemma-4-31b-it:free' };
    expect(parseTargetKey(targetKey(target))).toEqual(target);
    expect(parseTargetKey('broken')).toBeNull();
    expect(parseTargetKey('gemini:')).toBeNull();
  });

  it('labels known and custom models', () => {
    expect(targetLabel(CATALOG, { provider: 'gemini', model: 'gemini-3.8-flash' })).toBe(
      'Gemini · Gemini 3.8 Flash',
    );
    expect(targetLabel(CATALOG, { provider: 'custom', model: 'qwen3' })).toBe(
      'Ollama / custom server · qwen3',
    );
  });

  it('lists keyed providers used by any chain once, in a stable order', () => {
    const statuses = [
      status({ chain: [{ provider: 'anthropic', model: 'claude-sonnet-5-5' }] }),
      status({
        role: 'tts',
        chain: [
          { provider: 'gemini', model: 'gemini-3.8-flash-lite-tts' },
          { provider: 'system', model: 'say' },
        ],
      }),
      status({ role: 'vision', chain: [{ provider: 'gemini', model: 'gemini-3.8-flash' }] }),
    ];
    expect(providersNeedingKeys(statuses)).toEqual(['gemini', 'anthropic']);
  });

  it('describes model lifecycle', () => {
    expect(statusNote({ kind: 'stable' })).toBeNull();
    expect(statusNote({ kind: 'preview' })).toBe('Preview');
    expect(statusNote({ kind: 'deprecated', shutdown: '2026-12-01' }, 'ru')).toBe('Отключат 2026-12-01');
  });
});

describe('packages', () => {
  it('recommends exactly one package — Gemini', () => {
    expect(MODEL_PACKAGES.filter((p) => p.recommended).map((p) => p.id)).toEqual(['gemini']);
    expect(MODEL_PACKAGES[0]?.id).toBe('gemini');
  });

  it('finds package metadata, custom has none', () => {
    expect(packageMeta('cloudflare')?.needsAccountId).toBe(true);
    expect(packageMeta('local')?.needsBaseUrl).toBe(true);
    expect(packageMeta('custom')).toBeUndefined();
    expect(packageMeta(null)).toBeUndefined();
  });
});

describe('isCloudflareAccountIdInvalid', () => {
  it('accepts empty and 32-hex ids, rejects emails and short ids', () => {
    expect(isCloudflareAccountIdInvalid('')).toBe(false);
    expect(isCloudflareAccountIdInvalid(null)).toBe(false);
    expect(isCloudflareAccountIdInvalid('0123456789abcdef0123456789abcdef')).toBe(false);
    expect(isCloudflareAccountIdInvalid('me@example.com')).toBe(true);
    expect(isCloudflareAccountIdInvalid('abc123')).toBe(true);
  });
});

describe('usage estimate', () => {
  const priced: ModelSpec[] = [
    {
      provider: 'gemini',
      id: 'gemini-3.1-flash-lite-image',
      label: 'Nano Banana 2 Lite',
      capabilities: ['image_generation'],
      tier: 'paid',
      status: { kind: 'stable' },
      price: { unit: 'image', usd: 0.034 },
    },
    {
      provider: 'gemini',
      id: 'gemini-3.8-live',
      label: 'Gemini 3.8 Live',
      capabilities: ['realtime_voice'],
      tier: 'free_tier',
      status: { kind: 'stable' },
      price: { unit: 'minute', usd: 0.023 },
    },
  ];
  const row = (overrides: Partial<AiUsageRow>): AiUsageRow => ({
    role: 'text_fast',
    provider: 'gemini',
    model: 'gemini-3.5-flash-lite',
    requests: 0,
    failures: 0,
    seconds: 0,
    units: 0,
    ...overrides,
  });

  it('prices images and live minutes, leaves text requests unpriced', () => {
    const estimate = estimateUsageCost(
      [
        row({ role: 'image_gen', model: 'gemini-3.1-flash-lite-image', requests: 10, units: 10 }),
        row({ role: 'realtime_voice', model: 'gemini-3.8-live', requests: 2, seconds: 600 }),
        row({ requests: 120 }),
      ],
      priced,
    );
    expect(estimate.perRow[0]).toBeCloseTo(0.34, 5);
    expect(estimate.perRow[1]).toBeCloseTo(0.23, 5);
    expect(estimate.perRow[2]).toBeNull();
    expect(estimate.total).toBeCloseTo(0.57, 5);
    expect(estimate.partial).toBe(true);
  });

  it('describes the amount in the unit that is billed', () => {
    expect(usageAmount(row({ seconds: 754 }), 'ru')).toBe('13 мин');
    expect(usageAmount(row({ seconds: 42 }), 'ru')).toBe('42 с');
    expect(usageAmount(row({ units: 3, requests: 3 }), 'ru')).toBe('3 изображения');
    expect(usageAmount(row({ requests: 21 }), 'ru')).toBe('21 запрос');
    expect(usageAmount(row({ requests: 12 }), 'ru')).toBe('12 запросов');
  });

  it('formats dynamic counts and shutdown dates in English without Russian fragments', () => {
    expect(usageAmount(row({ seconds: 754 }), 'en')).toBe('13 min');
    expect(usageAmount(row({ seconds: 42 }), 'en')).toBe('42 sec');
    expect(usageAmount(row({ units: 3 }), 'en')).toBe('3 images');
    expect(usageAmount(row({ requests: 1 }), 'en')).toBe('1 request');
    expect(statusNote({ kind: 'deprecated', shutdown: '2026-12-01' }, 'en')).toBe('Shuts down 2026-12-01');
  });

  it('formats small sums honestly', () => {
    expect(formatUsd(0)).toBe('$0');
    expect(formatUsd(0.004)).toBe('< $0.01');
    expect(formatUsd(1.234)).toBe('$1.23');
  });
});
