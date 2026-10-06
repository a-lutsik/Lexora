import { describe, expect, it } from 'vitest';
import {
    ALL_PRESETS,
    FREE_PRESETS,
    PAID_PRESETS,
    buildPresetSettings,
    presetMeta,
    presetPackage,
} from './setupPresets';
import { DEFAULT_IMAGE_MODEL, NONE_IMAGE_MODEL } from './imageModels';
import type { AppSettings, SetupProfileName } from './types';

function baseSettings(overrides: Partial<AppSettings> = {}): AppSettings {
    return {
        primaryLanguage: 'ru',
        interfaceLanguage: 'ru',
        aiProvider: 'openrouter',
        aiModel: 'minimax/minimax-m3:free',
        customBaseUrl: null,
        cloudflareAccountId: null,
        ttsVoice: 'default',
        stickerCount: 3,
        stickerOpacity: 0.85,
        stickerSources: ['all'],
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        offlineMode: false,
        writingPrivacyMode: true,
        writingAutoCheck: true,
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

const CLOUDFLARE_ACC = 'cf-account-123';

describe('preset catalog', () => {
    it('covers every guided setup profile exactly once', () => {
        const ids = ALL_PRESETS.map((p) => p.id);
        expect(ids).toEqual(['gemini-free', 'zero', 'free-cloudflare', 'paid-openai', 'paid-gemini']);
        for (const id of ids) {
            expect(presetMeta(id)).toBeDefined();
        }
        expect(presetMeta('zero')?.card).toBe('free');
        expect(presetMeta('paid-gemini')?.card).toBe('paid');
    });

    it('free card starts with the recommended Gemini key, then no-key and cloudflare', () => {
        expect(FREE_PRESETS.map((p) => p.id)).toEqual(['gemini-free', 'zero', 'free-cloudflare']);
        expect(FREE_PRESETS[0]?.keyKind).toBe('gemini');
        expect(FREE_PRESETS[1]?.keyKind).toBe('none');
        expect(FREE_PRESETS[2]?.keyKind).toBe('cloudflare');
    });

    it('maps every preset to a model package', () => {
        expect(presetPackage('gemini-free')).toEqual({ package: 'gemini', illustrations: false });
        expect(presetPackage('paid-gemini')).toEqual({ package: 'gemini', illustrations: true });
        expect(presetPackage('paid-openai')).toEqual({ package: 'openai', illustrations: true });
        expect(presetPackage('free-cloudflare')).toEqual({ package: 'cloudflare', illustrations: false });
        expect(presetPackage('zero')).toEqual({ package: 'offline', illustrations: false });
    });

    it('paid card contains openai and gemini variants', () => {
        expect(PAID_PRESETS.map((p) => p.id)).toEqual(['paid-openai', 'paid-gemini']);
    });

    it('every preset carries marketing text and capability bullets', () => {
        for (const p of ALL_PRESETS) {
            expect(p.title.length).toBeGreaterThan(0);
            expect(p.tagline.length).toBeGreaterThan(0);
            expect(p.bullets.length).toBeGreaterThanOrEqual(3);
            expect(p.notes.length).toBeGreaterThan(0);
        }
    });
});

describe('buildPresetSettings', () => {
    it('keeps personal preferences untouched for every preset', () => {
        for (const p of ALL_PRESETS) {
            const s = buildPresetSettings(baseSettings(), p.id);
            expect(s.primaryLanguage).toBe('ru');
            expect(s.interfaceLanguage).toBe('ru');
            expect(s.hotkeyTranslate).toBe('CmdOrCtrl+Shift+L');
            expect(s.stickerCount).toBe(3);
            expect(s.stickerOpacity).toBeCloseTo(0.85);
            expect(s.quietHoursStart).toBe('22:00');
            expect(s.writingPrivacyMode).toBe(true);
        }
    });

    it('zero: offline dictionary, network enabled for stock photos, no AI images', () => {
        const s = buildPresetSettings(baseSettings(), 'zero');
        expect(s.setupProfile).toBe('zero');
        expect(s.aiProvider).toBe('offline');
        expect(s.aiModel).toBe('offline-built-in');
        expect(s.offlineMode).toBe(false);
        expect(s.imageModel).toBe(NONE_IMAGE_MODEL);
        expect(s.fallbackImageModel).toBe(NONE_IMAGE_MODEL);
        expect(s.fallbackAiProvider).toBeNull();
        expect(s.fallbackEnabled).toBe(false);
    });

    it('free-cloudflare: cloudflare provider, account id, flux images', () => {
        const s = buildPresetSettings(baseSettings(), 'free-cloudflare', {
            cloudflareAccountId: CLOUDFLARE_ACC,
        });
        expect(s.aiProvider).toBe('cloudflare');
        expect(s.aiModel).toBe('@cf/meta/llama-3.1-8b-instruct');
        expect(s.cloudflareAccountId).toBe(CLOUDFLARE_ACC);
        expect(s.imageModel).toBe(DEFAULT_IMAGE_MODEL);
        expect(s.fallbackImageModel).toBe(NONE_IMAGE_MODEL);
        expect(s.offlineMode).toBe(false);
        expect(s.setupProfile).toBe('free-cloudflare');
    });

    it('free-cloudflare: account id is trimmed and cleared when empty', () => {
        const withSpace = buildPresetSettings(baseSettings(), 'free-cloudflare', {
            cloudflareAccountId: '  ',
        });
        expect(withSpace.cloudflareAccountId).toBeNull();
    });

    it('gemini-free: Gemini text with same-key fallback, Gemini voice, no paid images', () => {
        const s = buildPresetSettings(baseSettings(), 'gemini-free');
        expect(s.aiProvider).toBe('gemini');
        expect(s.aiModel).toBe('gemini-3.8-flash');
        expect(s.fallbackAiProvider).toBe('gemini');
        expect(s.fallbackAiModel).toBe('gemini-3.5-flash-lite');
        expect(s.imageModel).toBe(NONE_IMAGE_MODEL);
        expect(s.ttsEngine).toBe('gemini');
        expect(s.modelPackage).toBe('gemini');
    });

    it('paid-openai: GPT-6.1 Sol + GPT Image 2.5 Flare + OpenAI voice', () => {
        const s = buildPresetSettings(baseSettings(), 'paid-openai');
        expect(s.aiProvider).toBe('openai');
        expect(s.aiModel).toBe('gpt-6.1-sol');
        expect(s.imageModel).toBe('openai:gpt-image-2.5-flare');
        expect(s.fallbackImageModel).toBe(NONE_IMAGE_MODEL);
        expect(s.ttsEngine).toBe('openai');
        expect(s.setupProfile).toBe('paid-openai');
    });

    it('paid-gemini: gemini flash text + paid illustrations', () => {
        const s = buildPresetSettings(baseSettings(), 'paid-gemini');
        expect(s.aiProvider).toBe('gemini');
        expect(s.aiModel).toBe('gemini-3.8-flash');
        expect(s.imageModel).toBe('gemini:gemini-3.1-flash-lite-image');
        expect(s.setupProfile).toBe('paid-gemini');
    });

    it('fallbacks never leave the preset key (single key, no surprise costs)', () => {
        for (const p of ALL_PRESETS) {
            const s = buildPresetSettings(baseSettings(), p.id);
            if (s.fallbackEnabled) {
                expect(s.fallbackAiProvider).toBe(s.aiProvider);
            } else {
                expect(s.fallbackAiProvider).toBeNull();
            }
        }
    });

    it('output types as valid SetupProfileName values', () => {
        const ids = ALL_PRESETS.map((p) => buildPresetSettings(baseSettings(), p.id).setupProfile);
        for (const id of ids) {
            expect(['gemini-free', 'zero', 'free-cloudflare', 'paid-openai', 'paid-gemini']).toContain(
                id as SetupProfileName,
            );
        }
    });
});
