// ============================================================
// LEXORA — Guided setup: preset catalog & settings builder
// Каждый пресет = пакет моделей (apply_model_package). Бэкенд
// пишет маршруты ролей и зеркалит их в AppSettings; здесь
// buildPresetSettings повторяет это зеркало для превью мастера.
// ============================================================

import type {
    AIProviderName,
    AppSettings,
    SetupProfileName,
} from './types';
import { DEFAULT_IMAGE_MODEL, NONE_IMAGE_MODEL } from './imageModels';
import type { ApplicablePackageId } from './modelRouting';
import type { AiCapabilityId } from './setupProfile';

export type SetupProfileId = Exclude<SetupProfileName, 'advanced' | 'local'>;
export type SetupCard = 'free' | 'paid';

/** Что от пользователя требует шаг (тип ключа). */
export type PresetKeyKind = 'none' | 'openai' | 'gemini' | 'cloudflare';

export type CapabilityBullet = {
    capability: AiCapabilityId;
    text: string;
};

export type SetupPresetMeta = {
    id: SetupProfileId;
    card: SetupCard;
    /** Заголовок шага/карточки. */
    title: string;
    /** Цена для бейджа: «0 ₽», «по использованию». */
    price: string;
    /** Одно-два предложения о преимуществе. */
    tagline: string;
    /** Плюсы (для карточек/шагов). */
    bullets: CapabilityBullet[];
    /** Дополнительные детали для шага (без ключа). */
    notes: string[];
    /** Какой ключ вводит пользователь. */
    keyKind: PresetKeyKind;
    /** Провайдер перевода, чей ключ сохраняется вместе с пакетом. */
    apiKeyProvider?: AIProviderName;
    /** Рекомендуемый вариант (отмечается в мастере). */
    recommended?: boolean;
};

// Идентификаторы моделей = маршруты пакетов (src-tauri providers/models/packages.rs).
const CLOUDFLARE_LLM = '@cf/meta/llama-3.1-8b-instruct';
const OPENAI_LLM = 'gpt-6.1-sol';
const OPENAI_LLM_FALLBACK = 'gpt-6-luna';
const GEMINI_LLM = 'gemini-3.8-flash';
const GEMINI_LLM_FALLBACK = 'gemini-3.5-flash-lite';
const OFFLINE_MODEL = 'offline-built-in';
const OPENAI_IMAGE = 'openai:gpt-image-2.5-flare';
const GEMINI_IMAGE = 'gemini:gemini-3.1-flash-lite-image';

/** Бесплатные сценарии: Gemini (рекомендуем), «без ключей», Cloudflare. */
export const FREE_PRESETS: SetupPresetMeta[] = [
    {
        id: 'gemini-free',
        card: 'free',
        title: 'Google Gemini — один бесплатный ключ',
        price: '0 ₽',
        tagline:
            'Один бесплатный ключ включает AI-перевод, перевод фото и голоса, живой диалог и синхронный перевод.',
        bullets: [
            { capability: 'translate', text: 'AI-перевод и перевод фото (Gemini 3.8 Flash)' },
            { capability: 'images', text: 'Свободные фото к словам (Wikimedia)' },
            { capability: 'audio', text: 'Нейроголос, живой диалог и синхронный перевод' },
        ],
        notes: [
            'Ключ бесплатно на aistudio.google.com',
            'Бесплатный тариф покрывает обычное ежедневное использование',
            'AI-иллюстрации к словам можно включить позже (платно)',
        ],
        keyKind: 'gemini',
        apiKeyProvider: 'gemini',
        recommended: true,
    },
    {
        id: 'zero',
        card: 'free',
        title: 'Без ключей',
        price: '0 ₽',
        tagline:
            'Работает сразу и приватно: встроенный словарь, системный голос и свободные фото. Ничего не нужно вводить.',
        bullets: [
            { capability: 'translate', text: 'Перевод по встроенному словарю' },
            { capability: 'images', text: 'Свободные изображения (Wikimedia)' },
            { capability: 'audio', text: 'Озвучка системным голосом macOS' },
        ],
        notes: [
            'Без интернета и без ключей',
            'Нет AI-перевода целых фраз и нейроголоса',
        ],
        keyKind: 'none',
    },
    {
        id: 'free-cloudflare',
        card: 'free',
        title: 'Один бесплатный ключ Cloudflare',
        price: '0 ₽/день',
        tagline:
            'Бесплатный тариф каждый день: AI-перевод (Llama) и генерация картинок (FLUX). Нужна только бесплатная учётка Cloudflare.',
        bullets: [
            { capability: 'translate', text: 'AI-перевод (Llama, бесплатно ежедневно)' },
            { capability: 'images', text: 'AI-генерация картинок (FLUX.1 Schnell)' },
            { capability: 'audio', text: 'Озвучка системным голосом macOS' },
        ],
        notes: [
            'Бесплатная учётка на dashboard.cloudflare.com',
            'Понадобятся Account ID и API-токен (2 минуты)',
            'Лимит ~10 000 запросов в день',
        ],
        keyKind: 'cloudflare',
        apiKeyProvider: 'cloudflare',
    },
];

