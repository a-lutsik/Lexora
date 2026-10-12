// ============================================================
// LEXORA — Settings Page
// AI models (packages, role readiness, advanced per-role routes),
// languages, privacy, desktop widgets, shortcuts and backups.
// ============================================================

import { useCallback, useState, useEffect, useRef, type FormEvent } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { ipc } from '../../lib/ipc';
import { formatIpcError, pluralize } from '../../lib/utils';
import { useSettings, useUpdateSettings, useApiKeysStatus } from '../../hooks/useSettings';
import { useLanguageOptions, resolveLanguageId, useLanguages } from '../../hooks/useLanguages';
import { Button } from '../../components/ui/Button';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { HotkeyInput } from './HotkeyInput';
import { isValidHotkey } from './hotkeyUtils';
import { useCollections } from '../../hooks/useCollections';
import { useSettingsStore } from '../../stores/settingsStore';
import { StickerSourcePicker } from '../../components/domain/StickerSourcePicker';
import { DEFAULT_STICKER_SOURCES } from '../../lib/stickerSources';
import { NONE_IMAGE_MODEL } from '../../lib/imageModels';
import type { AppSettings } from '../../lib/types';
import { SetupWizard } from '../../components/setup/SetupWizard';
import { AiModelsPanel } from './AiModelsPanel';
import { AiUsagePanel } from './AiUsagePanel';
import { GrammarWatchSection } from './GrammarWatchSection';
import { SettingsNav } from './SettingsNav';
import './settings.css';

type BackupStatus = {
  state: 'idle' | 'working' | 'success' | 'error';
  message?: string;
};

const BACKUP_FILE_FILTERS = [{ name: 'Lexora Vocabulary Backup', extensions: ['json'] }];

const DEFAULT_QUIET_START = '22:00';
const DEFAULT_QUIET_END = '07:00';

/** `input type="time"` may yield HH:MM:SS — store canonical HH:MM. */
function normalizeTimeInput(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match?.[1] || !match[2]) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return value;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

function validateHotkeys(hotkeyTranslate: string, hotkeyStickers: string): string | null {
  if (!isValidHotkey(hotkeyTranslate) || !isValidHotkey(hotkeyStickers)) {
    return 'Each shortcut needs at least one modifier (⌘, ⇧ or ⌥) plus a key.';
  }
  if (hotkeyTranslate === hotkeyStickers) {
    return 'Both actions use the same shortcut. Choose different combinations.';
  }
  return null;
}

/** AI fields owned by the model routes (AiModelsPanel / SetupWizard). */
function withSavedAiFields(draft: AppSettings, saved: AppSettings): AppSettings {
  return {
    ...draft,
    aiProvider: saved.aiProvider,
    aiModel: saved.aiModel,
    fallbackAiProvider: saved.fallbackAiProvider,
    fallbackAiModel: saved.fallbackAiModel,
    fallbackEnabled: saved.fallbackEnabled,
    imageModel: saved.imageModel,
    fallbackImageModel: saved.fallbackImageModel,
    ttsEngine: saved.ttsEngine,
    offlineMode: saved.offlineMode,
    customBaseUrl: saved.customBaseUrl,
    cloudflareAccountId: saved.cloudflareAccountId,
    setupProfile: saved.setupProfile,
    modelPackage: saved.modelPackage,
  };
}

