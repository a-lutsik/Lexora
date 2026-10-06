// ============================================================
// LEXORA — usePronunciation hooks (Stage 3: AI Pronunciation Coach)
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type {
  ArticulationTipInput,
  EvaluatePronunciationInput,
  SaveAudioRecordingInput,
} from '../lib/types';

export function useSaveAudioRecording() {
  return useMutation({
    mutationFn: (input: SaveAudioRecordingInput) => ipc.pronunciation.saveRecording(input),
  });
}

export function useEvaluatePronunciation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EvaluatePronunciationInput) => ipc.pronunciation.evaluate(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.PRONUNCIATION_HISTORY] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.PROBLEM_PHONEMES] });
    },
  });
}

export function usePronunciationHistory(
  lexemeId: number | null,
  language: string | null,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRONUNCIATION_HISTORY, lexemeId, language, limit],
    queryFn: () => ipc.pronunciation.getHistory(lexemeId, language, limit),
    enabled,
    staleTime: STALE_TIME.SHORT,
  });
}

export function useProblemPhonemes(language: string | null, limit = 10, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROBLEM_PHONEMES, language, limit],
    queryFn: () => ipc.pronunciation.getProblemPhonemes(language, limit),
    enabled,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useMinimalPairs(
  language: string | null,
  contrastType: string | null,
  limit = 200,
  enabled = true,
) {
  return useQuery({
    queryKey: [QUERY_KEYS.MINIMAL_PAIRS, language, contrastType, limit],
    queryFn: () => ipc.pronunciation.getMinimalPairs(language, contrastType, limit),
    enabled,
    staleTime: STALE_TIME.LONG,
  });
}

export function useArticulationTip() {
  return useMutation({
    mutationFn: (input: ArticulationTipInput) => ipc.pronunciation.getArticulationTip(input),
  });
}
