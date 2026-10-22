import { localizeModelMessage } from '../../lib/interfaceText';
import { t as tUi } from "../../i18n";
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — AiModelsPanel (Settings → «AI-модели»)
// Progressive disclosure:
//  1. readiness of Текст / Картинки / Голос / Иллюстрации + «Проверить»;
//  2. one package = one key (Gemini recommended);
//  3. «Продвинутый режим» — a separate switch: a model per role,
//     mixing providers (translation via DeepSeek, voice via Gemini).
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Select, type SelectOption } from '../../components/ui/Select';
import {
  useApplyModelPackage,
  useModelCatalog,
  useModelRoutes,
  useSetAdvancedModels,
  useSetRoleRoute,
  useTestModelRole,
} from '../../hooks/useModelRoutes';
import {
  CLOUDFLARE_ACCOUNT_ID_WARNING,
  DEFAULT_OLLAMA_URL,
  KEY_HINTS,
  MODEL_PACKAGES,
  MODEL_ROLES,
  ROLE_GROUPS,
  ROLE_LABELS,
  ROLE_STATE_LABELS,
  groupLevel,
  isCloudflareAccountIdInvalid,
  modelsForRole,
  packageMeta,
  parseTargetKey,
  providerLabel,
  providersNeedingKeys,
  routesUseProvider,
  statusesByGroup,
  targetKey,
  targetLabel,
  type ApplicablePackageId,
} from '../../lib/modelRouting';
import { detectProviderByKey } from '../../lib/setupProfile';
import { formatIpcError } from '../../lib/utils';
import type { AppSettings, ModelPackageId, ModelRole, ModelSpec, RoleState, RoleStatus } from '../../lib/types';
import { ProviderKeysEditor } from './ProviderKeysEditor';
import { RoleRouteEditor } from './RoleRouteEditor';
import { SettingsPanel } from './SettingsPanel';
import './ai-models.css';

