// ============================================================
// LEXORA — Vocabulary Store (Zustand)
// UI-состояние страницы словаря: поиск и фильтры.
// Данные с сервера — только через TanStack Query, не здесь.
// ============================================================

import { create } from 'zustand';
import { DEFAULT_VOCABULARY_FILTERS } from '../lib/constants';
import type { SrsStatus, VocabularyFilters } from '../lib/types';

type StatusFilter = SrsStatus | 'all';

type VocabularyState = {
  filters: VocabularyFilters;

  // Действия
  setSearch: (search: string) => void;
  setStatus: (status: StatusFilter) => void;
  setFilters: (patch: Partial<VocabularyFilters>) => void;
  resetFilters: (languageId: number | null) => void;
};

export const useVocabularyStore = create<VocabularyState>()((set) => ({
  filters: { ...DEFAULT_VOCABULARY_FILTERS },

  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search, page: 1 } })),

  setStatus: (status) =>
    set((s) => ({ filters: { ...s.filters, status, page: 1 } })),

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),

  resetFilters: (languageId) =>
    set({ filters: { ...DEFAULT_VOCABULARY_FILTERS, languageId } }),
}));
