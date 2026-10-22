import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Study Page (Lingora)
// Выбор режима: заголовок страницы, сетка режимов, запуск сессии.
// Сессия: фокус-полоса (режим, прогресс, таймер, End), холст режима,
// нижняя строка со статистикой.
// ============================================================

import { useState, useEffect, useId, useMemo, useRef, type KeyboardEvent } from 'react';
import {
  useStudyQueue,
  useDueCount,
  useStudyDailyActivity,
  useStudyStatsSummary,
} from '../../hooks/useStudyQueue';
import { useCategories } from '../../hooks/useCategories';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { FlashcardMode } from './modes/FlashcardMode';
import { TypingMode } from './modes/TypingMode';
import { ListeningMode } from './modes/ListeningMode';
import { ClozeMode } from './modes/ClozeMode';
import { ImageMode } from './modes/ImageMode';
import { IrregularVerbsMode } from './modes/IrregularVerbsMode';
import { DefinitionMode } from './modes/DefinitionMode';
import { SpeakingMode } from './modes/SpeakingMode';
import { CollocationMode } from './modes/CollocationMode';
import { CategorySelect } from '../../components/domain/CategorySelect';
import type { DailyActivity, StatsSummary } from '../../lib/ipc';
import type { StudyGrade, StudyMode, StudyQueueFilters } from '../../lib/types';
import { cx, pluralize } from '../../lib/utils';
import { estimateMinutes, hotkeyDigit, isFreeEnter } from './studyKeys';
import './study.css';

const STUDY_MODES: { mode: StudyMode; icon: string; name: string; desc: string }[] = [
  {
    mode: 'flashcard',
    icon: 'style',
    name: 'Flashcards',
    desc: 'Classic flip card review with SM-2 spaced repetition',
  },
  {
    mode: 'typing',
    icon: 'keyboard',
    name: 'Typing',
    desc: 'Practice spelling and recall with instant feedback',
  },
  {
    mode: 'listening',
    icon: 'headphones',
    name: 'Listening',
    desc: 'Hear the word and type what you heard',
  },
  {
    mode: 'cloze',
    icon: 'short_text',
    name: 'Fill the gap',
    desc: 'Contextual sentence completion with AI explanation',
  },
  {
    mode: 'image',
    icon: 'image',
    name: 'Image association',
    desc: 'Recall the word from a picture',
  },
  {
    mode: 'irregular_verbs',
    icon: 'shuffle',
    name: 'Irregular verbs',
    desc: 'Drill past simple and past participle forms',
  },
  {
    mode: 'definition',
    icon: 'menu_book',
    name: 'Definition',
    desc: 'Recall the word from its definition and synonyms',
  },
  {
    mode: 'speaking',
    icon: 'record_voice_over',
    name: 'Speaking',
    desc: 'Say the word and get phoneme-level feedback',
  },
  {
    mode: 'collocation',
    icon: 'link',
    name: 'Collocations',
    desc: 'Pick the word that goes with it: take advantage of, in the end',
  },
];

/** "Accuracy this week" = the last 7 calendar days, today included. */
const WEEK_DAYS = 7;
const QUEUE_LIMIT = 20;

type OverviewStats = {
  reviewedToday: number | null;
  weekAccuracy: number | null;
  streak: number | null;
};

/** Only numbers the backend actually returned; a missing value stays null (cell hidden). */
function overviewStats(
  activity: DailyActivity[] | null | undefined,
  summary: StatsSummary | null | undefined,
): OverviewStats {
  const days = Array.isArray(activity) ? activity : [];
  const today = days[days.length - 1];
  let reviewed = 0;
  let correct = 0;
  for (const day of days) {
    reviewed += day.reviewed;
    // Per-day accuracy is a percentage rounded to 0.1 — the count of correct answers is exact again.
    correct += Math.round((day.reviewed * day.accuracy) / 100);
  }
  return {
    reviewedToday: today ? today.reviewed : null,
    weekAccuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : null,
    streak: typeof summary?.streak === 'number' ? summary.streak : null,
  };
}

