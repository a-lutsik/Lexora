import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
    const dialog = dialogRef.current;
    // Удаление: фокус на безопасной кнопке; правка: на первом поле.
    const first = dialog?.querySelector<HTMLElement>('input, .modal__foot .btn--secondary')
      ?? dialog?.querySelector<HTMLElement>('button');
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

  const isEdit = action.kind === 'edit';
  const title = action.kind === 'edit'
    ? t('Edit word and translation')
    : action.word
      ? t('Remove “{word}” from your vocabulary?', { word: action.word })
      : t('Remove {count} selected words from your vocabulary?', { count: action.ids.length });

  return (
    <div className="modal-scrim">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-action-title"
        tabIndex={-1}
        className={isEdit ? 'modal modal--md' : 'modal modal--sm'}
      >
        <div className="modal__head">
          <div className="modal__head-text">
            <h2 id="vocabulary-action-title" className="modal__title">{title}</h2>
            {action.kind === 'remove' && action.word && (
              <p className="modal__desc">
                {t('Review history for this word will be deleted. This can’t be undone.')}
              </p>
            )}
          </div>
          <IconButton
            className="modal__close"
            icon={<Icon name="close" size={20} />}
            aria-label={t('Close dialog')}
            onClick={onClose}
            disabled={pending}
          />
        </div>
        {action.kind === 'edit' ? (
          <div className="modal__body">
            <WordDetailEdit
              entryId={action.entry.id}
              text={action.entry.lexeme.text}
              translation={action.entry.translations[0]?.translatedText ?? ''}
              onDone={onClose}
              onPendingChange={setSaving}
            />
          </div>
        ) : (
          <>
            {removal.isError && (
              <div className="modal__body">
                <p role="alert" className="inline-error">
                  {formatIpcError(removal.error, t('Couldn’t remove the selected words. Please try again.'))}
                </p>
              </div>
            )}
            <div className="modal__foot">
              <span className="spacer" />
              <Button variant="secondary" onClick={onClose} disabled={pending}>
                {action.word ? t('Keep word') : t('Cancel')}
              </Button>
              <Button variant="danger" isLoading={pending} onClick={() => {
                removal.mutate(action.ids, { onSuccess: onRemoved });
              }}>
                <Icon name="delete" size={17} />
                {t('Remove')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
