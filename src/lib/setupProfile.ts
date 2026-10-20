// ============================================================
// LEXORA — Guided AI setup: types, key detection, readiness
// Pure functions (no I/O) — fully unit-testable.
//
// Семантика возможностей (сверено с бэкендом):
//  - Перевод: AI-провайдеру нужен ключ (openai/gemini/groq/openrouter/
//    cloudflare). offlineMode==true или aiProvider=='offline' → только
//    встроенный словарь/кэш переводов.
//  - Картинки: offlineMode блокирует сеть. AI-генерация требует ключ
//    провайдера image-модели; без ключа работают свободные фото
//    Wikimedia/Unsplash.
//  - Аудио: системный голос (macOS `say`) работает всегда и офлайн;
//    нейроголоса Gemini / OpenAI — только с ключом (движок `gemini`/`openai`).
// ============================================================

import type {
    AIProviderName,
    AppSettings,
    SetupProfileName,
} from './types';
import {
    DEFAULT_FALLBACK_IMAGE_MODEL,
    DEFAULT_IMAGE_MODEL,
    imageModelProvider,
    type ImageModelProvider,
} from './imageModels';

export type AiCapabilityId = 'translate' | 'images' | 'audio';

export type AiCapabilityLevel = 'ready' | 'limited' | 'off';

export type AiCapability = {
    id: AiCapabilityId;
    level: AiCapabilityLevel;
    /** Короткий заголовок для чипа: «AI-перевод (Gemini)», «Фото-сток»… */
    label: string;
    /** Дополнительное пояснение-подсказка. */
    hint?: string;
};

export type AiReadiness = Record<AiCapabilityId, AiCapability>;

/** Все сценарии быстрой настройки (включая «расширенный»). */
export const SETUP_PROFILE_NAMES: SetupProfileName[] = [
    'gemini-free',
    'zero',
    'free-cloudflare',
    'paid-openai',
    'paid-gemini',
    'local',
    'advanced',
];

/** Провайдеры перевода, которым нужен API-ключ. */
const KEYED_TRANSLATE_PROVIDERS: ReadonlySet<AIProviderName> = new Set([
    'cloudflare',
    'openrouter',
    'groq',
    'deepseek',
    'openai',
    'gemini',
    'anthropic',
]);

/** Провайдеры AI-генерации изображений (imageModels.ts). */
const KEYED_IMAGE_PROVIDERS: ReadonlySet<ImageModelProvider> = new Set([
    'cloudflare',
    'gemini',
    'openai',
]);

export const AI_PROVIDER_LABELS: Record<AIProviderName, string> = {
    cloudflare: 'Cloudflare',
    openrouter: 'OpenRouter',
    groq: 'Groq',
    deepseek: 'DeepSeek',
    custom: 'Локальная модель',
    openai: 'OpenAI',
    gemini: 'Gemini',
    anthropic: 'Anthropic',
    offline: 'Офлайн-словарь',
};

/**
 * Угадать провайдера по форме ключа. Надёжно только для ключей
 * с устойчивым префиксом: OpenAI `sk-…`, Gemini `AIza…`, Groq `gsk_…`.
 */
export function detectProviderByKey(key: string): AIProviderName | null {
    const k = key.trim();
    if (!k) return null;
    if (/^sk-[A-Za-z0-9_-]+$/i.test(k)) return 'openai';
    // Классические ключи `AIza…` и новые ключи Google AI Studio вида `AQ.…`.
    if (/^AIza[0-9A-Za-z_-]{20,}$/.test(k)) return 'gemini';
    if (/^AQ\.[0-9A-Za-z_.-]{20,}$/.test(k)) return 'gemini';
    if (/^gsk_[A-Za-z0-9_-]+$/i.test(k)) return 'groq';
    return null;
}

function hasKey(provider: string, keysStatus: Record<string, boolean>): boolean {
    return keysStatus[provider] === true;
}

function translateReadiness(
    settings: AppSettings,
    keysStatus: Record<string, boolean>,
): AiCapability {
    const provider: AIProviderName = settings.aiProvider ?? 'openrouter';

    if (settings.offlineMode === true || provider === 'offline') {
        return {
            id: 'translate',
            level: 'limited',
            label: 'Офлайн-словарь',
            hint: 'Встроенный словарь и сохранённые переводы — без ключей и интернета',
        };
    }

    if (provider === 'custom') {
        if (settings.customBaseUrl?.trim()) {
            return { id: 'translate', level: 'ready', label: 'Локальная модель (Ollama)' };
        }
        return {
            id: 'translate',
            level: 'off',
            label: 'Локальная модель не настроена',
            hint: 'Укажите адрес сервера в расширенных настройках',
        };
    }

    if (KEYED_TRANSLATE_PROVIDERS.has(provider)) {
        if (hasKey(provider, keysStatus)) {
            return {
                id: 'translate',
                level: 'ready',
                label: `AI-перевод (${AI_PROVIDER_LABELS[provider]})`,
            };
        }
        return {
            id: 'translate',
            level: 'off',
            label: 'Нужен API-ключ',
            hint: `${AI_PROVIDER_LABELS[provider]}: без ключа перевод не работает`,
        };
    }

    return {
        id: 'translate',
        level: 'off',
        label: 'Провайдер не настроен',
        hint: 'Выберите сценарий быстрой настройки или расширенные настройки',
    };
}

