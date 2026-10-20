import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail: «не удалось загрузить» / «слово удалено»
// Вместо вечного "Loading…" даёт понятный итог и выход из модалки.
// ============================================================

import { useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './vocabulary.css';

type WordDetailUnavailableProps = {
  /** true — запрос упал (можно повторить); false — слова больше нет. */
  failed: boolean;
  onRetry: () => void;
  onClose: () => void;
};

export function WordDetailUnavailable({ failed, onRetry, onClose }: WordDetailUnavailableProps) {
  const { t: tUi } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);
  useFocusTrap(dialogRef);

  return (
    // Клик по backdrop закрывает окно мышью; клавиатурная альтернатива — Esc
    // (обработчик в WordDetail) и кнопка Close.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="word-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-detail-unavailable-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="word-detail-dialog word-detail-unavailable" tabIndex={-1}>
        <h2 id="word-detail-unavailable-title" className="word-detail-unavailable-title">
          {failed ? tUi("Couldn’t load this word") : tUi("This word is no longer in your vocabulary")}
        </h2>
        {failed && (
          <p className="word-detail-unavailable-text">{tUi("Something went wrong while reading it from your library. Your data is not affected.")}</p>
        )}
        <div className="word-detail-unavailable-actions">
          {failed && (
            <Button variant="primary" onClick={onRetry}>{tUi("Try again")}</Button>
          )}
          <Button onClick={onClose}>{tUi("Close")}</Button>
        </div>
      </div>
    </div>
  );
}
