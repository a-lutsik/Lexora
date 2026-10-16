import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';

export function useCategories(languageId: number) {
  return useQuery({
    queryKey: ['categories', languageId],
    queryFn: () => ipc.categories.list(languageId),
    enabled: languageId > 0,
    staleTime: STALE_TIME.MEDIUM,
  });
}

export function useCategoryMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (action:
      | { kind: 'create'; name: string; languageId: number }
      | { kind: 'rename'; id: number; name: string }
      | { kind: 'remove'; id: number }
      | { kind: 'move'; ids: number[]; categoryId: number }
    ) => {
      switch (action.kind) {
        case 'create': await ipc.categories.create(action.name, action.languageId); break;
        case 'rename': await ipc.categories.rename(action.id, action.name); break;
        case 'remove': await ipc.categories.remove(action.id); break;
        case 'move': await ipc.categories.move(action.ids, action.categoryId); break;
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['categories'] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
      void client.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY_ENTRY] });
    },
  });
}
