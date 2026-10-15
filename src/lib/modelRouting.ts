import { pluralize } from './utils';
import { getLocale, translate } from '../i18n';
// ============================================================
// LEXORA — AI model routing: labels, packages, pure helpers
// Mirrors src-tauri/src/providers/models/{roles,router}.rs.
// No I/O — fully unit-testable.
// ============================================================

import type {
  AiUsageRow,
  ModelCapability,
  ModelPackageId,
  ModelRole,
  ModelSpec,
  ModelStatus,
  ModelTier,
  RoleGroup,
  RoleState,
  RoleStatus,
  RouteTarget,
} from './types';

export const MODEL_ROLES: ModelRole[] = [
  'text_fast',
  'text_quality',
  'vision',
  'speech_to_text',
  'realtime_voice',
  'live_interpreter',
  'tts',
  'image_gen',
];

export const ROLE_LABELS: Record<ModelRole, string> = {
  text_fast: 'Быстрый перевод',
  text_quality: 'Качественный текст',
  vision: 'Перевод картинок',
  speech_to_text: 'Распознавание речи',
  realtime_voice: 'Живой диалог',
  live_interpreter: 'Синхронный перевод',
  tts: 'Озвучка',
  image_gen: 'Иллюстрации',
};

/** Where the role is used — shown under the role name. */
export const ROLE_HINTS: Record<ModelRole, string> = {
  text_fast: 'Попап, слова, подсказки',
  text_quality: 'Письмо, диалог, разбор ошибок',
  vision: 'Фото, скриншоты, документы',
  speech_to_text: 'Голосовые ответы и перевод аудио',
  realtime_voice: 'Разговор голосом в реальном времени',
  live_interpreter: 'Речь → речь на другом языке',
  tts: 'Произношение слов и фраз',
  image_gen: 'AI-картинки к словам',
};

export const ROLE_CAPABILITY: Record<ModelRole, ModelCapability> = {
  text_fast: 'text',
  text_quality: 'text',
  vision: 'vision',
  speech_to_text: 'transcription',
  realtime_voice: 'realtime_voice',
  live_interpreter: 'live_translation',
  tts: 'speech',
  image_gen: 'image_generation',
};

/** Providers Lexora can drive per role (router.rs `engine_supports`). */
export const ROLE_ENGINES: Record<ModelRole, readonly string[]> = {
  text_fast: ['gemini', 'openai', 'anthropic', 'openrouter', 'groq', 'cloudflare', 'custom'],
  text_quality: ['gemini', 'openai', 'anthropic', 'openrouter', 'groq', 'cloudflare', 'custom'],
  vision: ['gemini', 'openai', 'anthropic', 'openrouter', 'custom'],
  speech_to_text: ['gemini', 'openai', 'groq', 'openrouter', 'custom'],
  realtime_voice: ['gemini'],
  live_interpreter: ['gemini'],
  tts: ['system', 'gemini', 'openai'],
  image_gen: ['gemini', 'openai', 'cloudflare'],
};

/** Providers whose API key lives in the key store (router.rs `needs_key`). */
export const KEYED_PROVIDERS: readonly string[] = [
  'gemini',
  'openai',
  'anthropic',
  'openrouter',
  'groq',
  'cloudflare',
];

export const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  groq: 'Groq',
  cloudflare: 'Cloudflare',
  custom: 'Ollama / свой сервер',
  system: 'macOS',
  offline: 'Офлайн',
};

export function providerLabel(provider: string): string {
  return translate(getLocale(), PROVIDER_LABELS[provider] ?? provider);
}

export type RoleGroupMeta = {
  id: RoleGroup;
  title: string;
  description: string;
};

export const ROLE_GROUPS: RoleGroupMeta[] = [
  { id: 'text', title: 'Текст', description: 'Перевод, письмо, объяснения' },
  { id: 'images', title: 'Картинки', description: 'Перевод фото и скриншотов' },
  { id: 'voice', title: 'Голос', description: 'Речь, живой диалог, озвучка' },
  { id: 'illustrations', title: 'Иллюстрации', description: 'AI-картинки к словам (платно)' },
];

export const ROLE_STATE_LABELS: Record<RoleState, string> = {
  ready: 'Готово',
  needs_key: 'Нужен ключ',
  unavailable: 'Недоступно',
  unsupported: 'Не поддерживается',
  off: 'Выключено',
};

