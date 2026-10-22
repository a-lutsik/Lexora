import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Vocabulary Page (Lingora frames 1a / 1b / 2a)
// Main screen: word list with search, filters, and actions.
// The word detail opens as a panel beside the list (/vocabulary/:id).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useQueryClient } from '@tanstack/react-query';
import { useStatusCounts, useVocabulary, useVocabularyCount } from '../../hooks/useVocabulary';
import { useDueCount } from '../../hooks/useStudyQueue';
import { useCategories, useCategoryMutation } from '../../hooks/useCategories';
import { CategorySelect } from '../../components/domain/CategorySelect';
import { CategoryEditor } from './CategoryEditor';
import { formatIpcError } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { useVocabularyStore } from '../../stores/vocabularyStore';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
import { formatHotkey } from '../settings/hotkeyUtils';
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

/** Page-local shortcuts of the Add menu (frame 2a): ⌘N / Ctrl+N and ⌘⇧V / Ctrl+Shift+V. */
const ADD_ONE_HOTKEY = 'CmdOrCtrl+N';
const PASTE_LIST_HOTKEY = 'CmdOrCtrl+Shift+V';

/** Whether the event is CmdOrCtrl+[Shift+]<letter>; by physical key so non-Latin layouts work too. */
function isCmdOrCtrlLetter(event: KeyboardEvent, letter: string, shift: boolean): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey !== shift) return false;
  return event.code === `Key${letter.toUpperCase()}` || event.key.toLowerCase() === letter;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || target.closest('input, textarea, select') != null);
}

type WordRowProps = {
  entry: VocabularyEntryDto;
  onClick: (id: number) => void;
  selected: boolean;
  /** The word shown in the detail panel right now. */
  current: boolean;
  onSelect: () => void;
  onAction: (action: VocabularyAction) => void;
};

/** Due today or overdue: the learner should see it now. */
function isDueByToday(dueAt: number): boolean {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return dueAt * 1000 < endOfToday;
}

