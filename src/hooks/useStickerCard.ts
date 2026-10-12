// ============================================================
// LEXORA — useStickerCard hook
// Each sticker window asks the backend for *its* unique card.
// Dismiss/grade never returns a word already shown on a peer.
// Фильтр (язык, источники) бэкенд строит из настроек.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { VocabularyEntryDto } from '../lib/types';

const STICKER_REFETCH_MS = 60_000;

const STICKER_CARD_QUERY_KEY = [QUERY_KEYS.STICKER_CARD] as const;

export function useStickerCard() {
  return useQuery({
    queryKey: STICKER_CARD_QUERY_KEY,
    queryFn: () => ipc.stickers.getCard(),
    staleTime: STALE_TIME.SHORT,
    refetchInterval: STICKER_REFETCH_MS,
  });
}

export function useDismissStickerCard() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (entryId: number) => ipc.stickers.dismissCard(entryId),
    onSuccess: (card: VocabularyEntryDto | null) => {
      client.setQueryData(STICKER_CARD_QUERY_KEY, card);
    },
  });
}
