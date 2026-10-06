// ============================================================
// LEXORA — useStickerCard hook
// Each sticker window asks the backend for *its* unique card.
// Dismiss/grade never returns a word already shown on a peer.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { StudyQueueFilters, VocabularyEntryDto } from '../lib/types';

const STICKER_REFETCH_MS = 60_000;

export function stickerCardQueryKey(filters: StudyQueueFilters) {
  return [QUERY_KEYS.STICKER_CARD, filters] as const;
}

export function useStickerCard(
  filters: StudyQueueFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: stickerCardQueryKey(filters),
    queryFn: () => ipc.stickers.getCard(filters),
    staleTime: STALE_TIME.SHORT,
    refetchInterval: STICKER_REFETCH_MS,
    enabled: options?.enabled ?? true,
  });
}

type DismissStickerInput = {
  entryId: number;
  filters: StudyQueueFilters;
};

export function useDismissStickerCard() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, filters }: DismissStickerInput) =>
      ipc.stickers.dismissCard(entryId, filters),
    onSuccess: (card: VocabularyEntryDto | null, { filters }) => {
      client.setQueryData(stickerCardQueryKey(filters), card);
    },
  });
}