/** Платные сценарии: один ключ на перевод + картинки. */
export const PAID_PRESETS: SetupPresetMeta[] = [
    {
        id: 'paid-openai',
        card: 'paid',
        title: 'OpenAI — один ключ на всё',
        price: 'по использованию',
        tagline:
            'Один ключ OpenAI включает перевод и генерацию картинок. Высокое качество и надёжность из коробки.',
        bullets: [
            { capability: 'translate', text: 'AI-перевод (GPT-6.1 Sol)' },
            { capability: 'images', text: 'AI-генерация картинок (GPT Image 2.5 Flare)' },
            { capability: 'audio', text: 'Нейроголос и распознавание речи OpenAI' },
        ],
        notes: [
            'Понадобится ключ с platform.openai.com',
            'Оплата за использование (очень дёшево для изучения языка)',
        ],
        keyKind: 'openai',
        apiKeyProvider: 'openai',
    },
    {
        id: 'paid-gemini',
        card: 'paid',
        title: 'Google Gemini + AI-иллюстрации',
        price: 'по использованию',
        tagline:
            'Всё из бесплатного Gemini плюс AI-картинки к словам. Картинки не входят в бесплатный тариф (~$0.03 за штуку).',
        bullets: [
            { capability: 'translate', text: 'AI-перевод и перевод фото (Gemini 3.8 Flash)' },
            { capability: 'images', text: 'AI-иллюстрации (Nano Banana 2 Lite)' },
            { capability: 'audio', text: 'Нейроголос, живой диалог и синхронный перевод' },
        ],
        notes: [
            'Ключ на aistudio.google.com с подключённой оплатой',
            'Текст и голос остаются в бесплатных лимитах',
        ],
        keyKind: 'gemini',
        apiKeyProvider: 'gemini',
    },
];

export const ALL_PRESETS: SetupPresetMeta[] = [...FREE_PRESETS, ...PAID_PRESETS];

export function presetMeta(id: SetupProfileId): SetupPresetMeta | undefined {
    return ALL_PRESETS.find((p) => p.id === id);
}

export type PresetExtras = {
    cloudflareAccountId?: string | null;
};

/** Пакет моделей, который включает сценарий мастера. */
export function presetPackage(id: SetupProfileId): {
    package: ApplicablePackageId;
    illustrations: boolean;
} {
    switch (id) {
        case 'gemini-free':
            return { package: 'gemini', illustrations: false };
        case 'paid-gemini':
            return { package: 'gemini', illustrations: true };
        case 'paid-openai':
            return { package: 'openai', illustrations: true };
        case 'free-cloudflare':
            return { package: 'cloudflare', illustrations: false };
        case 'zero':
            return { package: 'offline', illustrations: false };
    }
}

