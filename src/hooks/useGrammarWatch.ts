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

export function useUpdateGrammarWatchSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: GrammarWatchSettings) => ipc.grammar.updateSettings(settings),
    onSuccess: (saved) => {
      client.setQueryData([QUERY_KEYS.GRAMMAR_WATCH_SETTINGS], saved);
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