export default function StudyPage() {
  const { t: tUi, locale } = useI18n();
  const [selectedMode, setSelectedMode] = useState<StudyMode>('flashcard');
  // "Mixed" (due + new) keeps the previous default queue; "Due" leaves new cards out.
  const [includeNew, setIncludeNew] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const cardsLabelId = useId();
  const categoryLabelId = useId();

  const session = useSessionStore();
  const { data: dueCount } = useDueCount(activeLanguageId);
  const { data: categories } = useCategories(activeLanguageId);
  const { data: statsSummary } = useStudyStatsSummary(activeLanguageId, !session.isActive);
  const { data: weekActivity } = useStudyDailyActivity(WEEK_DAYS, activeLanguageId, !session.isActive);
  // Category filter applies to the learner's own words (queue semantics of `categoryIds`).
  const queueFilters: StudyQueueFilters = {
    languageId: activeLanguageId,
    sources: [],
    limit: QUEUE_LIMIT,
    includeNew,
    includeMatureRefresh: false,
    collocationsOnly: selectedMode === 'collocation',
    ...(categoryId != null ? { includeMine: false, categoryIds: [categoryId] } : {}),
  };
  const { data: queue, refetch, isLoading: isQueueLoading, isError: isQueueError } = useStudyQueue(queueFilters);

  // Track session timer
  useEffect(() => {
    if (!session.isActive) {
      setSecondsElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session.isActive]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Карточка без состояния повторений не может быть запланирована — в сессию
  // берём только те, что можно оценить и сохранить.
  const startableQueue = useMemo(
    () => (queue ?? []).filter((entry) => entry.reviewState != null),
    [queue],
  );

  const handleStartSession = () => {
    if (isQueueLoading || startableQueue.length === 0) return;
    session.startSession(startableQueue, selectedMode);
  };

  // Picker hotkeys: 1–9 pick a mode, Enter starts. Text fields and pickers keep their keys.
  const startSessionRef = useRef(handleStartSession);
  startSessionRef.current = handleStartSession;
  useEffect(() => {
    if (session.isActive) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const digit = hotkeyDigit(event, STUDY_MODES.length);
      if (digit !== null) {
        const item = STUDY_MODES[digit - 1];
        if (!item) return;
        event.preventDefault();
        setSelectedMode(item.mode);
        return;
      }
      if (isFreeEnter(event)) {
        event.preventDefault();
        startSessionRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.isActive]);

  const modeIndex = STUDY_MODES.findIndex((item) => item.mode === selectedMode);

  // Radio-группа: Space/Enter выбирают, стрелки и Home/End двигают выбор и фокус.
  const handleModeKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const last = STUDY_MODES.length - 1;
    let target: number | null = null;
    switch (event.key) {
      case 'Enter':
        // Enter on the already selected mode starts the session (native radio + submit).
        if (STUDY_MODES[index]?.mode === selectedMode) {
          event.preventDefault();
          handleStartSession();
          return;
        }
        target = index;
        break;
      case ' ':
        target = index;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        target = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = index === 0 ? last : index - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = STUDY_MODES[target];
    if (!next) return;
    setSelectedMode(next.mode);
    document.getElementById(`study-mode-${next.mode}`)?.focus();
  };

  const handleCardGrade = (grade: StudyGrade) => {
    session.recordAnswer(grade, 1200);
    session.nextCard(selectedMode);
  };

  const handleSkipCard = () => {
    session.nextCard(selectedMode);
  };

  const currentEntry = session.queue[session.currentIndex];

  // Distractors for Flashcards: main translations of the *other* cards in this session.
  const flashcardDistractorPool = useMemo(
    () =>
      session.queue
        .filter((e) => e.id !== currentEntry?.id)
        .map((e) => e.translations[0]?.translatedText)
        .filter((text): text is string => Boolean(text)),
    [session.queue, currentEntry?.id],
  );

  const sessionPosition = Math.min(session.currentIndex + 1, session.queue.length);
  const selectedModeName = STUDY_MODES[modeIndex]?.name ?? 'Flashcards';

  // ── Session summary screen ──
  if (session.isActive && !currentEntry) {
    const { stats } = session;
    const accuracy = stats.total > 0
      ? `${Math.round((stats.correct / stats.total) * 100)}%`
      : '—';

    return (
      <div className="page study-page">
        <div className="study-summary animate-slide-up">
          <h2 className="page-title">{tUi("Session Complete!")}</h2>
          <p className="page-subtitle">{tUi("Great job! Here is your session summary:")}</p>

          <div className="stat-grid study-summary-stats">
            <div className="stat">
              <div className="stat__label">{tUi("Words Reviewed")}</div>
              <div className="stat__value">{stats.total}</div>
            </div>
            <div className="stat">
              <div className="stat__label">{tUi("Accuracy")}</div>
              <div className="stat__value">{accuracy}</div>
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={session.endSession}>{tUi("Back to Study Overview")}</Button>
        </div>
      </div>
    );
  }

  // ── Mode selection / launcher ──
  if (!session.isActive) {
    const overview = overviewStats(weekActivity, statsSummary);
    const hasOverviewStats =
      overview.reviewedToday !== null || overview.weekAccuracy !== null || overview.streak !== null;
    return (
      <div className="page study-page">
        <header className="page-header">
          <div className="page-header__text">
            <h1 className="page-title">{tUi("Study")}</h1>
            <div className="page-subtitle">
              {dueCount && dueCount > 0
                ? tUi("{value1} due today · about {value2} min", {
                  value1: pluralize(dueCount, 'card'),
                  // Time for the next session (queue is capped), not the whole backlog.
                  value2: estimateMinutes(startableQueue.length > 0 ? startableQueue.length : dueCount),
                })
                : tUi("All caught up on scheduled reviews! Ready to learn new words?")}
            </div>
          </div>
        </header>

        <div className="page-body study-setup animate-fade-in">
          <div className="study-modes-grid" role="radiogroup" aria-label={tUi("Select study mode")}>
            {STUDY_MODES.map((item, index) => {
              const isSelected = selectedMode === item.mode;
              return (
                <div
                  key={item.mode}
                  id={`study-mode-${item.mode}`}
                  className={cx('card', 'card--selectable', 'study-mode-card', isSelected && 'is-selected')}
                  onClick={() => setSelectedMode(item.mode)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={index === modeIndex ? 0 : -1}
                  onKeyDown={(e) => handleModeKeyDown(e, index)}
                >
                  <Icon name={item.icon} size={22} className="study-mode-icon" />
                  <div className="study-mode-name">{tUi(item.name)}</div>
                  <div className="study-mode-desc">{tUi(item.desc)}</div>
                  <kbd className="kbd study-mode-kbd" aria-hidden="true">{index + 1}</kbd>
                </div>
              );
            })}
          </div>

          <div className="study-session-options">
            <div className="study-option-group">
              <span className="study-option-label" id={cardsLabelId}>{tUi("Cards")}</span>
              <div className="seg" role="group" aria-labelledby={cardsLabelId}>
                <button
                  type="button"
                  className="seg__item"
                  aria-pressed={!includeNew}
                  onClick={() => setIncludeNew(false)}
                >
                  {typeof dueCount === 'number'
                    ? tUi("Due · {value1}", { value1: dueCount.toLocaleString(locale) })
                    : tUi("Due")}
                </button>
                <button
                  type="button"
                  className="seg__item"
                  aria-pressed={includeNew}
                  onClick={() => setIncludeNew(true)}
                >
                  {tUi("Mixed")}
                </button>
              </div>
            </div>
            <div className="study-option-group">
              <span className="study-option-label" id={categoryLabelId}>{tUi("Category")}</span>
              <div className="study-category-select">
                <CategorySelect
                  categories={categories ?? []}
                  value={categoryId}
                  onChange={setCategoryId}
                  allCategories
                  ariaLabel={tUi("Category")}
                />
              </div>
            </div>
          </div>

          {isQueueError && !isQueueLoading && (
            <div className="study-setup-error" role="alert">
              <p className="inline-error">{tUi("Couldn’t load your cards.")}</p>
              <Button variant="secondary" size="md" onClick={() => void refetch()}>{tUi("Try again")}</Button>
            </div>
          )}

          {!isQueueLoading && !isQueueError && startableQueue.length === 0 && (
            <p className="study-setup-empty inline-note" role="status">
              {selectedMode === 'collocation'
                ? tUi("No collocation cards yet. Open a word’s collocations and add the ones you want to learn.")
                : tUi("Nothing to review right now. Add words in My Vocabulary, or enable a collection.")}
            </p>
          )}

          <div className="study-start-row">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartSession}
              disabled={isQueueLoading || startableQueue.length === 0}
              className="study-start-btn"
            >
              {!isQueueLoading && <Icon name="play_arrow" size={17} />}
              {isQueueLoading
                ? tUi("Loading cards…")
                : tUi("Start session · {value1}", { value1: pluralize(startableQueue.length, 'card') })}
            </Button>
            <span className="hint">
              <kbd className="kbd">↵</kbd>
              {tUi("to start")} ·
              <kbd className="kbd">1</kbd>
              –
              <kbd className="kbd">{STUDY_MODES.length}</kbd>
              {tUi("to pick a mode")}
            </span>
          </div>

          {hasOverviewStats && (
            <div className="stat-grid study-overview-stats">
              {overview.reviewedToday !== null && (
                <div className="stat">
                  <div className="stat__label">{tUi("Reviewed today")}</div>
                  <div className="stat__value">{overview.reviewedToday.toLocaleString(locale)}</div>
                </div>
              )}
              {overview.weekAccuracy !== null && (
                <div className="stat">
                  <div className="stat__label">{tUi("Accuracy this week")}</div>
                  <div className="stat__value">{overview.weekAccuracy}%</div>
                </div>
              )}
              {overview.streak !== null && (
                <div className="stat">
                  <div className="stat__label">{tUi("Streak")}</div>
                  <div className="stat__value">{pluralize(overview.streak, 'day')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active Session ──
  const currentAccuracy = session.stats.total > 0
    ? Math.round((session.stats.correct / session.stats.total) * 100)
    : 0;

  return (
    <div className="study-session">
      {/* Фокус-полоса: режим · прогресс · таймер · End */}
      <header className="focus-topbar study-topbar" data-tauri-drag-region>
        <h2 className="study-topbar-title">{tUi("Study")} · {tUi(selectedModeName)}</h2>

        <div className="study-topbar-progress">
          <progress
            className="study-progress"
            value={sessionPosition}
            max={Math.max(session.queue.length, 1)}
            aria-hidden="true"
          />
          <span className="study-topbar-count">
            {sessionPosition} / {session.queue.length}
          </span>
        </div>

        <span className="study-topbar-timer">{formatTimer(secondsElapsed)}</span>
        <Button variant="ghost" size="md" onClick={session.endSession} aria-label={tUi("End session")}>
          <Icon name="close" size={17} />
          {tUi("End")}
        </Button>
      </header>

      {/* Main card container */}
      <div className="study-card-container">
        {currentEntry && selectedMode === 'flashcard' && (
          <FlashcardMode
            key={currentEntry.id}
            entry={currentEntry}
            distractorPool={flashcardDistractorPool}
            onGrade={handleCardGrade}
          />
        )}

        {currentEntry && selectedMode === 'typing' && (
          <TypingMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}

        {currentEntry && selectedMode === 'listening' && (
          <ListeningMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}

        {currentEntry && selectedMode === 'cloze' && (
          <ClozeMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
            onSkip={handleSkipCard}
          />
        )}

        {currentEntry && selectedMode === 'image' && (
          <ImageMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}

        {currentEntry && selectedMode === 'irregular_verbs' && (
          <IrregularVerbsMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}

        {currentEntry && selectedMode === 'definition' && (
          <DefinitionMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
            onSkip={handleSkipCard}
          />
        )}

        {currentEntry && selectedMode === 'collocation' && (
          <CollocationMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
            onSkip={handleSkipCard}
          />
        )}

        {currentEntry && selectedMode === 'speaking' && (
          <SpeakingMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}
      </div>

      {/* Нижняя строка: статистика сессии и подсказка клавиш */}
      <footer className="study-footer-bar">
        <span className="study-footer-item">
          {tUi("Due today")} <b className="study-footer-value">{dueCount ?? 0}</b>
        </span>
        <span className="study-footer-item">
          {tUi("Accuracy")} <b className="study-footer-value">{currentAccuracy}%</b>
        </span>
        {selectedMode === 'flashcard' && (
          <span className="hint">
            <kbd className="kbd">{tUi("Space")}</kbd>
            {tUi("show answer")} ·
            <kbd className="kbd">1</kbd>
            –
            <kbd className="kbd">4</kbd>
            {tUi("rate")}
          </span>
        )}
      </footer>
    </div>
  );
}
