import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useI18n } from '../../hooks/useI18n';
import { useRemoveVocabularyBatch } from '../../hooks/useVocabulary';
import { formatIpcError } from '../../lib/utils';
import type { VocabularyEntryDto } from '../../lib/types';
import { WordDetailEdit } from './WordDetailEdit';

export type VocabularyAction =
  | { kind: 'edit'; entry: VocabularyEntryDto }
  | { kind: 'remove'; ids: number[]; word?: string };

type VocabularyWordActionProps = {
  action: VocabularyAction;
  onClose: () => void;
  onRemoved: () => void;
};

export function VocabularyWordAction({ action, onClose, onRemoved }: VocabularyWordActionProps) {
  const { t } = useI18n();
  const removal = useRemoveVocabularyBatch();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  const [saving, setSaving] = useState(false);
  const pending = removal.isPending || saving;

  useEffect(() => {
    const previous = document.activeElement;
    const first = dialogRef.current?.querySelector<HTMLElement>('input, button');
    first?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, pending]);

  const title = action.kind === 'edit' ? t('Edit word and translation') : t('Confirm removal');
  return (
    <div className="word-detail-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-action-title"
        tabIndex={-1}
        className="add-word-dialog"
      >
        <h2 id="vocabulary-action-title" className="add-word-title">{title}</h2>
        {action.kind === 'edit' ? (
          <WordDetailEdit
            entryId={action.entry.id}
            text={action.entry.lexeme.text}
            translation={action.entry.translations[0]?.translatedText ?? ''}
            onDone={onClose}
            onPendingChange={setSaving}
          />
        ) : (
          <>
            <p>{action.word
              ? t('Remove “{word}” from your vocabulary?', { word: action.word })
              : t('Remove {count} selected words from your vocabulary?', { count: action.ids.length })}</p>
            {removal.isError && (
              <p role="alert" className="word-detail-remove-error">
                {formatIpcError(removal.error, t('Couldn’t remove the selected words. Please try again.'))}
              </p>
            )}
            <div className="word-detail-edit-actions">
              <Button onClick={onClose} disabled={pending}>{t('Cancel')}</Button>
              <Button variant="danger" isLoading={pending} onClick={() => {
                removal.mutate(action.ids, { onSuccess: onRemoved });
              }}>{t('Remove')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