/** Дефолты, если в `current` чего-то не хватает (на случай старых строк БД). */
const DEFAULT_HOTKEY_TRANSLATE = 'CmdOrCtrl+Shift+L';
const DEFAULT_HOTKEY_STICKERS = 'CmdOrCtrl+Shift+S';
const DEFAULT_HOTKEY_VOICE_TRANSLATE = 'CmdOrCtrl+Shift+Space';

/**
 * Строит ПОЛНЫЙ AppSettings для сценария поверх текущих настроек — то же
 * зеркало маршрутов, что сохранит бэкенд (для превью готовности в мастере).
 * Сохраняет языки, хоткеи, количество/прозрачность стикеров — меняет только
 * AI-конфигурацию и setupProfile.
 */
export function buildPresetSettings(
    current: AppSettings,
    id: SetupProfileId,
    extras?: PresetExtras,
): AppSettings {
    const base: AppSettings = {
        // Личные настройки — переносим без изменений.
        primaryLanguage: current.primaryLanguage,
        interfaceLanguage: current.interfaceLanguage,
        ttsVoice: current.ttsVoice || 'default',
        stickerCount: current.stickerCount ?? 2,
        stickerOpacity: current.stickerOpacity ?? 0.9,
        stickerSources: current.stickerSources ?? ['all'],
        quietHoursStart: current.quietHoursStart ?? null,
        quietHoursEnd: current.quietHoursEnd ?? null,
        writingPrivacyMode: current.writingPrivacyMode ?? false,
        writingAutoCheck: current.writingAutoCheck ?? false,
        hotkeyTranslate: current.hotkeyTranslate || DEFAULT_HOTKEY_TRANSLATE,
        hotkeyStickers: current.hotkeyStickers || DEFAULT_HOTKEY_STICKERS,
        hotkeyVoiceTranslate: current.hotkeyVoiceTranslate || DEFAULT_HOTKEY_VOICE_TRANSLATE,

        // AI-часть: дефолт «ничего не требует ключа», ниже переопределяется.
        aiProvider: 'offline',
        aiModel: OFFLINE_MODEL,
        customBaseUrl: null,
        cloudflareAccountId: null,
        offlineMode: false,
        fallbackAiProvider: null,
        fallbackAiModel: null,
        fallbackEnabled: false,
        imageModel: NONE_IMAGE_MODEL,
        fallbackImageModel: NONE_IMAGE_MODEL,

        setupProfile: id,
        ttsEngine: 'system',
        modelPackage: presetPackage(id).package,
    };

    switch (id) {
        case 'zero':
            // Всё по умолчанию из base.
            break;
        case 'gemini-free':
            base.aiProvider = 'gemini';
            base.aiModel = GEMINI_LLM;
            base.fallbackAiProvider = 'gemini';
            base.fallbackAiModel = GEMINI_LLM_FALLBACK;
            base.fallbackEnabled = true;
            base.ttsEngine = 'gemini';
            break;
        case 'free-cloudflare':
            base.aiProvider = 'cloudflare';
            base.aiModel = CLOUDFLARE_LLM;
            base.cloudflareAccountId = extras?.cloudflareAccountId?.trim() || null;
            base.imageModel = DEFAULT_IMAGE_MODEL; // cloudflare FLUX.1 Schnell
            break;
        case 'paid-openai':
            base.aiProvider = 'openai';
            base.aiModel = OPENAI_LLM;
            base.fallbackAiProvider = 'openai';
            base.fallbackAiModel = OPENAI_LLM_FALLBACK;
            base.fallbackEnabled = true;
            base.imageModel = OPENAI_IMAGE;
            base.ttsEngine = 'openai';
            break;
        case 'paid-gemini':
            base.aiProvider = 'gemini';
            base.aiModel = GEMINI_LLM;
            base.fallbackAiProvider = 'gemini';
            base.fallbackAiModel = GEMINI_LLM_FALLBACK;
            base.fallbackEnabled = true;
            base.imageModel = GEMINI_IMAGE;
            base.ttsEngine = 'gemini';
            break;
        default:
            break;
    }

    return base;
}
