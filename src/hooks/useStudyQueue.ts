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

/**
 * Next interval for each rating grade of one card (read-only SM-2 preview).
 * Disabled for cards without a review state: there is nothing to schedule.
 */
export function useReviewIntervalPreview(reviewStateId: number | null) {
  return useQuery({
    queryKey: ['review-interval-preview', reviewStateId],
    queryFn: () => ipc.study.previewIntervals(reviewStateId ?? 0),
    enabled: reviewStateId != null,
  });
}

/**
 * Stats summary (streak) for the study overview. Shares the Stats page cache key.
 * `enabled: false` while a session runs, so the overview refetches when it comes back.
 */
export function useStudyStatsSummary(languageId: number, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, languageId],
    queryFn: () => ipc.stats.getSummary(languageId),
    enabled,
  });
}

/** Daily review activity (oldest first, today last) for the study overview. */
export function useStudyDailyActivity(days: number, languageId: number, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATS, 'daily-activity', days, languageId],
    queryFn: () => ipc.stats.getDailyActivity(days, languageId),
    enabled,
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
