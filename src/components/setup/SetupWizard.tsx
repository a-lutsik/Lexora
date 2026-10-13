// ============================================================
// LEXORA — SetupWizard (быстрая настройка AI)
// 2 сценария: «Бесплатно» / «Платно» с объяснением преимуществ.
// Flow: card → variant → (key) → confirm → applied.
// Reusable: первый запуск (App.tsx) и «Сменить сценарий» (Settings).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { LogoMark } from '../ui/Logo';
import { useApplyModelPackage } from '../../hooks/useModelRoutes';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useUpdateSettings } from '../../hooks/useSettings';
import {
    buildPresetSettings,
    FREE_PRESETS,
    PAID_PRESETS,
    presetPackage,
} from '../../lib/setupPresets';
import type { SetupCard, SetupPresetMeta } from '../../lib/setupPresets';
import { computeAiReadiness, detectProviderByKey } from '../../lib/setupProfile';
import type { AiCapability, AiCapabilityId, AiReadiness } from '../../lib/setupProfile';
import { AI_PROVIDER_LABELS } from '../../lib/setupProfile';
import type { AIProviderName, AppSettings } from '../../lib/types';
import './setup.css';

type SetupPhase = 'card' | 'variant' | 'key' | 'confirm' | 'done';

type SetupWizardProps = {
    settings: AppSettings;
    keysStatus: Record<string, boolean>;
    onClose: () => void;
    /** Вызывается после успешного применения пресета / «Пропустить» (до onClose). */
    onApplied?: () => void;
};

const CAPABILITY_ORDER: AiCapabilityId[] = ['translate', 'images', 'audio'];

/** Бесплатные/платные карточки выбора. */
const FREE_CARDS: Array<{ id: SetupCard; title: string; tagline: string }> = [
    {
        id: 'free',
        title: 'Бесплатно',
        tagline:
            'Без карты: один бесплатный ключ Google Gemini включает AI-перевод, фото, голос и живой диалог. Или совсем без ключей — словарь, свободные фото и системный голос.',
    },
    {
        id: 'paid',
        title: 'Платно',
        tagline:
            'Один ключ OpenAI или Google Gemini с оплатой по использованию: всё из бесплатного плюс AI-иллюстрации к словам.',
    },
];

/** «Шаг N из M» — прогресс. */
function stepProgress(phase: SetupPhase, needsKey: boolean): { current: number; total: number } {
    const total = needsKey ? 4 : 3;
    switch (phase) {
        case 'card':
            return { current: 1, total };
        case 'variant':
            return { current: 2, total };
        case 'key':
            return { current: 3, total };
        case 'confirm':
        case 'done':
            return { current: total, total };
    }
}

function CapabilityChip({ cap }: { cap: AiCapability }) {
    return (
        <div className={`setup-cap setup-cap--${cap.level}`}>
            <span className="setup-cap-dot" aria-hidden="true" />
            <div className="setup-cap-body">
                <span className="setup-cap-label">{cap.label}</span>
                {cap.hint && <span className="setup-cap-hint">{cap.hint}</span>}
            </div>
        </div>
    );
}

type KeyCheck = {
    ok: boolean;
    detected: AIProviderName | null;
    message: string;
};

/** Живая (форматная) проверка введённого ключа для сценария. */
function checkPresetKey(meta: SetupPresetMeta, apiKey: string): KeyCheck {
    const value = apiKey.trim();
    const label = AI_PROVIDER_LABELS[meta.apiKeyProvider ?? 'cloudflare'] ?? 'провайдер';

    if (meta.keyKind === 'none') {
        return { ok: true, detected: null, message: '' };
    }
    if (value.length === 0) {
        return { ok: false, detected: null, message: `Вставьте ключ ${label}` };
    }

    if (meta.keyKind === 'cloudflare') {
        const ok = value.length >= 16 && !/\s/.test(value);
        return {
            ok,
            detected: 'cloudflare',
            message: ok
                ? 'Токен Cloudflare введён — формат похож на корректный'
                : 'Похоже, токен неполный (Cloudflare API-токены длинные, без пробелов)',
        };
    }

    const expected: AIProviderName = meta.keyKind;
    const detected = detectProviderByKey(value);
    if (detected === expected) {
        return {
            ok: true,
            detected,
            message: `Ключ похож на корректный ключ ${label} — он подойдёт и для картинок`,
        };
    }
    if (detected !== null) {
        return {
            ok: false,
            detected,
            message: `Это похоже на ключ ${AI_PROVIDER_LABELS[detected]}, а нужен ключ ${label}`,
        };
    }
    return {
        ok: false,
        detected: null,
        message: `Не похоже на ключ ${label}. Скопируйте его целиком (${label === 'OpenAI' ? 'sk-…' : 'AIza… / AQ.…'})`,
    };
}

