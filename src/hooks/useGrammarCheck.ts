// ============================================================
// LEXORA — useGrammarCheck hooks (writing-check badge window)
// The check of text typed in another app is ephemeral: it is
// never stored in the DB and lives briefly in the query cache.
// ============================================================

import { useMutation, useQuery } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS } from '../lib/constants';
import type { ApplyGrammarFixInput } from '../lib/types';

/** Drop typed text from memory soon after the field changes. */
const CHECK_CACHE_MS = 60_000;

export function useGrammarCheck(fieldId: number | null, text: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAMMAR_CHECK, fieldId, text],
    queryFn: () => ipc.writing.check({ text: text ?? '', ephemeral: true }),
    enabled: fieldId !== null && Boolean(text),
    staleTime: Infinity,
    gcTime: CHECK_CACHE_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useApplyGrammarFix() {
  return useMutation({
    mutationFn: (input: ApplyGrammarFixInput) => ipc.grammar.applyFix(input),
  });
}
