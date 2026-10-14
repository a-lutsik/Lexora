// ============================================================
// LEXORA — useVocabulary hook
// Серверное состояние словаря через TanStack Query.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type {
  AddVocabularyBatchInput,
  AddVocabularyInput,
  ImportWordListInput,
  VocabularyFilters,
} from '../lib/types';

export function useVocabulary(filters: VocabularyFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.VOCABULARY, filters],
    queryFn:  () => ipc.vocabulary.list(filters),
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useVocabularyEntry(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.VOCABULARY_ENTRY, id],
    queryFn:  () => ipc.vocabulary.get(id),
    staleTime: STALE_TIME.MEDIUM,
    enabled: id > 0,
  });
}

export function useVocabularyCount(languageId: number | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.VOCABULARY, 'count', languageId],
    queryFn:  () => ipc.vocabulary.count(languageId),
    staleTime: STALE_TIME.SHORT,
  });
}

export function useAddToVocabulary() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: AddVocabularyInput) => ipc.vocabulary.add(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      void client.invalidateQueries({ queryKey: ['media', 'image'] });
    },
  });
}

export function useAddVocabularyBatch() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: AddVocabularyBatchInput) => ipc.vocabulary.addBatch(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
    },
  });
}

export function useImportWordList() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportWordListInput) => ipc.vocabulary.importWordList(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
    },
  });
}

export function useRemoveFromVocabulary() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ipc.vocabulary.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      // Удалённое слово не должно оставаться в счётчике «к повторению» и очереди.
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.DUE_COUNT] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.STUDY_QUEUE] });
    },
  });
}

export function useToggleFavorite() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ipc.vocabulary.toggleFavorite(id),
    onSuccess: (updated) => {
      client.setQueryData(
        [QUERY_KEYS.VOCABULARY_ENTRY, updated.id],
        updated
      );
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
    },
  });
}

export function useUpdateVocabularyEntry() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; text: string; translation: string | null }) =>
      ipc.vocabulary.update(input.id, input.text, input.translation),
    onSuccess: (updated) => {
      client.setQueryData([QUERY_KEYS.VOCABULARY_ENTRY, updated.id], updated);
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
    },
  });
}
