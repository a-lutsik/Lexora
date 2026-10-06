// ============================================================
// LEXORA — useCollections hook
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';

export function useCollections(languageId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.COLLECTIONS, languageId],
    queryFn: () => ipc.collections.list(languageId),
    staleTime: STALE_TIME.LONG,
  });
}
