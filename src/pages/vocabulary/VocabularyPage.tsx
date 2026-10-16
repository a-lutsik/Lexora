import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Vocabulary Page
// Main screen: word list with search, filters, and actions.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useQueryClient } from '@tanstack/react-query';
import { useVocabulary, useVocabularyCount } from '../../hooks/useVocabulary';
import { useCategories, useCategoryMutation } from '../../hooks/useCategories';
import { CategorySelect } from '../../components/domain/CategorySelect';
import { CategoryEditor } from './CategoryEditor';
import { formatIpcError } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { useVocabularyStore } from '../../stores/vocabularyStore';
import { Button, IconButton } from '../../components/ui/Button';
import { SrsStatusBadge, PosBadge } from '../../components/ui/Badge';
import { FreqBadge } from '../../components/domain/FreqBadge';
import { QUERY_KEYS } from '../../lib/constants';
import { ipc } from '../../lib/ipc';
import { cx, formatRelativeDate, pluralize } from '../../lib/utils';
import { WordDetail } from './WordDetail';
import { VocabularyWordAction, type VocabularyAction } from './VocabularyWordAction';
import { VocabularyPager } from './VocabularyPager';
import { AddWordModal } from './AddWordModal';
import { BulkAddModal, type BulkAddMode } from './BulkAddModal';
import type { BulkTranslateProgress, SrsStatus, VocabularyEntryDto } from '../../lib/types';
import './vocabulary.css';

type StatusFilter = SrsStatus | 'all';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'New',      value: 'new'      },
  { label: 'Learning', value: 'learning' },
  { label: 'Review',   value: 'review'   },
  { label: 'Mature',   value: 'mature'   },
];

const BULK_TRANSLATE_PROGRESS_EVENT = 'lexora:bulk-translate-progress';

function SearchIcon() {
  return (
    <svg className="vocabulary-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function EditIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5Z" /></svg>;
}

function RemoveIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>;
}

function OpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type WordRowProps = {
  entry: VocabularyEntryDto;
  onClick: (id: number) => void;
  selected: boolean;
  onSelect: () => void;
  onAction: (action: VocabularyAction) => void;
};

