import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Collocation Study Mode
// The example sentence with the partner word blanked out
// ("___ advantage of"): pick the right word among confusable
// ones. Deterministic grading, no AI call: right = Good (3),
// wrong = Wrong (1), saved to SRS through submit_review.
// ============================================================

import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { useSubmitReview } from '../../../hooks/useSubmitReview';
import { buildCollocationGap } from '../../../lib/collocations';
import { buildFlashcardOptions, type FlashcardOption } from '../../../lib/flashcardOptions';
import { cx } from '../../../lib/utils';
import type { StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type CollocationModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade) => void;
  onSkip: () => void;
};

const GRADE_CORRECT: StudyGrade = 3;
const GRADE_WRONG: StudyGrade = 1;

export function CollocationMode({ entry, onComplete, onSkip }: CollocationModeProps) {
  const { t: tUi } = useI18n();
  const [selected, setSelected] = useState<FlashcardOption | null>(null);
  const [shownAt] = useState(() => Date.now());
  const submitReview = useSubmitReview();
  const { lexeme, reviewState } = entry;
  const drill = entry.collocationDrill ?? null;

  const gap = useMemo(
    () => (drill ? buildCollocationGap(lexeme.text, drill.focus, drill.example) : null),
    [drill, lexeme.text],
  );
  const options = useMemo(
    () => (drill ? buildFlashcardOptions(entry.id, drill.focus, drill.distractors) : []),
    [drill, entry.id],
  );

  const grade = selected?.isCorrect ? GRADE_CORRECT : GRADE_WRONG;

  const handleChoose = (option: FlashcardOption) => {
    if (selected) return;
    setSelected(option);
    if (!reviewState) return;
    submitReview.mutate({
      reviewStateId: reviewState.id,
      mode: 'collocation',
      grade: option.isCorrect ? GRADE_CORRECT : GRADE_WRONG,
      latencyMs: Math.max(0, Date.now() - shownAt),
    });
  };

  const handleNext = () => {
    if (!selected || submitReview.isPending) return;
    onComplete(grade);
  };

  useStudyContinueHotkey(selected !== null && !submitReview.isPending, handleNext);

  if (!drill || !gap || options.length === 0) {
    return (
      <div className="typing-card">
        <div className="typing-prompt">
          <div className="typing-prompt-label">{tUi("Collocations")}</div>
          <div className="study-fallback-text">
            {tUi("“{text}” has no collocation exercise yet.", { text: lexeme.text })}
          </div>
        </div>
        <Button variant="secondary" size="md" onClick={onSkip}>{tUi("Skip Card (→)")}</Button>
      </div>
    );
  }

  return (
    <div className="typing-card">
      <div className="typing-prompt">
        <div className="typing-prompt-label">{tUi("Choose the missing word:")}</div>
        <div className="cloze-sentence" dir="auto">
          {gap.before}
          <span className="cloze-gap">{selected ? drill.focus : '_____'}</span>
          {gap.after}
        </div>
        <div className="cloze-translation-hint" dir="auto">{drill.translation}</div>
      </div>

      <div className="study-options-grid" role="group" aria-label={tUi("Select the missing word")}>
        {options.map((option) => {
          const isCorrect = selected !== null && option.isCorrect;
          const isWrong = !isCorrect && selected?.text === option.text;
          return (
            <button
              key={option.text}
              type="button"
              dir="auto"
              className={cx(
                'study-option-card',
                isCorrect && 'selected-correct',
                isWrong && 'selected-wrong',
                selected !== null && !isCorrect && !isWrong && 'is-dimmed',
              )}
              onClick={() => handleChoose(option)}
              disabled={selected !== null}
            >
              <span className="study-option-text">{option.text}</span>
              {isCorrect && <Icon name="check_circle" size={20} className="icon--ok" />}
              {isWrong && <Icon name="cancel" size={20} className="icon--live" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          role="status"
          className={`typing-feedback ${selected.isCorrect ? 'typing-feedback--correct' : 'typing-feedback--wrong'}`}
        >
          <div className="typing-feedback-title" dir="auto">
            {selected.isCorrect ? tUi("✓ Excellent!") : tUi("Expected: {value1}", { value1: lexeme.text })}
          </div>
          {!gap.inExample && drill.example && (
            <p className="typing-feedback-explanation" dir="auto">{drill.example}</p>
          )}
          {submitReview.isError && (
            <p className="study-save-error inline-error" role="alert">{tUi("Couldn’t save your rating. Please try again.")}</p>
          )}
          <div className="typing-feedback-actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleNext}
              isLoading={submitReview.isPending}
            >{tUi("Continue (Space)")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
