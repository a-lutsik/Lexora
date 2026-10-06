// ============================================================
// LEXORA — ProviderKeysEditor (Settings → AI-модели → Расширенные)
// Keys of every provider the role routes use, plus connection
// details (Cloudflare Account ID, local server URL).
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useSetApiKey, useUpdateSettings } from '../../hooks/useSettings';
import {
  CLOUDFLARE_ACCOUNT_ID_WARNING,
  DEFAULT_OLLAMA_URL,
  KEY_HINTS,
  isCloudflareAccountIdInvalid,
  providerLabel,
} from '../../lib/modelRouting';
import { formatIpcError } from '../../lib/utils';
import type { AppSettings } from '../../lib/types';

type ProviderKeysEditorProps = {
  /** Keyed providers used by the current routes. */
  providers: string[];
  keysStatus: Record<string, boolean>;
  settings: AppSettings | undefined;
  needsCloudflareAccount: boolean;
  needsBaseUrl: boolean;
  onSettingsChanged: (settings: AppSettings) => void;
};

type Notice = { ok: boolean; text: string };

export function ProviderKeysEditor({
  providers,
  keysStatus,
  settings,
  needsCloudflareAccount,
  needsBaseUrl,
  onSettingsChanged,
}: ProviderKeysEditorProps) {
  const setApiKey = useSetApiKey();
  const updateSettings = useUpdateSettings();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [account, setAccount] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const accountValue = account ?? settings?.cloudflareAccountId ?? '';
  const baseUrlValue = baseUrl ?? settings?.customBaseUrl ?? DEFAULT_OLLAMA_URL;
  const connectionDirty = account !== null || baseUrl !== null;

  const saveKey = async (provider: string) => {
    const key = drafts[provider]?.trim() ?? '';
    if (!key) return;
    setNotice(null);
    try {
      await setApiKey.mutateAsync({ provider, key });
      setDrafts((d) => ({ ...d, [provider]: '' }));
      setNotice({ ok: true, text: `Ключ ${providerLabel(provider)} сохранён` });
    } catch (err) {
      setNotice({ ok: false, text: formatIpcError(err, 'Не удалось сохранить ключ') });
    }
  };

  const saveConnection = async () => {
    if (!settings) return;
    setNotice(null);
    try {
      const updated = await updateSettings.mutateAsync({
        ...settings,
        cloudflareAccountId: needsCloudflareAccount
          ? accountValue.trim() || null
          : settings.cloudflareAccountId,
        customBaseUrl: needsBaseUrl ? baseUrlValue.trim() || null : settings.customBaseUrl,
      });
      setAccount(null);
      setBaseUrl(null);
      onSettingsChanged(updated);
      setNotice({ ok: true, text: 'Параметры подключения сохранены' });
    } catch (err) {
      setNotice({ ok: false, text: formatIpcError(err, 'Не удалось сохранить') });
    }
  };

  return (
    <div className="ai-keys">
      <h4 className="ai-subtitle">Ключи провайдеров</h4>
      {providers.length === 0 ? (
        <p className="settings-field-hint text-muted text-xs">Текущие модели не требуют ключей.</p>
      ) : (
        <ul className="ai-key-list">
          {providers.map((provider) => {
            const stored = keysStatus[provider] === true;
            const label = providerLabel(provider);
            const inputId = `ai-key-${provider}`;
            return (
              <li key={provider} className="ai-key-row">
                <label htmlFor={inputId} className="ai-key-label">
                  {label}
                  <span className={`ai-key-state ai-key-state--${stored ? 'ok' : 'missing'}`}>
                    {stored ? 'ключ сохранён' : 'нет ключа'}
                  </span>
                </label>
                <input
                  id={inputId}
                  type="password"
                  className="settings-input settings-input--mono"
                  value={drafts[provider] ?? ''}
                  autoComplete="off"
                  placeholder={stored ? 'Вставьте новый ключ, чтобы заменить' : 'Вставьте ключ'}
                  onChange={(e) => setDrafts((d) => ({ ...d, [provider]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void saveKey(provider);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void saveKey(provider)}
                  disabled={!drafts[provider]?.trim()}
                  isLoading={setApiKey.isPending && setApiKey.variables?.provider === provider}
                  aria-label={`Сохранить ключ ${label}`}
                >
                  Сохранить
                </Button>
                {KEY_HINTS[provider] && (
                  <p className="ai-key-hint text-muted text-xs">{KEY_HINTS[provider]}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(needsCloudflareAccount || needsBaseUrl) && (
        <div className="ai-connection">
          {needsCloudflareAccount && (
            <div className="ai-field">
              <label htmlFor="ai-cf-account" className="settings-label text-secondary text-xs font-medium">
                CLOUDFLARE ACCOUNT ID
              </label>
              <input
                id="ai-cf-account"
                type="text"
                className="settings-input settings-input--mono"
                value={accountValue}
                autoComplete="off"
                spellCheck={false}
                placeholder="32 hex-символа из адреса Cloudflare Dashboard"
                aria-invalid={isCloudflareAccountIdInvalid(accountValue)}
                onChange={(e) => setAccount(e.target.value)}
              />
              {isCloudflareAccountIdInvalid(accountValue) && (
                <p className="settings-field-warning text-xs" role="alert">
                  {CLOUDFLARE_ACCOUNT_ID_WARNING}
                </p>
              )}
            </div>
          )}
          {needsBaseUrl && (
            <div className="ai-field">
              <label htmlFor="ai-base-url" className="settings-label text-secondary text-xs font-medium">
                АДРЕС ЛОКАЛЬНОГО СЕРВЕРА (OPENAI-СОВМЕСТИМЫЙ)
              </label>
              <input
                id="ai-base-url"
                type="url"
                className="settings-input settings-input--mono"
                value={baseUrlValue}
                autoComplete="off"
                spellCheck={false}
                placeholder={DEFAULT_OLLAMA_URL}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void saveConnection()}
            disabled={!connectionDirty || !settings}
            isLoading={updateSettings.isPending}
            aria-label="Сохранить параметры подключения"
          >
            Сохранить подключение
          </Button>
        </div>
      )}

      {notice && (
        <p
          className={`ai-notice ai-notice--${notice.ok ? 'ok' : 'error'}`}
          role={notice.ok ? 'status' : 'alert'}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
