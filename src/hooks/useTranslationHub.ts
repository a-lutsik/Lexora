// ============================================================
// LEXORA — Translation Hub Hooks
// TanStack Query mutations & queries for Multimodal Translation Hub.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import type {
  AudioHubTranslationResponse,
  DocChunkTranslationResult,
  ImageHubTranslationResponse,
  TextHubTranslationResponse,
  TranslateAudioInput,
  TranslateDocChunkInput,
  TranslateImageInput,
  TranslateInput,
  TranslationHistoryDto,
  TranslationHubMode,
} from '../lib/types';

export const TRANSLATION_HUB_KEYS = {
  all: ['translationHub'] as const,
  history: (mode?: string | null) => [...TRANSLATION_HUB_KEYS.all, 'history', mode ?? 'all'] as const,
};

export function useTranslateTextHub() {
  const queryClient = useQueryClient();
  return useMutation<
    TextHubTranslationResponse,
    Error,
    { req: TranslateInput; saveHistory?: boolean }
  >({
    mutationFn: ({ req, saveHistory }) => ipc.translationHub.translateText(req, saveHistory),
    onSuccess: (_data, variables) => {
      if (variables.saveHistory === false) return;
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}

export function useTranslateImageHub() {
  const queryClient = useQueryClient();
  return useMutation<
    ImageHubTranslationResponse,
    Error,
    { req: TranslateImageInput; saveHistory?: boolean }
  >({
    mutationFn: ({ req, saveHistory }) => ipc.translationHub.translateImage(req, saveHistory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}

export function useTranslateDocChunkHub() {
  return useMutation<DocChunkTranslationResult, Error, TranslateDocChunkInput>({
    mutationFn: (req) => ipc.translationHub.translateDocumentChunk(req),
  });
}

export function useTranslateAudioHub() {
  const queryClient = useQueryClient();
  return useMutation<
    AudioHubTranslationResponse,
    Error,
    { req: TranslateAudioInput; saveHistory?: boolean }
  >({
    mutationFn: ({ req, saveHistory }) => ipc.translationHub.translateAudio(req, saveHistory),
    onSuccess: (_data, variables) => {
      if (variables.saveHistory === false) return;
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}

export function useTranslationHistory(mode?: TranslationHubMode | null, limit = 30, offset = 0) {
  return useQuery<TranslationHistoryDto[], Error>({
    queryKey: [...TRANSLATION_HUB_KEYS.history(mode), limit, offset],
    queryFn: () => ipc.translationHub.listHistory(mode, limit, offset),
    staleTime: 10_000,
  });
}

export function useToggleHistoryFavorite() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, number>({
    mutationFn: (id) => ipc.translationHub.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => ipc.translationHub.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}

export function useClearTranslationHistory() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string | undefined>({
    mutationFn: (mode) => ipc.translationHub.clearHistory(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_HUB_KEYS.all });
    },
  });
}