function imagesReadiness(
    settings: AppSettings,
    keysStatus: Record<string, boolean>,
): AiCapability {
    if (settings.offlineMode === true) {
        return {
            id: 'images',
            level: 'off',
            label: 'Офлайн-режим',
            hint: 'Изображения требуют сеть — отключите офлайн-режим в настройках',
        };
    }

    const configuredAi = [
        imageModelProvider(settings.imageModel),
        imageModelProvider(settings.fallbackImageModel),
    ].filter((p): p is ImageModelProvider => p !== null);

    const readyAi = configuredAi.find((p) => KEYED_IMAGE_PROVIDERS.has(p) && hasKey(p, keysStatus));

    if (readyAi) {
        return {
            id: 'images',
            level: 'ready',
            label: `AI-картинки (${AI_PROVIDER_LABELS[readyAi]})`,
        };
    }

    if (configuredAi.length > 0) {
        return {
            id: 'images',
            level: 'limited',
            label: 'Фото-сток',
            hint: 'AI-ключ не найден — показываем свободные фото Wikimedia/Unsplash',
        };
    }

    return {
        id: 'images',
        level: 'limited',
        label: 'Фото-сток',
        hint: 'Свободные изображения Wikimedia — без ключей',
    };
}

function audioReadiness(
    settings: AppSettings,
    keysStatus: Record<string, boolean>,
): AiCapability {
    const engine = settings.ttsEngine ?? 'system';

    if (engine === 'openai' || engine === 'gemini') {
        const label = AI_PROVIDER_LABELS[engine];
        if (hasKey(engine, keysStatus)) {
            return { id: 'audio', level: 'ready', label: `Нейроголос (${label})` };
        }
        return {
            id: 'audio',
            level: 'limited',
            label: 'Системный голос',
            hint: `Для нейроголоса нужен ключ ${label}`,
        };
    }

    return {
        id: 'audio',
        level: 'ready',
        label: 'Системный голос',
        hint: 'macOS — без ключей, работает офлайн',
    };
}

/** Полная сводка готовности трёх возможностей по текущим настройкам и ключам. */
export function computeAiReadiness(
    settings: AppSettings,
    keysStatus: Record<string, boolean>,
): AiReadiness {
    return {
        translate: translateReadiness(settings, keysStatus),
        images: imagesReadiness(settings, keysStatus),
        audio: audioReadiness(settings, keysStatus),
    };
}

/**
 * Настройки AI «нетронуты» (совпадают с дефолтами новой установки)?
 * Используется как эвристика первого запуска: если пользователь ещё не
 * менял AI-настройки и не выбрал сценарий — предложить SetupWizard.
 */
export function isSettingsAiPristine(settings: AppSettings): boolean {
    if (settings.offlineMode === true) return false;
    // V023+: an untouched install sits on the default Gemini package without a
    // chosen scenario; any other package means the user picked one.
    if (settings.modelPackage) {
        return settings.modelPackage === 'gemini' && !settings.setupProfile;
    }
    return (
        (settings.aiProvider ?? 'openrouter') === 'openrouter' &&
        (settings.aiModel ?? 'minimax/minimax-m3:free') === 'minimax/minimax-m3:free' &&
        settings.fallbackEnabled !== false &&
        (settings.imageModel ?? DEFAULT_IMAGE_MODEL) === DEFAULT_IMAGE_MODEL &&
        (settings.fallbackImageModel ?? DEFAULT_FALLBACK_IMAGE_MODEL) ===
        DEFAULT_FALLBACK_IMAGE_MODEL
    );
}

/**
 * Показывать ли SetupWizard автоматически: сценарий ещё не выбран,
 * AI-настройки не тронуты и ни одного ключа не сохранено.
 */
export function shouldSuggestSetupWizard(
    settings: AppSettings,
    keysStatus: Record<string, boolean>,
): boolean {
    if (settings.setupProfile) return false;
    if (!isSettingsAiPristine(settings)) return false;
    return !Object.values(keysStatus).some(Boolean);
}
