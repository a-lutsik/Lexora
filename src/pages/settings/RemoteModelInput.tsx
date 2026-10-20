// ============================================================
// LEXORA — RemoteModelInput (Settings → Продвинутый режим)
// Model id field with suggestions from the provider's own list
// for the saved key; any id can still be typed by hand.
// ============================================================

import { useId } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useProviderModels } from '../../hooks/useModelRoutes';
import { KEYED_PROVIDERS, ROLE_CAPABILITY, providerLabel } from '../../lib/modelRouting';
import { formatIpcError } from '../../lib/utils';
import type { ModelRole, RemoteModel } from '../../lib/types';

type RemoteModelInputProps = {
  provider: string;
  role: ModelRole;
  value: string;
  onChange: (model: string) => void;
  keysStatus: Record<string, boolean>;
  ariaLabel: string;
};

/** Models of the role first; an unknown or empty match falls back to the whole list. */
function modelsForRole(models: RemoteModel[], role: ModelRole): RemoteModel[] {
  const capability = ROLE_CAPABILITY[role];
  const matching = models.filter((m) => m.capabilities.includes(capability));
  return matching.length > 0 ? matching : models;
}

export function RemoteModelInput({
  provider,
  role,
  value,
  onChange,
  keysStatus,
  ariaLabel,
}: RemoteModelInputProps) {
  const { t } = useI18n();
  const listId = useId();
  const keyMissing = KEYED_PROVIDERS.includes(provider) && keysStatus[provider] !== true;
  const { data, isFetching, error } = useProviderModels(provider, !keyMissing);
  const models = data ? modelsForRole(data, role) : [];
  const name = providerLabel(provider);

  let status: string | null = null;
  if (keyMissing) {
    status = t("Сохраните ключ {provider}, чтобы подтянуть список его моделей", { provider: name });
  } else if (isFetching) {
    status = t("Загружаем модели {provider}…", { provider: name });
  } else if (error) {
    status = t("Список моделей недоступен: {reason}. Введите ID вручную.", {
      reason: formatIpcError(error, t("ошибка провайдера")),
    });
  } else if (data) {
    status = t("Доступно моделей: {count} — начните вводить название", { count: models.length });
  }

  return (
    <>
      <input
        dir="auto"
        type="text"
        className="settings-input settings-input--mono"
        value={value}
        list={models.length > 0 ? listId : undefined}
        placeholder={t("ID модели, например qwen3:8b")}
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      />
      {models.length > 0 && (
        <datalist id={listId}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label ?? ''}
            </option>
          ))}
        </datalist>
      )}
      {status && (
        <p className={`ai-route-models-status${error ? ' ai-route-models-status--error' : ''}`} role="status">
          {status}
        </p>
      )}
    </>
  );
}
