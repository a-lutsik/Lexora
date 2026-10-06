// ============================================================
// LEXORA — Settings Store (Zustand)
// Глобальное клиентское состояние настроек.
// Данные с сервера — только через TanStack Query, не здесь.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SettingsState = {
  // Локальные UI-настройки (не требуют сохранения на бекенд)
  sidebarCollapsed: boolean;
  activeLanguageId: number;

  // Действия
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveLanguageId: (id: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeLanguageId: 1, // English by default

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setActiveLanguageId: (id) =>
        set({ activeLanguageId: id }),
    }),
    {
      name: 'lexora-settings-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeLanguageId: state.activeLanguageId,
      }),
    }
  )
);
