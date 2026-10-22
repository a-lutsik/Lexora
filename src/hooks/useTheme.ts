// ============================================================
// LEXORA — useTheme
// Применяет выбранную тему к <html> и следит за системной,
// пока выбрано `system`. Подключается один раз в каждой точке входа.
// ============================================================

import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { applyTheme, watchSystemTheme, type ThemePreference } from '../lib/theme';

export function useTheme(): { theme: ThemePreference; setTheme: (theme: ThemePreference) => void } {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    return watchSystemTheme(() => applyTheme('system'));
  }, [theme]);

  // Другое окно (popup/stickers) поменяло тему — подхватываем через storage.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'lexora-settings-ui') {
        void useSettingsStore.persist.rehydrate();
        applyTheme(useSettingsStore.getState().theme);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { theme, setTheme };
}
