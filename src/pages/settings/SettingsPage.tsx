import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/constants';
import { useCategories } from '../../hooks/useCategories';
import { INTERFACE_LANGUAGES } from '../../i18n/locales';
import { useI18n } from '../../hooks/useI18n';
// ============================================================
// LEXORA — Settings Page
// Two columns: section navigation (grouped, one section open at a
// time) and the open section. Every change is saved as soon as it
// is made; errors are shown next to the field that caused them.
// ============================================================

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { save, open } from '@tauri-apps/plugin-dialog';
import { ipc } from '../../lib/ipc';
import { formatIpcError } from '../../lib/utils';
import { useSettings, useUpdateSettings, useApiKeysStatus } from '../../hooks/useSettings';
import { useLanguageOptions, resolveLanguageId, useLanguages } from '../../hooks/useLanguages';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { HotkeyInput } from './HotkeyInput';
import { isValidHotkey } from './hotkeyUtils';
import { useCollections } from '../../hooks/useCollections';
import { useSettingsStore } from '../../stores/settingsStore';
import { StickerSourcePicker } from '../../components/domain/StickerSourcePicker';
import { DEFAULT_STICKER_SOURCES } from '../../lib/stickerSources';
import { NONE_IMAGE_MODEL } from '../../lib/imageModels';
import { ROLE_STATE_LABELS } from '../../lib/modelRouting';
import type { AppSettings } from '../../lib/types';
import { SetupWizard } from '../../components/setup/SetupWizard';
import { AiModelsPanel } from './AiModelsPanel';
import { AiUsagePanel } from './AiUsagePanel';
import { GrammarWatchSection } from './GrammarWatchSection';
import { SettingsNav } from './SettingsNav';
import { resolveSettingsSection, settingsSectionElementId, type SettingsSectionId } from './settingsSections';
import { SettingsPanel } from './SettingsPanel';
import { ThemeSetting } from './ThemeSetting';
import { useModelRoutes } from '../../hooks/useModelRoutes';
import './settings.css';

type BackupStatus = {
  state: 'idle' | 'working' | 'success' | 'error';
  message?: string;
};

type SettingsField = keyof AppSettings;

type SaveState =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved' }
  | { state: 'error'; message: string; fields: readonly SettingsField[] };

const SECTION_PARAM = 'section';

/** Sliders fire on every pixel: wait for the hand to settle before saving. */
const SLIDER_SAVE_DELAY_MS = 400;
const SAVED_NOTE_MS = 2500;

const interfaceOptions = INTERFACE_LANGUAGES.map(({ code, nativeName }) => ({ value: code, label: nativeName }));

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

type HotkeyField = 'hotkeyTranslate' | 'hotkeyStickers' | 'hotkeyVoiceTranslate';

const HOTKEY_FIELDS: readonly HotkeyField[] = ['hotkeyTranslate', 'hotkeyStickers', 'hotkeyVoiceTranslate'];

const DEFAULT_HOTKEY_VOICE_TRANSLATE = 'CmdOrCtrl+Shift+V';

/** Older backends may omit the voice shortcut; show the default instead. */
function voiceHotkey(settings: Pick<AppSettings, 'hotkeyVoiceTranslate'>): string {
  return settings.hotkeyVoiceTranslate ?? DEFAULT_HOTKEY_VOICE_TRANSLATE;
}

function hotkeyValue(settings: AppSettings, field: HotkeyField): string {
  return field === 'hotkeyVoiceTranslate' ? voiceHotkey(settings) : settings[field];
}

/** Fields whose shortcut is also used by another action. */
function duplicateHotkeyFields(settings: AppSettings): Set<HotkeyField> {
  const duplicates = new Set<HotkeyField>();
  for (const field of HOTKEY_FIELDS) {
    const value = hotkeyValue(settings, field);
    if (HOTKEY_FIELDS.some((other) => other !== field && hotkeyValue(settings, other) === value)) {
      duplicates.add(field);
    }
  }
  return duplicates;
}

