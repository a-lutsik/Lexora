// ============================================================
// LEXORA — Settings Store (Zustand)
// Глобальное клиентское состояние настроек.
// Данные с сервера — только через TanStack Query, не здесь.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyTheme, isThemePreference, type ThemePreference } from '../lib/theme';
import { broadcastTheme } from '../lib/themeSync';

type SettingsState = {
  // Локальные UI-настройки (не требуют сохранения на бекенд)
  sidebarCollapsed: boolean;
  activeLanguageId: number;
  /** Тема оформления: light | dark | system. Общая для всех окон (localStorage). */
  theme: ThemePreference;

  // Действия
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveLanguageId: (id: number) => void;
  setTheme: (theme: ThemePreference) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeLanguageId: 1, // English by default
      theme: 'system',

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setActiveLanguageId: (id) =>
        set({ activeLanguageId: id }),

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
        // Popup, stickers and the grammar overlay are separate webviews.
        broadcastTheme(theme);
      },
    }),
    {
      name: 'lexora-settings-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeLanguageId: state.activeLanguageId,
        theme: state.theme,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...saved,
          theme: isThemePreference(saved.theme) ? saved.theme : current.theme,
        };
      },
    }
  )
);
