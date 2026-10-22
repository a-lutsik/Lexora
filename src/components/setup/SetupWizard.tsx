import { t as tUi } from "../../i18n";
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — SetupWizard (быстрая настройка AI)
// 2 сценария: «Бесплатно» / «Платно» с объяснением преимуществ.
// Flow: card → variant → (key) → confirm → applied.
// Reusable: первый запуск (App.tsx) и «Сменить сценарий» (Settings).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
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
const FREE_CARDS: Array<{ id: SetupCard; icon: string; title: string; tagline: string }> = [
    {
        id: 'free',
        icon: 'savings',
        title: 'Бесплатно',
        tagline:
            'Без карты: один бесплатный ключ Google Gemini включает AI-перевод, фото, голос и живой диалог. Или совсем без ключей — словарь, свободные фото и системный голос.',
    },
    {
        id: 'paid',
        icon: 'bolt',
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
  const { t: tUi } = useI18n();
    return (
        <div className={`setup-cap setup-cap--${cap.level}`}>
            <span className="status-dot setup-cap-dot" aria-hidden="true" />
            <div className="setup-cap-body">
                <span className="setup-cap-label">{tUi(cap.label)}</span>
                {cap.hint && <span className="setup-cap-hint">{tUi(cap.hint)}</span>}
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
    const label = AI_PROVIDER_LABELS[meta.apiKeyProvider ?? 'cloudflare'] ?? tUi("провайдер");

    if (meta.keyKind === 'none') {
        return { ok: true, detected: null, message: '' };
    }
    if (value.length === 0) {
        return { ok: false, detected: null, message: tUi("Вставьте ключ {value1}", { value1: label }) };
    }

    if (meta.keyKind === 'cloudflare') {
        const ok = value.length >= 16 && !/\s/.test(value);
        return {
            ok,
            detected: 'cloudflare',
            message: ok
                ? tUi("Токен Cloudflare введён — формат похож на корректный")
                : tUi("Похоже, токен неполный (Cloudflare API-токены длинные, без пробелов)"),
        };
    }

    const expected: AIProviderName = meta.keyKind;
    const detected = detectProviderByKey(value);
    if (detected === expected) {
        return {
            ok: true,
            detected,
            message: tUi("Ключ похож на корректный ключ {value1} — он подойдёт и для картинок", { value1: label }),
        };
    }
    if (detected !== null) {
        return {
            ok: false,
            detected,
            message: tUi("Это похоже на ключ {value1}, а нужен ключ {value2}", { value1: AI_PROVIDER_LABELS[detected], value2: label }),
        };
    }
    return {
        ok: false,
        detected: null,
        message: tUi("Не похоже на ключ {value1}. Скопируйте его целиком ({value2})", { value1: label, value2: label === 'OpenAI' ? 'sk-…' : 'AIza… / AQ.…' }),
    };
}

export function SetupWizard({ settings, keysStatus, onClose, onApplied }: SetupWizardProps) {
  const { t: tUi } = useI18n();
    const [phase, setPhase] = useState<SetupPhase>('card');
    // «Бесплатно» выделен заранее как рекомендуемый; шаг 1 выбирается кликом по карточке.
    const [card, setCard] = useState<SetupCard>('free');
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
                return tUi("Как настроить Lexora?");
            case 'variant':
                return card === 'paid' ? tUi("Платный сценарий") : tUi("Бесплатный сценарий");
            case 'key':
                return tUi("Вставьте ключ");
            case 'confirm':
                return tUi("Проверьте и включите");
            case 'done':
                return tUi("Готово!");
        }
    };

    const progressLabel =
        phase === 'done'
            ? tUi("Настройка завершена")
            : tUi("Шаг {value1} из {value2}", { value1: progress.current, value2: progress.total });

    const stepDots = Array.from({ length: progress.total }, (_, index) => index < progress.current);

    return (
        <div className="modal-scrim setup-overlay">
            <div
                ref={panelRef}
                className="modal modal--lg setup-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="setup-title"
                tabIndex={-1}
            >
                <header className="setup-header">
                    <div className="setup-header-top">
                        <span className="setup-brand" aria-hidden="true">
                            <Logo size={28} />
                        </span>
                        <span className="spacer" />
                        {phase === 'done' ? (
                            <span className="tag tag--ok setup-badge setup-badge--success">{tUi("Включено ✓")}</span>
                        ) : (
                            <>
                                <span className="setup-steps" aria-hidden="true">
                                    {stepDots.map((filled, index) => (
                                        <span
                                            key={index}
                                            className={`setup-step${filled ? ' is-filled' : ''}`}
                                        />
                                    ))}
                                </span>
                                <span className="setup-step-count" aria-hidden="true">
                                    {progress.current} / {progress.total}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="setup-header-text">
                        <span className="setup-progress" aria-live="polite">
                            {tUi(progressLabel)}
                        </span>
                        <h1 id="setup-title" className="setup-title">
                            {phaseTitle()}
                        </h1>
                    </div>
                </header>

                <div className="modal__body setup-body">
                    {phase === 'card' && (
                        <div className="setup-card-grid">
                            {FREE_CARDS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`card card--selectable setup-card${card === c.id ? ' is-selected' : ''}`}
                                    onClick={() => chooseCard(c.id)}
                                    aria-label={tUi("Выбрать сценарий: {value1}", { value1: tUi(c.title) })}
                                >
                                    <span className="setup-card-top">
                                        <Icon name={c.icon} size={22} className="setup-card-icon" />
                                        <span className="spacer" />
                                        <span className={`tag setup-badge setup-badge--${c.id}${c.id === 'free' ? ' tag--accent' : ''}`}>
                                            {c.id === 'free' ? tUi("Без оплаты") : tUi("Лучшее качество")}
                                        </span>
                                    </span>
                                    <span className="setup-card-title">{tUi(c.title)}</span>
                                    <span className="setup-card-tagline">{tUi(c.tagline)}</span>
                                </button>
                            ))}
                            <p className="setup-card-note">{tUi("Никаких карт и обязательств. Сценарий можно сменить в любой момент в Настройках → AI-модели.")}</p>
                        </div>
                    )}

                    {phase === 'variant' && meta === null && (
                        <div className="setup-variant-list">
                            {variants.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    className="card card--selectable setup-variant"
                                    onClick={() => chooseVariant(m)}
                                    aria-label={`${tUi(m.title)}: ${tUi(m.tagline)}`}
                                >
                                    <span className="setup-variant-main">
                                        <span className="setup-variant-title">{tUi(m.title)}</span>
                                        {m.recommended && (
                                            <span className="tag tag--accent setup-variant-reco">{tUi("Рекомендуем")}</span>
                                        )}
                                        <span className="setup-variant-price">{tUi(m.price)}</span>
                                    </span>
                                    <span className="setup-variant-tagline">{tUi(m.tagline)}</span>
                                    <span className="setup-variant-bullets">
                                        {m.bullets.map((b) => (
                                            <span key={tUi(b.text)} className="setup-variant-bullet">
                                                <span
                                                    className={`setup-variant-dot setup-variant-dot--${b.capability}`}
                                                    aria-hidden="true"
                                                />
                                                {tUi(b.text)}
                                            </span>
                                        ))}
                                    </span>
                                </button>
                            ))}
                            <div className="setup-notes">
                                {variants.map((m) => (
                                    <ul key={m.id} className="setup-notes-list">
                                        {m.notes.map((n) => (
                                            <li key={tUi(n)}>{tUi(n)}</li>
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
                                <span className="setup-summary-chip-label">{tUi("Выбран сценарий")}</span>
                                <span className="setup-summary-chip-value">{tUi(meta.title)}</span>
                            </div>

                            {meta.keyKind === 'cloudflare' && (
                                <div className="setup-field">
                                    <label
                                        htmlFor="setup-cf-account"
                                        className="label setup-field-label"
                                    >{tUi("ACCOUNT ID")}</label>
                                    <div className="field">
                                        <input dir="auto"
                                            id="setup-cf-account"
                                            type="text"
                                            value={accountId}
                                            autoComplete="off"
                                            placeholder={tUi("32-символьный ID из адреса Cloudflare Dashboard")}
                                            className="field__input setup-input--mono"
                                            onChange={(e) => setAccountId(e.target.value)}
                                        />
                                    </div>
                                    <p className="setup-field-hint">{tUi("Dashboard Cloudflare → в правом нижнем углу «Account ID»")}</p>
                                </div>
                            )}

                            {meta.keyKind !== 'none' && (
                                <div className="setup-field">
                                    <label htmlFor="setup-key" className="label setup-field-label">
                                        {meta.keyKind === 'cloudflare'
                                            ? tUi("API TOKEN CLOUDFLARE")
                                            : tUi("API KEY — {value1}", { value1: AI_PROVIDER_LABELS[meta.apiKeyProvider ?? meta.keyKind] })}
                                    </label>
                                    <div className={`field setup-key-row${apiKey.trim().length > 0 && !keyCheck?.ok ? ' is-invalid' : ''}`}>
                                        <Icon name="key" size={18} className="field__icon" />
                                        <input dir="auto"
                                            ref={keyInputRef}
                                            id="setup-key"
                                            type="password"
                                            value={apiKey}
                                            autoComplete="off"
                                            placeholder={
                                                meta.keyKind === 'cloudflare'
                                                    ? tUi("Вставьте API-токен")
                                                    : tUi("Вставьте ключ целиком")
                                            }
                                            className="field__input setup-input--mono"
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
                                        {meta.keyKind === 'openai' && tUi("Ключ выдаётся на platform.openai.com → API keys")}
                                        {meta.keyKind === 'gemini' && tUi("Бесплатный ключ — на aistudio.google.com → Get API key")}
                                        {meta.keyKind === 'cloudflare' &&
                                            tUi("Токен: Cloudflare Dashboard → My Profile → API Tokens → Create Token")}
                                    </p>
                                </div>
                            )}
                        </form>
                    )}

                    {phase === 'confirm' && meta && (
                        <div className="setup-confirm">
                            <div className="setup-confirm-preset">
                                <span className="setup-confirm-preset-label">{tUi("Выбранный сценарий")}</span>
                                <span className="setup-confirm-preset-title">{tUi(meta.title)}</span>
                                {meta.keyKind !== 'none' && (
                                    <span className="setup-confirm-preset-key">
                                        {meta.keyKind === 'cloudflare'
                                            ? tUi("Ключ Cloudflare будет сохранён в системе")
                                            : tUi("Ключ {value1} будет сохранён в системе", { value1: AI_PROVIDER_LABELS[meta.apiKeyProvider ?? meta.keyKind] })}
                                    </span>
                                )}
                            </div>

                            <p className="setup-confirm-lead" id="setup-readiness-live">{tUi("Так будут работать возможности после включения:")}</p>
                            <div className="setup-cap-list" aria-live="polite">
                                {CAPABILITY_ORDER.map((id) => (
                                    <CapabilityChip key={id} cap={previewReadiness[id]} />
                                ))}
                            </div>

                            {applyError && (
                                <div className="setup-error" role="alert">{tUi("Не удалось применить настройки: ")}{applyError}
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'done' && (
                        <div className="setup-done">
                            <div className="setup-done-icon" aria-hidden="true">
                                <Icon name="check" size={28} />
                            </div>
                            <p className="setup-done-title">
                                {meta?.title ?? tUi("Сценарий")}{tUi(" включён")}</p>
                            <p className="setup-done-text">{tUi("Все настройки сохранены. Если захотите поменять сценарий или настроить модели вручную — откройте Настройки → «AI-модели».")}</p>
                            <div className="setup-cap-list" aria-live="polite">
                                {CAPABILITY_ORDER.map((id) => (
                                    <CapabilityChip key={id} cap={previewReadiness[id]} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="modal__foot setup-footer">
                    {(phase === 'card' || phase === 'variant') && (
                        <Button variant="ghost" className="setup-skip-link" onClick={() => void skipToAdvanced()}>{tUi("Пропустить — настроить вручную")}</Button>
                    )}
                    <span className="spacer" />
                    {phase !== 'card' && phase !== 'done' && (
                        <Button variant="secondary" onClick={goBack}>{tUi("← Назад")}</Button>
                    )}

                    {phase === 'key' && meta && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                                if (canContinueKey) setPhase('confirm');
                            }}
                            disabled={!canContinueKey}
                            aria-label={tUi("Продолжить к проверке")}
                        >{tUi("Продолжить")}</Button>
                    )}
                    {phase === 'confirm' && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={applyPreset}
                            isLoading={applyMutation.isPending || updateMutation.isPending}
                            aria-label={
                                meta?.keyKind === 'none'
                                    ? tUi("Включить выбранный сценарий")
                                    : tUi("Сохранить ключ и включить сценарий")
                            }
                        >
                            {meta?.keyKind === 'none' ? tUi("Включить") : tUi("Сохранить ключ и включить")}
                        </Button>
                    )}
                    {phase === 'done' && (
                        <Button variant="primary" size="md" onClick={onClose} aria-label={tUi("Закрыть мастер")}>{tUi("Отлично")}</Button>
                    )}
                </footer>
            </div>
        </div>
    );
}
