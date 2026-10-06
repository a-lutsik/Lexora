// ============================================================
// LEXORA — AiModelsPanel (Settings → «AI-модели»)
// Progressive disclosure:
//  1. readiness of Текст / Картинки / Голос / Иллюстрации + «Проверить»;
//  2. one package = one key (Gemini recommended);
//  3. «Расширенные» — a model per role; mixing providers only here.
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  useApplyModelPackage,
  useModelCatalog,
  useModelRoutes,
  useTestModelRole,
} from '../../hooks/useModelRoutes';
import {
  CLOUDFLARE_ACCOUNT_ID_WARNING,
  DEFAULT_OLLAMA_URL,
  GROUP_LEVEL_LABELS,
  KEY_HINTS,
  MODEL_PACKAGES,
  MODEL_ROLES,
  ROLE_GROUPS,
  ROLE_HINTS,
  ROLE_LABELS,
  ROLE_STATE_LABELS,
  groupLevel,
  isCloudflareAccountIdInvalid,
  packageMeta,
  providerLabel,
  providersNeedingKeys,
  routesUseProvider,
  statusesByGroup,
  type ApplicablePackageId,
} from '../../lib/modelRouting';
import { detectProviderByKey } from '../../lib/setupProfile';
import { formatIpcError } from '../../lib/utils';
import type { AppSettings, ModelPackageId, ModelRole, RoleState, RoleStatus } from '../../lib/types';
import { ProviderKeysEditor } from './ProviderKeysEditor';
import { RoleRouteEditor } from './RoleRouteEditor';
import './ai-models.css';

type AiModelsPanelProps = {
  /** Saved settings (query cache), not the page draft. */
  settings: AppSettings | undefined;
  keysStatus: Record<string, boolean>;
  onOpenWizard: () => void;
  /** AI fields changed on the backend — merge them into the page draft. */
  onSettingsChanged: (settings: AppSettings) => void;
};

type RoleTest =
  | { state: 'testing' }
  | { state: 'ok'; latencyMs: number }
  | { state: 'error'; message: string };

/** Roles whose check calls a paid model. */
const PAID_TEST_ROLES: ReadonlySet<ModelRole> = new Set<ModelRole>(['image_gen']);

const UNTESTABLE_STATES: ReadonlySet<RoleState> = new Set<RoleState>([
  'off',
  'unsupported',
  'needs_key',
]);

function summaryOf(packageId: ModelPackageId | null, illustrations: boolean): string {
  if (packageId === 'custom') return 'Свои модели по ролям (расширенный режим)';
  const meta = packageMeta(packageId);
  if (!meta) return 'Пакет моделей не выбран';
  return illustrations && meta.paidIllustrations
    ? `Пакет: ${meta.title} + AI-иллюстрации`
    : `Пакет: ${meta.title}`;
}

