import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail: удаление слова из словаря
// Двухшаговое подтверждение: случайный клик ничего не удаляет.
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
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

  return (
    <div className="word-detail-remove">
      {confirming ? (
        <div className="word-detail-remove-confirm" role="group" aria-label={tUi("Confirm removal")}>
          <p className="word-detail-remove-question">{tUi("Remove “")}{word}{tUi("” from your vocabulary?")}</p>
          <div className="word-detail-remove-actions">
            <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isRemoving}>{tUi("Remove")}</Button>
            <Button size="sm" onClick={() => setConfirming(false)} disabled={isRemoving}>{tUi("Keep word")}</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          aria-label={tUi("Remove {word} from vocabulary", { word: word })}
        >{tUi("Remove from vocabulary")}</Button>
      )}
      {hasError && (
        <p className="word-detail-remove-error" role="alert">{tUi("Couldn’t remove this word. Please try again.")}</p>
      )}
    </div>
  );
}