function WordRow({ entry, onClick, selected, onSelect, onAction }: WordRowProps) {
  const { t: tUi } = useI18n();
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? '—';

  const handlePlayAudio: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    void ipc.media.playTts(lexeme.text);
  };

  return (
    <div
      className="vocabulary-list-row animate-fade-in"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('label, input')) return;
        onClick(entry.id);
      }}
      role="row"
      aria-label={`${lexeme.text}: ${mainTranslation}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(entry.id);
        }
      }}
    >
      <label className="vocabulary-select">
        <input type="checkbox" checked={selected} onChange={onSelect}
          aria-label={tUi('Select {word}', { word: lexeme.text })} />
      </label>
      <div className="word-cell-main">
        <span dir="auto" className="word-text">{lexeme.text}</span>
        {lexeme.phonetic && (
          <span className="word-phonetic phonetic">{lexeme.phonetic}</span>
        )}
      </div>

      <div dir="auto" className="word-translation">{mainTranslation}</div>

      <div>
        <PosBadge pos={lexeme.partOfSpeech} />
      </div>

      <div>
        <FreqBadge rank={lexeme.frequencyRank} />
      </div>

      <div>
        {reviewState ? (
          <SrsStatusBadge status={reviewState.status} />
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </div>

      <div className="word-cell-due text-secondary text-xs">
        {reviewState?.dueAt
          ? formatRelativeDate(reviewState.dueAt)
          : '—'}
      </div>

      <div className="row-actions">
        <IconButton
          icon={<PlayIcon />}
          aria-label={tUi("Play pronunciation of {value1}", { value1: lexeme.text })}
          onClick={handlePlayAudio}
          size="sm"
        />
        <IconButton
          icon={<OpenIcon />}
          aria-label={tUi("Open details for {value1}", { value1: lexeme.text })}
          size="sm"
        />
        <IconButton icon={<EditIcon />} aria-label={tUi('Edit {word}', { word: lexeme.text })}
          onClick={(event) => { event.stopPropagation(); onAction({ kind: 'edit', entry }); }} size="sm" />
        <IconButton icon={<RemoveIcon />} aria-label={tUi('Remove {word}', { word: lexeme.text })}
          onClick={(event) => { event.stopPropagation(); onAction({ kind: 'remove', ids: [entry.id], word: lexeme.text }); }} size="sm" />
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const { t: tUi } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const filters = useVocabularyStore((s) => s.filters);
  const setSearch = useVocabularyStore((s) => s.setSearch);
  const setStatus = useVocabularyStore((s) => s.setStatus);
  const setFilters = useVocabularyStore((s) => s.setFilters);
  const resetFilters = useVocabularyStore((s) => s.resetFilters);
  const [selection, setSelection] = useState<{ scope: string; ids: number[] }>({ scope: '', ids: [] });
  const categories = useCategories(activeLanguageId);
  const categoryMutation = useCategoryMutation();
  const [categoryEditor, setCategoryEditor] = useState<'create' | 'rename' | 'remove' | null>(null);
  const [moveCategoryId, setMoveCategoryId] = useState<number | null>(null);
  const selectedCategory = categories.data?.find((category) => category.id === filters.categoryId);
  const [wordAction, setWordAction] = useState<VocabularyAction | null>(null);
  const selectionScope = JSON.stringify({ ...filters, languageId: activeLanguageId });
  useEffect(() => { setSelection({ scope: selectionScope, ids: [] }); }, [selectionScope]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addWordEpoch, setAddWordEpoch] = useState(0);
  const [bulkMode, setBulkMode] = useState<BulkAddMode | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkTranslateProgress | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const lastRefetchAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: entries, isLoading, isError, refetch } = useVocabulary({
    ...filters,
    languageId: activeLanguageId,
  });
  const { data: totalCount } = useVocabularyCount(activeLanguageId);

  // Scope selection to the visible page/filter/language; hidden words cannot be removed by accident.
  const selectedIds = selection.scope === selectionScope
    ? selection.ids.filter((id) => entries?.some((entry) => entry.id === id)) : [];
  const allSelected = !!entries?.length && selectedIds.length === entries.length;
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);
  const toggleSelection = (id: number) => {
    setSelection({ scope: selectionScope, ids: selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id] });
  };

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all' || filters.categoryId != null;

  // Category ids belong to one language; never carry another language's filter across.
  const previousLanguageId = useRef(activeLanguageId);
  useEffect(() => {
    if (previousLanguageId.current !== activeLanguageId) {
      previousLanguageId.current = activeLanguageId;
      setFilters({ categoryId: null, page: 1 });
      setCategoryEditor(null);
      setMoveCategoryId(null);
    }
  }, [activeLanguageId, setFilters]);

  useEffect(() => {
    if (categories.isSuccess && categories.data && filters.categoryId != null
      && !categories.data.some((category) => category.id === filters.categoryId)) {
      setFilters({ categoryId: null, page: 1 });
    }
  }, [categories.isSuccess, categories.data, filters.categoryId, setFilters]);

  const handlePageChange = (page: number) => {
    setFilters({ page });
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const handleWordClick = (id: number) => {
    void navigate(`/vocabulary/${id}`);
  };

  const { id: paramId } = useParams<{ id: string }>();
  const selectedId = paramId ? parseInt(paramId, 10) : null;

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, []);

  useEffect(() => {
    const unlistenPromise = listen<BulkTranslateProgress>(
      BULK_TRANSLATE_PROGRESS_EVENT,
      (event) => {
        const payload = event.payload;
        setBulkProgress(payload);
        const now = Date.now();
        const shouldRefetch =
          payload.done === payload.total ||
          payload.done % 3 === 0 ||
          now - lastRefetchAt.current > 4000;
        if (shouldRefetch) {
          lastRefetchAt.current = now;
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
        }
        if (payload.done === payload.total) {
          window.setTimeout(() => setBulkProgress(null), 2500);
        }
      }
    );
    return () => {
      void unlistenPromise.then((u) => u());
    };
  }, [queryClient]);

  const openAddOne = () => {
    setAddMenuOpen(false);
    setAddWordEpoch((n) => n + 1);
    setIsAddModalOpen(true);
  };

  const openBulk = (mode: BulkAddMode) => {
    setAddMenuOpen(false);
    setBulkMode(mode);
  };

  return (
    <div className="vocabulary-page">
      <header className="vocabulary-header">
        <div className="vocabulary-header-left">
          <h1 className="vocabulary-title">{tUi("My Vocabulary")}</h1>
          {totalCount != null && (
            <span className="vocabulary-count" aria-label={tUi("{value1} total", { value1: pluralize(totalCount, 'word') })}>
              {pluralize(totalCount, 'word')}
            </span>
          )}
        </div>

        <div className="vocabulary-header-actions">
          <Button
            variant="secondary"
            size="md"
            onClick={() => void navigate('/study')}
          >{tUi("Study Now")}</Button>

          <div className="add-word-split" ref={addMenuRef}>
            <Button
              variant="primary"
              size="md"
              onClick={openAddOne}
            >
              <PlusIcon />{tUi(" Add Word")}</Button>
            <button
              type="button"
              className="add-word-split-toggle"
              aria-label={tUi("More add options")}
              aria-haspopup="menu"
              aria-expanded={addMenuOpen}
              onClick={() => setAddMenuOpen((open) => !open)}
            >
              <ChevronDownIcon />
            </button>
            {addMenuOpen && (
              <div className="add-word-split-menu" role="menu">
                <button
                  type="button"
                  className="add-word-split-item"
                  role="menuitem"
                  onClick={openAddOne}
                >{tUi("Add one")}</button>
                <button
                  type="button"
                  className="add-word-split-item"
                  role="menuitem"
                  onClick={() => openBulk('paste')}
                >{tUi("Paste list")}</button>
                <button
                  type="button"
                  className="add-word-split-item"
                  role="menuitem"
                  onClick={() => openBulk('file')}
                >{tUi("Upload file")}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {bulkProgress && (
        <div className="bulk-translate-banner" role="status" aria-live="polite">{tUi("Translating ")}{bulkProgress.done}/{bulkProgress.total}
          {bulkProgress.text ? `: ${bulkProgress.text}` : '…'}
          {bulkProgress.error ? ` (${bulkProgress.error})` : ''}
        </div>
      )}

      <div className="vocabulary-toolbar" role="toolbar" aria-label={tUi("Vocabulary filters")}>
        <div className="vocabulary-search">
          <SearchIcon />
          <input dir="auto"
            type="search"
            className="vocabulary-search-input"
            placeholder={tUi("Search words…")}
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={tUi("Search vocabulary")}
          />
        </div>

        <CategorySelect categories={categories.data ?? []} value={filters.categoryId ?? null}
          allCategories ariaLabel={tUi('Filter by category')}
          onChange={(categoryId) => setFilters({ categoryId, page: 1 })} />
        <Button size="sm" variant="secondary" onClick={() => setCategoryEditor('create')}>{tUi('+ Category')}</Button>
        {selectedCategory && !selectedCategory.isGeneral && <>
          <Button size="sm" onClick={() => setCategoryEditor('rename')}>{tUi('Rename category')}</Button>
          <Button size="sm" onClick={() => setCategoryEditor('remove')}>{tUi('Delete category')}</Button>
        </>}

        <div className="filter-chips" role="group" aria-label={tUi("Filter by status")}>
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={cx('filter-chip', filters.status === value && 'active')}
              onClick={() => setStatus(value)}
              aria-pressed={filters.status === value}
              aria-label={tUi("Show {label} words", { label: tUi(label) })}
            >
              {tUi(label)}
            </button>
          ))}
        </div>
      </div>

      {categories.isError && <p className="text-secondary text-xs">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Retry categories')}</Button></p>}
      {categoryMutation.isError && <p role="alert" className="add-word-image-error">{formatIpcError(categoryMutation.error, tUi('Could not move words.'))}</p>}
      {selectedIds.length > 0 && (
        <div className="vocabulary-selection-bar">
          <span role="status" aria-live="polite">{tUi('{count} selected on this page', { count: selectedIds.length })}</span>
          <CategorySelect categories={categories.data ?? []} value={moveCategoryId} onChange={setMoveCategoryId}
            ariaLabel={tUi('Move to category')} disabled={categoryMutation.isPending} />
          <Button size="sm" variant="secondary" disabled={categoryMutation.isPending || !categories.data?.length}
            onClick={() => {
              const target = moveCategoryId ?? categories.data?.find((category) => category.isGeneral)?.id;
              if (target == null) return;
              categoryMutation.mutate({ kind: 'move', ids: selectedIds, categoryId: target }, {
                onSuccess: () => setSelection({ scope: selectionScope, ids: [] }),
              });
            }}>{tUi('Move selected')}</Button>
          <Button variant="danger" size="sm" onClick={() => setWordAction({ kind: 'remove', ids: [...selectedIds] })}>
            {tUi('Remove selected ({count})', { count: selectedIds.length })}
          </Button>
          <Button size="sm" onClick={() => setSelection({ scope: selectionScope, ids: [] })}>{tUi('Clear selection')}</Button>
        </div>
      )}
      <div className="vocabulary-list-header" role="row">
        <label className="vocabulary-select">
          <input ref={selectAllRef} type="checkbox" checked={allSelected}
            disabled={!entries?.length || isLoading || isError}
            aria-label={tUi('Select all words on this page')}
            onChange={() => setSelection({ scope: selectionScope, ids: allSelected ? [] : (entries ?? []).map((entry) => entry.id) })} />
        </label>
        <span>{tUi("Word")}</span>
        <span>{tUi("Translation")}</span>
        <span>{tUi("Type")}</span>
        <span>{tUi("Frequency")}</span>
        <span>{tUi("Status")}</span>
        <span>{tUi("Due")}</span>
        <span />
      </div>

      <div
        ref={listRef}
        className="vocabulary-list"
        role="table"
        aria-label={tUi("Vocabulary list")}
        aria-rowcount={entries?.length ?? 0}
      >
        {isLoading && (
          <div className="vocabulary-empty text-muted text-sm animate-pulse">{tUi("Loading vocabulary…")}</div>
        )}
        {isError && !isLoading && (
          <div className="vocabulary-empty" role="alert">
            <p className="text-secondary text-sm">{tUi("Couldn’t load your vocabulary.")}</p>
            <Button variant="secondary" size="md" onClick={() => void refetch()}>{tUi("Try again")}</Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page > 1 && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">{tUi("No more words on this page.")}</p>
            <Button variant="secondary" size="md" onClick={() => handlePageChange(1)}>{tUi("Back to the first page")}</Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && hasActiveFilters && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">{tUi("No words match your search or filter.")}</p>
            <Button variant="secondary" size="md" onClick={() => resetFilters(activeLanguageId)}>{tUi("Clear filters")}</Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && !hasActiveFilters && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">{tUi("No words yet. Add your first word to start learning.")}</p>
            <Button variant="secondary" size="md" onClick={openAddOne}>{tUi("+ Add your first word")}</Button>
          </div>
        )}
        {entries?.map((entry) => (
          <WordRow key={entry.id} entry={entry} onClick={handleWordClick}
            selected={selectedIds.includes(entry.id)} onSelect={() => toggleSelection(entry.id)} onAction={setWordAction} />
        ))}
      </div>

      {!isError && (
        <VocabularyPager
          page={filters.page}
          perPage={filters.perPage}
          shown={entries?.length ?? 0}
          total={hasActiveFilters ? null : (totalCount ?? null)}
          onPageChange={handlePageChange}
        />
      )}

      {wordAction && (
        <VocabularyWordAction action={wordAction} onClose={() => setWordAction(null)} onRemoved={() => {
          setWordAction(null);
          setSelection({ scope: selectionScope, ids: [] });
          if (entries?.every((entry) => wordAction.kind === 'remove' && wordAction.ids.includes(entry.id)) && filters.page > 1) {
            handlePageChange(filters.page - 1);
          }
        }} />
      )}
      <AddWordModal
        key={addWordEpoch}
        isOpen={isAddModalOpen}
        initialCategoryId={filters.categoryId ?? null}
        onClose={() => setIsAddModalOpen(false)}
      />

      <BulkAddModal
        isOpen={bulkMode != null}
        mode={bulkMode ?? 'paste'}
        initialCategoryId={filters.categoryId ?? null}
        onClose={() => setBulkMode(null)}
        onQueued={(result) => {
          if (result.translateQueued && result.added > 0) {
            setBulkProgress({
              done: 0,
              total: result.added,
              text: '',
              error: null,
            });
          }
        }}
      />

      {categoryEditor && <CategoryEditor languageId={activeLanguageId}
        {...(categoryEditor !== 'create' && selectedCategory ? { category: selectedCategory } : {})}
        deleting={categoryEditor === 'remove'} onClose={() => setCategoryEditor(null)}
        onDeleted={() => setFilters({ categoryId: null, page: 1 })} />}

      {selectedId != null && !isNaN(selectedId) && (
        <WordDetail
          id={selectedId}
          onClose={() => void navigate('/vocabulary')}
        />
      )}
    </div>
  );
}