function validateHotkeys(settings: AppSettings): string | null {
  if (HOTKEY_FIELDS.some((field) => !isValidHotkey(hotkeyValue(settings, field)))) {
    return 'Each shortcut needs at least one modifier (⌘, ⇧ or ⌥) plus a key.';
  }
  if (duplicateHotkeyFields(settings).size > 0) {
    return 'Two actions use the same shortcut. Choose different combinations.';
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
    advancedModels: saved.advancedModels,
  };
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = resolveSettingsSection(searchParams.get(SECTION_PARAM));
  const backupFileFilters = [{ name: t('Lexora Vocabulary Backup'), extensions: ['json'] }];
  const { data: remoteSettings, isLoading } = useSettings();
  const { data: apiKeysStatus } = useApiKeysStatus();
  const { data: modelRoutes } = useModelRoutes();
  const { data: languages } = useLanguages();
  const updateMutation = useUpdateSettings();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const setActiveLanguageId = useSettingsStore((s) => s.setActiveLanguageId);
  const { data: collections = [] } = useCollections(activeLanguageId);
  const categoryQuery = useCategories(activeLanguageId);
  const categories = categoryQuery.data ?? [];

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
    hotkeyVoiceTranslate: DEFAULT_HOTKEY_VOICE_TRANSLATE,
    fallbackAiProvider: 'gemini',
    fallbackAiModel: 'gemini-3.5-flash-lite',
    fallbackEnabled: true,
    imageModel: NONE_IMAGE_MODEL,
    fallbackImageModel: NONE_IMAGE_MODEL,
  });

  const langOptions = useLanguageOptions([form.primaryLanguage, form.interfaceLanguage]);

  // The draft is read at save time, after state updates were batched.
  const formRef = useRef(form);
  const didHydrateForm = useRef(false);
  const [saveState, setSaveState] = useState<SaveState>({ state: 'idle' });
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({ state: 'idle' });
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardAppliedCount, setWizardAppliedCount] = useState(0);

  // Autosave bookkeeping: which fields the next save carries, the slider
  // debounce, whether a save is in flight and must be followed by another.
  const pendingFields = useRef<Set<SettingsField>>(new Set());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlight = useRef(false);
  const saveAgain = useRef(false);

  const handleOpenSetupWizard = () => setShowSetupWizard(true);
  const handleCloseSetupWizard = () => setShowSetupWizard(false);
  // Пресет применён: эффект ниже подтянет AI-поля из свежих настроек.
  const handleWizardApplied = () => setWizardAppliedCount((n) => n + 1);

  const selectSection = (id: SettingsSectionId) => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set(SECTION_PARAM, id);
      return next;
    }, { replace: true });
  };

  // AiModelsPanel saved models/keys/connection on the backend: keep the
  // in-progress draft of other sections, take the AI fields as saved.
  const handleAiSettingsChanged = useCallback((saved: AppSettings) => {
    formRef.current = withSavedAiFields(formRef.current, saved);
    setForm(formRef.current);
  }, []);

  const applyRemoteToForm = useCallback((s: AppSettings) => {
    formRef.current = {
      ...s,
      stickerSources: s.stickerSources ?? DEFAULT_STICKER_SOURCES,
    };
    setForm(formRef.current);
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
    handleAiSettingsChanged(remoteSettings);
  }, [wizardAppliedCount, remoteSettings, handleAiSettingsChanged]);

  const { mutateAsync: updateSettings } = updateMutation;

  const flushSave = useCallback(async () => {
    saveTimer.current = null;
    if (saveInFlight.current) {
      // The running save carries an older draft: run once more after it.
      saveAgain.current = true;
      return;
    }
    const current = formRef.current;
    const fields = [...pendingFields.current];
    pendingFields.current.clear();

    const hotkeyValidationError = validateHotkeys(current);
    if (hotkeyValidationError) {
      setSaveState({ state: 'error', message: hotkeyValidationError, fields: HOTKEY_FIELDS });
      return;
    }

    saveInFlight.current = true;
    setSaveState({ state: 'saving' });
    try {
      const updated = await updateSettings(current);
      if (fields.includes('primaryLanguage')) {
        const langId = resolveLanguageId(languages, updated.primaryLanguage);
        if (langId != null) {
          setActiveLanguageId(langId);
          void ipc.collections.ensureSystemPacks(langId).catch(() => undefined);
        }
      }
      setSaveState({ state: 'saved' });
      if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
      savedNoteTimer.current = setTimeout(() => {
        savedNoteTimer.current = null;
        setSaveState((s) => (s.state === 'saved' ? { state: 'idle' } : s));
      }, SAVED_NOTE_MS);
    } catch (err) {
      // Keep the fields in the draft: the user sees the error next to them.
      setSaveState({ state: 'error', message: formatIpcError(err, 'Failed to save settings'), fields });
    } finally {
      saveInFlight.current = false;
    }
    if (saveAgain.current) {
      saveAgain.current = false;
      void flushSave();
    }
  }, [updateSettings, languages, setActiveLanguageId]);

  /** Apply a change to the draft and save it (debounced for sliders). */
  const commit = useCallback(
    (patch: Partial<AppSettings>, options: { debounce?: boolean } = {}) => {
      formRef.current = { ...formRef.current, ...patch };
      setForm(formRef.current);
      for (const field of Object.keys(patch) as SettingsField[]) pendingFields.current.add(field);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (options.debounce) {
        saveTimer.current = setTimeout(() => void flushSave(), SLIDER_SAVE_DELAY_MS);
      } else {
        void flushSave();
      }
    },
    [flushSave],
  );

  // Leaving the page with a slider change still waiting: save it now.
  useEffect(() => {
    return () => {
      if (savedNoteTimer.current) clearTimeout(savedNoteTimer.current);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (!validateHotkeys(formRef.current)) updateMutation.mutate(formRef.current);
      }
    };
    // Unmount only: the mutation object is stable for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHotkeyChange = (field: HotkeyField, value: string) => {
    commit({ [field]: value });
  };

  const handleExport = async () => {
    setBackupStatus({ state: 'working' });
    try {
      const path = await save({
        defaultPath: 'lexora-vocabulary-backup.json',
        filters: backupFileFilters,
      });
      if (!path) {
        setBackupStatus({ state: 'idle' });
        return;
      }
      const count = await ipc.vocabulary.exportData(path);
      setBackupStatus({ state: 'success', message: t("Exported {count} words", { count }) });
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
        filters: backupFileFilters,
      });
      if (!path) {
        setBackupStatus({ state: 'idle' });
        return;
      }
      const result = await ipc.vocabulary.importData(path);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DUE_COUNT] }),
      ]);
      setBackupStatus({
        state: 'success',
        message: t("Imported {imported}, skipped {skipped}", result),
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
      <div className="settings-loading animate-pulse">{t("Loading settings…")}</div>
    );
  }

  /** Save error shown under the field(s) that were being saved. */
  const errorFor = (...fields: SettingsField[]): ReactNode => {
    if (saveState.state !== 'error' || !fields.some((field) => saveState.fields.includes(field))) {
      return null;
    }
    return (
      <p className="settings-field-error" role="alert">
        {t("Not saved")}{': '}{t(saveState.message)}
      </p>
    );
  };

  const duplicateHotkeys = duplicateHotkeyFields(form);
  const hotkeyHasError = (field: HotkeyField) =>
    duplicateHotkeys.has(field) || !isValidHotkey(hotkeyValue(form, field));
  const quietHoursEnabled = form.quietHoursStart != null && form.quietHoursEnd != null;

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (enabled) {
      commit({
        quietHoursStart: form.quietHoursStart ?? DEFAULT_QUIET_START,
        quietHoursEnd: form.quietHoursEnd ?? DEFAULT_QUIET_END,
      });
      return;
    }
    commit({ quietHoursStart: null, quietHoursEnd: null });
  };

  const sectionId = settingsSectionElementId(activeSection);
  // Amber dot in the nav: a model role is waiting for an API key.
  const attention: Partial<Record<SettingsSectionId, string>> = {};
  if (modelRoutes?.roles.some((role) => role.state === 'needs_key')) {
    attention['ai-models'] = t(ROLE_STATE_LABELS.needs_key);
  }

  return (
    <div className="settings-page">
      <aside className="settings-nav-column">
        <h1 className="settings-title" data-tauri-drag-region>{t("Settings")}</h1>
        <SettingsNav active={activeSection} onSelect={selectSection} attention={attention} />
      </aside>

      <div className="settings-content">
        <div className="settings-save-status" role="status" aria-live="polite">
          {saveState.state === 'saving' && <span className="settings-save-note">{t("Saving…")}</span>}
          {saveState.state === 'saved' && (
            <span className="settings-save-note settings-save-note--ok animate-fade-in">✓ {t("Saved")}</span>
          )}
        </div>

        {activeSection === 'ai-models' && (
          <AiModelsPanel
            panelId={sectionId}
            settings={remoteSettings}
            keysStatus={apiKeysStatus ?? {}}
            onOpenWizard={handleOpenSetupWizard}
            onSettingsChanged={handleAiSettingsChanged}
          />
        )}

        {activeSection === 'ai-usage' && <AiUsagePanel panelId={sectionId} />}

        {activeSection === 'language' && (
          <SettingsPanel id={sectionId} title={t("Language Preferences")}>
            <div className="settings-section settings-section--rows">
              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-interface-lang" className="settings-row__label">
                    {t('Interface language')}
                  </label>
                </div>
                <div className="settings-row__control settings-row__control--select">
                  <LanguageSelect
                    id="settings-interface-lang"
                    value={locale}
                    options={interfaceOptions}
                    onChange={setLocale}
                    ariaLabel={t('Interface language')}
                  />
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-learning-lang" className="settings-row__label">
                    {t('Learning Language')}
                  </label>
                  <p className="settings-row__desc">{t("TTS and pronunciation use this language.")}</p>
                </div>
                <div className="settings-row__control settings-row__control--select">
                  <LanguageSelect
                    id="settings-learning-lang"
                    value={form.primaryLanguage}
                    options={langOptions}
                    onChange={(val) => commit({ primaryLanguage: val })}
                    ariaLabel={t("Learning Language")}
                  />
                </div>
                {errorFor('primaryLanguage')}
              </div>

              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-translation-lang" className="settings-row__label">
                    {t('Translation Language')}
                  </label>
                </div>
                <div className="settings-row__control settings-row__control--select">
                  <LanguageSelect
                    id="settings-translation-lang"
                    value={form.interfaceLanguage}
                    options={langOptions}
                    onChange={(val) => commit({ interfaceLanguage: val })}
                    ariaLabel={t("Translation Language")}
                  />
                </div>
                {errorFor('interfaceLanguage')}
              </div>
            </div>
          </SettingsPanel>
        )}

        {activeSection === 'appearance' && (
          <SettingsPanel id={sectionId} title={t("Appearance")} subtitle={t("Light or dark interface; the popup and stickers follow the same choice.")}>
            <div className="settings-section settings-section--rows">
              <div className="settings-row">
                <div className="settings-row__text">
                  <span id="settings-appearance-label" className="settings-row__label">{t("Theme")}</span>
                  <span className="settings-row__desc">{t("Follow system switches with macOS appearance.")}</span>
                </div>
                <div className="settings-row__control">
                  <ThemeSetting labelledBy="settings-appearance-label" />
                </div>
              </div>
            </div>
          </SettingsPanel>
        )}

        {activeSection === 'privacy' && (
          <SettingsPanel id={sectionId} title={t("Privacy")}>
            <div className="settings-section settings-section--rows">
              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-writing-privacy" className="settings-row__label">{t("Writing privacy mode")}</label>
                  <p className="settings-row__desc">{t("When enabled, text you check or rewrite in the Writing Assistant is not stored — no writing history or error patterns are collected.")}</p>
                </div>
                <div className="settings-row__control">
                  <span className="settings-check">
                    <input
                      id="settings-writing-privacy"
                      type="checkbox"
                      checked={form.writingPrivacyMode}
                      onChange={(e) => commit({ writingPrivacyMode: e.target.checked })}
                      className="settings-checkbox"
                    />
                  </span>
                </div>
                {errorFor('writingPrivacyMode')}
              </div>

              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-writing-auto-check" className="settings-row__label">{t("Writing auto-check")}</label>
                  <p className="settings-row__desc">{t("When enabled, the Writing Assistant automatically checks your text after you pause typing. Uses your AI provider and may incur API cost.")}</p>
                </div>
                <div className="settings-row__control">
                  <span className="settings-check">
                    <input
                      id="settings-writing-auto-check"
                      type="checkbox"
                      checked={form.writingAutoCheck}
                      onChange={(e) => commit({ writingAutoCheck: e.target.checked })}
                      className="settings-checkbox"
                    />
                  </span>
                </div>
                {errorFor('writingAutoCheck')}
              </div>
            </div>
          </SettingsPanel>
        )}

        {activeSection === 'writing-check' && <GrammarWatchSection panelId={sectionId} />}

        {activeSection === 'stickers' && (
          <SettingsPanel id={sectionId} title={t("Desktop Stickers & Ambient Review")}>
            <div className="settings-section settings-section--rows">
              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-sticker-count" className="settings-row__label">
                    {t("MAX CONCURRENT STICKERS:")}<span className="settings-row__value">{form.stickerCount}</span>
                  </label>
                </div>
                <div className="settings-row__control">
                  <input
                    id="settings-sticker-count"
                    type="range"
                    min="1"
                    max="5"
                    value={form.stickerCount}
                    onChange={(e) => commit({ stickerCount: Number(e.target.value) }, { debounce: true })}
                    className="settings-slider"
                  />
                </div>
                {errorFor('stickerCount')}
              </div>

              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-sticker-opacity" className="settings-row__label">
                    {t("STICKER OPACITY:")}<span className="settings-row__value">{Math.round(form.stickerOpacity * 100)}%</span>
                  </label>
                </div>
                <div className="settings-row__control">
                  <input
                    id="settings-sticker-opacity"
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={form.stickerOpacity}
                    onChange={(e) => commit({ stickerOpacity: Number(e.target.value) }, { debounce: true })}
                    className="settings-slider"
                  />
                </div>
                {errorFor('stickerOpacity')}
              </div>

              <div className="settings-row settings-row--block">
                <div className="settings-row__text">
                  <p className="settings-row__desc">{t("Choose which words appear on desktop stickers. Select my words, collections (Top 5000, irregular verbs, …), or several at once.")}</p>
                </div>
                {categoryQuery.isError && <p role="alert" className="inline-error settings-row__full">{t('Could not load categories.')} <Button size="sm" onClick={() => void categoryQuery.refetch()}>{t('Retry categories')}</Button></p>}
                <div className="settings-row__full">
                  <StickerSourcePicker
                    sources={form.stickerSources}
                    collections={collections}
                    categories={categories}
                    onChange={(stickerSources) => commit({ stickerSources })}
                  />
                </div>
                {errorFor('stickerSources')}
              </div>

              <div className="settings-row">
                <div className="settings-row__text">
                  <label htmlFor="settings-quiet-hours" className="settings-row__label">{t("Quiet hours — hide stickers overnight")}</label>
                  {quietHoursEnabled && (
                    <p className="settings-row__desc">{t("Stickers stay hidden between these local times, including overnight ranges (e.g. 22:00–07:00).")}</p>
                  )}
                </div>
                <div className="settings-row__control">
                  <span className="settings-check">
                    <input
                      id="settings-quiet-hours"
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                      className="settings-checkbox"
                    />
                  </span>
                </div>

                {quietHoursEnabled && (
                  <div className="settings-quiet-hours-grid settings-row__full">
                    <div>
                      <label className="label" htmlFor="quiet-hours-start">{t("START")}</label>
                      <div className="field">
                        <input
                          id="quiet-hours-start"
                          type="time"
                          value={form.quietHoursStart ?? DEFAULT_QUIET_START}
                          onChange={(e) =>
                            commit({
                              quietHoursStart: normalizeTimeInput(e.target.value) || DEFAULT_QUIET_START,
                              quietHoursEnd: form.quietHoursEnd ?? DEFAULT_QUIET_END,
                            })
                          }
                          className="field__input settings-time-input"
                          aria-label={t("Quiet hours start")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label" htmlFor="quiet-hours-end">{t("END")}</label>
                      <div className="field">
                        <input
                          id="quiet-hours-end"
                          type="time"
                          value={form.quietHoursEnd ?? DEFAULT_QUIET_END}
                          onChange={(e) =>
                            commit({
                              quietHoursEnd: normalizeTimeInput(e.target.value) || DEFAULT_QUIET_END,
                              quietHoursStart: form.quietHoursStart ?? DEFAULT_QUIET_START,
                            })
                          }
                          className="field__input settings-time-input"
                          aria-label={t("Quiet hours end")}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {errorFor('quietHoursStart', 'quietHoursEnd')}
              </div>
            </div>
          </SettingsPanel>
        )}

        {activeSection === 'shortcuts' && (
          <SettingsPanel
            id={sectionId}
            title={t("Global Shortcuts (System-wide)")}
            subtitle={t("Press these shortcuts from any macOS app (Safari, Chrome, PDF reader, Notes, etc.). You can also click the Lexora icon in the menu bar to open an empty translator, or right-click selected text and choose Services → Lexora.")}
            actions={<span className="tag tag--ok">{t("Active in background")}</span>}
          >
            <div className="settings-section settings-section--rows">
              <div className="settings-row">
                <div className="settings-row__text">
                  <span className="settings-row__label">{t("Open Translator")}</span>
                  <p className="settings-row__desc">{t("Opens the floating window empty — type freely, nothing is taken from the clipboard")}</p>
                </div>
                <div className="settings-row__control">
                  <span className="settings-row__note">{t("via tray menu")}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void ipc.window.openPopup()}
                  >{t("Open Translator")}</Button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row__text">
                  <span className="settings-row__label">{t("Quick Translate Selected Text")}</span>
                  <p className="settings-row__desc">{t("Fills the floating translator only when text is selected — never from the clipboard")}</p>
                </div>
                <div className="settings-row__control">
                  <HotkeyInput
                    value={form.hotkeyTranslate}
                    onChange={(value) => handleHotkeyChange('hotkeyTranslate', value)}
                    label={t("Quick Translate Selected Text shortcut")}
                    hasError={hotkeyHasError('hotkeyTranslate')}
                  />
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row__text">
                  <span className="settings-row__label">{t("Toggle Stickers")}</span>
                  <p className="settings-row__desc">{t("Shows or hides all desktop sticker widgets")}</p>
                </div>
                <div className="settings-row__control">
                  <HotkeyInput
                    value={form.hotkeyStickers}
                    onChange={(value) => handleHotkeyChange('hotkeyStickers', value)}
                    label={t("Toggle Stickers shortcut")}
                    hasError={hotkeyHasError('hotkeyStickers')}
                  />
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row__text">
                  <span className="settings-row__label">{t("Voice Translate")}</span>
                  <p className="settings-row__desc">{t("Put the cursor in a text field, press the shortcut and speak — Accept inserts the translation")}</p>
                </div>
                <div className="settings-row__control">
                  <HotkeyInput
                    value={voiceHotkey(form)}
                    onChange={(value) => handleHotkeyChange('hotkeyVoiceTranslate', value)}
                    label={t("Voice Translate shortcut")}
                    hasError={hotkeyHasError('hotkeyVoiceTranslate')}
                  />
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row__text">
                  <span className="settings-row__label">{t("Open Main Window")}</span>
                  <p className="settings-row__desc">{t("Brings Lexora dashboard to focus")}</p>
                </div>
                <div className="settings-row__control">
                  <span className="settings-row__note">{t("via tray menu")}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void ipc.window.openMain()}
                  >{t("Focus")}</Button>
                </div>
              </div>
            </div>

            {errorFor(...HOTKEY_FIELDS)}
          </SettingsPanel>
        )}

        {activeSection === 'backup' && (
          <SettingsPanel
            id={sectionId}
            title={t("Backup / Export")}
            subtitle={t("Export your vocabulary (words, translations, notes and SRS progress) to a JSON file, or restore it on another device. Existing words are never overwritten on import.")}
            actions={<span className="tag tag--accent">{t("Local JSON")}</span>}
          >
            <div className="settings-section settings-section--rows">
              <div className="settings-row settings-row--actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleExport()}
                  isLoading={backupStatus.state === 'working'}
                >
                  <Icon name="download" size={17} />
                  {t("Export vocabulary")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleImport()}
                  isLoading={backupStatus.state === 'working'}
                >
                  <Icon name="upload" size={17} />
                  {t("Import vocabulary")}
                </Button>
              </div>

              {backupStatus.state === 'success' && (
                <div className="settings-result settings-result--ok animate-fade-in">
                  <Icon name="check_circle" size={17} />
                  <span>{backupStatus.message}</span>
                </div>
              )}
              {backupStatus.state === 'error' && (
                <div className="settings-result settings-result--error animate-fade-in" role="alert">
                  <div className="settings-result__title">{t("✕ Backup operation failed")}</div>
                  <div className="settings-result__message">{backupStatus.message}</div>
                </div>
              )}
            </div>
          </SettingsPanel>
        )}
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