export function SetupWizard({ settings, keysStatus, onClose, onApplied }: SetupWizardProps) {
    const [phase, setPhase] = useState<SetupPhase>('card');
    const [card, setCard] = useState<SetupCard | null>(null);
    const [meta, setMeta] = useState<SetupPresetMeta | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [accountId, setAccountId] = useState('');
    const [applyError, setApplyError] = useState<string | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);
    const keyInputRef = useRef<HTMLInputElement>(null);
    const applyMutation = useApplyModelPackage();
    const updateMutation = useUpdateSettings();

    const variants = card === 'free' ? FREE_PRESETS : PAID_PRESETS;
    const needsKey = meta ? meta.keyKind !== 'none' : false;
    const progress = stepProgress(phase, needsKey);

    const keyCheck = meta ? checkPresetKey(meta, apiKey) : null;
    const accountValid = meta?.keyKind === 'cloudflare'
        ? accountId.trim().length > 0
        : true;

    // Фокус на панель при открытии, возврат на прежний элемент при закрытии.
    useEffect(() => {
        const previouslyFocused =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        panelRef.current?.focus();
        return () => previouslyFocused?.focus();
    }, []);

    // aria-modal: фокус не должен уходить на страницу под мастером.
    useFocusTrap(panelRef);

    // Esc закрывает мастер (без записи настроек: он появится при следующем запуске).
    // Пока применяется пресет, закрытие блокируем — результат нужно увидеть.
    const isApplying = applyMutation.isPending;
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isApplying) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isApplying, onClose]);
    useEffect(() => {
        if (phase === 'key') {
            keyInputRef.current?.focus();
        }
    }, [phase]);

    // Картинка «что получится»: превью настроек + оптимистичные ключи.
    let previewSettings = settings;
    let optimisticKeys = keysStatus;
    if (meta) {
        previewSettings = buildPresetSettings(settings, meta.id, {
            cloudflareAccountId: accountId.trim() || null,
        });
        optimisticKeys = { ...keysStatus };
        if (meta.apiKeyProvider && keyCheck?.ok) {
            optimisticKeys[meta.apiKeyProvider] = true;
        }
    }
    const previewReadiness: AiReadiness = computeAiReadiness(previewSettings, optimisticKeys);

    const canContinueKey = keyCheck !== null && keyCheck.ok && accountValid;

    const resetDrafts = () => {
        setApiKey('');
        setAccountId('');
        setApplyError(null);
    };

    const chooseCard = (id: SetupCard) => {
        setCard(id);
        setMeta(null);
        resetDrafts();
        setPhase('variant');
    };

    const chooseVariant = (m: SetupPresetMeta) => {
        setMeta(m);
        resetDrafts();
        setPhase(m.keyKind === 'none' ? 'confirm' : 'key');
    };

    const goBack = () => {
        setApplyError(null);
        if (phase === 'variant') {
            setPhase('card');
            return;
        }
        if (phase === 'key' || (phase === 'confirm' && meta && meta.keyKind !== 'none')) {
            resetDrafts();
            setPhase('variant');
            return;
        }
        if (phase === 'confirm') {
            setPhase('variant');
        }
    };

    /** «Пропустить» — отметить advanced (расширенные), не меняя AI-настройки. */
    const skipToAdvanced = async () => {
        setApplyError(null);
        try {
            await updateMutation.mutateAsync({ ...settings, setupProfile: 'advanced' });
            onApplied?.();
            onClose();
        } catch (err) {
            setApplyError(err instanceof Error ? err.message : String(err));
        }
    };

    const applyPreset = async () => {
        if (!meta) return;
        setApplyError(null);
        try {
            const target = presetPackage(meta.id);
            const apiKeyToSave =
                meta.apiKeyProvider && apiKey.trim() ? apiKey.trim() : null;
            await applyMutation.mutateAsync({
                package: target.package,
                illustrations: target.illustrations,
                apiKey: apiKeyToSave,
                cloudflareAccountId: accountId.trim() || null,
            });
            onApplied?.();
            setPhase('done');
        } catch (err) {
            setApplyError(err instanceof Error ? err.message : String(err));
        }
    };

    const phaseTitle = (): string => {
        switch (phase) {
            case 'card':
                return 'Как настроить Lexora?';
            case 'variant':
                return card === 'paid' ? 'Платный сценарий' : 'Бесплатный сценарий';
            case 'key':
                return 'Вставьте ключ';
            case 'confirm':
                return 'Проверьте и включите';
            case 'done':
                return 'Готово!';
        }
    };

    const progressLabel =
        phase === 'done'
            ? 'Настройка завершена'
            : `Шаг ${progress.current} из ${progress.total}`;

    return (
        <div className="setup-overlay">
            <div
                ref={panelRef}
                className="setup-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="setup-title"
                tabIndex={-1}
            >
                <header className="setup-header">
                    <div className="setup-logo" aria-hidden="true">
                        <LogoMark size={28} />
                    </div>
                    <div className="setup-header-text">
                        <span className="setup-progress" aria-live="polite">
                            {progressLabel}
                        </span>
                        <h1 id="setup-title" className="setup-title">
                            {phaseTitle()}
                        </h1>
                    </div>
                    {phase === 'done' && (
                        <span className="setup-badge setup-badge--success">Включено ✓</span>
                    )}
                </header>

                <div className="setup-body">
                    {phase === 'card' && (
                        <div className="setup-card-grid">
                            {FREE_CARDS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className="setup-card"
                                    onClick={() => chooseCard(c.id)}
                                    aria-label={`Выбрать сценарий: ${c.title}`}
                                >
                                    <span className="setup-card-top">
                                        <span className="setup-card-icon" aria-hidden="true">
                                            {c.id === 'free' ? '🪙' : '⚡'}
                                        </span>
                                        <span className={`setup-badge setup-badge--${c.id}`}>
                                            {c.id === 'free' ? 'Без оплаты' : 'Лучшее качество'}
                                        </span>
                                    </span>
                                    <span className="setup-card-title">{c.title}</span>
                                    <span className="setup-card-tagline">{c.tagline}</span>
                                </button>
                            ))}
                            <p className="setup-card-note">
                                Никаких карт и обязательств. Сценарий можно сменить в любой момент в
                                Настройках — секция «AI-модели».
                            </p>
                        </div>
                    )}

                    {phase === 'variant' && meta === null && (
                        <div className="setup-variant-list">
                            {variants.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    className="setup-variant"
                                    onClick={() => chooseVariant(m)}
                                    aria-label={`${m.title}: ${m.tagline}`}
                                >
                                    <span className="setup-variant-main">
                                        <span className="setup-variant-title">{m.title}</span>
                                        {m.recommended && (
                                            <span className="setup-variant-reco">Рекомендуем</span>
                                        )}
                                        <span className="setup-variant-price">{m.price}</span>
                                    </span>
                                    <span className="setup-variant-tagline">{m.tagline}</span>
                                    <span className="setup-variant-bullets">
                                        {m.bullets.map((b) => (
                                            <span key={b.text} className="setup-variant-bullet">
                                                <span
                                                    className={`setup-variant-dot setup-variant-dot--${b.capability}`}
                                                    aria-hidden="true"
                                                />
                                                {b.text}
                                            </span>
                                        ))}
                                    </span>
                                </button>
                            ))}
                            <div className="setup-notes">
                                {variants.map((m) => (
                                    <ul key={m.id} className="setup-notes-list">
                                        {m.notes.map((n) => (
                                            <li key={n}>{n}</li>
                                        ))}
                                    </ul>
                                ))}
                            </div>
                        </div>
                    )}

                    {phase === 'variant' && meta !== null && (
                        // Промежуточный рендер на время перехода — не показываем.
                        <span className="setup-invisible" aria-hidden="true" />
                    )}

                    {phase === 'key' && meta && (
                        <form
                            className="setup-key-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (canContinueKey) setPhase('confirm');
                            }}
                        >
                            <div className="setup-summary-chip">
                                <span className="setup-summary-chip-label">Выбран сценарий</span>
                                <span className="setup-summary-chip-value">{meta.title}</span>
                            </div>

                            {meta.keyKind === 'cloudflare' && (
                                <div className="setup-field">
                                    <label
                                        htmlFor="setup-cf-account"
                                        className="setup-field-label"
                                    >
                                        ACCOUNT ID
                                    </label>
                                    <input
                                        id="setup-cf-account"
                                        type="text"
                                        value={accountId}
                                        autoComplete="off"
                                        placeholder="32-символьный ID из адреса Cloudflare Dashboard"
                                        className="setup-input setup-input--mono"
                                        onChange={(e) => setAccountId(e.target.value)}
                                    />
                                    <p className="setup-field-hint">
                                        Dashboard Cloudflare → в правом нижнем углу «Account ID»
                                    </p>
                                </div>
                            )}

                            {meta.keyKind !== 'none' && (
                                <div className="setup-field">
                                    <label htmlFor="setup-key" className="setup-field-label">
                                        {meta.keyKind === 'cloudflare'
                                            ? 'API TOKEN CLOUDFLARE'
                                            : `API KEY — ${AI_PROVIDER_LABELS[meta.apiKeyProvider ?? meta.keyKind]}`}
                                    </label>
                                    <div className="setup-key-row">
                                        <input
                                            ref={keyInputRef}
                                            id="setup-key"
                                            type="password"
                                            value={apiKey}
                                            autoComplete="off"
                                            placeholder={
                                                meta.keyKind === 'cloudflare'
                                                    ? 'Вставьте API-токен'
                                                    : 'Вставьте ключ целиком'
                                            }
                                            className="setup-input setup-input--mono"
                                            onChange={(e) => setApiKey(e.target.value)}
                                            aria-invalid={apiKey.trim().length > 0 && !keyCheck?.ok}
                                        />
                                    </div>
                                    {apiKey.trim().length > 0 && (
                                        <p
                                            className={`setup-field-feedback setup-field-feedback--${keyCheck?.ok ? 'ok' : 'warn'}`}
                                            role={keyCheck?.ok ? undefined : 'alert'}
                                        >
                                            {keyCheck?.message}
                                        </p>
                                    )}
                                    <p className="setup-field-hint">
                                        {meta.keyKind === 'openai' && 'Ключ выдаётся на platform.openai.com → API keys'}
                                        {meta.keyKind === 'gemini' && 'Бесплатный ключ — на aistudio.google.com → Get API key'}
                                        {meta.keyKind === 'cloudflare' &&
                                            'Токен: Cloudflare Dashboard → My Profile → API Tokens → Create Token'}
                                    </p>
                                </div>
                            )}
                        </form>
                    )}

                    {phase === 'confirm' && meta && (
                        <div className="setup-confirm">
                            <div className="setup-confirm-preset">
                                <span className="setup-confirm-preset-label">Выбранный сценарий</span>
                                <span className="setup-confirm-preset-title">{meta.title}</span>
                                {meta.keyKind !== 'none' && (
                                    <span className="setup-confirm-preset-key">
                                        {meta.keyKind === 'cloudflare'
                                            ? 'Ключ Cloudflare будет сохранён в системе'
                                            : `Ключ ${AI_PROVIDER_LABELS[meta.apiKeyProvider ?? meta.keyKind]} будет сохранён в системе`}
                                    </span>
                                )}
                            </div>

                            <p className="setup-confirm-lead" id="setup-readiness-live">
                                Так будут работать возможности после включения:
                            </p>
                            <div className="setup-cap-list" aria-live="polite">
                                {CAPABILITY_ORDER.map((id) => (
                                    <CapabilityChip key={id} cap={previewReadiness[id]} />
                                ))}
                            </div>

                            {applyError && (
                                <div className="setup-error" role="alert">
                                    Не удалось применить настройки: {applyError}
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'done' && (
                        <div className="setup-done">
                            <div className="setup-done-icon" aria-hidden="true">
                                ✓
                            </div>
                            <p className="setup-done-title">
                                {meta?.title ?? 'Сценарий'} включён
                            </p>
                            <p className="setup-done-text">
                                Все настройки сохранены. Если захотите поменять сценарий или
                                настроить модели вручную — откройте Настройки → «AI-модели».
                            </p>
                            <div className="setup-cap-list" aria-live="polite">
                                {CAPABILITY_ORDER.map((id) => (
                                    <CapabilityChip key={id} cap={previewReadiness[id]} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="setup-footer">
                    {phase !== 'done' && (
                        <Button variant="ghost" size="sm" onClick={goBack} disabled={phase === 'card'}>
                            ← Назад
                        </Button>
                    )}

                    {phase === 'card' && (
                        <button type="button" className="setup-skip-link" onClick={skipToAdvanced}>
                            Пропустить — настроить вручную
                        </button>
                    )}
                    {phase === 'variant' && (
                        <button type="button" className="setup-skip-link" onClick={skipToAdvanced}>
                            Пропустить — настроить вручную
                        </button>
                    )}
                    {phase === 'key' && meta && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                                if (canContinueKey) setPhase('confirm');
                            }}
                            disabled={!canContinueKey}
                            aria-label="Продолжить к проверке"
                        >
                            Продолжить
                        </Button>
                    )}
                    {phase === 'confirm' && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={applyPreset}
                            isLoading={applyMutation.isPending || updateMutation.isPending}
                            aria-label={
                                meta?.keyKind === 'none'
                                    ? 'Включить выбранный сценарий'
                                    : 'Сохранить ключ и включить сценарий'
                            }
                        >
                            {meta?.keyKind === 'none' ? 'Включить' : 'Сохранить ключ и включить'}
                        </Button>
                    )}
                    {phase === 'done' && (
                        <Button variant="primary" size="md" onClick={onClose} aria-label="Закрыть мастер">
                            Отлично
                        </Button>
                    )}
                </footer>
            </div>
        </div>
    );
}
