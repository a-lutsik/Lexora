// ============================================================
// LEXORA — Bulk Add Modal
// Paste a list or import a newline-separated file.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '../../components/ui/Button';
import { useAddVocabularyBatch, useImportWordList } from '../../hooks/useVocabulary';
import { useSettings } from '../../hooks/useSettings';
import { MAX_BULK_WORDS, parseWordList } from '../../lib/wordList';
import { formatIpcError } from '../../lib/utils';
import type { AddVocabularyBatchResult } from '../../lib/types';
import './vocabulary.css';

export type BulkAddMode = 'paste' | 'file';

type BulkAddModalProps = {
  isOpen: boolean;
  mode: BulkAddMode;
  onClose: () => void;
  onQueued?: (result: AddVocabularyBatchResult) => void;
};

const WORD_LIST_FILTERS = [
  { name: 'Word list', extensions: ['txt', 'csv'] },
];

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function BulkAddModal({ isOpen, mode, onClose, onQueued }: BulkAddModalProps) {
  const [rawText, setRawText] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const batchMutation = useAddVocabularyBatch();
  const importMutation = useImportWordList();
  const { data: settings } = useSettings();
  const sourceLanguage = settings?.primaryLanguage ?? 'en';
  const isPending = batchMutation.isPending || importMutation.isPending;

  const parsed = useMemo(() => parseWordList(rawText), [rawText]);

  useEffect(() => {
    if (!isOpen) return;
    setRawText('');
    setFilePath(null);
    setFileName(null);
    setError(null);
    setResultSummary(null);
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = mode === 'paste' ? 'Paste Word List' : 'Upload Word List';
  const canSubmit =
    mode === 'paste' ? parsed.words.length > 0 : Boolean(filePath);

  const handlePickFile = async () => {
    setError(null);
    try {
      const path = await open({
        multiple: false,
        filters: WORD_LIST_FILTERS,
      });
      if (!path || Array.isArray(path)) return;
      setFilePath(path);
      const parts = path.split(/[/\\]/);
      setFileName(parts[parts.length - 1] ?? path);
    } catch (err) {
      setError(formatIpcError(err, 'Could not open the file. Try again.'));
    }
  };

  const handleSubmit = () => {
    setError(null);
    setResultSummary(null);

    if (mode === 'paste') {
      if (parsed.words.length === 0) {
        setError('Add at least one word or phrase (one per line).');
        return;
      }
      batchMutation.mutate(
        {
          texts: parsed.words,
          sourceLanguage,
          source: 'bulk',
        },
        {
          onSuccess: (result) => {
            const parts = [
              `Added ${result.added}`,
              result.skipped > 0 ? `skipped ${result.skipped}` : null,
              result.translateQueued ? 'translating in background…' : null,
            ].filter(Boolean);
            setResultSummary(parts.join(', '));
            onQueued?.(result);
            window.setTimeout(() => onClose(), 900);
          },
          onError: (err) => setError(formatIpcError(err, 'Could not add these words. Try again.')),
        }
      );
      return;
    }

    if (!filePath) {
      setError('Choose a .txt or .csv file first.');
      return;
    }
    importMutation.mutate(
      {
        path: filePath,
          sourceLanguage,
        source: 'file',
      },
      {
        onSuccess: (result) => {
          const parts = [
            `Added ${result.added}`,
            result.skipped > 0 ? `skipped ${result.skipped}` : null,
            result.translateQueued ? 'translating in background…' : null,
          ].filter(Boolean);
          setResultSummary(parts.join(', '));
          onQueued?.(result);
          window.setTimeout(() => onClose(), 900);
        },
        onError: (err) => setError(formatIpcError(err, 'Could not add these words. Try again.')),
      }
    );
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="add-word-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-add-title"
    >
      <div className="add-word-dialog animate-slide-up">
        <div className="add-word-header">
          <div>
            <h2 id="bulk-add-title" className="add-word-title">{title}</h2>
            <p className="text-secondary text-xs">
              One word or phrase per line. Up to {MAX_BULK_WORDS} entries. Translations run in the background.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="add-word-close-btn"
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </div>

        {mode === 'paste' ? (
          <div className="bulk-add-field">
            <label htmlFor="bulk-add-textarea" className="text-secondary text-xs font-medium">
              WORDS / PHRASES
            </label>
            <textarea
              id="bulk-add-textarea"
              className="bulk-add-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'apple\nget along\nbe pesky'}
              rows={10}
              autoFocus
              aria-label="Word list, one per line"
            />
            <p className="bulk-add-preview text-secondary text-xs" aria-live="polite">
              {parsed.words.length === 0
                ? 'No words yet'
                : `${parsed.words.length} word${parsed.words.length === 1 ? '' : 's'} ready`}
              {parsed.truncated ? ` (first ${MAX_BULK_WORDS} only)` : ''}
              {parsed.skippedLong > 0 ? `, skipped ${parsed.skippedLong} long line(s)` : ''}
            </p>
          </div>
        ) : (
          <div className="bulk-add-field">
            <p className="text-secondary text-xs">
              Choose a UTF-8 text file with one word or phrase per line (.txt or .csv).
            </p>
            <Button variant="secondary" size="md" onClick={() => void handlePickFile()}>
              Choose file…
            </Button>
            {fileName && (
              <p className="bulk-add-preview text-secondary text-xs" aria-live="polite">
                Selected: {fileName}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="add-word-image-error" role="alert">
            {error}
          </p>
        )}
        {resultSummary && (
          <p className="bulk-add-success text-xs" role="status" aria-live="polite">
            {resultSummary}
          </p>
        )}

        <div className="add-word-actions">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!canSubmit || isPending}
            aria-label={
              mode === 'paste'
                ? `Add ${parsed.words.length} words`
                : 'Add words from file'
            }
          >
            {mode === 'paste'
              ? `Add ${parsed.words.length || ''} word${parsed.words.length === 1 ? '' : 's'}`.trim()
              : 'Add from file'}
          </Button>
        </div>
      </div>
    </div>
  );
}
