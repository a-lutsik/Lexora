// ============================================================
// LEXORA — useSettings hooks
// Серверное состояние настроек через TanStack Query.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { AppSettings } from '../lib/types';

type SetApiKeyInput = {
  provider: string;
  key: string;
};

export function useSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS],
    queryFn:  () => ipc.settings.get(),
    staleTime: STALE_TIME.NEVER,
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<AppSettings>) => ipc.settings.update(settings),
    onSuccess: (updated) => {
      // Cache write only — a refetch here re-hydrates Settings and wipes in-progress edits.
      client.setQueryData([QUERY_KEYS.SETTINGS], updated);
      // Offline mode / connection details change role readiness.
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.MODEL_ROUTES] });
    },
  });
}

export function useApiKeysStatus() {
  return useQuery({
    queryKey: ['api_keys_status'],
    queryFn: () => ipc.settings.getApiKeysStatus(),
    staleTime: 5000,
  });
}

export function useSetApiKey() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, key }: SetApiKeyInput) =>
      ipc.settings.setApiKey(provider, key),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['api_keys_status'] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.MODEL_ROUTES] });
    },
  });
}

