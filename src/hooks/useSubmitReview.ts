// ============================================================
// LEXORA — useSubmitReview hook
// Самооценка карточки (Flashcards): записывает оценку в SRS.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS } from '../lib/constants';
import type { SubmitReviewInput } from '../lib/types';

export function useSubmitReview() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitReviewInput) => ipc.study.submitReview(input),
    onSuccess: () => {
      // Расписание изменилось: счётчик «к повторению», словарь и очередь устарели.
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.DUE_COUNT] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.STUDY_QUEUE] });
    },
  });
}
