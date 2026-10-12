// ============================================================
// LEXORA — useStudyQueue hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { EvaluateAnswerInput, StudyQueueFilters } from '../lib/types';

export function useStudyQueue(
  filters: StudyQueueFilters,
  options?: { refetchInterval?: number; enabled?: boolean },
) {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDY_QUEUE, filters],
    queryFn:  () => ipc.study.getQueue(filters),
    staleTime: STALE_TIME.SHORT,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled ?? true,
  });
}

export function useDueCount(languageId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.DUE_COUNT, languageId],
    queryFn:  () => ipc.study.getDueCount(languageId),
    staleTime: STALE_TIME.SHORT,
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useEvaluateAnswer() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: EvaluateAnswerInput) =>
      ipc.study.evaluateAnswer(input),
    onSuccess: () => {
      // Invalidate due count and queue after each review
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.DUE_COUNT] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      // Иначе «Start Session» после завершения берёт устаревшую очередь из кэша
      // и повторяет только что пройденные карточки вне расписания.
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.STUDY_QUEUE] });
    },
  });
}
