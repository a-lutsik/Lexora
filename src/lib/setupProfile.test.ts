import { describe, expect, it } from 'vitest';
import {
    computeAiReadiness,
    detectProviderByKey,
    isSettingsAiPristine,
    shouldSuggestSetupWizard,
    type AiReadiness,
} from './setupProfile';
import type { AppSettings } from './types';

function baseSettings(overrides: Partial<AppSettings> = {}): AppSettings {
    return {
        primaryLanguage: 'en',
        interfaceLanguage: 'en',
        aiProvider: 'openrouter',
        aiModel: 'minimax/minimax-m3:free',
        customBaseUrl: null,
        cloudflareAccountId: null,
        ttsVoice: 'default',
        stickerCount: 2,
        stickerOpacity: 0.9,
        stickerSources: ['all'],
        quietHoursStart: null,
        quietHoursEnd: null,
        offlineMode: false,
        writingPrivacyMode: false,
        writingAutoCheck: false,
        hotkeyTranslate: 'CmdOrCtrl+Shift+L',
        hotkeyStickers: 'CmdOrCtrl+Shift+S',
        fallbackAiProvider: 'openrouter',
        fallbackAiModel: 'minimax/minimax-m2.7:free',
        fallbackEnabled: true,
        imageModel: 'cloudflare:@cf/black-forest-labs/flux-1-schnell',
        fallbackImageModel: 'gemini:gemini-3.1-flash-image',
        setupProfile: null,
        ttsEngine: 'system',
        ...overrides,
    };
}

const NO_KEYS: Record<string, boolean> = {};

describe('detectProviderByKey', () => {
    it('recognizes OpenAI sk- keys', () => {
        expect(detectProviderByKey('sk-proj-abc123DEF')).toBe('openai');
        expect(detectProviderByKey('  sk-1234  ')).toBe('openai');
    });

    it('recognizes Gemini AIza keys', () => {
        expect(detectProviderByKey('AIzaSyD_xYZabcdefgh1234567890')).toBe('gemini');
    });

    it('recognizes Groq gsk_ keys', () => {
        expect(detectProviderByKey('gsk_xYz98765')).toBe('groq');
    });

    it('returns null for empty or unknown keys', () => {
        expect(detectProviderByKey('')).toBeNull();
        expect(detectProviderByKey('   ')).toBeNull();
        expect(detectProviderByKey('some-random-token')).toBeNull();
        expect(detectProviderByKey('sk-')).toBeNull();
    });
});

