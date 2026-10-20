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
import { formatIpcError } from '../../lib/utils';

export function GrammarWatchSection() {
  const { t: tUi } = useI18n();
  const { data: settings, isLoading } = useGrammarWatchSettings();
  const { data: status } = useGrammarWatchStatus();
  const update = useUpdateGrammarWatchSettings();
  const requestAccess = useRequestGrammarWatchAccess();
  const [newApp, setNewApp] = useState('');
  // Shown until the save settles, so the checkbox never flips back mid-save.
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const inputId = useId();

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
    <div id="settings-writing-check" className="settings-section" aria-labelledby="grammar-watch-title">
      <h3 id="grammar-watch-title" className="settings-section-title settings-section-title--spaced">{tUi("Writing check in other apps")}</h3>

      <div className="settings-fields">
        <label className="settings-checkbox-label">
          <input dir="auto"
            type="checkbox"
            checked={enabled}
            disabled={!supported || isLoading || update.isPending}
            onChange={(event) => handleToggle(event.target.checked)}
            className="settings-checkbox"
          />
          <span className="settings-checkbox-text text-sm font-medium">{tUi("Suggest fixes while I type in any app")}</span>
        </label>
        <p className="text-secondary text-xs">{tUi("Lexora reads the text field you are typing in and, after a short pause, sends the text to your AI provider to check it in your learning language. A badge appears in the corner of the field; click it to apply fixes right there. Password fields are never read and checks are not saved. Uses your AI provider and may incur API cost.")}</p>
        {!supported && status && (
          <p className="text-secondary text-xs">{tUi("Available on macOS and Windows.")}</p>
        )}

        {needsAccess && (
          <div className="grammar-settings-access" role="alert">
            <p className="text-sm">{tUi("Lexora needs Accessibility access to read and fix text in other apps: System Settings → Privacy & Security → Accessibility.")}</p>
            <Button
              size="sm"
              onClick={() => requestAccess.mutate()}
              disabled={requestAccess.isPending}
            >{tUi("Grant access")}</Button>
          </div>
        )}

        {update.isError && (
          <p className="text-danger text-xs" role="alert">
            {formatIpcError(update.error, tUi("Could not save the setting."))}
          </p>
        )}

        <div>
          <label htmlFor={inputId} className="settings-label text-secondary text-xs font-medium">{tUi("NEVER CHECK IN THESE APPS (BUNDLE ID OR .EXE NAME)")}</label>
          <ul className="grammar-settings-apps" aria-label={tUi("Excluded apps")}>
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
                  ×
                </button>
              </li>
            ))}
          </ul>
          {/* Not a <form>: the section lives inside the Settings form, and a
              nested submit would also run the page-wide save. */}
          <div className="grammar-settings-add">
            <input dir="auto"
              id={inputId}
              type="text"
              className="settings-input settings-input--mono"
              value={newApp}
              onChange={(event) => setNewApp(event.target.value)}
              onKeyDown={handleAddKey}
              placeholder={tUi("com.example.app, notepad.exe or com.example.*")}
              disabled={!settings}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newApp.trim() || update.isPending}>{tUi("Add")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
