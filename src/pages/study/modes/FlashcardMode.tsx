// ============================================================
// LEXORA — Flashcard Study Mode
// Классическая карточка: слово → (необязательный выбор перевода) →
// самооценка Again/Hard/Good/Easy. Оценка сохраняется в SRS через
// submit_review. Варианты ответа — только из реальных данных сессии.
// ============================================================

import { useMemo, useState } from 'react';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { useSubmitReview } from '../../../hooks/useSubmitReview';
import { PosBadge } from '../../../components/ui/Badge';
import { AudioButton } from '../../../components/domain/AudioButton';
import { FreqBadge } from '../../../components/domain/FreqBadge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { buildFlashcardOptions, type FlashcardOption } from '../../../lib/flashcardOptions';
import { copyToClipboard } from '../../../lib/utils';
import type { StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type FlashcardModeProps = {
  entry: VocabularyEntryDto;
  /** Main translations of the other cards in this session (real distractors). */
  distractorPool: readonly string[];
  onGrade: (grade: StudyGrade) => void;
};

type GradeButton = { grade: StudyGrade; label: string; className: string };

const GRADE_BUTTONS: readonly GradeButton[] = [
  { grade: 0, label: 'Again', className: 'grade-btn--blackout' },
  { grade: 2, label: 'Hard', className: 'grade-btn--hard' },
  { grade: 3, label: 'Good', className: 'grade-btn--good' },
  { grade: 4, label: 'Easy', className: 'grade-btn--easy' },
];

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function FlashcardMode({ entry, distractorPool, onGrade }: FlashcardModeProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shownAt] = useState(() => Date.now());
  const submitReview = useSubmitReview();

  const { lexeme, translations, examples, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? null;
  const example = examples[0]?.sentence ?? null;
  const hasContext = Boolean(entry.notes) || Boolean(example);

  const options = useMemo<FlashcardOption[]>(
    () => buildFlashcardOptions(entry.id, mainTranslation, distractorPool),
    [entry.id, mainTranslation, distractorPool],
  );

  const handleOptionClick = (opt: FlashcardOption) => {
    setSelectedOption(opt.text);
    setRevealed(true);
  };

  const handleGrade = (grade: StudyGrade) => {
    // Карточка без состояния повторений сохранить нечем — просто идём дальше.
    if (!reviewState) {
      onGrade(grade);
      return;
    }
    submitReview.mutate(
      {
        reviewStateId: reviewState.id,
        mode: 'flashcard',
        grade,
        latencyMs: Math.max(0, Date.now() - shownAt),
      },
      { onSuccess: () => onGrade(grade) },
    );
  };

  useStudyContinueHotkey(!revealed, () => setRevealed(true));

  return (
    <div className="study-layout">
      <div className="study-main-col">
        <div className="study-card">
          <div className="study-card-top-badge">
            <span>{options.length > 0 ? 'What does this mean?' : 'Do you remember this word?'}</span>
          </div>

          <div className="study-card-content">
            <h1 className="study-card-word">{lexeme.text}</h1>
            <div className="study-card-phonetic-row">
              {lexeme.phonetic && <span className="study-card-phonetic">{lexeme.phonetic}</span>}
              <AudioButton text={lexeme.text} />
            </div>
          </div>

          <div className="study-card-bottom-tags">
            <PosBadge pos={lexeme.partOfSpeech} />
            <FreqBadge rank={lexeme.frequencyRank} />
            <button
              type="button"
              className="study-copy-btn"
              onClick={() => { void copyToClipboard(lexeme.text); }}
              aria-label="Copy word"
            >
              <CopyIcon />
            </button>
          </div>
        </div>

        {options.length > 0 && (
          <div className="study-options-grid" role="group" aria-label="Select translation">
            {options.map((opt) => {
              let className = 'study-option-card';
              if (revealed && opt.isCorrect) {
                className += ' selected-correct';
              } else if (revealed && selectedOption === opt.text && !opt.isCorrect) {
                className += ' selected-wrong';
              }

              return (
                <button
                  key={opt.text}
                  type="button"
                  className={className}
                  onClick={() => handleOptionClick(opt)}
                  disabled={revealed}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {revealed && options.length === 0 && (
          <p
            className={`study-answer-reveal${mainTranslation ? '' : ' study-answer-reveal--missing'}`}
            aria-live="polite"
          >
            {mainTranslation ?? 'No translation saved for this word yet.'}
          </p>
        )}

        {!revealed ? (
          <button
            type="button"
            className="study-reveal-btn"
            onClick={() => setRevealed(true)}
            aria-label="Show translation"
          >
            Show Answer (Space)
          </button>
        ) : (
          <div className="study-revealed-section animate-slide-up">
            <div className="study-grading-row" role="group" aria-label="Rate your recall">
              {GRADE_BUTTONS.map(({ grade, label, className }) => (
                <button
                  key={grade}
                  type="button"
                  className={`grade-btn ${className}`}
                  onClick={() => handleGrade(grade)}
                  disabled={submitReview.isPending}
                >
                  <span className="grade-btn-label">{label}</span>
                </button>
              ))}
            </div>
            {submitReview.isError && (
              <p className="study-save-error" role="alert">
                Couldn’t save your rating. Please try again.
              </p>
            )}
          </div>
        )}
      </div>

      {hasContext && (
        <aside className="study-ai-panel" aria-label="Notes and example">
          <div className="study-ai-header">
            <span className="study-ai-icon" aria-hidden="true">📝</span>
            <span className="study-ai-title">Context</span>
          </div>
          <div className="study-ai-body">
            {entry.notes && (
              <div className="study-ai-tip">
                <span className="study-ai-bulb" aria-hidden="true">💡</span>
                <p>
                  <strong>Notes:</strong> <SafeHtml html={entry.notes} as="span" />
                </p>
              </div>
            )}
            {example && (
              <div className="study-ai-mnemonic">
                <p className="study-ai-mnemonic-title">Example:</p>
                <p className="study-ai-mnemonic-text">{example}</p>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
