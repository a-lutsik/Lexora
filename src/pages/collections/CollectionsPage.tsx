import { collectionDisplayName } from '../../lib/collectionLabels';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Collections Page
// System packs: Load into DB (lazy) → Enable in SRS.
// ============================================================

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { ipc } from '../../lib/ipc';
import { formatIpcError, pluralize } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CreateCollectionModal } from './CreateCollectionModal';
import { PACK_EXPECTED_COUNTS } from '../../lib/languages';
import type { PackLoadProgress } from '../../lib/types';
import './collections.css';

const PACK_LOAD_EVENT = 'lexora:pack-load-progress';

export default function CollectionsPage() {
  const { t: tUi } = useI18n();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState<PackLoadProgress | null>(null);
  const [withImages, setWithImages] = useState(false);
  const [confirmingDisableId, setConfirmingDisableId] = useState<number | null>(null);
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const queryClient = useQueryClient();

  const { data: collections, isLoading, isError, refetch } = useQuery({
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
      void queryClient.invalidateQueries({ queryKey: ['due-count'] });
    },
    onSettled: () => setConfirmingDisableId(null),
  });

  const loadMutation = useMutation({
    mutationFn: ({ id, images }: { id: number; images: boolean }) =>
      ipc.collections.loadSystemPack(id, images),
    onError: (err) => {
      setLoadProgress({
        collectionId: 0,
        done: 0,
        total: 0,
        phase: 'error',
        text: null,
        error: formatIpcError(err, tUi("Could not load this pack. Check the AI provider in Settings.")),
      });
    },
  });

  return (
    <div className="collections-page animate-fade-in">
      <div className="collections-header">
        <div>
          <h1 className="collections-title">{tUi("Collections")}</h1>
          <p className="text-secondary text-sm">{tUi("Curated lists for your learning language. Load a pack into the database when you need it, then enable it in SRS.")}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          aria-label={tUi("Create new collection")}
        >{tUi("+ New Collection")}</Button>
      </div>

      {loadProgress && (
        <div
          className="collections-load-progress"
          role="status"
          aria-live="polite"
        >
          {loadProgress.phase === 'error' ? (
            <span className="text-sm collections-load-error">{tUi("Load failed:")}{' '}
              {formatIpcError(
                loadProgress.error,
                tUi("Could not load this pack. Check the AI provider in Settings."),
              )}
            </span>
          ) : (
            <span className="text-sm text-secondary">{tUi("Loading pack… ")}{loadProgress.done}/{loadProgress.total}
              {loadProgress.text ? ` — ${loadProgress.text}` : ''}
              {' '}({loadProgress.phase}{tUi("). Runs in the background.")}</span>
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

      <label className="collections-images-option text-secondary text-sm">
        <input dir="auto"
          type="checkbox"
          checked={withImages}
          onChange={(e) => setWithImages(e.target.checked)}
        />{tUi("Also fetch pictures when loading a pack (slower; sends each word to your image provider)")}</label>

      {toggleMutation.isError && (
        <p className="collections-error text-sm" role="alert">{tUi("Couldn’t update this collection. Please try again.")}</p>
      )}

      {isError && !isLoading && (
        <div className="collections-error-block" role="alert">
          <p className="text-secondary text-sm">{tUi("Couldn’t load your collections.")}</p>
          <Button variant="secondary" size="md" onClick={() => void refetch()}>{tUi("Try again")}</Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-muted text-sm animate-pulse">{tUi("Loading collections…")}</div>
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
                    <h3 className="collection-name">{collectionDisplayName(col)}</h3>
                    <p className="text-muted text-xs">{col.description}</p>
                  </div>
                  <Badge variant={col.collectionType === 'system' ? 'accent' : 'neutral'}>
                    {col.collectionType}
                  </Badge>
                </div>

                <div className="collection-card-footer">
                  <span className="text-secondary text-xs">
                    {needsLoad && expected
                      ? tUi("Not loaded · ~{value1}", { value1: pluralize(expected, 'word') })
                      : pluralize(col.wordCount, 'word')}
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
                          text: tUi("Starting…"),
                          error: null,
                        });
                        loadMutation.mutate({ id: col.id, images: withImages });
                      }}
                      aria-label={tUi("Load {value1} into database", { value1: collectionDisplayName(col) })}
                    >
                      {status === 'error' ? tUi("Retry Load") : tUi("Load into database")}
                    </Button>
                  ) : confirmingDisableId === col.id ? (
                    <div className="collection-confirm" role="group" aria-label={tUi("Confirm disabling {value1}", { value1: collectionDisplayName(col) })}>
                      <p className="collection-confirm-text text-xs">{tUi("Disable “")}{collectionDisplayName(col)}{tUi("”? Its words leave your vocabulary and study queue (unless another active pack has them) and return when you enable it again.")}</p>
                      <div className="collection-confirm-actions">
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ id: col.id, active: false })}
                        >{tUi("Disable")}</Button>
                        <Button
                          size="sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => setConfirmingDisableId(null)}
                        >{tUi("Keep enabled")}</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant={col.isActive ? 'primary' : 'secondary'}
                      size="sm"
                      isLoading={toggleMutation.isPending && toggleMutation.variables?.id === col.id}
                      aria-label={
                        col.isActive
                          ? tUi("Active in SRS, disable {value1}", { value1: collectionDisplayName(col) })
                          : tUi("Enable {value1} in SRS", { value1: collectionDisplayName(col) })
                      }
                      onClick={() => {
                        if (col.isActive) {
                          toggleMutation.reset();
                          setConfirmingDisableId(col.id);
                        } else {
                          toggleMutation.mutate({ id: col.id, active: true });
                        }
                      }}
                    >
                      {col.isActive ? tUi("✓ Active in SRS") : tUi("Enable in SRS")}
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
