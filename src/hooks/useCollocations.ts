// ============================================================
// LEXORA — Collocations hooks
// Fetched only when the collocations view is open (AI call on
// first open, SQLite cache afterwards).
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { AddCollocationsInput } from '../lib/types';

export function collocationsQueryKey(lexemeId: number, targetLanguage: string) {
  return [QUERY_KEYS.COLLOCATIONS, lexemeId, targetLanguage] as const;
}

export function useCollocations(lexemeId: number, targetLanguage: string, enabled = true) {
  return useQuery({
    queryKey: collocationsQueryKey(lexemeId, targetLanguage),
    queryFn: () => ipc.collocations.get(lexemeId, targetLanguage),
    staleTime: STALE_TIME.LONG,
    enabled,
    // A failed AI call must not be repeated behind the user's back.
    retry: false,
  });
}

export function useAddCollocations() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCollocationsInput) => ipc.collocations.add(input),
    onSuccess: (list, input) => {
      client.setQueryData(collocationsQueryKey(input.lexemeId, input.targetLanguage), list);
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.STUDY_QUEUE] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.DUE_COUNT] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
    },
  });
}
