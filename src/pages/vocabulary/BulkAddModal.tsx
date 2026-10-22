import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Bulk Add Modal
// Paste a list or import a newline-separated file.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

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

  const title = mode === 'paste' ? tUi("Paste word list") : tUi("Upload word list");
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
    // Клик по фону закрывает модалку мышью; с клавиатуры — Esc и Cancel.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal modal--md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-add-title"
      >
        <div className="modal__head">
          <div className="modal__head-text">
            <h2 id="bulk-add-title" className="modal__title">{title}</h2>
            <p className="modal__desc">{tUi("Translations run in the background. You can keep working.")}</p>
          </div>
          <IconButton
            className="modal__close"
            icon={<Icon name="close" size={20} />}
            aria-label={tUi("Close dialog")}
            onClick={onClose}
          />
        </div>

        <div className="modal__body">
          {mode === 'paste' ? (
            <div className="vocabulary-form-field">
              <label htmlFor="bulk-add-textarea" className="label">
                {tUi("Words and phrases")}
                <span className="label__optional">{tUi("one per line, up to {count}", { count: MAX_BULK_WORDS })}</span>
              </label>
              <textarea dir="auto"
                id="bulk-add-textarea"
                className="field field--textarea bulk-add-textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"apple\nget along\nbe pesky"}
                rows={8}
                autoFocus
                aria-label={tUi("Word list, one per line")}
              />
              <p className="bulk-add-preview" aria-live="polite">
                <Icon
                  name={parsed.words.length > 0 ? 'check_circle' : 'info'}
                  size={17}
                  className={parsed.words.length > 0 ? 'icon--ok' : 'icon--muted'}
                />
                <span>
                  {parsed.words.length === 0
                    ? tUi("No words yet")
                    : parsed.words.length === 1
                      ? tUi("{count} word ready", { count: parsed.words.length })
                      : tUi("{count} words ready", { count: parsed.words.length })}
                  {parsed.truncated ? tUi(" (first {MAX_BULK_WORDS} only)", { MAX_BULK_WORDS: MAX_BULK_WORDS }) : ''}
                  {parsed.skippedLong > 0 ? tUi(", skipped {value1} long line(s)", { value1: parsed.skippedLong }) : ''}
                </span>
              </p>
            </div>
          ) : (
            <div className="vocabulary-form-field">
              <p className="inline-note">{tUi("Choose a UTF-8 text file with one word or phrase per line (.txt or .csv).")}</p>
              <div className="bulk-add-file-row">
                <Button variant="secondary" size="md" onClick={() => void handlePickFile()}>
                  <Icon name="upload_file" size={17} />
                  {tUi("Choose file…")}
                </Button>
                {fileName && (
                  <p className="bulk-add-preview" aria-live="polite">{tUi("Selected: ")}{fileName}</p>
                )}
              </div>
            </div>
          )}

          <div className="vocabulary-form-field">
            <label htmlFor="bulk-add-category" className="label">{tUi('Category')}</label>
            <CategorySelect id="bulk-add-category" categories={categories.data ?? []} value={categoryId} onChange={setCategoryId} disabled={isPending} />
          </div>
          {categories.isError && <p className="inline-note">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Try again')}</Button></p>}

          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          {resultSummary && (
            <p className="bulk-add-success" role="status" aria-live="polite">
              <Icon name="check_circle" size={17} className="icon--ok" />
              {resultSummary}
            </p>
          )}
        </div>

        <div className="modal__foot">
          <span className="hint">
            <kbd className="kbd">{tUi("Esc")}</kbd>
            {tUi("close")}
          </span>
          <span className="spacer" />
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
