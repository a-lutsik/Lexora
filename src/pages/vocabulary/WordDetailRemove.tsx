import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail: удаление слова из словаря
// Текстовая кнопка в футере панели открывает подтверждение
// (общая анатомия модалки, frame 2d): случайный клик ничего не удаляет.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './vocabulary.css';

type WordDetailRemoveProps = {
  word: string;
  isRemoving: boolean;
  hasError: boolean;
  onConfirm: () => void;
};

export function WordDetailRemove({ word, isRemoving, hasError, onConfirm }: WordDetailRemoveProps) {
  const { t: tUi } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  useFocusTrap(dialogRef, confirming);

  useEffect(() => {
    if (!confirming) return;
    const trigger = triggerRef.current?.querySelector('button') ?? null;
    // Безопасное действие по умолчанию — «Keep word».
    dialogRef.current?.querySelector<HTMLButtonElement>('.modal__foot .btn--secondary')?.focus();
    return () => {
      if (trigger?.isConnected) trigger.focus();
    };
  }, [confirming]);

  useEffect(() => {
    if (!confirming) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Esc закрывает только подтверждение, не всю панель слова.
      event.stopPropagation();
      if (!isRemoving) setConfirming(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [confirming, isRemoving]);

  const titleId = 'word-detail-remove-title';

  return (
    <>
      <span ref={triggerRef} className="word-panel__remove">
        <Button
          variant="danger-ghost"
          onClick={() => setConfirming(true)}
          aria-label={tUi("Remove {word} from vocabulary", { word: word })}
        >
          <Icon name="delete" size={17} />
          {tUi("Remove from vocabulary")}
        </Button>
      </span>
      {confirming && (
        // Клик по фону закрывает подтверждение мышью; с клавиатуры — Esc и «Keep word».
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="modal-scrim"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isRemoving) setConfirming(false);
          }}
        >
          <div
            ref={dialogRef}
            className="modal modal--sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby="word-detail-remove-desc"
          >
            <div className="modal__head">
              <div className="modal__head-text">
                <h2 id={titleId} className="modal__title">
                  {tUi('Remove “{word}” from your vocabulary?', { word })}
                </h2>
                <p id="word-detail-remove-desc" className="modal__desc">
                  {tUi('Review history for this word will be deleted. This can’t be undone.')}
                </p>
              </div>
              <IconButton
                className="modal__close"
                icon={<Icon name="close" size={20} />}
                aria-label={tUi("Close dialog")}
                onClick={() => setConfirming(false)}
                disabled={isRemoving}
              />
            </div>
            {hasError && (
              <div className="modal__body">
                <p className="inline-error" role="alert">{tUi("Couldn’t remove this word. Please try again.")}</p>
              </div>
            )}
            <div className="modal__foot">
              <span className="spacer" />
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isRemoving}>
                {tUi("Keep word")}
              </Button>
              <Button variant="danger" onClick={onConfirm} isLoading={isRemoving}>
                <Icon name="delete" size={17} />
                {tUi("Remove")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
