import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail: fix a typo in a saved card
// Edits the word and its main translation. Review progress is kept;
// picture, examples and phonetic are rebuilt for a changed spelling.
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useUpdateVocabularyEntry } from '../../hooks/useVocabulary';
import { formatIpcError } from '../../lib/utils';

type WordDetailEditProps = {
  entryId: number;
  text: string;
  translation: string;
  onDone: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export function WordDetailEdit({ entryId, text, translation, onDone, onPendingChange }: WordDetailEditProps) {
  const { t: tUi } = useI18n();
  const updateMutation = useUpdateVocabularyEntry();
  const [wordValue, setWordValue] = useState(text);
  const [translationValue, setTranslationValue] = useState(translation);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    onPendingChange?.(true);
    try {
      await updateMutation.mutateAsync({
        id: entryId,
        text: wordValue,
        translation: translationValue.trim() ? translationValue : null,
      });
      onDone();
    } catch (err) {
      setError(formatIpcError(err, tUi("Couldn’t save the changes. Please try again.")));
    } finally {
      onPendingChange?.(false);
    }
  };

  return (
    <form
      className="word-detail-edit"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      <label className="word-detail-edit-label" htmlFor="word-detail-edit-word">{tUi("Word")}</label>
      <input dir="auto"
        id="word-detail-edit-word"
        className="word-detail-edit-input"
        value={wordValue}
        onChange={(e) => setWordValue(e.target.value)}
        maxLength={200}
        // Focus the field the user just asked to edit.
        autoFocus
      />
      <label className="word-detail-edit-label" htmlFor="word-detail-edit-translation">{tUi("Translation")}</label>
      <input dir="auto"
        id="word-detail-edit-translation"
        className="word-detail-edit-input"
        value={translationValue}
        onChange={(e) => setTranslationValue(e.target.value)}
      />
      {error && (
        <p className="word-detail-notes-error" role="alert">
          {error}
        </p>
      )}
      <div className="word-detail-edit-actions">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={updateMutation.isPending}>{tUi("Cancel")}</Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isLoading={updateMutation.isPending}
          disabled={!wordValue.trim()}
        >{tUi("Save")}</Button>
      </div>
    </form>
  );
}
