// ============================================================
// LEXORA — useGrammarWatch hooks
// Settings of the system-wide writing check («Grammarly mode»).
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { GrammarWatchSettings } from '../lib/types';

export function useGrammarWatchSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAMMAR_WATCH_SETTINGS],
    queryFn: () => ipc.grammar.getSettings(),
    staleTime: STALE_TIME.NEVER,
  });
}

/** Platform support + Accessibility permission (can change in System Settings). */
export function useGrammarWatchStatus() {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAMMAR_WATCH_STATUS],
    queryFn: () => ipc.grammar.getStatus(),
    staleTime: STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
}

/** Optimistic: the checkbox/list change at once, rolled back if saving fails. */
export function useUpdateGrammarWatchSettings() {
  const client = useQueryClient();
  const key = [QUERY_KEYS.GRAMMAR_WATCH_SETTINGS];
  return useMutation({
    mutationFn: (settings: GrammarWatchSettings) => ipc.grammar.updateSettings(settings),
    onMutate: async (settings) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<GrammarWatchSettings>(key);
      client.setQueryData(key, settings);
      return { previous };
    },
    onError: (_error, _settings, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSuccess: (saved) => {
      client.setQueryData(key, saved);
    },
  });
}

export function useRequestGrammarWatchAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => ipc.grammar.requestAccess(),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.GRAMMAR_WATCH_STATUS] });
    },
  });
}
