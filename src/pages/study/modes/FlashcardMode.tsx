import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Flashcard Study Mode
// Классическая карточка: слово → (необязательный выбор перевода) →
// самооценка Again/Hard/Good/Easy. Оценка сохраняется в SRS через
// submit_review. Варианты ответа — только из реальных данных сессии.
// Справа — контекст: пример со словом и заметки ученика.
// ============================================================

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { useSubmitReview } from '../../../hooks/useSubmitReview';
import { useReviewIntervalPreview } from '../../../hooks/useStudyQueue';
import { PosBadge } from '../../../components/ui/Badge';
import { Button, IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { AudioButton } from '../../../components/domain/AudioButton';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { buildFlashcardOptions, type FlashcardOption } from '../../../lib/flashcardOptions';
import { copyToClipboard, cx, splitByTerm } from '../../../lib/utils';
import type { StudyGrade, VocabularyEntryDto } from '../../../lib/types';
import { formatDueIn, hotkeyDigit } from '../studyKeys';

type FlashcardModeProps = {
  entry: VocabularyEntryDto;
  /** Main translations of the other cards in this session (real distractors). */
  distractorPool: readonly string[];
  onGrade: (grade: StudyGrade) => void;
};

type GradeButton = { grade: StudyGrade; label: string };

const GRADE_BUTTONS: readonly GradeButton[] = [
  { grade: 0, label: 'Again' },
  { grade: 2, label: 'Hard' },
  { grade: 3, label: 'Good' },
  { grade: 4, label: 'Easy' },
];

const GRADE_AFTER_CORRECT: StudyGrade = 3;
const GRADE_AFTER_WRONG: StudyGrade = 0;

export function FlashcardMode({ entry, distractorPool, onGrade }: FlashcardModeProps) {
  const { t: tUi, locale } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FlashcardOption | null>(null);
  const [shownAt] = useState(() => Date.now());
  const submitReview = useSubmitReview();
  const intervalIdPrefix = useId();

  const { lexeme, translations, examples, reviewState } = entry;
  // Real next intervals from the backend (SM-2 dry run); nothing is shown until they arrive.
  const { data: intervalPreview } = useReviewIntervalPreview(reviewState?.id ?? null);
  const intervalFor = (grade: StudyGrade): string | null => {
    if (!Array.isArray(intervalPreview)) return null;
    const preview = intervalPreview.find((item) => item.grade === grade);
    return preview ? formatDueIn(preview.dueInSeconds, tUi) : null;
  };
  const mainTranslation = translations[0]?.translatedText ?? null;
  const example = examples[0]?.sentence ?? null;
  const hasContext = Boolean(entry.notes) || Boolean(example);

  const options = useMemo<FlashcardOption[]>(
    () => buildFlashcardOptions(entry.id, mainTranslation, distractorPool),
    [entry.id, mainTranslation, distractorPool],
  );

  // Подсветка «рекомендованной» оценки следует из выбранного варианта:
  // верно → Good, неверно → Again. Без выбора (флип-карта) — без подсказки.
  const recommendedGrade: StudyGrade | null = selectedOption
    ? (selectedOption.isCorrect ? GRADE_AFTER_CORRECT : GRADE_AFTER_WRONG)
    : null;

  const gradePrompt = selectedOption
    ? (selectedOption.isCorrect
      ? tUi("Correct. How hard was it to recall?")
      : tUi("Not quite. How hard was it to recall?"))
    : tUi("How hard was it to recall?");

  const handleOptionClick = (opt: FlashcardOption) => {
    setSelectedOption(opt);
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

  // 1–4: before the answer — pick an option; after it — rate Again/Hard/Good/Easy.
  const onDigitRef = useRef<(digit: number) => boolean>(() => false);
  onDigitRef.current = (digit) => {
    if (!revealed) {
      const option = options[digit - 1];
      if (!option) return false;
      handleOptionClick(option);
      return true;
    }
    const button = GRADE_BUTTONS[digit - 1];
    if (!button || submitReview.isPending) return false;
    handleGrade(button.grade);
    return true;
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const digit = hotkeyDigit(event, GRADE_BUTTONS.length);
      if (digit !== null && onDigitRef.current(digit)) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={cx('study-layout', hasContext && 'study-layout--aside')}>
      <div className="study-main-col">
        <div className="study-prompt-label">
          {options.length > 0 ? tUi("What does this mean?") : tUi("Do you remember this word?")}
        </div>

        <div className="study-word-block">
          <h1 dir="auto" className="study-card-word">{lexeme.text}</h1>
          <div className="study-card-phonetic-row">
            {lexeme.phonetic && <span className="study-card-phonetic">{lexeme.phonetic}</span>}
            <AudioButton text={lexeme.text} />
            <IconButton
              icon={<Icon name="content_copy" size={17} />}
              variant="ghost"
              size="sm"
              className="study-copy-btn"
              onClick={() => { void copyToClipboard(lexeme.text); }}
              aria-label={tUi("Copy word")}
            />
          </div>
          {(lexeme.partOfSpeech !== null || lexeme.frequencyRank !== null) && (
            <div className="study-card-meta">
              <PosBadge pos={lexeme.partOfSpeech} />
              {lexeme.partOfSpeech !== null && lexeme.frequencyRank !== null && (
                <span aria-hidden="true">·</span>
              )}
              {lexeme.frequencyRank !== null && (
                <span className="study-card-freq">
                  {tUi("Top {rank}", { rank: lexeme.frequencyRank.toLocaleString(locale) })}
                </span>
              )}
            </div>
          )}
        </div>

        {options.length > 0 && (
          <div className="study-options-grid" role="group" aria-label={tUi("Select translation")}>
            {options.map((opt, index) => {
              const isCorrect = revealed && opt.isCorrect;
              const isWrong = revealed && selectedOption?.text === opt.text && !opt.isCorrect;
              return (
                <button
                  key={opt.text}
                  type="button"
                  dir="auto"
                  className={cx(
                    'study-option-card',
                    isCorrect && 'selected-correct',
                    isWrong && 'selected-wrong',
                    revealed && !isCorrect && !isWrong && 'is-dimmed',
                  )}
                  onClick={() => handleOptionClick(opt)}
                  disabled={revealed}
                >
                  <kbd className="kbd study-option-key" aria-hidden="true">{index + 1}</kbd>
                  <span className="study-option-text">{opt.text}</span>
                  {isCorrect && <Icon name="check_circle" size={20} className="icon--ok" />}
                  {isWrong && <Icon name="cancel" size={20} className="icon--live" />}
                </button>
              );
            })}
          </div>
        )}

        {revealed && options.length === 0 && (
          <p
            className={cx('study-answer-reveal', !mainTranslation && 'study-answer-reveal--missing')}
            dir="auto"
            aria-live="polite"
          >
            {mainTranslation ?? tUi("No translation saved for this word yet.")}
          </p>
        )}

        {!revealed ? (
          <Button
            variant="secondary"
            size="lg"
            className="study-reveal-btn"
            onClick={() => setRevealed(true)}
            aria-label={tUi("Show translation")}
          >{tUi("Show Answer (Space)")}</Button>
        ) : (
          <div className="study-revealed-section animate-slide-up">
            <p className="study-grade-prompt">{gradePrompt}</p>
            <div className="study-grading-row" role="group" aria-label={tUi("Rate your recall")}>
              {GRADE_BUTTONS.map(({ grade, label }, index) => {
                const interval = intervalFor(grade);
                const intervalId = `${intervalIdPrefix}-interval-${grade}`;
                return (
                  <button
                    key={grade}
                    type="button"
                    className={cx('grade-btn', grade === recommendedGrade && 'is-recommended')}
                    onClick={() => handleGrade(grade)}
                    disabled={submitReview.isPending}
                    aria-describedby={interval ? intervalId : undefined}
                  >
                    <span className="grade-btn-label">{tUi(label)}</span>
                    <span className="grade-btn-sub" aria-hidden="true">
                      {index + 1}
                      {interval && <> · <span id={intervalId}>{interval}</span></>}
                    </span>
                  </button>
                );
              })}
            </div>
            {submitReview.isError && (
              <p className="study-save-error inline-error" role="alert">{tUi("Couldn’t save your rating. Please try again.")}</p>
            )}
          </div>
        )}
      </div>

      {hasContext && (
        <aside className="study-context" aria-label={tUi("Notes and example")}>
          {example && (
            <>
              <div className="study-context-label">{tUi("Context")}</div>
              <p className="study-context-example" dir="auto">
                “{splitByTerm(example, lexeme.text).map((segment, i) =>
                  segment.match ? <u key={i}>{segment.text}</u> : segment.text,
                )}”
              </p>
            </>
          )}
          {example && entry.notes && <hr className="divider" />}
          {entry.notes && (
            <>
              <div className="study-context-label">{tUi("Notes")}</div>
              <SafeHtml html={entry.notes} className="study-context-notes" />
            </>
          )}
        </aside>
      )}
    </div>
  );
}
