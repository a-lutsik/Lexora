import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Settings → Writing check in other apps
// Opt-in «Grammarly mode»: Lexora watches the text field you type
// in (any app) and offers fixes next to it. Saved immediately.
// ============================================================

import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  useGrammarWatchSettings,
  useGrammarWatchStatus,
  useRequestGrammarWatchAccess,
  useUpdateGrammarWatchSettings,
} from '../../hooks/useGrammarWatch';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { formatIpcError } from '../../lib/utils';
import { SettingsPanel } from './SettingsPanel';

type GrammarWatchSectionProps = {
  /** Element id of the panel on the Settings page. */
  panelId: string;
};

export function GrammarWatchSection({ panelId }: GrammarWatchSectionProps) {
  const { t: tUi } = useI18n();
  const { data: settings, isLoading } = useGrammarWatchSettings();
  const { data: status } = useGrammarWatchStatus();
  const update = useUpdateGrammarWatchSettings();
  const requestAccess = useRequestGrammarWatchAccess();
  const [newApp, setNewApp] = useState('');
  // Shown until the save settles, so the checkbox never flips back mid-save.
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const inputId = useId();
  const toggleId = useId();

  const supported = status?.supported ?? false;
  const enabled = pendingEnabled ?? settings?.enabled ?? false;
  const excluded = settings?.excludedApps ?? [];
  const needsAccess = supported && enabled && status?.accessibilityTrusted === false;

  const save = (next: { enabled?: boolean; excludedApps?: string[] }) => {
    if (!settings) return;
    update.mutate(
      {
        enabled: next.enabled ?? settings.enabled,
        excludedApps: next.excludedApps ?? settings.excludedApps,
      },
      { onSettled: () => setPendingEnabled(null) },
    );
  };

  const handleToggle = (checked: boolean) => {
    setPendingEnabled(checked);
    save({ enabled: checked });
  };

  const handleAdd = () => {
    const bundleId = newApp.trim();
    if (!bundleId || excluded.includes(bundleId)) {
      setNewApp('');
      return;
    }
    save({ excludedApps: [...excluded, bundleId] });
    setNewApp('');
  };

  const handleAddKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleAdd();
  };

  return (
    <SettingsPanel id={panelId} title={tUi("Writing check in other apps")}>
      <div className="settings-section settings-section--rows">
        <div className="settings-row">
          <div className="settings-row__text">
            <label htmlFor={toggleId} className="settings-row__label">{tUi("Suggest fixes while I type in any app")}</label>
            <p className="settings-row__desc">{tUi("Lexora reads the text field you are typing in and, after a short pause, sends the text to your AI provider to check it in your learning language. A badge appears in the corner of the field; click it to apply fixes right there. Password fields are never read and checks are not saved. Uses your AI provider and may incur API cost.")}</p>
            {!supported && status && (
              <p className="settings-row__desc">{tUi("Available on macOS and Windows.")}</p>
            )}
          </div>
          <div className="settings-row__control">
            <span className="settings-check">
              <input dir="auto"
                id={toggleId}
                type="checkbox"
                checked={enabled}
                disabled={!supported || isLoading || update.isPending}
                onChange={(event) => handleToggle(event.target.checked)}
                className="settings-checkbox"
              />
            </span>
          </div>
          {update.isError && (
            <p className="settings-field-error" role="alert">
              {formatIpcError(update.error, tUi("Could not save the setting."))}
            </p>
          )}
        </div>

        {needsAccess && (
          <div className="grammar-settings-access" role="alert">
            <Icon name="warning" size={18} className="icon--warn" />
            <p className="grammar-settings-access-text">{tUi("Lexora needs Accessibility access to read and fix text in other apps: System Settings → Privacy & Security → Accessibility.")}</p>
            <Button
              size="sm"
              onClick={() => requestAccess.mutate()}
              disabled={requestAccess.isPending}
            >{tUi("Grant access")}</Button>
          </div>
        )}

        <div className="settings-row settings-row--block">
          <div className="settings-row__text settings-row__full">
            <label htmlFor={inputId} className="settings-row__label">{tUi("NEVER CHECK IN THESE APPS (BUNDLE ID OR .EXE NAME)")}</label>
          </div>
          <ul className="grammar-settings-apps settings-row__full" aria-label={tUi("Excluded apps")}>
            {excluded.map((bundleId) => (
              <li key={bundleId} className="grammar-settings-app">
                <span className="grammar-settings-app-id">{bundleId}</span>
                <button
                  type="button"
                  className="grammar-settings-app-remove"
                  onClick={() => save({ excludedApps: excluded.filter((id) => id !== bundleId) })}
                  disabled={update.isPending}
                  aria-label={tUi("Check again in {bundleId}", { bundleId: bundleId })}
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="grammar-settings-add settings-row__full">
            <div className="field">
              <input dir="auto"
                id={inputId}
                type="text"
                className="field__input ai-key-input"
                value={newApp}
                onChange={(event) => setNewApp(event.target.value)}
                onKeyDown={handleAddKey}
                placeholder={tUi("com.example.app, notepad.exe or com.example.*")}
                disabled={!settings}
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newApp.trim() || update.isPending}>{tUi("Add")}</Button>
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}
