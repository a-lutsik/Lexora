// ============================================================
// LEXORA — Collections Page
// System packs: Load into DB (lazy) → Enable in SRS.
// ============================================================

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { ipc } from '../../lib/ipc';
import { formatIpcError } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CreateCollectionModal } from './CreateCollectionModal';
import { PACK_EXPECTED_COUNTS } from '../../lib/languages';
import type { PackLoadProgress } from '../../lib/types';
import './collections.css';

const PACK_LOAD_EVENT = 'lexora:pack-load-progress';

export default function CollectionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState<PackLoadProgress | null>(null);
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const queryClient = useQueryClient();

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections', activeLanguageId],
    queryFn: () => ipc.collections.list(activeLanguageId),
  });

  useEffect(() => {
    const unlistenPromise = listen<PackLoadProgress>(PACK_LOAD_EVENT, (event) => {
      setLoadProgress(event.payload);
      if (event.payload.phase === 'done' || event.payload.phase === 'error') {
        void queryClient.invalidateQueries({ queryKey: ['collections'] });
        if (event.payload.phase === 'done') {
          window.setTimeout(() => setLoadProgress(null), 2500);
        }
      }
    });
    return () => {
      void unlistenPromise.then((u) => u());
    };
  }, [queryClient]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      ipc.collections.toggle(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: ['study-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  const loadMutation = useMutation({
    mutationFn: (id: number) => ipc.collections.loadSystemPack(id, true),
    onError: (err) => {
      setLoadProgress({
        collectionId: 0,
        done: 0,
        total: 0,
        phase: 'error',
        text: null,
        error: formatIpcError(err, 'Could not load this pack. Check the AI provider in Settings.'),
      });
    },
  });

  return (
    <div className="collections-page animate-fade-in">
      <div className="collections-header">
        <div>
          <h1 className="collections-title">Collections</h1>
          <p className="text-secondary text-sm">
            Curated lists for your learning language. Load a pack into the database when you need it,
            then enable it in SRS.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          aria-label="Create new collection"
        >
          + New Collection
        </Button>
      </div>

      {loadProgress && (
        <div
          className="collections-load-progress"
          role="status"
          aria-live="polite"
        >
          {loadProgress.phase === 'error' ? (
            <span className="text-sm collections-load-error">
              Load failed:{' '}
              {formatIpcError(
                loadProgress.error,
                'Could not load this pack. Check the AI provider in Settings.',
              )}
            </span>
          ) : (
            <span className="text-sm text-secondary">
              Loading pack… {loadProgress.done}/{loadProgress.total}
              {loadProgress.text ? ` — ${loadProgress.text}` : ''}
              {' '}({loadProgress.phase}). Runs in the background.
            </span>
          )}
          {loadProgress.total > 0 && loadProgress.phase !== 'error' && (
            <div
              className="collections-load-bar"
              role="progressbar"
              aria-valuenow={loadProgress.done}
              aria-valuemin={0}
              aria-valuemax={loadProgress.total}
            >
              <div
                className="collections-load-bar-fill"
                style={
                  {
                    '--progress-pct': `${Math.min(
                      100,
                      Math.round((loadProgress.done / loadProgress.total) * 100),
                    )}%`,
                  } as CSSProperties
                }
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-muted text-sm animate-pulse">Loading collections…</div>
      ) : (
        <div className="collections-grid">
          {collections?.map((col) => {
            const status = col.loadStatus ?? (col.wordCount > 0 ? 'ready' : 'empty');
            const expected =
              (col.packKey && PACK_EXPECTED_COUNTS[col.packKey]) || col.wordCount || null;
            const isSystemPack = Boolean(col.packKey);
            const needsLoad =
              isSystemPack && (status === 'empty' || status === 'error' || col.wordCount === 0);
            const isLoadingPack =
              status === 'loading' ||
              (loadProgress?.collectionId === col.id &&
                loadProgress.phase !== 'done' &&
                loadProgress.phase !== 'error');

            return (
              <div key={col.id} className="collection-card">
                <div className="collection-card-header">
                  <div>
                    <h3 className="collection-name">{col.name}</h3>
                    <p className="text-muted text-xs">{col.description}</p>
                  </div>
                  <Badge variant={col.collectionType === 'system' ? 'accent' : 'neutral'}>
                    {col.collectionType}
                  </Badge>
                </div>

                <div className="collection-card-footer">
                  <span className="text-secondary text-xs">
                    {needsLoad && expected
                      ? `Not loaded · ~${expected} words`
                      : `${col.wordCount} words`}
                  </span>

                  {needsLoad ? (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isLoadingPack || loadMutation.isPending}
                      disabled={isLoadingPack || loadMutation.isPending}
                      onClick={() => {
                        setLoadProgress({
                          collectionId: col.id,
                          done: 0,
                          total: expected ?? 0,
                          phase: 'words',
                          text: 'Starting…',
                          error: null,
                        });
                        loadMutation.mutate(col.id);
                      }}
                      aria-label={`Load ${col.name} into database`}
                    >
                      {status === 'error' ? 'Retry Load' : 'Load into database'}
                    </Button>
                  ) : (
                    <Button
                      variant={col.isActive ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({ id: col.id, active: !col.isActive })
                      }
                    >
                      {col.isActive ? '✓ Active in SRS' : 'Enable in SRS'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCollectionModal
        isOpen={isCreateOpen}
        languageId={activeLanguageId}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
