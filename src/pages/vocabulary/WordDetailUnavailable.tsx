import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail: «не удалось загрузить» / «слово удалено»
// Вместо вечного "Loading…" даёт понятный итог и выход из панели.
// Рендерится внутри панели слова (WordDetail); Esc обрабатывает панель.
// ============================================================

import { Button } from '../../components/ui/Button';
import './vocabulary.css';

type WordDetailUnavailableProps = {
  /** true — запрос упал (можно повторить); false — слова больше нет. */
  failed: boolean;
  onRetry: () => void;
  onClose: () => void;
  /** id заголовка — им панель подписывает себя (aria-labelledby). */
  titleId: string;
};

export function WordDetailUnavailable({ failed, onRetry, onClose, titleId }: WordDetailUnavailableProps) {
  const { t: tUi } = useI18n();

  return (
    <div className="empty word-panel__state">
      <h2 id={titleId} className="empty__title">
        {failed ? tUi("Couldn’t load this word") : tUi("This word is no longer in your vocabulary")}
      </h2>
      {failed && (
        <p className="word-panel__state-text">{tUi("Something went wrong while reading it from your library. Your data is not affected.")}</p>
      )}
      <div className="word-panel__state-actions">
        {failed && (
          <Button variant="primary" onClick={onRetry}>{tUi("Try again")}</Button>
        )}
        <Button onClick={onClose}>{tUi("Close")}</Button>
      </div>
    </div>
  );
}
