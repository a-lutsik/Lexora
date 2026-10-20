import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Bulk Add Modal
// Paste a list or import a newline-separated file.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '../../components/ui/Button';
import { useAddVocabularyBatch, useImportWordList } from '../../hooks/useVocabulary';
import { useCategories } from '../../hooks/useCategories';
import { useLanguages, resolveLanguageId } from '../../hooks/useLanguages';
import { useSettingsStore } from '../../stores/settingsStore';
import { CategorySelect } from '../../components/domain/CategorySelect';
import { useSettings } from '../../hooks/useSettings';
import { MAX_BULK_WORDS, parseWordList } from '../../lib/wordList';
import { formatIpcError, pluralize } from '../../lib/utils';
import type { AddVocabularyBatchResult } from '../../lib/types';
import './vocabulary.css';

export type BulkAddMode = 'paste' | 'file';

type BulkAddModalProps = {
  isOpen: boolean;
  mode: BulkAddMode;
  onClose: () => void;
  initialCategoryId?: number | null;
  onQueued?: (result: AddVocabularyBatchResult) => void;
};


function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function BulkAddModal({ isOpen, mode, onClose, onQueued, initialCategoryId = null }: BulkAddModalProps) {
  const { t: tUi } = useI18n();
  const wordListFilters = [{ name: tUi('Word list'), extensions: ['txt', 'csv'] }];
  const [rawText, setRawText] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const activeLanguageId = useSettingsStore((state) => state.activeLanguageId);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const batchMutation = useAddVocabularyBatch();
  const importMutation = useImportWordList();
  const { data: settings } = useSettings();
  const sourceLanguage = settings?.primaryLanguage ?? 'en';
  const { data: languages } = useLanguages();
  const sourceLanguageId = resolveLanguageId(languages, sourceLanguage) ?? activeLanguageId;
  const categories = useCategories(isOpen ? sourceLanguageId : 0);
  const isPending = batchMutation.isPending || importMutation.isPending;

  const parsed = useMemo(() => parseWordList(rawText), [rawText]);

  const previousSession = useRef({ isOpen: false, mode });
  useEffect(() => {
    const previous = previousSession.current;
    previousSession.current = { isOpen, mode };
    if (!isOpen || (previous.isOpen && previous.mode === mode)) return;
    setRawText('');
    setCategoryId(initialCategoryId);
    setFilePath(null);
    setFileName(null);
    setError(null);
    setResultSummary(null);
  }, [isOpen, mode, initialCategoryId]);

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

  const title = mode === 'paste' ? tUi("Paste Word List") : tUi("Upload Word List");
  const canSubmit =
    mode === 'paste' ? parsed.words.length > 0 : Boolean(filePath);

  const handlePickFile = async () => {
    setError(null);
    try {
      const path = await open({
        multiple: false,
        filters: wordListFilters,
      });
      if (!path || Array.isArray(path)) return;
      setFilePath(path);
      const parts = path.split(/[/\\]/);
      setFileName(parts[parts.length - 1] ?? path);
    } catch (err) {
      setError(formatIpcError(err, tUi("Could not open the file. Try again.")));
    }
  };

  const handleSubmit = () => {
    const selectedCategoryId = categoryId ?? categories.data?.find((category) => category.isGeneral)?.id;
    setError(null);
    setResultSummary(null);

    if (mode === 'paste') {
      if (parsed.words.length === 0) {
        setError(tUi("Add at least one word or phrase (one per line)."));
        return;
      }
      batchMutation.mutate(
        {
          texts: parsed.words,
          sourceLanguage,
          source: 'bulk',
          ...(selectedCategoryId != null ? { categoryId: selectedCategoryId } : {}),
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
          onError: (err) => setError(formatIpcError(err, tUi("Could not add these words. Try again."))),
        }
      );
      return;
    }

    if (!filePath) {
      setError(tUi("Choose a .txt or .csv file first."));
      return;
    }
    importMutation.mutate(
      {
        path: filePath,
          sourceLanguage,
        source: 'file',
        ...(selectedCategoryId != null ? { categoryId: selectedCategoryId } : {}),
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
        onError: (err) => setError(formatIpcError(err, tUi("Could not add these words. Try again."))),
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
            <p className="text-secondary text-xs">{tUi("One word or phrase per line. Up to ")}{MAX_BULK_WORDS}{tUi(" entries. Translations run in the background.")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="add-word-close-btn"
            aria-label={tUi("Close dialog")}
          >
            <CloseIcon />
          </button>
        </div>

        {mode === 'paste' ? (
          <div className="bulk-add-field">
            <label htmlFor="bulk-add-textarea" className="text-secondary text-xs font-medium">{tUi("WORDS / PHRASES")}</label>
            <textarea dir="auto"
              id="bulk-add-textarea"
              className="bulk-add-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"apple\nget along\nbe pesky"}
              rows={10}
              autoFocus
              aria-label={tUi("Word list, one per line")}
            />
            <p className="bulk-add-preview text-secondary text-xs" aria-live="polite">
              {parsed.words.length === 0
                ? tUi("No words yet")
                : parsed.words.length === 1
                  ? tUi("{count} word ready", { count: parsed.words.length })
                  : tUi("{count} words ready", { count: parsed.words.length })}
              {parsed.truncated ? tUi(" (first {MAX_BULK_WORDS} only)", { MAX_BULK_WORDS: MAX_BULK_WORDS }) : ''}
              {parsed.skippedLong > 0 ? tUi(", skipped {value1} long line(s)", { value1: parsed.skippedLong }) : ''}
            </p>
          </div>
        ) : (
          <div className="bulk-add-field">
            <p className="text-secondary text-xs">{tUi("Choose a UTF-8 text file with one word or phrase per line (.txt or .csv).")}</p>
            <Button variant="secondary" size="md" onClick={() => void handlePickFile()}>{tUi("Choose file…")}</Button>
            {fileName && (
              <p className="bulk-add-preview text-secondary text-xs" aria-live="polite">{tUi("Selected: ")}{fileName}
              </p>
            )}
          </div>
        )}

        <label className="bulk-add-field">{tUi('Category')}
          <CategorySelect categories={categories.data ?? []} value={categoryId} onChange={setCategoryId} disabled={isPending} />
        </label>
        {categories.isError && <p className="text-secondary text-xs">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Try again')}</Button></p>}

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
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>{tUi("Cancel")}</Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!canSubmit || isPending}
            aria-label={
              mode === 'paste'
                ? tUi("Add {value1}", { value1: pluralize(parsed.words.length, 'word') })
                : tUi("Add words from file")
            }
          >
            {mode === 'paste'
              ? parsed.words.length === 1
                ? tUi("Add {count} word", { count: parsed.words.length })
                : parsed.words.length > 0
                  ? tUi("Add {count} words", { count: parsed.words.length })
                  : tUi("Add words")
              : tUi("Add from file")}
          </Button>
        </div>
      </div>
    </div>
  );
}
