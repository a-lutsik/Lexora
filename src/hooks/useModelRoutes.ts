// ============================================================
// LEXORA — AI model routing hooks (packages, per-role routes)
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type { ApplyModelPackageInput, ModelRole, ModelSetup, RouteTarget } from '../lib/types';

type SetRoleRouteInput = {
  role: ModelRole;
  targets: RouteTarget[];
};

export function useModelRoutes() {
  return useQuery({
    queryKey: [QUERY_KEYS.MODEL_ROUTES],
    queryFn: () => ipc.models.routes(),
    staleTime: STALE_TIME.SHORT,
  });
}

export function useModelCatalog() {
  return useQuery({
    queryKey: [QUERY_KEYS.MODEL_CATALOG],
    queryFn: () => ipc.models.catalog(),
    staleTime: STALE_TIME.NEVER,
  });
}

function useStoreModelSetup() {
  const client = useQueryClient();
  return (setup: ModelSetup) => {
    client.setQueryData([QUERY_KEYS.MODEL_ROUTES], setup.routes);
    // Cache write only — Settings merges the AI fields into its draft itself.
    client.setQueryData([QUERY_KEYS.SETTINGS], setup.settings);
    void client.invalidateQueries({ queryKey: ['api_keys_status'] });
  };
}

export function useApplyModelPackage() {
  const store = useStoreModelSetup();
  return useMutation({
    mutationFn: (input: ApplyModelPackageInput) => ipc.models.applyPackage(input),
    onSuccess: store,
  });
}

export function useSetRoleRoute() {
  const store = useStoreModelSetup();
  return useMutation({
    mutationFn: ({ role, targets }: SetRoleRouteInput) => ipc.models.setRoleRoute(role, targets),
    onSuccess: store,
  });
}

export function useAiUsage(days: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_USAGE, days],
    queryFn: () => ipc.models.usage(days),
    staleTime: STALE_TIME.SHORT,
  });
}

export function useTestModelRole() {
  return useMutation({
    mutationFn: (role: ModelRole) => ipc.models.testRole(role),
  });
}