type AiModelsPanelProps = {
  /** Element id of the panel on the Settings page. */
  panelId: string;
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

/** Element id of the scenario (model package) chooser under the header. */
const SCENARIO_ID = 'ai-scenario';

const UNTESTABLE_STATES: ReadonlySet<RoleState> = new Set<RoleState>([
  'off',
  'unsupported',
  'needs_key',
]);

function scenarioOf(packageId: ModelPackageId | null): string {
  if (packageId === 'custom') return tUi("Свои модели по ролям (расширенный режим)");
  const meta = packageMeta(packageId);
  if (!meta) return tUi("Пакет моделей не выбран");
  return tUi("Сценарий: {value1} · {value2}", { value1: tUi(meta.price), value2: tUi(meta.title) });
}

/** «Scenario: Free tier · Google Gemini. One role needs a key.» */
function summaryOf(packageId: ModelPackageId | null, statuses: readonly RoleStatus[]): string {
  const scenario = scenarioOf(packageId);
  const waiting = statuses.filter((s) => s.state === 'needs_key').length;
  if (waiting === 0) return scenario;
  const keys =
    waiting === 1
      ? tUi("Одной роли нужен ключ.")
      : tUi("Ключ нужен ролям: {count}.", { count: waiting });
  return `${scenario}. ${keys}`;
}

function withoutRole<T>(map: Partial<Record<ModelRole, T>>, role: ModelRole): Partial<Record<ModelRole, T>> {
  const next = { ...map };
  delete next[role];
  return next;
}

/** Catalog models of a role for the table's model picker; the saved model stays listed. */
function roleModelOptions(catalog: ModelSpec[], status: RoleStatus): SelectOption[] {
  const options: SelectOption[] = modelsForRole(catalog, status.role).map((m) => ({
    value: targetKey({ provider: m.provider, model: m.id }),
    label: `${providerLabel(m.provider)} · ${tUi(m.label)}`,
  }));
  const primary = status.chain[0];
  if (primary && !options.some((o) => o.value === targetKey(primary))) {
    options.push({ value: targetKey(primary), label: targetLabel(catalog, primary) });
  }
  return options;
}

export function AiModelsPanel({
  panelId,
  settings,
  keysStatus,
  onOpenWizard,
  onSettingsChanged,
}: AiModelsPanelProps) {
  const { t: tUi } = useI18n();
  const { data: routes, isLoading, error: routesError } = useModelRoutes();
  const { data: catalog = [] } = useModelCatalog();
  const applyPackage = useApplyModelPackage();
  const testRole = useTestModelRole();
  const setAdvanced = useSetAdvancedModels();
  const setRoute = useSetRoleRoute();

  const [selected, setSelected] = useState<ApplicablePackageId | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [accountDraft, setAccountDraft] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [illustrationsDraft, setIllustrationsDraft] = useState<boolean | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [tests, setTests] = useState<Partial<Record<ModelRole, RoleTest>>>({});
  const [advancedDraft, setAdvancedDraft] = useState<boolean | null>(null);
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [routeErrors, setRouteErrors] = useState<Partial<Record<ModelRole, string>>>({});

  const current = routes?.package ?? null;
  const statuses: RoleStatus[] = routes?.roles ?? [];
  const grouped = statusesByGroup(statuses);
  const active: ApplicablePackageId =
    selected ?? (current && current !== 'custom' ? current : 'gemini');
  const meta = packageMeta(active) ?? MODEL_PACKAGES[0];
  const isCurrent = current === active;
  const advancedOn = advancedDraft ?? settings?.advancedModels ?? current === 'custom';

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
      ? tUi("Похоже на ключ {value1}, а нужен ключ {value2}", { value1: providerLabel(detectedKey), value2: providerLabel(meta.keyProvider) })
      : null;
  const hasChanges =
    !isCurrent ||
    keyTyped ||
    illustrations !== savedIllustrations ||
    accountDraft !== null ||
    urlDraft !== null;
  const canApply = !keyMissing && !accountMissing && hasChanges;

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
      setAppliedNote(tUi("Пакет «{value1}» включён", { value1: meta.title }));
    } catch (err) {
      setApplyError(formatIpcError(err, tUi("Не удалось включить пакет")));
    }
  };

  const toggleAdvanced = async (enabled: boolean) => {
    setAdvancedError(null);
    setAdvancedDraft(enabled);
    try {
      const saved = await setAdvanced.mutateAsync(enabled);
      onSettingsChanged(saved);
    } catch (err) {
      setAdvancedDraft(null);
      setAdvancedError(formatIpcError(err, tUi("Не удалось переключить продвинутый режим")));
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
          : { state: 'error', message: formatIpcError(result.message, tUi("Проверка не прошла")) },
      }));
    } catch (err) {
      setTests((t) => ({
        ...t,
        [role]: { state: 'error', message: formatIpcError(err, tUi("Проверка не прошла")) },
      }));
    }
  };

  const isTestable = (status: RoleStatus) => !UNTESTABLE_STATES.has(status.state);
  // Free checks only, one after another: a burst would trip provider rate limits.
  const freeTestable = statuses.filter((s) => isTestable(s) && !PAID_TEST_ROLES.has(s.role));

  const testAll = async () => {
    setTestingAll(true);
    try {
      for (const status of freeTestable) {
        await runTest(status.role);
      }
    } finally {
      setTestingAll(false);
    }
  };

  /** Table picker: the chosen model becomes the primary target, the rest of the chain stays. */
  const chooseModel = async (status: RoleStatus, value: string) => {
    const primary = status.chain[0];
    if (primary && targetKey(primary) === value) return;
    const target = parseTargetKey(value);
    if (!target) return;
    const targets = [target, ...status.chain.slice(1).filter((t) => targetKey(t) !== value)];
    setRouteErrors((e) => withoutRole(e, status.role));
    try {
      const setup = await setRoute.mutateAsync({ role: status.role, targets });
      setTests((t) => withoutRole(t, status.role));
      onSettingsChanged(setup.settings);
    } catch (err) {
      setRouteErrors((e) => ({ ...e, [status.role]: formatIpcError(err, tUi("Не удалось сохранить модель")) }));
    }
  };

  const renderRole = (status: RoleStatus) => {
    const test = tests[status.role];
    const routeError = routeErrors[status.role];
    const label = tUi(ROLE_LABELS[status.role]);
    const paid = PAID_TEST_ROLES.has(status.role);
    const primary = status.chain[0];
    const saving = setRoute.isPending && setRoute.variables?.role === status.role;
    const showMessage =
      status.message !== '' && (status.state === 'unavailable' || status.state === 'unsupported');
    return (
      <li key={status.role} className={`ai-role ai-role--${status.state}`}>
        <div className="ai-role-main">
          <span className="ai-role-name">{label}</span>
          {showMessage && <span className="ai-role-message">{localizeModelMessage(status.message)}</span>}
        </div>
        <div className="ai-role-model">
          <Select
            className="ai-role-select"
            options={roleModelOptions(catalog, status)}
            value={primary ? targetKey(primary) : ''}
            displayLabel={
              status.modelLabel
                ? `${localizeModelMessage(status.modelLabel)}${status.usingFallback ? tUi(" · запасная модель") : ''}`
                : undefined
            }
            placeholder={tUi("— выключено —")}
            disabled={saving}
            onChange={(value) => void chooseModel(status, value)}
            ariaLabel={tUi("Модель: {roleLabel}", { roleLabel: label })}
          />
        </div>
        <span className="status ai-role-state">
          <span className="status-dot ai-role-dot" aria-hidden="true" />
          {tUi(ROLE_STATE_LABELS[status.state])}
        </span>
        <span className="ai-role-action">
          <button
            type="button"
            className="ai-role-test-link"
            onClick={() => void runTest(status.role)}
            disabled={!isTestable(status) || testingAll || test?.state === 'testing'}
            aria-busy={test?.state === 'testing'}
            aria-label={paid ? tUi("Проверить (платно): {label}", { label: label }) : tUi("Проверить: {label}", { label: label })}
          >
            {paid ? tUi("Проверить · ~$0.03") : tUi("Проверить")}
          </button>
        </span>
        {test?.state === 'ok' && (
          <span className="ai-role-test ai-role-test--ok" role="status">{tUi("✓ Работает · ")}{test.latencyMs}{tUi(" мс")}</span>
        )}
        {test?.state === 'error' && (
          <span className="ai-role-test ai-role-test--error" role="alert">
            ✕ {test.message}
          </span>
        )}
        {routeError && (
          <span className="ai-role-test ai-role-test--error" role="alert">
            ✕ {routeError}
          </span>
        )}
      </li>
    );
  };

  return (
    <SettingsPanel
      id={panelId}
      title={tUi("AI-модели")}
      subtitle={summaryOf(current, statuses)}
      actions={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={() => void testAll()}
            disabled={freeTestable.length === 0}
            isLoading={testingAll}
          >
            <Icon name="play_circle" size={17} />
            {tUi("Проверить все")}
          </Button>
          {/* Native button: the shared Button has no aria-expanded. */}
          <button
            type="button"
            className="btn btn--secondary btn--md"
            aria-expanded={scenarioOpen}
            aria-controls={scenarioOpen ? SCENARIO_ID : undefined}
            onClick={() => setScenarioOpen((open) => !open)}
          >
            <span className="btn-content">
              <Icon name="tune" size={17} />
              {tUi("Сменить сценарий")}
            </span>
          </button>
        </>
      }
    >
      {settings?.offlineMode && (
        <p className="ai-notice ai-notice--warn" role="status">{tUi("Офлайн-режим: AI не используется, работает только озвучка. Включите любой пакет, чтобы вернуть AI.")}</p>
      )}

      {isLoading && <p className="inline-note">{tUi("Загружаем модели…")}</p>}
      {routesError && (
        <p className="ai-notice ai-notice--error" role="alert">
          {formatIpcError(routesError, tUi("Не удалось загрузить модели"))}
        </p>
      )}

      {scenarioOpen && (
        <fieldset id={SCENARIO_ID} className="settings-section ai-packages">
          <legend className="ai-legend">{tUi("ПАКЕТ МОДЕЛЕЙ")}</legend>
          <div className="ai-packages-intro">
            <p className="settings-field-hint">{tUi("Один ключ закрывает все роли пакета. Свою модель для каждой функции можно выбрать в продвинутом режиме ниже.")}</p>
            <Button variant="ghost" size="sm" onClick={onOpenWizard}>{tUi("Открыть мастер настройки")}</Button>
          </div>
          <div className="ai-package-grid">
            {MODEL_PACKAGES.map((p) => (
              <label
                key={p.id}
                className={`card card--selectable ai-package${active === p.id ? ' is-selected ai-package--selected' : ''}`}
              >
                <input dir="auto"
                  type="radio"
                  name="ai-package"
                  className="ai-package-input"
                  value={p.id}
                  checked={active === p.id}
                  onChange={() => choosePackage(p.id)}
                />
                <span className="ai-package-top">
                  <span className="ai-package-title">{tUi(p.title)}</span>
                  {p.recommended && <span className="tag tag--accent ai-package-reco">{tUi("Рекомендуем")}</span>}
                </span>
                <span className="ai-package-price">
                  {tUi(p.price)}
                  {current === p.id && tUi(" · активен")}
                </span>
                <span className="ai-package-tagline">{tUi(p.tagline)}</span>
              </label>
            ))}
          </div>

          <div className="ai-package-setup">
            {meta.keyProvider && (
              <div className="ai-field">
                <label htmlFor="ai-package-key" className="settings-label">{tUi("API-КЛЮЧ ")}{providerLabel(meta.keyProvider)}
                  {keyStored && <span className="ai-key-state ai-key-state--ok">{tUi("ключ сохранён")}</span>}
                </label>
                <div className={`field ai-key-field${keyWarning !== null ? ' is-invalid' : ''}`}>
                  <Icon name="key" size={18} className="field__icon" />
                  <input dir="auto"
                    id="ai-package-key"
                    type="password"
                    className="field__input ai-key-input"
                    value={keyDraft}
                    autoComplete="off"
                    placeholder={keyStored ? tUi("Вставьте новый ключ, чтобы заменить") : tUi("Вставьте ключ целиком")}
                    aria-invalid={keyWarning !== null}
                    onChange={(e) => {
                      setKeyDraft(e.target.value);
                      setAppliedNote(null);
                    }}
                  />
                </div>
                {keyWarning && (
                  <p className="settings-field-warning" role="alert">
                    {keyWarning}
                  </p>
                )}
                <p className="settings-field-hint">{tUi(KEY_HINTS[meta.keyProvider])}</p>
              </div>
            )}

            {meta.needsAccountId && (
              <div className="ai-field">
                <label htmlFor="ai-package-account" className="settings-label">{tUi("CLOUDFLARE ACCOUNT ID")}</label>
                <input dir="auto"
                  id="ai-package-account"
                  type="text"
                  className="settings-input settings-input--mono"
                  value={accountValue}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={tUi("32 hex-символа из адреса Cloudflare Dashboard")}
                  aria-invalid={isCloudflareAccountIdInvalid(accountValue)}
                  onChange={(e) => setAccountDraft(e.target.value)}
                />
                {isCloudflareAccountIdInvalid(accountValue) && (
                  <p className="settings-field-warning" role="alert">
                    {tUi(CLOUDFLARE_ACCOUNT_ID_WARNING)}
                  </p>
                )}
              </div>
            )}

            {meta.needsBaseUrl && (
              <div className="ai-field">
                <label htmlFor="ai-package-url" className="settings-label">{tUi("АДРЕС OLLAMA / LM STUDIO")}</label>
                <input dir="auto"
                  id="ai-package-url"
                  type="url"
                  className="settings-input settings-input--mono"
                  value={urlValue}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={DEFAULT_OLLAMA_URL}
                  onChange={(e) => setUrlDraft(e.target.value)}
                />
                <p className="settings-field-hint">{tUi("Модель по умолчанию — gemma4. Другую можно выбрать в продвинутом режиме.")}</p>
              </div>
            )}

            {meta.paidIllustrations && (
              <label className="ai-illustrations">
                <input dir="auto"
                  type="checkbox"
                  className="settings-checkbox"
                  checked={illustrations}
                  onChange={(e) => setIllustrationsDraft(e.target.checked)}
                />
                <span>{tUi("AI-иллюстрации к словам — ")}<strong>{tUi("платно")}</strong>{tUi(", примерно $0.03 за картинку. Без них к словам подбираются свободные фото.")}</span>
              </label>
            )}

            {current === 'custom' && !isCurrent && (
              <p className="ai-notice ai-notice--warn">{tUi("Пакет заменит модели, выбранные вручную для отдельных ролей.")}</p>
            )}

            <div className="ai-package-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => void apply()}
                disabled={!canApply}
                isLoading={applyPackage.isPending}
                aria-label={isCurrent ? tUi("Сохранить пакет {value1}", { value1: meta.title }) : tUi("Включить пакет {value1}", { value1: meta.title })}
              >
                {isCurrent ? tUi("Сохранить") : tUi("Включить пакет")}
              </Button>
              {keyMissing && <span className="inline-note">{tUi("Сначала вставьте ключ")}</span>}
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
      )}

      {statuses.length > 0 && (
        <div className="settings-section ai-readiness">
          <ul className="ai-groups" aria-label={tUi("Готовность возможностей")}>
            {ROLE_GROUPS.map((group) => {
              const list = grouped[group.id];
              const level = groupLevel(list);
              return (
                <li key={group.id} className={`ai-group ai-group--${level}`}>
                  <div className="ai-group-head">
                    <span className="ai-group-title">{tUi(group.title)}</span>
                    <span className="ai-group-desc">{tUi(group.description)}</span>
                  </div>
                  <ul className="ai-roles">{list.map(renderRole)}</ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ProviderKeysEditor
        providers={providersNeedingKeys(statuses)}
        keysStatus={keysStatus}
        settings={settings}
        needsCloudflareAccount={routesUseProvider(statuses, 'cloudflare')}
        needsBaseUrl={routesUseProvider(statuses, 'custom')}
        onSettingsChanged={onSettingsChanged}
      />

      <div className="settings-section ai-advanced">
        <label className="ai-advanced-switch">
          <input
            type="checkbox"
            role="switch"
            className="settings-checkbox"
            checked={advancedOn}
            disabled={setAdvanced.isPending}
            aria-controls="ai-advanced-body"
            onChange={(e) => void toggleAdvanced(e.target.checked)}
          />
          <span className="ai-advanced-switch-title">{tUi("Продвинутый режим: своя модель для каждой функции")}</span>
          <span className="ai-advanced-switch-desc">{tUi("Например, перевод через DeepSeek, а голос через Gemini. Каждому провайдеру нужен свой ключ и отдельная оплата.")}</span>
        </label>
        {advancedError && (
          <p className="ai-notice ai-notice--error" role="alert">
            {advancedError}
          </p>
        )}
        {!advancedOn && current === 'custom' && (
          <p className="ai-notice" role="status">{tUi("Сейчас работают модели, выбранные вручную. Чтобы вернуться к одному провайдеру, включите пакет выше.")}</p>
        )}
        {advancedOn && (
          <div id="ai-advanced-body" className="ai-advanced-body">
            <p className="settings-field-hint">{tUi("Основная модель отвечает первой; если она перестала работать, запрос автоматически уходит запасной. Любое изменение переводит AI в режим «Свои модели».")}</p>
            <div className="ai-route-list">
              {MODEL_ROLES.map((role) => {
                const status = statuses.find((s) => s.role === role);
                return status ? (
                  <RoleRouteEditor
                    key={role}
                    status={status}
                    catalog={catalog}
                    keysStatus={keysStatus}
                    onSaved={onSettingsChanged}
                  />
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </SettingsPanel>
  );
}
