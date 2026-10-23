// ============================================================
// LEXORA — useGrammarCheck hooks (writing-check badge window)
// The check of text typed in another app is ephemeral: it is
// never stored in the DB and lives briefly in the query cache.
// Only the paragraphs (lines) not checked recently are sent to
// the LLM, in one batch; the rest come from the query cache.
// ============================================================

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS } from '../lib/constants';
import { buildBatch, mergeCheck, planCheck, splitBatchIssues } from '../lib/grammarIncremental';
import type { ApplyGrammarFixInput, WritingCheckDto, WritingIssueDto } from '../lib/types';

/** Drop typed text from memory soon after the field changes. */
const CHECK_CACHE_MS = 60_000;

/**
 * Checked paragraphs stay longer, so the unchanged lines of a text written
 * over several minutes are not re-sent: typed text stays in the badge
 * window's memory for up to 5 minutes (never on disk).
 */
const PARAGRAPH_CACHE_MS = 300_000;

function paragraphKey(paragraph: string) {
  return [QUERY_KEYS.GRAMMAR_CHECK_PARAGRAPH, paragraph] as const;
}

async function checkChangedParagraphs(queryClient: QueryClient, text: string): Promise<WritingCheckDto> {
  // Paragraph entries have no observers: gcTime alone bounds how long typed
  // text stays in memory (counted from when the paragraph was checked).
  queryClient.setQueryDefaults([QUERY_KEYS.GRAMMAR_CHECK_PARAGRAPH], {
    gcTime: PARAGRAPH_CACHE_MS,
    staleTime: Infinity,
  });
  const plan = planCheck(text, (paragraph) =>
    queryClient.getQueryData<WritingIssueDto[]>(paragraphKey(paragraph)),
  );
  if (plan.missing.length === 0) {
    return mergeCheck(text, plan.paragraphs, plan.hits, null);
  }

  const batch = buildBatch(plan.missing);
  const response = await ipc.writing.check({ text: batch.text, ephemeral: true });
  const fresh = splitBatchIssues(batch, response.issues, response.originalText);
  fresh.forEach((issues, paragraph) => queryClient.setQueryData(paragraphKey(paragraph), issues));
  return mergeCheck(text, plan.paragraphs, new Map([...plan.hits, ...fresh]), response);
}

export function useGrammarCheck(fieldId: number | null, text: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    // No fieldId: the same text focused in another field is not re-checked.
    queryKey: [QUERY_KEYS.GRAMMAR_CHECK, text],
    queryFn: () => checkChangedParagraphs(queryClient, text ?? ''),
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