function WordRow({ entry, onClick, selected, current, onSelect, onAction }: WordRowProps) {
  const { t: tUi } = useI18n();
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? '—';

  const handlePlayAudio: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    void ipc.media.playTts(lexeme.text);
  };

  return (
    <div
      className={cx('vocabulary-row is-hoverable animate-fade-in', selected && 'is-checked', current && 'is-current')}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('label, input')) return;
        onClick(entry.id);
      }}
      role="row"
      aria-label={`${lexeme.text}: ${mainTranslation}`}
      aria-current={current || undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(entry.id);
        }
      }}
    >
      <label className="vocabulary-check">
        <input type="checkbox" checked={selected} onChange={onSelect}
          aria-label={tUi('Select {word}', { word: lexeme.text })} />
      </label>
      <div className="vocabulary-row__word">
        {/* Explicit open control for keyboard and screen-reader users; the click bubbles to the row. */}
        <button type="button" className="vocabulary-row__open"
          aria-label={tUi("Open details for {value1}", { value1: lexeme.text })}>
          <span dir="auto" className="word">{lexeme.text}</span>
          {lexeme.phonetic && (
            <span className="ipa vocabulary-row__ipa">{lexeme.phonetic}</span>
          )}
        </button>
      </div>

      <div dir="auto" className="vocabulary-row__translation">{mainTranslation}</div>

      <div className="vocabulary-row__type">
        <PosBadge pos={lexeme.partOfSpeech} />
      </div>

      <div className="vocabulary-row__freq">
        <FreqBadge rank={lexeme.frequencyRank} />
      </div>

      <div className="vocabulary-row__status">
        {reviewState ? (
          <SrsStatusBadge status={reviewState.status} />
        ) : (
          <span className="vocabulary-row__none">—</span>
        )}
      </div>

      <div className={cx('vocabulary-row__due', reviewState?.dueAt != null && isDueByToday(reviewState.dueAt) && 'is-due')}>
        {reviewState?.dueAt
          ? formatRelativeDate(reviewState.dueAt)
          : '—'}
      </div>

      <div className="row-actions-hover vocabulary-row__actions">
        <IconButton
          size="sm"
          icon={<Icon name="volume_up" size={17} />}
          aria-label={tUi("Play pronunciation of {value1}", { value1: lexeme.text })}
          onClick={handlePlayAudio}
        />
        <IconButton size="sm" icon={<Icon name="edit" size={17} />} aria-label={tUi('Edit {word}', { word: lexeme.text })}
          onClick={(event) => { event.stopPropagation(); onAction({ kind: 'edit', entry }); }} />
        <IconButton size="sm" icon={<Icon name="delete" size={17} />} aria-label={tUi('Remove {word}', { word: lexeme.text })}
          onClick={(event) => { event.stopPropagation(); onAction({ kind: 'remove', ids: [entry.id], word: lexeme.text }); }} />
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const { t: tUi, locale } = useI18n();
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
  const addToggleRef = useRef<HTMLButtonElement>(null);
  const addMenuListRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastRefetchAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: entries, isLoading, isError, refetch } = useVocabulary({
    ...filters,
    languageId: activeLanguageId,
  });
  const { data: totalCount } = useVocabularyCount(activeLanguageId);
  const { data: statusCounts } = useStatusCounts(activeLanguageId);
  const { data: dueCount } = useDueCount(activeLanguageId);
  const numberFormat = new Intl.NumberFormat(locale);

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

  // "/" jumps to the search field (the frame shows it as a key hint in the field).
  useEffect(() => {
    const handleSlash = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable
        || target.closest('input, textarea, select, [role="combobox"], [role="listbox"]'))) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  // Add-menu shortcuts (shown in the menu): only while no modal is open over the page.
  const addShortcutsRef = useRef<{ addOne: () => void; pasteList: () => void } | null>(null);
  useEffect(() => {
    const handleAddShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || document.querySelector('[aria-modal="true"]')) return;
      if (isCmdOrCtrlLetter(event, 'n', false)) {
        event.preventDefault();
        addShortcutsRef.current?.addOne();
      } else if (isCmdOrCtrlLetter(event, 'v', true) && !isEditableTarget(event.target)) {
        // In a text field ⌘⇧V stays "paste as plain text".
        event.preventDefault();
        addShortcutsRef.current?.pasteList();
      }
    };
    window.addEventListener('keydown', handleAddShortcut);
    return () => window.removeEventListener('keydown', handleAddShortcut);
  }, []);

  // Menu keyboard: focus the first item on open, ↑/↓ move, Esc closes back to the toggle.
  useEffect(() => {
    if (addMenuOpen) addMenuListRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [addMenuOpen]);

  const handleAddMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const items = Array.from(addMenuListRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const at = items.findIndex((item) => item === document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setAddMenuOpen(false);
      addToggleRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(at + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
      setAddMenuOpen(false);
    }
  };

  const openAddOne = () => {
    setAddMenuOpen(false);
    setAddWordEpoch((n) => n + 1);
    setIsAddModalOpen(true);
  };

  const openBulk = (mode: BulkAddMode) => {
    setAddMenuOpen(false);
    setBulkMode(mode);
  };
  addShortcutsRef.current = { addOne: openAddOne, pasteList: () => openBulk('paste') };

  const detailOpen = selectedId != null && !isNaN(selectedId);
  const currentIndex = detailOpen && entries ? entries.findIndex((entry) => entry.id === selectedId) : -1;
  const previousEntry = currentIndex > 0 ? entries?.[currentIndex - 1] : undefined;
  const nextEntry = currentIndex >= 0 ? entries?.[currentIndex + 1] : undefined;
  const detailPosition = currentIndex >= 0
    ? {
        index: (filters.page - 1) * filters.perPage + currentIndex + 1,
        total: hasActiveFilters ? null : (totalCount ?? null),
      }
    : null;

  return (
    <div className={cx('vocabulary-page', detailOpen && 'has-detail')}>
      <div className="vocabulary-main">
        <header className="page-header" data-tauri-drag-region>
          <div className="page-header__text">
            <h1 className="page-title">{tUi("Vocabulary")}</h1>
            {totalCount != null && (
              <div className="page-subtitle">
                <span aria-label={tUi("{value1} total", { value1: pluralize(totalCount, 'word') })}>
                  {pluralize(totalCount, 'word')}
                </span>
                {dueCount != null && (
                  <>
                    <span aria-hidden="true">{' · '}</span>
                    <span>{tUi("{value1} due today", { value1: numberFormat.format(dueCount) })}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="page-actions">
            <Button
              variant="secondary"
              className="vocabulary-study-btn"
              onClick={() => void navigate('/study')}
            >
              <Icon name="style" size={17} />
              {tUi("Study now")}
            </Button>

            <div className="vocabulary-add" ref={addMenuRef}>
              <span className="btn-split">
                <Button variant="primary" onClick={openAddOne}>
                  <Icon name="add" size={17} />
                  {tUi("Add word")}
                </Button>
                <button
                  ref={addToggleRef}
                  type="button"
                  className="btn btn--primary btn--md vocabulary-add__toggle"
                  aria-label={tUi("More add options")}
                  aria-haspopup="menu"
                  aria-expanded={addMenuOpen}
                  onClick={() => setAddMenuOpen((open) => !open)}
                >
                  <Icon name={addMenuOpen ? 'expand_less' : 'expand_more'} size={17} />
                </button>
              </span>
              {addMenuOpen && (
                <div
                  ref={addMenuListRef}
                  className="popover vocabulary-add__menu"
                  role="menu"
                  tabIndex={-1}
                  aria-label={tUi("More add options")}
                  onKeyDown={handleAddMenuKeyDown}
                >
                  <button type="button" className="menu-item" role="menuitem" tabIndex={-1} onClick={openAddOne}
                    aria-keyshortcuts="Meta+N Control+N">
                    <Icon name="add" size={18} className="menu-item__icon" />
                    <span className="menu-item__label">{tUi("Add one")}</span>
                    <kbd className="menu-item__shortcut" aria-hidden="true">{formatHotkey(ADD_ONE_HOTKEY)}</kbd>
                  </button>
                  <button type="button" className="menu-item" role="menuitem" tabIndex={-1} onClick={() => openBulk('paste')}
                    aria-keyshortcuts="Meta+Shift+V Control+Shift+V">
                    <Icon name="content_paste" size={18} className="menu-item__icon" />
                    <span className="menu-item__label">{tUi("Paste list")}</span>
                    <kbd className="menu-item__shortcut" aria-hidden="true">{formatHotkey(PASTE_LIST_HOTKEY)}</kbd>
                  </button>
                  <button type="button" className="menu-item" role="menuitem" tabIndex={-1} onClick={() => openBulk('file')}>
                    <Icon name="upload_file" size={18} className="menu-item__icon" />
                    <span className="menu-item__label">{tUi("Upload file")}</span>
                    <span className="menu-item__shortcut">{tUi(".txt .csv")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {bulkProgress && (
          <div className="bulk-translate-banner" role="status" aria-live="polite">
            <Icon name="translate" size={17} className="icon--muted" />
            <span>
              {tUi("Translating ")}
              <span className="num">{bulkProgress.done}/{bulkProgress.total}</span>
              {bulkProgress.text ? `: ${bulkProgress.text}` : '…'}
              {bulkProgress.error ? ` (${bulkProgress.error})` : ''}
            </span>
          </div>
        )}

        <div className="page-toolbar vocabulary-toolbar" role="toolbar" aria-label={tUi("Vocabulary filters")}>
          <div className="field vocabulary-search">
            <Icon name="search" size={18} className="field__icon" />
            <input dir="auto"
              ref={searchRef}
              type="search"
              className="field__input"
              placeholder={tUi("Search words…")}
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={tUi("Search vocabulary")}
              aria-keyshortcuts="/"
            />
            <kbd className="kbd" aria-hidden="true">/</kbd>
          </div>

          <div className="vocabulary-toolbar__filters">
            <CategorySelect categories={categories.data ?? []} value={filters.categoryId ?? null}
              allCategories ariaLabel={tUi('Filter by category')}
              onChange={(categoryId) => setFilters({ categoryId, page: 1 })}
              onCreate={() => setCategoryEditor('create')} />
            {selectedCategory && !selectedCategory.isGeneral && <>
              <Button size="sm" variant="ghost" onClick={() => setCategoryEditor('rename')}>{tUi('Rename category')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setCategoryEditor('remove')}>{tUi('Delete category')}</Button>
            </>}

            <span className="divider--v" aria-hidden="true" />

            <div className="vocabulary-chips" role="group" aria-label={tUi("Filter by status")}>
              {STATUS_FILTERS.map(({ label, value }) => {
                const count = value === 'all' ? totalCount : statusCounts?.[value];
                return (
                <button
                  key={value}
                  type="button"
                  className={cx('chip', filters.status === value && 'is-active')}
                  onClick={() => setStatus(value)}
                  aria-pressed={filters.status === value}
                  aria-label={tUi("Show {label} words", { label: tUi(label) })}
                >
                  {tUi(label)}
                  {count != null && <span className="chip__count">{numberFormat.format(count)}</span>}
                </button>
                );
              })}
            </div>
          </div>
        </div>

        {categories.isError && <p className="inline-note vocabulary-notice">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Retry categories')}</Button></p>}
        {categoryMutation.isError && <p role="alert" className="inline-error vocabulary-notice">{formatIpcError(categoryMutation.error, tUi('Could not move words.'))}</p>}
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
            <span className="spacer" />
            <Button size="sm" variant="ghost" onClick={() => setSelection({ scope: selectionScope, ids: [] })}>{tUi('Clear selection')}</Button>
            <Button variant="danger" size="sm" onClick={() => setWordAction({ kind: 'remove', ids: [...selectedIds] })}>
              <Icon name="delete" size={17} />
              {tUi('Remove selected ({count})', { count: selectedIds.length })}
            </Button>
          </div>
        )}
        <div className="vocabulary-table-head" role="row">
          <label className="vocabulary-check">
            <input ref={selectAllRef} type="checkbox" checked={allSelected}
              disabled={!entries?.length || isLoading || isError}
              aria-label={tUi('Select all words on this page')}
              onChange={() => setSelection({ scope: selectionScope, ids: allSelected ? [] : (entries ?? []).map((entry) => entry.id) })} />
          </label>
          <span>{tUi("Word")}</span>
          <span>{tUi("Translation")}</span>
          <span>{tUi("Type")}</span>
          <span>{tUi("Freq.")}</span>
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
            <div className="empty vocabulary-empty animate-pulse">{tUi("Loading vocabulary…")}</div>
          )}
          {isError && !isLoading && (
            <div className="empty vocabulary-empty" role="alert">
              <p>{tUi("Couldn’t load your vocabulary.")}</p>
              <Button variant="secondary" size="md" onClick={() => void refetch()}>{tUi("Try again")}</Button>
            </div>
          )}
          {!isLoading && !isError && entries?.length === 0 && filters.page > 1 && (
            <div className="empty vocabulary-empty">
              <p>{tUi("No more words on this page.")}</p>
              <Button variant="secondary" size="md" onClick={() => handlePageChange(1)}>{tUi("Back to the first page")}</Button>
            </div>
          )}
          {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && hasActiveFilters && (
            <div className="empty vocabulary-empty">
              <p>{tUi("No words match your search or filter.")}</p>
              <Button variant="secondary" size="md" onClick={() => resetFilters(activeLanguageId)}>{tUi("Clear filters")}</Button>
            </div>
          )}
          {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && !hasActiveFilters && (
            <div className="empty vocabulary-empty">
              <p>{tUi("No words yet. Add your first word to start learning.")}</p>
              <Button variant="primary" size="md" onClick={openAddOne}>{tUi("+ Add your first word")}</Button>
            </div>
          )}
          {entries?.map((entry) => (
            <WordRow key={entry.id} entry={entry} onClick={handleWordClick}
              selected={selectedIds.includes(entry.id)} current={entry.id === selectedId}
              onSelect={() => toggleSelection(entry.id)} onAction={setWordAction} />
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
      </div>

      {detailOpen && (
        <WordDetail
          id={selectedId}
          onClose={() => void navigate('/vocabulary')}
          position={detailPosition}
          {...(previousEntry ? { onPrevious: () => void navigate(`/vocabulary/${previousEntry.id}`, { replace: true }) } : {})}
          {...(nextEntry ? { onNext: () => void navigate(`/vocabulary/${nextEntry.id}`, { replace: true }) } : {})}
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
    </div>
  );
}
