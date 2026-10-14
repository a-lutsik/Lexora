// ============================================================
// LEXORA — useDialogue hooks (AI Dialogue)
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type {
  CreateDialogueScenarioInput,
  SendDialogueTurnInput,
  StartDialogueSessionInput,
} from '../lib/types';

export function useDialogueScenarios(language?: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.DIALOGUE_SCENARIOS, language ?? 'all'],
    queryFn: () => ipc.dialogue.listScenarios(language),
    staleTime: STALE_TIME.LONG,
  });
}

export function useGenerateDialogueScenarios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: string) => ipc.dialogue.generateScenarios(language),
    // A partial run still saved scenarios, so refresh on error too.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGUE_SCENARIOS] }),
  });
}

export function useCreateDialogueScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDialogueScenarioInput) => ipc.dialogue.createScenario(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGUE_SCENARIOS] }),
  });
}

export function useDeleteDialogueScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ipc.dialogue.deleteScenario(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGUE_SCENARIOS] }),
  });
}

export function useDialogueSession(sessionId: number | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.DIALOGUE_SESSION, sessionId],
    queryFn: () => {
      if (sessionId == null) {
        throw new Error('No dialogue session');
      }
      return ipc.dialogue.getSession(sessionId);
    },
    enabled: sessionId != null,
    staleTime: STALE_TIME.SHORT,
  });
}

export function useStartDialogueSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartDialogueSessionInput = {}) => ipc.dialogue.startSession(input),
    onSuccess: (session) => {
      queryClient.setQueryData([QUERY_KEYS.DIALOGUE_SESSION, session.id], session);
    },
  });
}

export function useSendDialogueTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendDialogueTurnInput) => ipc.dialogue.sendTurn(input),
    onSuccess: (session) => {
      queryClient.setQueryData([QUERY_KEYS.DIALOGUE_SESSION, session.id], session);
    },
  });
}

export function useEndDialogueSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => ipc.dialogue.endSession(sessionId),
    onSuccess: (session) => {
      queryClient.setQueryData([QUERY_KEYS.DIALOGUE_SESSION, session.id], session);
    },
  });
}