export const TIER_LABELS: Record<ModelTier, string> = {
  local: 'Локально',
  free: 'Бесплатно',
  free_tier: 'Бесплатный тариф',
  paid: 'Платно',
};

export type GroupLevel = 'ready' | 'partial' | 'needs_key' | 'off';

export const GROUP_LEVEL_LABELS: Record<GroupLevel, string> = {
  ready: 'Готово',
  partial: 'Частично',
  needs_key: 'Нужен ключ',
  off: 'Выключено',
};

/** Summary of a role group: all ready / some ready / waiting for a key / off. */
export function groupLevel(statuses: RoleStatus[]): GroupLevel {
  if (statuses.length === 0) return 'off';
  const ready = statuses.filter((s) => s.state === 'ready').length;
  if (ready === statuses.length) return 'ready';
  if (ready > 0) return 'partial';
  if (statuses.some((s) => s.state === 'needs_key')) return 'needs_key';
  return 'off';
}

export function statusesByGroup(statuses: RoleStatus[]): Record<RoleGroup, RoleStatus[]> {
  const grouped: Record<RoleGroup, RoleStatus[]> = {
    text: [],
    images: [],
    voice: [],
    illustrations: [],
  };
  for (const status of statuses) {
    grouped[status.group].push(status);
  }
  return grouped;
}

export function findSpec(
  catalog: readonly ModelSpec[],
  target: RouteTarget,
): ModelSpec | undefined {
  return catalog.find((m) => m.provider === target.provider && m.id === target.model);
}

/** «Gemini · Gemini 3.8 Flash»; unknown custom names show the raw id. */
export function targetLabel(catalog: readonly ModelSpec[], target: RouteTarget): string {
  const spec = findSpec(catalog, target);
  return `${providerLabel(target.provider)} · ${spec ? translate(getLocale(), spec.label) : target.model}`;
}

export function isRetired(status: ModelStatus): boolean {
  return status.kind === 'retired';
}

/** Short lifecycle note for a model: preview / shutdown date. */
export function statusNote(status: ModelStatus, locale = getLocale()): string | null {
  switch (status.kind) {
    case 'preview':
      return translate(locale, 'Preview');
    case 'deprecated':
      return locale === 'ru' ? `Отключат ${status.shutdown}` : translate(locale, 'Shuts down {date}', { date: status.shutdown });
    case 'retired':
      return locale === 'ru' ? 'Снята с поддержки' : translate(locale, 'Retired');
    case 'stable':
      return null;
  }
}

/** Catalog models a role can use: right capability, live engine, not retired. */
export function modelsForRole(catalog: readonly ModelSpec[], role: ModelRole): ModelSpec[] {
  const capability = ROLE_CAPABILITY[role];
  const engines = ROLE_ENGINES[role];
  return catalog.filter(
    (m) =>
      m.capabilities.includes(capability) &&
      engines.includes(m.provider) &&
      !isRetired(m.status),
  );
}

export function targetKey(target: RouteTarget): string {
  return `${target.provider}:${target.model}`;
}

/** Inverse of `targetKey`; the model id may itself contain ':'. */
export function parseTargetKey(key: string): RouteTarget | null {
  const colon = key.indexOf(':');
  if (colon <= 0 || colon === key.length - 1) return null;
  return { provider: key.slice(0, colon), model: key.slice(colon + 1) };
}

/** Distinct keyed providers used by any route chain. */
export function providersNeedingKeys(statuses: readonly RoleStatus[]): string[] {
  const seen = new Set<string>();
  for (const status of statuses) {
    for (const target of status.chain) {
      if (KEYED_PROVIDERS.includes(target.provider)) {
        seen.add(target.provider);
      }
    }
  }
  return KEYED_PROVIDERS.filter((p) => seen.has(p));
}

export function routesUseProvider(statuses: readonly RoleStatus[], provider: string): boolean {
  return statuses.some((s) => s.chain.some((t) => t.provider === provider));
}

// ── Usage («Расходы AI») ───────────────────────────────────

export type UsageEstimate = {
  /** USD for rows with a known unit price, null otherwise. */
  perRow: Array<number | null>;
  total: number;
  /** Some rows have no price (text requests, unknown models). */
  partial: boolean;
};