describe('computeAiReadiness', () => {
    it('default pristine (openrouter, no keys) → translate off, images limited, audio ready', () => {
        const r = computeAiReadiness(baseSettings(), NO_KEYS);
        expect(r.translate.level).toBe('off');
        expect(r.images.level).toBe('limited');
        expect(r.audio.level).toBe('ready');
    });

    it('offline provider without offlineMode → dictionary translate, stock images, ready audio', () => {
        const r = computeAiReadiness(
            baseSettings({ aiProvider: 'offline', aiModel: 'offline-built-in', imageModel: 'none', fallbackImageModel: 'none' }),
            NO_KEYS,
        );
        expect(r.translate).toMatchObject({ level: 'limited', label: 'Офлайн-словарь' });
        expect(r.images.level).toBe('limited');
        expect(r.audio.level).toBe('ready');
    });

    it('offlineMode=true blocks images but dictionary + system audio still work', () => {
        const r = computeAiReadiness(baseSettings({ offlineMode: true }), {
            openai: true,
            openrouter: true,
        });
        expect(r.translate.level).toBe('limited');
        expect(r.images).toMatchObject({ level: 'off', label: 'Офлайн-режим' });
        expect(r.audio.level).toBe('ready');
    });

    it('OpenAI key enables translate and AI images when models use OpenAI', () => {
        const settings = baseSettings({
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            imageModel: 'openai:gpt-image-1',
            fallbackImageModel: 'none',
        });
        const r = computeAiReadiness(settings, { openai: true });
        expect(r.translate).toMatchObject({ level: 'ready', label: 'AI-перевод (OpenAI)' });
        expect(r.images).toMatchObject({ level: 'ready', label: 'AI-картинки (OpenAI)' });
    });

    it('Gemini key enables translate and AI images when models use Gemini', () => {
        const settings = baseSettings({
            aiProvider: 'gemini',
            aiModel: 'gemini-3.6-flash',
            imageModel: 'gemini:gemini-3.1-flash-image',
            fallbackImageModel: 'none',
        });
        const r = computeAiReadiness(settings, { gemini: true });
        expect(r.translate.level).toBe('ready');
        expect(r.images).toMatchObject({ level: 'ready', label: 'AI-картинки (Gemini)' });
    });

    it('Cloudflare key enables free-tier translate and flux image gen', () => {
        const settings = baseSettings({
            aiProvider: 'cloudflare',
            aiModel: '@cf/meta/llama-3.1-8b-instruct',
            imageModel: 'cloudflare:@cf/black-forest-labs/flux-1-schnell',
            fallbackImageModel: 'none',
        });
        const r = computeAiReadiness(settings, { cloudflare: true });
        expect(r.translate).toMatchObject({ level: 'ready', label: 'AI-перевод (Cloudflare)' });
        expect(r.images).toMatchObject({ level: 'ready', label: 'AI-картинки (Cloudflare)' });
    });

    it('AI image model configured but key missing → stock fallback', () => {
        const settings = baseSettings({
            aiProvider: 'cloudflare',
            aiModel: '@cf/meta/llama-3.1-8b-instruct',
            imageModel: 'cloudflare:@cf/black-forest-labs/flux-1-schnell',
        });
        const r = computeAiReadiness(settings, NO_KEYS);
        expect(r.images).toMatchObject({ level: 'limited', label: 'Фото-сток' });
        expect(r.translate.level).toBe('off');
    });

    it('ttsEngine=openai without key degrades to system voice', () => {
        const r = computeAiReadiness(baseSettings({ ttsEngine: 'openai' }), NO_KEYS);
        expect(r.audio).toMatchObject({ level: 'limited', label: 'Системный голос' });
    });

    it('ttsEngine=openai with key advertises neural voice', () => {
        const r = computeAiReadiness(baseSettings({ ttsEngine: 'openai' }), { openai: true });
        expect(r.audio).toMatchObject({ level: 'ready', label: 'Нейроголос (OpenAI)' });
    });

    it('ttsEngine=gemini needs the Gemini key for the neural voice', () => {
        expect(computeAiReadiness(baseSettings({ ttsEngine: 'gemini' }), NO_KEYS).audio).toMatchObject({
            level: 'limited',
            hint: 'Для нейроголоса нужен ключ Gemini',
        });
        expect(
            computeAiReadiness(baseSettings({ ttsEngine: 'gemini' }), { gemini: true }).audio,
        ).toMatchObject({ level: 'ready', label: 'Нейроголос (Gemini)' });
    });

    it('returns all three capabilities', () => {
        const r: AiReadiness = computeAiReadiness(baseSettings(), NO_KEYS);
        expect(Object.keys(r).sort()).toEqual(['audio', 'images', 'translate']);
    });
});

describe('isSettingsAiPristine', () => {
    it('true for untouched defaults', () => {
        expect(isSettingsAiPristine(baseSettings())).toBe(true);
    });

    it('false after changing AI provider/model', () => {
        expect(isSettingsAiPristine(baseSettings({ aiProvider: 'gemini' }))).toBe(false);
        expect(isSettingsAiPristine(baseSettings({ aiModel: 'custom-model' }))).toBe(false);
    });

    it('false when offlineMode enabled', () => {
        expect(isSettingsAiPristine(baseSettings({ offlineMode: true }))).toBe(false);
        expect(
            isSettingsAiPristine(baseSettings({ modelPackage: 'gemini', offlineMode: true })),
        ).toBe(false);
    });

    it('true for the default Gemini package of a new install (V023)', () => {
        expect(
            isSettingsAiPristine(
                baseSettings({ modelPackage: 'gemini', aiProvider: 'gemini', aiModel: 'gemini-3.8-flash' }),
            ),
        ).toBe(true);
    });

    it('false once a package or scenario was chosen', () => {
        expect(isSettingsAiPristine(baseSettings({ modelPackage: 'openai' }))).toBe(false);
        expect(isSettingsAiPristine(baseSettings({ modelPackage: 'custom' }))).toBe(false);
        expect(
            isSettingsAiPristine(baseSettings({ modelPackage: 'gemini', setupProfile: 'gemini-free' })),
        ).toBe(false);
    });
});

describe('shouldSuggestSetupWizard', () => {
    it('suggests for pristine settings with no keys', () => {
        expect(shouldSuggestSetupWizard(baseSettings(), NO_KEYS)).toBe(true);
    });

    it('does not suggest when any key is present', () => {
        expect(shouldSuggestSetupWizard(baseSettings(), { openai: true })).toBe(false);
    });

    it('does not suggest once a setup profile is chosen', () => {
        expect(
            shouldSuggestSetupWizard(baseSettings({ setupProfile: 'zero' }), NO_KEYS),
        ).toBe(false);
    });

    it('does not suggest for a customized configuration', () => {
        expect(
            shouldSuggestSetupWizard(baseSettings({ aiProvider: 'openai' }), NO_KEYS),
        ).toBe(false);
    });
});
