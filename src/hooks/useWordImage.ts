// ============================================================
// LEXORA — Resolve stock photo for a bare word (minimal pairs)
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { convertFileSrc } from '@tauri-apps/api/core';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';

export function useWordImage(word: string | null | undefined, language: string | null | undefined) {
  const trimmed = word?.trim() ?? '';
  const lang = language?.trim() ?? '';

  return useQuery({
    queryKey: [QUERY_KEYS.WORD_IMAGE, lang, trimmed.toLowerCase()],
    queryFn: async (): Promise<string | null> => {
      const path = await ipc.media.resolveWordImage(trimmed, lang);
      if (!path) return null;
      return convertFileSrc(path);
    },
    enabled: trimmed.length > 0 && lang.length > 0,
    staleTime: STALE_TIME.LONG,
  });
}
