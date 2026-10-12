// ============================================================
// LEXORA — Vocabulary Page
// Main screen: word list with search, filters, and actions.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { useQueryClient } from '@tanstack/react-query';
import { useVocabulary, useVocabularyCount } from '../../hooks/useVocabulary';
import { useSettingsStore } from '../../stores/settingsStore';
import { useVocabularyStore } from '../../stores/vocabularyStore';
import { Button, IconButton } from '../../components/ui/Button';
import { SrsStatusBadge, PosBadge } from '../../components/ui/Badge';
import { FreqBadge } from '../../components/domain/FreqBadge';
import { QUERY_KEYS } from '../../lib/constants';
import { ipc } from '../../lib/ipc';
import { cx, formatRelativeDate, pluralize } from '../../lib/utils';
import { WordDetail } from './WordDetail';
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
};

function WordRow({ entry, onClick }: WordRowProps) {
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? '—';

  const handlePlayAudio: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    void ipc.media.playTts(lexeme.text);
  };

  return (
    <div
      className="vocabulary-list-row animate-fade-in"
      onClick={() => onClick(entry.id)}
      role="row"
      aria-label={`${lexeme.text}: ${mainTranslation}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(entry.id);
        }
      }}
    >
      <div className="word-cell-main">
        <span className="word-text">{lexeme.text}</span>
        {lexeme.phonetic && (
          <span className="word-phonetic phonetic">{lexeme.phonetic}</span>
        )}
      </div>

      <div className="word-translation">{mainTranslation}</div>

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
          aria-label={`Play pronunciation of ${lexeme.text}`}
          onClick={handlePlayAudio}
          size="sm"
        />
        <IconButton
          icon={<OpenIcon />}
          aria-label={`Open details for ${lexeme.text}`}
          size="sm"
        />
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const filters = useVocabularyStore((s) => s.filters);
  const setSearch = useVocabularyStore((s) => s.setSearch);
  const setStatus = useVocabularyStore((s) => s.setStatus);
  const setFilters = useVocabularyStore((s) => s.setFilters);
  const resetFilters = useVocabularyStore((s) => s.resetFilters);
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

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all';

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
          <h1 className="vocabulary-title">My Vocabulary</h1>
          {totalCount != null && (
            <span className="vocabulary-count" aria-label={`${pluralize(totalCount, 'word')} total`}>
              {totalCount.toLocaleString()} {totalCount === 1 ? 'word' : 'words'}
            </span>
          )}
        </div>

        <div className="vocabulary-header-actions">
          <Button
            variant="secondary"
            size="md"
            onClick={() => void navigate('/study')}
          >
            Study Now
          </Button>

          <div className="add-word-split" ref={addMenuRef}>
            <Button
              variant="primary"
              size="md"
              onClick={openAddOne}
            >
              <PlusIcon /> Add Word
            </Button>
            <button
              type="button"
              className="add-word-split-toggle"
              aria-label="More add options"
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
                >
                  Add one
                </button>
                <button
                  type="button"
                  className="add-word-split-item"
                  role="menuitem"
                  onClick={() => openBulk('paste')}
                >
                  Paste list
                </button>
                <button
                  type="button"
                  className="add-word-split-item"
                  role="menuitem"
                  onClick={() => openBulk('file')}
                >
                  Upload file
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {bulkProgress && (
        <div className="bulk-translate-banner" role="status" aria-live="polite">
          Translating {bulkProgress.done}/{bulkProgress.total}
          {bulkProgress.text ? `: ${bulkProgress.text}` : '…'}
          {bulkProgress.error ? ` (${bulkProgress.error})` : ''}
        </div>
      )}

      <div className="vocabulary-toolbar" role="toolbar" aria-label="Vocabulary filters">
        <div className="vocabulary-search">
          <SearchIcon />
          <input
            type="search"
            className="vocabulary-search-input"
            placeholder="Search words…"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search vocabulary"
          />
        </div>

        <div className="filter-chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={cx('filter-chip', filters.status === value && 'active')}
              onClick={() => setStatus(value)}
              aria-pressed={filters.status === value}
              aria-label={`Show ${label} words`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="vocabulary-list-header" role="row" aria-hidden="true">
        <span>Word</span>
        <span>Translation</span>
        <span>Type</span>
        <span>Frequency</span>
        <span>Status</span>
        <span>Due</span>
        <span />
      </div>

      <div
        ref={listRef}
        className="vocabulary-list"
        role="table"
        aria-label="Vocabulary list"
        aria-rowcount={entries?.length ?? 0}
      >
        {isLoading && (
          <div className="vocabulary-empty text-muted text-sm animate-pulse">
            Loading vocabulary…
          </div>
        )}
        {isError && !isLoading && (
          <div className="vocabulary-empty" role="alert">
            <p className="text-secondary text-sm">Couldn’t load your vocabulary.</p>
            <Button variant="secondary" size="md" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page > 1 && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">No more words on this page.</p>
            <Button variant="secondary" size="md" onClick={() => handlePageChange(1)}>
              Back to the first page
            </Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && hasActiveFilters && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">No words match your search or filter.</p>
            <Button variant="secondary" size="md" onClick={() => resetFilters(activeLanguageId)}>
              Clear filters
            </Button>
          </div>
        )}
        {!isLoading && !isError && entries?.length === 0 && filters.page <= 1 && !hasActiveFilters && (
          <div className="vocabulary-empty">
            <p className="text-secondary text-sm">No words yet. Add your first word to start learning.</p>
            <Button variant="secondary" size="md" onClick={openAddOne}>
              + Add your first word
            </Button>
          </div>
        )}
        {entries?.map((entry) => (
          <WordRow key={entry.id} entry={entry} onClick={handleWordClick} />
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

      <AddWordModal
        key={addWordEpoch}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <BulkAddModal
        isOpen={bulkMode != null}
        mode={bulkMode ?? 'paste'}
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

      {selectedId != null && !isNaN(selectedId) && (
        <WordDetail
          id={selectedId}
          onClose={() => void navigate('/vocabulary')}
        />
      )}
    </div>
  );
}
