import { collectionDisplayName } from '../../lib/collectionLabels';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Collections Page
// System packs: Load into DB (lazy) → turn on in Study (SRS).
// Layout (Lingora 1i): page header, "Mine" and packs sections,
// one card per collection with a switch instead of two buttons.
// ============================================================

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { ipc } from '../../lib/ipc';
import { cx, formatIpcError, pluralize } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { CreateCollectionModal } from './CreateCollectionModal';
import { PACK_EXPECTED_COUNTS } from '../../lib/languages';
import type { CollectionDto, PackLoadProgress } from '../../lib/types';
import './collections.css';

const PACK_LOAD_EVENT = 'lexora:pack-load-progress';
/** Ширина SVG-шкалы прогресса в единицах viewBox (проценты). */
const PROGRESS_SCALE = 100;

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

  const isSystemCollection = (col: CollectionDto) =>
    col.collectionType === 'system' || Boolean(col.packKey);
  const mine = (collections ?? []).filter((col) => !isSystemCollection(col));
  const packs = (collections ?? []).filter(isSystemCollection);

  const renderCard = (col: CollectionDto) => {
    const name = collectionDisplayName(col);
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
    const cardProgress =
      isLoadingPack && loadProgress?.collectionId === col.id && loadProgress.total > 0
        ? loadProgress
        : null;
    const progressValue = cardProgress
      ? Math.min(PROGRESS_SCALE, Math.round((cardProgress.done / cardProgress.total) * PROGRESS_SCALE))
      : 0;
    const isTogglePending = toggleMutation.isPending && toggleMutation.variables?.id === col.id;

    return (
      <div key={col.id} className="card collection-card">
        <div className="collection-card__head">
          <h3 className="collection-card__name">{name}</h3>
          <span className="collection-card__kind">
            {needsLoad
              ? tUi("Not loaded")
              : isSystemCollection(col)
                ? tUi("System")
                : tUi("Mine")}
          </span>
        </div>
        {col.description && (
          <p className="collection-card__desc">{col.description}</p>
        )}

        <div className="spacer" />

        {needsLoad ? (
          isLoadingPack ? (
            <div className="collection-card__loading">
              <div className="collection-card__loading-row">
                <span className="spacer">{tUi("Loading…")}</span>
                {cardProgress && (
                  <span className="num">
                    {cardProgress.done} / {cardProgress.total}
                  </span>
                )}
              </div>
              {cardProgress && (
                <span
                  className="collection-card__bar"
                  role="progressbar"
                  aria-valuenow={cardProgress.done}
                  aria-valuemin={0}
                  aria-valuemax={cardProgress.total}
                >
                  <svg
                    className="collection-card__bar-svg"
                    viewBox={`0 0 ${PROGRESS_SCALE} 4`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect className="collection-card__bar-fill" width={progressValue} height="4" />
                  </svg>
                </span>
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="collection-card__load"
              isLoading={loadMutation.isPending}
              disabled={loadMutation.isPending}
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
              aria-label={tUi("Load {value1} into database", { value1: name })}
            >
              <Icon name="download" size={17} />
              {status === 'error' ? tUi("Retry Load") : tUi("Load into database")}
            </Button>
          )
        ) : confirmingDisableId === col.id ? (
          <div
            className="collection-confirm"
            role="group"
            aria-label={tUi("Confirm disabling {value1}", { value1: name })}
          >
            <p className="collection-confirm__text">{tUi("Disable “")}{name}{tUi("”? Its words leave your vocabulary and study queue (unless another active pack has them) and return when you enable it again.")}</p>
            <div className="collection-confirm__actions">
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
          <button
            type="button"
            className={cx('collection-switch', col.isActive && 'is-on')}
            aria-pressed={col.isActive}
            aria-busy={isTogglePending}
            disabled={isTogglePending}
            aria-label={
              col.isActive
                ? tUi("Active in SRS, disable {value1}", { value1: name })
                : tUi("Enable {value1} in SRS", { value1: name })
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
            <span className="collection-switch__track" aria-hidden="true">
              <span className="collection-switch__thumb" />
            </span>
            <span>{tUi("In Study")}</span>
          </button>
        )}

        <div className="collection-card__foot">
          <span className="collection-card__count">
            {needsLoad && expected
              ? `~${pluralize(expected, 'word')}`
              : pluralize(col.wordCount, 'word')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="page collections-page animate-fade-in">
      <header className="page-header" data-tauri-drag-region>
        <div className="page-header__text" data-tauri-drag-region>
          <h1 className="page-title">{tUi("Collections")}</h1>
          <p className="page-subtitle">{tUi("Curated lists for your learning language. Load a pack when you need it, then turn it on in Study.")}</p>
        </div>
        <div className="page-actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            aria-label={tUi("Create new collection")}
          >
            <Icon name="add" size={17} />
            {tUi("New collection")}
          </Button>
        </div>
      </header>

      <div className="page-toolbar collections-toolbar">
        <label className="collections-images-option">
          <input dir="auto"
            type="checkbox"
            className="collections-images-option__box"
            checked={withImages}
            onChange={(e) => setWithImages(e.target.checked)}
          />
          <span className="collections-images-option__text">
            {tUi("Also fetch pictures when loading a pack")}{' '}
            <span className="collections-images-option__note">{tUi("· slower, sends each word to your image provider")}</span>
          </span>
        </label>
      </div>

      <div className="page-body collections-body">
        {loadProgress && (
          <div className="collections-load-status" role="status" aria-live="polite">
            {loadProgress.phase === 'error' ? (
              <span className="inline-error">{tUi("Load failed:")}{' '}
                {formatIpcError(
                  loadProgress.error,
                  tUi("Could not load this pack. Check the AI provider in Settings."),
                )}
              </span>
            ) : (
              <span className="inline-note">{tUi("Loading pack… ")}{loadProgress.done}/{loadProgress.total}
                {loadProgress.text ? ` — ${loadProgress.text}` : ''}
                {' '}({loadProgress.phase}{tUi("). Runs in the background.")}</span>
            )}
          </div>
        )}

        {toggleMutation.isError && (
          <p className="inline-error collections-error" role="alert">{tUi("Couldn’t update this collection. Please try again.")}</p>
        )}

        {isError && !isLoading && (
          <div className="collections-error-block" role="alert">
            <p className="inline-note">{tUi("Couldn’t load your collections.")}</p>
            <Button variant="secondary" size="md" onClick={() => void refetch()}>{tUi("Try again")}</Button>
          </div>
        )}

        {isLoading ? (
          <div className="inline-note animate-pulse">{tUi("Loading collections…")}</div>
        ) : !isError && (
          <>
            <section className="collections-section" aria-labelledby="collections-mine-label">
              <div id="collections-mine-label" className="section-label">{tUi("Mine")}</div>
              <div className="collections-grid">
                {mine.map(renderCard)}
                <button
                  type="button"
                  className="collection-new-tile"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Icon name="add" size={18} />
                  {tUi("New collection")}
                </button>
              </div>
            </section>

            {packs.length > 0 && (
              <section className="collections-section" aria-labelledby="collections-packs-label">
                <div id="collections-packs-label" className="section-label">{tUi("Lexora packs")}</div>
                <div className="collections-grid">{packs.map(renderCard)}</div>
              </section>
            )}
          </>
        )}
      </div>

      <CreateCollectionModal
        isOpen={isCreateOpen}
        languageId={activeLanguageId}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