export default function SettingsPage() {
  const { data: remoteSettings, isLoading } = useSettings();
  const { data: apiKeysStatus } = useApiKeysStatus();
  const { data: languages } = useLanguages();
  const updateMutation = useUpdateSettings();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const setActiveLanguageId = useSettingsStore((s) => s.setActiveLanguageId);
  const { data: collections = [] } = useCollections(activeLanguageId);

  const [form, setForm] = useState<AppSettings>({
    primaryLanguage: 'en',
    interfaceLanguage: 'ru',
    aiProvider: 'gemini',
    aiModel: 'gemini-3.8-flash',
    customBaseUrl: null,
    cloudflareAccountId: null,
    ttsVoice: 'default',
    stickerCount: 2,
    stickerOpacity: 0.9,
    stickerSources: DEFAULT_STICKER_SOURCES,
    quietHoursStart: null,
    quietHoursEnd: null,
    offlineMode: false,
    writingPrivacyMode: false,
    writingAutoCheck: false,
    hotkeyTranslate: 'CmdOrCtrl+Shift+L',
    hotkeyStickers: 'CmdOrCtrl+Shift+S',
    fallbackAiProvider: 'gemini',
    fallbackAiModel: 'gemini-3.5-flash-lite',
    fallbackEnabled: true,
    imageModel: NONE_IMAGE_MODEL,
    fallbackImageModel: NONE_IMAGE_MODEL,
  });

  const langOptions = useLanguageOptions([form.primaryLanguage, form.interfaceLanguage]);

  const formRef = useRef(form);
  const didHydrateForm = useRef(false);
  formRef.current = form;
  const [savedMessage, setSavedMessage] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({ state: 'idle' });
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardAppliedCount, setWizardAppliedCount] = useState(0);

  const handleOpenSetupWizard = () => setShowSetupWizard(true);
  const handleCloseSetupWizard = () => setShowSetupWizard(false);
  // Пресет применён: эффект ниже подтянет AI-поля из свежих настроек.
  const handleWizardApplied = () => setWizardAppliedCount((n) => n + 1);

  // AiModelsPanel saved models/keys/connection on the backend: keep the
  // in-progress draft of other sections, take the AI fields as saved.
  const handleAiSettingsChanged = useCallback((saved: AppSettings) => {
    setForm((prev) => withSavedAiFields(prev, saved));
  }, []);

  const applyRemoteToForm = useCallback((s: AppSettings) => {
    setForm({
      ...s,
      stickerSources: s.stickerSources?.length ? s.stickerSources : DEFAULT_STICKER_SOURCES,
    });
  }, []);

  // Первичная гидратация формы из сохранённых настроек (один раз).
  useEffect(() => {
    if (!remoteSettings || didHydrateForm.current) {
      return;
    }
    didHydrateForm.current = true;
    applyRemoteToForm(remoteSettings);
  }, [remoteSettings, applyRemoteToForm]);

  // После применения пресета в SetupWizard — взять AI-поля из свежих
  // (сохранённых) настроек, чтобы черновик формы не перезаписал пресет.
  useEffect(() => {
    if (wizardAppliedCount === 0 || !remoteSettings) {
      return;
    }
    didHydrateForm.current = true;
    setForm((prev) => withSavedAiFields(prev, remoteSettings));
  }, [wizardAppliedCount, remoteSettings]);

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);

    const current = formRef.current;
    const hotkeyValidationError = validateHotkeys(current.hotkeyTranslate, current.hotkeyStickers);
    if (hotkeyValidationError) {
      setHotkeyError(hotkeyValidationError);
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync(current);
      setForm({
        ...updated,
        stickerSources: updated.stickerSources?.length
          ? updated.stickerSources
          : DEFAULT_STICKER_SOURCES,
      });
      const langId = resolveLanguageId(languages, updated.primaryLanguage);
      if (langId != null) {
        setActiveLanguageId(langId);
        void ipc.collections.ensureSystemPacks(langId).catch(() => undefined);
      }
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      setSaveError(formatIpcError(err, 'Failed to save settings'));
    }
  };

  const handleHotkeyChange = (field: 'hotkeyTranslate' | 'hotkeyStickers', value: string) => {
    setHotkeyError(null);
    setSaveError(null);
    setForm({ ...form, [field]: value });
  };

  const handleExport = async () => {
    setBackupStatus({ state: 'working' });
    try {
      const path = await save({
        defaultPath: 'lexora-vocabulary-backup.json',
        filters: BACKUP_FILE_FILTERS,
      });
      if (!path) {
        setBackupStatus({ state: 'idle' });
        return;
      }
      const count = await ipc.vocabulary.exportData(path);
      setBackupStatus({ state: 'success', message: `Exported ${pluralize(count, 'word')}` });
    } catch (err: unknown) {
      setBackupStatus({
        state: 'error',
        message: formatIpcError(err, 'Export failed'),
      });
    }
  };

  const handleImport = async () => {
    setBackupStatus({ state: 'working' });
    try {
      const path = await open({
        multiple: false,
        filters: BACKUP_FILE_FILTERS,
      });
      if (!path) {
        setBackupStatus({ state: 'idle' });
        return;
      }
      const result = await ipc.vocabulary.importData(path);
      setBackupStatus({
        state: 'success',
        message: `Imported ${result.imported}, skipped ${result.skipped}`,
      });
    } catch (err: unknown) {
      setBackupStatus({
        state: 'error',
        message: formatIpcError(err, 'Import failed'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="settings-loading animate-pulse text-muted text-sm">
        Loading settings…
      </div>
    );
  }

  const hotkeysDuplicate = form.hotkeyTranslate === form.hotkeyStickers;
  const quietHoursEnabled = form.quietHoursStart != null && form.quietHoursEnd != null;

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (enabled) {
      setForm({
        ...form,
        quietHoursStart: form.quietHoursStart ?? DEFAULT_QUIET_START,
        quietHoursEnd: form.quietHoursEnd ?? DEFAULT_QUIET_END,
      });
      return;
    }
    setForm({ ...form, quietHoursStart: null, quietHoursEnd: null });
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle text-secondary text-sm">
          Configure AI translation engines, free tier models, API keys, and test live connections
        </p>

        <SettingsNav />

        <AiModelsPanel
          settings={remoteSettings}
          keysStatus={apiKeysStatus ?? {}}
          onOpenWizard={handleOpenSetupWizard}
          onSettingsChanged={handleAiSettingsChanged}
        />

        <AiUsagePanel />

        <form onSubmit={handleSave} className="settings-form">
          {/* Languages Section */}
          <div id="settings-language" className="settings-section">
            <h3 className="settings-section-title settings-section-title--spaced">
              Language Preferences
            </h3>

            <div className="settings-lang-grid">
              <div>
                <label
                  htmlFor="settings-learning-lang"
                  className="settings-label text-secondary text-xs font-medium"
                >
                  LEARNING LANGUAGE (SOURCE)
                </label>
                <LanguageSelect
                  id="settings-learning-lang"
                  value={form.primaryLanguage}
                  options={langOptions}
                  onChange={(val) => setForm({ ...form, primaryLanguage: val })}
                  ariaLabel="Learning Language"
                />
                <p className="text-muted text-xs">TTS and pronunciation use this language.</p>
              </div>

              <div>
                <label
                  htmlFor="settings-translation-lang"
                  className="settings-label text-secondary text-xs font-medium"
                >
                  TRANSLATION LANGUAGE (TARGET)
                </label>
                <LanguageSelect
                  id="settings-translation-lang"
                  value={form.interfaceLanguage}
                  options={langOptions}
                  onChange={(val) => setForm({ ...form, interfaceLanguage: val })}
                  ariaLabel="Translation Language"
                />
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div id="settings-privacy" className="settings-section">
            <h3 className="settings-section-title settings-section-title--spaced">
              Privacy
            </h3>

            <div className="settings-fields">
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.writingPrivacyMode}
                  onChange={(e) => setForm({ ...form, writingPrivacyMode: e.target.checked })}
                  className="settings-checkbox"
                />
                <span className="settings-checkbox-text text-sm font-medium">
                  Writing privacy mode
                </span>
              </label>
              <p className="text-secondary text-xs">
                When enabled, text you check or rewrite in the Writing Assistant is not stored —
                no writing history or error patterns are collected.
              </p>

              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.writingAutoCheck}
                  onChange={(e) => setForm({ ...form, writingAutoCheck: e.target.checked })}
                  className="settings-checkbox"
                />
                <span className="settings-checkbox-text text-sm font-medium">
                  Writing auto-check
                </span>
              </label>
              <p className="text-secondary text-xs">
                When enabled, the Writing Assistant automatically checks your text after you pause
                typing. Uses your AI provider and may incur API cost.
              </p>
            </div>
          </div>

          <GrammarWatchSection />

          {/* Desktop Stickers Section */}
          <div id="settings-stickers" className="settings-section">
            <h3 className="settings-section-title settings-section-title--spaced">
              Desktop Stickers & Ambient Review
            </h3>

            <div className="settings-fields">
              <div>
                <label
                  htmlFor="settings-sticker-count"
                  className="settings-label text-secondary text-xs font-medium"
                >
                  MAX CONCURRENT STICKERS: {form.stickerCount}
                </label>
                <input
                  id="settings-sticker-count"
                  type="range"
                  min="1"
                  max="5"
                  value={form.stickerCount}
                  onChange={(e) => setForm({ ...form, stickerCount: Number(e.target.value) })}
                  className="settings-slider"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-sticker-opacity"
                  className="settings-label text-secondary text-xs font-medium"
                >
                  STICKER OPACITY: {Math.round(form.stickerOpacity * 100)}%
                </label>
                <input
                  id="settings-sticker-opacity"
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={form.stickerOpacity}
                  onChange={(e) => setForm({ ...form, stickerOpacity: Number(e.target.value) })}
                  className="settings-slider"
                />
              </div>

              <div className="settings-sticker-sources">
                <p className="text-secondary text-xs">
                  Choose which words appear on desktop stickers. Select my words,
                  collections (Top 5000, irregular verbs, …), or several at once.
                </p>
                <StickerSourcePicker
                  sources={form.stickerSources}
                  collections={collections}
                  onChange={(stickerSources) => setForm({ ...form, stickerSources })}
                />
              </div>

              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                  className="settings-checkbox"
                />
                <span className="settings-checkbox-text text-sm font-medium">
                  Quiet hours — hide stickers overnight
                </span>
              </label>

              {quietHoursEnabled && (
                <div className="settings-quiet-hours">
                  <p className="text-secondary text-xs">
                    Stickers stay hidden between these local times, including overnight ranges
                    (e.g. 22:00–07:00).
                  </p>
                  <div className="settings-quiet-hours-grid">
                    <div>
                      <label className="settings-label text-secondary text-xs font-medium" htmlFor="quiet-hours-start">
                        START
                      </label>
                      <input
                        id="quiet-hours-start"
                        type="time"
                        value={form.quietHoursStart ?? DEFAULT_QUIET_START}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            quietHoursStart: normalizeTimeInput(e.target.value) || DEFAULT_QUIET_START,
                            quietHoursEnd: form.quietHoursEnd ?? DEFAULT_QUIET_END,
                          })
                        }
                        className="settings-input"
                        aria-label="Quiet hours start"
                      />
                    </div>
                    <div>
                      <label className="settings-label text-secondary text-xs font-medium" htmlFor="quiet-hours-end">
                        END
                      </label>
                      <input
                        id="quiet-hours-end"
                        type="time"
                        value={form.quietHoursEnd ?? DEFAULT_QUIET_END}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            quietHoursEnd: normalizeTimeInput(e.target.value) || DEFAULT_QUIET_END,
                            quietHoursStart: form.quietHoursStart ?? DEFAULT_QUIET_START,
                          })
                        }
                        className="settings-input"
                        aria-label="Quiet hours end"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Global Hotkeys Info */}
          <div id="settings-shortcuts" className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">
                Global Shortcuts (System-wide)
              </h3>
              <span className="settings-badge settings-badge--success">
                Active in background
              </span>
            </div>
            <p className="settings-hotkeys-note text-secondary text-xs">
              Press these shortcuts from any macOS app (Safari, Chrome, PDF reader, Notes, etc.).
              You can also click the Lexora icon in the menu bar to open an empty translator,
              or right-click selected text and choose Services → Lexora.
            </p>
            <div className="settings-hotkeys">
              <div className="settings-hotkey-row">
                <div className="settings-hotkey-info">
                  <span>Open Translator</span>
                  <span className="text-muted text-xs">
                    Opens the floating window empty — type freely, nothing is taken from the clipboard
                  </span>
                </div>
                <div className="settings-hotkey-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void ipc.window.openPopup()}
                  >
                    Open Translator
                  </Button>
                  <span className="text-muted text-xs">via tray menu</span>
                </div>
              </div>
              <div className="settings-hotkey-row">
                <div className="settings-hotkey-info">
                  <span>Quick Translate Selected Text</span>
                  <span className="text-muted text-xs">
                    Fills the floating translator only when text is selected — never from the clipboard
                  </span>
                </div>
                <div className="settings-hotkey-actions">
                  <HotkeyInput
                    value={form.hotkeyTranslate}
                    onChange={(value) => handleHotkeyChange('hotkeyTranslate', value)}
                    label="Quick Translate Selected Text shortcut"
                    hasError={hotkeysDuplicate || !isValidHotkey(form.hotkeyTranslate)}
                  />
                </div>
              </div>
              <div className="settings-hotkey-row">
                <div className="settings-hotkey-info">
                  <span>Toggle Stickers</span>
                  <span className="text-muted text-xs">Shows or hides all desktop sticker widgets</span>
                </div>
                <div className="settings-hotkey-actions">
                  <HotkeyInput
                    value={form.hotkeyStickers}
                    onChange={(value) => handleHotkeyChange('hotkeyStickers', value)}
                    label="Toggle Stickers shortcut"
                    hasError={hotkeysDuplicate || !isValidHotkey(form.hotkeyStickers)}
                  />
                </div>
              </div>
              <div className="settings-hotkey-row">
                <div className="settings-hotkey-info">
                  <span>Open Main Window</span>
                  <span className="text-muted text-xs">Brings Lexora dashboard to focus</span>
                </div>
                <div className="settings-hotkey-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void ipc.window.openMain()}
                  >
                    Focus
                  </Button>
                  <span className="text-muted text-xs">via tray menu</span>
                </div>
              </div>
            </div>

            {(hotkeyError || hotkeysDuplicate) && (
              <div className="settings-test-result settings-test-result--error animate-fade-in" role="alert">
                <div className="settings-test-result-message">
                  {hotkeyError ?? 'Both actions use the same shortcut. Choose different combinations.'}
                </div>
              </div>
            )}
          </div>

          {/* Backup / Export Section */}
          <div id="settings-backup" className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">
                Backup / Export
              </h3>
              <span className="settings-badge settings-badge--accent">
                Local JSON
              </span>
            </div>
            <p className="settings-hotkeys-note text-secondary text-xs">
              Export your vocabulary (words, translations, notes and SRS progress) to a JSON file,
              or restore it on another device. Existing words are never overwritten on import.
            </p>

            <div className="settings-backup-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleExport()}
                isLoading={backupStatus.state === 'working'}
              >
                Export vocabulary
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleImport()}
                isLoading={backupStatus.state === 'working'}
              >
                Import vocabulary
              </Button>
            </div>

            {backupStatus.state === 'success' && (
              <div className="settings-test-result settings-test-result--success animate-fade-in">
                <span className="settings-test-result-status--success">
                  ✓ {backupStatus.message}
                </span>
              </div>
            )}
            {backupStatus.state === 'error' && (
              <div className="settings-test-result settings-test-result--error animate-fade-in">
                <div className="settings-test-result-status--error">
                  ✕ Backup operation failed
                </div>
                <div className="settings-test-result-message">
                  {backupStatus.message}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {saveError && (
            <div className="settings-test-result settings-test-result--error animate-fade-in" role="alert">
              <div className="settings-test-result-status--error">
                ✕ Failed to save settings
              </div>
              <div className="settings-test-result-message">
                {saveError}
              </div>
            </div>
          )}
          <div className="settings-save-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={updateMutation.isPending}
            >
              Save Settings
            </Button>
            {savedMessage && (
              <span className="text-success text-sm animate-fade-in" role="status">
                ✓ Settings saved successfully
              </span>
            )}
          </div>
        </form>
      </div>

      {showSetupWizard && remoteSettings && (
        <SetupWizard
          settings={remoteSettings}
          keysStatus={apiKeysStatus ?? {}}
          onClose={handleCloseSetupWizard}
          onApplied={handleWizardApplied}
        />
      )}
    </div>
  );
}