export function AiModelsPanel({
  settings,
  keysStatus,
  onOpenWizard,
  onSettingsChanged,
}: AiModelsPanelProps) {
  const { data: routes, isLoading, error: routesError } = useModelRoutes();
  const { data: catalog = [] } = useModelCatalog();
  const applyPackage = useApplyModelPackage();
  const testRole = useTestModelRole();

  const [selected, setSelected] = useState<ApplicablePackageId | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [accountDraft, setAccountDraft] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [illustrationsDraft, setIllustrationsDraft] = useState<boolean | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [tests, setTests] = useState<Partial<Record<ModelRole, RoleTest>>>({});
  const [advancedToggle, setAdvancedToggle] = useState<boolean | null>(null);

  const current = routes?.package ?? null;
  const statuses: RoleStatus[] = routes?.roles ?? [];
  const grouped = statusesByGroup(statuses);
  const active: ApplicablePackageId =
    selected ?? (current && current !== 'custom' ? current : 'gemini');
  const meta = packageMeta(active) ?? MODEL_PACKAGES[0];
  const isCurrent = current === active;
  const advancedOpen = advancedToggle ?? current === 'custom';

  if (!meta) return null;

  const savedIllustrations = isCurrent ? (routes?.illustrations ?? false) : false;
  const illustrations = illustrationsDraft ?? savedIllustrations;
  const accountValue = accountDraft ?? settings?.cloudflareAccountId ?? '';
  const urlValue = urlDraft ?? settings?.customBaseUrl ?? DEFAULT_OLLAMA_URL;
  const keyStored = meta.keyProvider ? keysStatus[meta.keyProvider] === true : true;
  const keyTyped = keyDraft.trim() !== '';
  const keyMissing = meta.keyProvider !== null && !keyStored && !keyTyped;
  const accountMissing = meta.needsAccountId === true && accountValue.trim() === '';
  const detectedKey = keyTyped ? detectProviderByKey(keyDraft) : null;
  const keyWarning =
    meta.keyProvider && detectedKey && detectedKey !== meta.keyProvider
      ? `Похоже на ключ ${providerLabel(detectedKey)}, а нужен ключ ${providerLabel(meta.keyProvider)}`
      : null;
  const hasChanges =
    !isCurrent ||
    keyTyped ||
    illustrations !== savedIllustrations ||
    accountDraft !== null ||
    urlDraft !== null;
  const canApply = !keyMissing && !accountMissing && hasChanges;
  // One-provider package: a single hint instead of «нужен ключ» on every role.
  const currentMeta = packageMeta(current);
  const packageNeedsKey =
    current !== 'custom' && statuses.some((s) => s.state === 'needs_key') && currentMeta?.keyProvider;

  const choosePackage = (id: ApplicablePackageId) => {
    setSelected(id);
    setKeyDraft('');
    setIllustrationsDraft(null);
    setApplyError(null);
    setAppliedNote(null);
  };

  const apply = async () => {
    setApplyError(null);
    setAppliedNote(null);
    try {
      const setup = await applyPackage.mutateAsync({
        package: active,
        apiKey: keyTyped ? keyDraft.trim() : null,
        illustrations: meta.paidIllustrations === true && illustrations,
        cloudflareAccountId: meta.needsAccountId ? accountValue.trim() || null : null,
        customBaseUrl: meta.needsBaseUrl ? urlValue.trim() || null : null,
      });
      setSelected(null);
      setKeyDraft('');
      setIllustrationsDraft(null);
      setAccountDraft(null);
      setUrlDraft(null);
      setTests({});
      onSettingsChanged(setup.settings);
      setAppliedNote(`Пакет «${meta.title}» включён`);
    } catch (err) {
      setApplyError(formatIpcError(err, 'Не удалось включить пакет'));
    }
  };

  const runTest = async (role: ModelRole) => {
    setTests((t) => ({ ...t, [role]: { state: 'testing' } }));
    try {
      const result = await testRole.mutateAsync(role);
      setTests((t) => ({
        ...t,
        [role]: result.ok
          ? { state: 'ok', latencyMs: result.latencyMs }
          : { state: 'error', message: formatIpcError(result.message, 'Проверка не прошла') },
      }));
    } catch (err) {
      setTests((t) => ({
        ...t,
        [role]: { state: 'error', message: formatIpcError(err, 'Проверка не прошла') },
      }));
    }
  };

  const renderRole = (status: RoleStatus) => {
    const test = tests[status.role];
    const label = ROLE_LABELS[status.role];
    const paid = PAID_TEST_ROLES.has(status.role);
    return (
      <li key={status.role} className={`ai-role ai-role--${status.state}`}>
        <div className="ai-role-main">
          <span className="ai-role-name">
            {label}
            <span className="ai-role-state">{ROLE_STATE_LABELS[status.state]}</span>
          </span>
          <span className="ai-role-model">
            {status.modelLabel ?? ROLE_HINTS[status.role]}
            {status.usingFallback && ' · запасная модель'}
          </span>
          {status.message && !(packageNeedsKey && status.state === 'needs_key') && (
            <span className="ai-role-message">{status.message}</span>
          )}
          {test?.state === 'ok' && (
            <span className="ai-role-test ai-role-test--ok" role="status">
              ✓ Работает · {test.latencyMs} мс
            </span>
          )}
          {test?.state === 'error' && (
            <span className="ai-role-test ai-role-test--error" role="alert">
              ✕ {test.message}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void runTest(status.role)}
          disabled={UNTESTABLE_STATES.has(status.state)}
          isLoading={test?.state === 'testing'}
          aria-label={paid ? `Проверить (платно): ${label}` : `Проверить: ${label}`}
        >
          {paid ? 'Проверить · ~$0.03' : 'Проверить'}
        </Button>
      </li>
    );
  };

  return (
    <section className="settings-section ai-models animate-fade-in" aria-labelledby="ai-models-title">
      <div className="ai-models-head">
        <div className="ai-models-titles">
          <h2 id="ai-models-title" className="ai-models-title">
            AI-модели
          </h2>
          <p className="ai-models-summary text-secondary text-sm">
            {summaryOf(current, routes?.illustrations ?? false)}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onOpenWizard}>
          ⚡ Сменить сценарий
        </Button>
      </div>

      {settings?.offlineMode && (
        <p className="ai-notice ai-notice--warn" role="status">
          Офлайн-режим: AI не используется, работает только озвучка. Включите любой пакет, чтобы
          вернуть AI.
        </p>
      )}

      {packageNeedsKey && (
        <p className="ai-notice ai-notice--warn" role="status">
          Вставьте ключ {providerLabel(packageNeedsKey)} в разделе «Пакет моделей» ниже — он
          включит все роли пакета.
        </p>
      )}

      {isLoading && <p className="text-muted text-sm">Загружаем модели…</p>}
      {routesError && (
        <p className="ai-notice ai-notice--error" role="alert">
          {formatIpcError(routesError, 'Не удалось загрузить модели')}
        </p>
      )}

      {statuses.length > 0 && (
        <ul className="ai-groups" aria-label="Готовность возможностей">
          {ROLE_GROUPS.map((group) => {
            const list = grouped[group.id];
            const level = groupLevel(list);
            return (
              <li key={group.id} className={`ai-group ai-group--${level}`}>
                <div className="ai-group-head">
                  <span className="ai-group-dot" aria-hidden="true" />
                  <span className="ai-group-title">{group.title}</span>
                  <span className="ai-group-level">{GROUP_LEVEL_LABELS[level]}</span>
                </div>
                <p className="ai-group-desc text-muted text-xs">{group.description}</p>
                <ul className="ai-roles">{list.map(renderRole)}</ul>
              </li>
            );
          })}
        </ul>
      )}

      <fieldset className="ai-packages">
        <legend className="settings-label text-secondary text-xs font-medium">ПАКЕТ МОДЕЛЕЙ</legend>
        <p className="settings-field-hint text-muted text-xs">
          Один ключ закрывает все роли пакета. Модели для отдельных ролей — в «Расширенных».
        </p>
        <div className="ai-package-grid">
          {MODEL_PACKAGES.map((p) => (
            <label
              key={p.id}
              className={`ai-package${active === p.id ? ' ai-package--selected' : ''}`}
            >
              <input
                type="radio"
                name="ai-package"
                className="ai-package-input"
                value={p.id}
                checked={active === p.id}
                onChange={() => choosePackage(p.id)}
              />
              <span className="ai-package-top">
                <span className="ai-package-title">{p.title}</span>
                {p.recommended && <span className="ai-package-reco">Рекомендуем</span>}
              </span>
              <span className="ai-package-price">
                {p.price}
                {current === p.id && ' · активен'}
              </span>
              <span className="ai-package-tagline">{p.tagline}</span>
            </label>
          ))}
        </div>

        <div className="ai-package-setup">
          {meta.keyProvider && (
            <div className="ai-field">
              <label htmlFor="ai-package-key" className="settings-label text-secondary text-xs font-medium">
                API-КЛЮЧ {providerLabel(meta.keyProvider).toUpperCase()}
                {keyStored && <span className="ai-key-state ai-key-state--ok">ключ сохранён</span>}
              </label>
              <input
                id="ai-package-key"
                type="password"
                className="settings-input settings-input--mono"
                value={keyDraft}
                autoComplete="off"
                placeholder={keyStored ? 'Вставьте новый ключ, чтобы заменить' : 'Вставьте ключ целиком'}
                aria-invalid={keyWarning !== null}
                onChange={(e) => {
                  setKeyDraft(e.target.value);
                  setAppliedNote(null);
                }}
              />
              {keyWarning && (
                <p className="settings-field-warning text-xs" role="alert">
                  {keyWarning}
                </p>
              )}
              <p className="settings-field-hint text-muted text-xs">{KEY_HINTS[meta.keyProvider]}</p>
            </div>
          )}

          {meta.needsAccountId && (
            <div className="ai-field">
              <label htmlFor="ai-package-account" className="settings-label text-secondary text-xs font-medium">
                CLOUDFLARE ACCOUNT ID
              </label>
              <input
                id="ai-package-account"
                type="text"
                className="settings-input settings-input--mono"
                value={accountValue}
                autoComplete="off"
                spellCheck={false}
                placeholder="32 hex-символа из адреса Cloudflare Dashboard"
                aria-invalid={isCloudflareAccountIdInvalid(accountValue)}
                onChange={(e) => setAccountDraft(e.target.value)}
              />
              {isCloudflareAccountIdInvalid(accountValue) && (
                <p className="settings-field-warning text-xs" role="alert">
                  {CLOUDFLARE_ACCOUNT_ID_WARNING}
                </p>
              )}
            </div>
          )}

          {meta.needsBaseUrl && (
            <div className="ai-field">
              <label htmlFor="ai-package-url" className="settings-label text-secondary text-xs font-medium">
                АДРЕС OLLAMA / LM STUDIO
              </label>
              <input
                id="ai-package-url"
                type="url"
                className="settings-input settings-input--mono"
                value={urlValue}
                autoComplete="off"
                spellCheck={false}
                placeholder={DEFAULT_OLLAMA_URL}
                onChange={(e) => setUrlDraft(e.target.value)}
              />
              <p className="settings-field-hint text-muted text-xs">
                Модель по умолчанию — gemma4. Другую можно выбрать в «Расширенных».
              </p>
            </div>
          )}

          {meta.paidIllustrations && (
            <label className="ai-illustrations">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={illustrations}
                onChange={(e) => setIllustrationsDraft(e.target.checked)}
              />
              <span>
                AI-иллюстрации к словам — <strong>платно</strong>, примерно $0.03 за картинку. Без
                них к словам подбираются свободные фото.
              </span>
            </label>
          )}

          {current === 'custom' && !isCurrent && (
            <p className="ai-notice ai-notice--warn">
              Пакет заменит модели, выбранные вручную для отдельных ролей.
            </p>
          )}

          <div className="ai-package-actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => void apply()}
              disabled={!canApply}
              isLoading={applyPackage.isPending}
              aria-label={isCurrent ? `Сохранить пакет ${meta.title}` : `Включить пакет ${meta.title}`}
            >
              {isCurrent ? 'Сохранить' : 'Включить пакет'}
            </Button>
            {keyMissing && <span className="text-muted text-xs">Сначала вставьте ключ</span>}
            {appliedNote && (
              <span className="ai-notice ai-notice--ok" role="status">
                ✓ {appliedNote}
              </span>
            )}
          </div>
          {applyError && (
            <p className="ai-notice ai-notice--error" role="alert">
              {applyError}
            </p>
          )}
        </div>
      </fieldset>

      <div className="ai-advanced">
        <button
          type="button"
          className="btn btn--ghost btn--md ai-advanced-toggle"
          onClick={() => setAdvancedToggle(!advancedOpen)}
          aria-expanded={advancedOpen}
          aria-controls="ai-advanced-body"
        >
          <span className="btn-content">
            {advancedOpen ? 'Скрыть расширенные' : 'Расширенные: модель для каждой роли'}
          </span>
        </button>
        {advancedOpen && (
          <div id="ai-advanced-body" className="ai-advanced-body">
            <p className="settings-field-hint text-muted text-xs">
              Здесь можно смешивать провайдеров — например, текст через Claude, а голос через
              Gemini. Каждому провайдеру нужен свой ключ и отдельная оплата. Любое изменение
              переводит AI в режим «Свои модели».
            </p>
            <div className="ai-route-list">
              {MODEL_ROLES.map((role) => {
                const status = statuses.find((s) => s.role === role);
                return status ? (
                  <RoleRouteEditor
                    key={role}
                    status={status}
                    catalog={catalog}
                    onSaved={onSettingsChanged}
                  />
                ) : null;
              })}
            </div>
            <ProviderKeysEditor
              providers={providersNeedingKeys(statuses)}
              keysStatus={keysStatus}
              settings={settings}
              needsCloudflareAccount={routesUseProvider(statuses, 'cloudflare')}
              needsBaseUrl={routesUseProvider(statuses, 'custom')}
              onSettingsChanged={onSettingsChanged}
            />
          </div>
        )}
      </div>
    </section>
  );
}
