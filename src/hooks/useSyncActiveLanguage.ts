// ============================================================
// LEXORA — Sync Learning Language → activeLanguageId
// Vocabulary / Study / Collections all filter by activeLanguageId.
// ============================================================

import { useEffect } from 'react';
import { useSettings } from './useSettings';
import { useLanguages, resolveLanguageId } from './useLanguages';
import { useSettingsStore } from '../stores/settingsStore';
import { ipc } from '../lib/ipc';

/**
 * Keep Zustand activeLanguageId in sync with settings.primaryLanguage,
 * and ensure empty system pack shells exist for that language.
 */
export function useSyncActiveLanguage() {
  const { data: settings } = useSettings();
  const { data: languages } = useLanguages();
  const setActiveLanguageId = useSettingsStore((s) => s.setActiveLanguageId);
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);

  useEffect(() => {
    if (!settings || !languages?.length) return;
    const id = resolveLanguageId(languages, settings.primaryLanguage);
    if (id != null && id !== activeLanguageId) {
      setActiveLanguageId(id);
    }
    if (id != null) {
      void ipc.collections.ensureSystemPacks(id).catch(() => undefined);
    }
  }, [settings, languages, activeLanguageId, setActiveLanguageId]);
}