/** Estimate from published unit prices: images × price, live minutes × price. */
export function estimateUsageCost(
  rows: readonly AiUsageRow[],
  catalog: readonly ModelSpec[],
): UsageEstimate {
  let total = 0;
  let partial = false;
  const perRow = rows.map((row) => {
    const price = findSpec(catalog, row)?.price ?? null;
    if (!price) {
      partial = true;
      return null;
    }
    const cost = price.unit === 'image' ? row.units * price.usd : (row.seconds / 60) * price.usd;
    total += cost;
    return cost;
  });
  return { perRow, total, partial };
}

/** «12 мин», «45 с», «3 картинки», «28 запросов». */
export function usageAmount(row: AiUsageRow, locale = getLocale()): string {
  if (row.seconds > 0) {
    return row.seconds >= 60
      ? translate(locale, '{count} min', { count: Math.round(row.seconds / 60) })
      : translate(locale, '{count} sec', { count: Math.round(row.seconds) });
  }
  return row.units > 0
    ? pluralize(row.units, 'image', 'images', locale)
    : pluralize(row.requests, 'request', 'requests', locale);
}

export function formatUsd(value: number): string {
  if (getLocale() !== 'en') {
    const formatted = new Intl.NumberFormat(getLocale(), {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: value === 0 ? 0 : 2,
    }).format(value > 0 && value < 0.01 ? 0.01 : value);
    return value > 0 && value < 0.01 ? `< ${formatted}` : formatted;
  }
  if (value === 0) return '$0';
  return value < 0.01 ? '< $0.01' : `$${value.toFixed(2)}`;
}

// ── Packages ───────────────────────────────────────────────

export type ApplicablePackageId = Exclude<ModelPackageId, 'custom'>;

export type ModelPackageMeta = {
  id: ApplicablePackageId;
  title: string;
  price: string;
  tagline: string;
  /** Provider whose key the package needs. */
  keyProvider: 'gemini' | 'openai' | 'cloudflare' | null;
  recommended?: boolean;
  /** Paid AI illustrations can be switched on. */
  paidIllustrations?: boolean;
  needsAccountId?: boolean;
  needsBaseUrl?: boolean;
};

export const MODEL_PACKAGES: ModelPackageMeta[] = [
  {
    id: 'gemini',
    title: 'Google Gemini',
    price: 'Бесплатный тариф',
    tagline: 'Один ключ на всё: перевод, фото, голос, живой диалог и синхронный перевод.',
    keyProvider: 'gemini',
    recommended: true,
    paidIllustrations: true,
  },
  {
    id: 'openai',
    title: 'OpenAI',
    price: 'По использованию',
    tagline: 'Сильный текст, распознавание и нейроголос. Живой голос пока только у Gemini.',
    keyProvider: 'openai',
    paidIllustrations: true,
  },
  {
    id: 'cloudflare',
    title: 'Cloudflare',
    price: '0 ₽/день',
    tagline: 'Бесплатный текст (Llama) и картинки FLUX. Без фото и распознавания речи.',
    keyProvider: 'cloudflare',
    needsAccountId: true,
  },
  {
    id: 'local',
    title: 'Локально (Ollama)',
    price: '0 ₽',
    tagline: 'Модели на вашем Mac: текст и фото без облака. Голос — системный.',
    keyProvider: null,
    needsBaseUrl: true,
  },
  {
    id: 'offline',
    title: 'Без AI',
    price: '0 ₽',
    tagline: 'Встроенный словарь, свободные фото и системный голос. Никаких ключей.',
    keyProvider: null,
  },
];

export function packageMeta(id: ModelPackageId | null | undefined): ModelPackageMeta | undefined {
  return MODEL_PACKAGES.find((p) => p.id === id);
}

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434/v1';

const CLOUDFLARE_ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/;

export const CLOUDFLARE_ACCOUNT_ID_WARNING =
  'Account ID — 32 hex-символа из адреса Cloudflare Dashboard, не email';

/** Empty is "not entered yet", not invalid. */
export function isCloudflareAccountIdInvalid(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '') return false;
  return trimmed.includes('@') || !CLOUDFLARE_ACCOUNT_ID_PATTERN.test(trimmed);
}

/** Where to get the key of a package provider. */
export const KEY_HINTS: Record<string, string> = {
  gemini: 'Бесплатный ключ — aistudio.google.com → Get API key',
  openai: 'platform.openai.com → API keys',
  cloudflare: 'Cloudflare Dashboard → My Profile → API Tokens → Create Token',
  anthropic: 'console.anthropic.com → API Keys',
  openrouter: 'openrouter.ai → Keys',
  groq: 'console.groq.com → API Keys',
};
