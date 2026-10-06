// ============================================================
// LEXORA — Study Page
// Exact match to mockup: Study Session header, streak badge,
// glowing progress bar, main study canvas, and bottom stats bar.
// ============================================================

import { useState, useEffect } from 'react';
import { useStudyQueue, useDueCount } from '../../hooks/useStudyQueue';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/ui/Button';
import { FlashcardMode } from './modes/FlashcardMode';
import { TypingMode } from './modes/TypingMode';
import { ListeningMode } from './modes/ListeningMode';
import { ClozeMode } from './modes/ClozeMode';
import { ImageMode } from './modes/ImageMode';
import { IrregularVerbsMode } from './modes/IrregularVerbsMode';
import { DefinitionMode } from './modes/DefinitionMode';
import { SpeakingMode } from './modes/SpeakingMode';
import type { StudyGrade, StudyMode } from '../../lib/types';
import './study.css';

const STUDY_MODES: { mode: StudyMode; icon: string; name: string; desc: string }[] = [
  {
    mode: 'flashcard',
    icon: '🃏',
    name: 'Flashcards',
    desc: 'Classic flip card review with SM-2 spaced repetition',
  },
  {
    mode: 'typing',
    icon: '⌨️',
    name: 'Typing Mode',
    desc: 'Practice spelling and recall with instant feedback',
  },
  {
    mode: 'listening',
    icon: '🎧',
    name: 'Listening',
    desc: 'Hear the word and type what you heard',
  },
  {
    mode: 'cloze',
    icon: '📝',
    name: 'Fill the Gap',
    desc: 'Contextual sentence completion with AI explanation',
  },
  {
    mode: 'image',
    icon: '🖼️',
    name: 'Image Association',
    desc: 'Recall the word from a picture',
  },
  {
    mode: 'irregular_verbs',
    icon: '🔀',
    name: 'Irregular Verbs',
    desc: 'Drill past simple and past participle forms',
  },
  {
    mode: 'definition',
    icon: '📖',
    name: 'Definition',
    desc: 'Recall the word from its definition and synonyms',
  },
  {
    mode: 'speaking',
    icon: '🎙️',
    name: 'Speaking',
    desc: 'Say the word and get phoneme-level pronunciation feedback',
  },
];

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function StudyPage() {
  const [selectedMode, setSelectedMode] = useState<StudyMode>('flashcard');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);

  const session = useSessionStore();
  const { data: dueCount } = useDueCount(activeLanguageId);
  const { data: queue, refetch } = useStudyQueue({
    languageId: activeLanguageId,
    sources: [],
    limit: 20,
    includeNew: true,
    includeMatureRefresh: false,
  });

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

  const handleStartSession = () => {
    if (!queue || queue.length === 0) {
      void refetch();
    }
    const currentQueue = queue && queue.length > 0 ? queue : [];
    session.startSession(currentQueue, selectedMode);
  };

  const handleCardGrade = (grade: StudyGrade) => {
    session.recordAnswer(grade, 1200);
    session.nextCard(selectedMode);
  };

  const handleSkipCard = () => {
    session.nextCard(selectedMode);
  };

  const currentEntry = session.queue[session.currentIndex];
  const progressPercent = session.queue.length > 0
    ? Math.round(((session.currentIndex + 1) / session.queue.length) * 100)
    : 0;

  // ── Session summary screen ──
  if (session.isActive && !currentEntry) {
    const { stats } = session;
    const accuracy = stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 100;

    return (
      <div className="study-page">
        <div className="study-setup animate-slide-up">
          <div className="study-summary-icon">🎉</div>
          <h2>Session Complete!</h2>
          <p className="text-secondary">Great job! Here is your session summary:</p>

          <div className="study-summary-stats">
            <div className="study-mode-card study-summary-stat">
              <div className="study-summary-value text-accent">
                {stats.total}
              </div>
              <div className="text-muted text-xs">Words Reviewed</div>
            </div>
            <div className="study-mode-card study-summary-stat">
              <div className="study-summary-value text-success">
                {accuracy}%
              </div>
              <div className="text-muted text-xs">Accuracy</div>
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={session.endSession}>
            Back to Study Overview
          </Button>
        </div>
      </div>
    );
  }

  // ── Mode selection / launcher ──
  if (!session.isActive) {
    return (
      <div className="study-page">
        <div className="study-setup animate-fade-in">
          <div className="study-setup-icon">🎯</div>
          <h1 className="study-setup-title">Study Session</h1>
          <p className="text-secondary study-setup-desc">
            {dueCount && dueCount > 0
              ? `You have ${dueCount} cards due for review today.`
              : 'All caught up on scheduled reviews! Ready to learn new words?'}
          </p>

          <div className="study-modes-grid" role="radiogroup" aria-label="Select study mode">
            {STUDY_MODES.map((item) => (
              <div
                key={item.mode}
                className={`study-mode-card${selectedMode === item.mode ? ' selected' : ''}`}
                onClick={() => setSelectedMode(item.mode)}
                role="radio"
                aria-checked={selectedMode === item.mode}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedMode(item.mode)}
              >
                <div className="study-mode-icon">{item.icon}</div>
                <div className="study-mode-name">{item.name}</div>
                <div className="study-mode-desc">{item.desc}</div>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartSession}
            aria-label="Start study session"
          >
            Start Session ({dueCount ?? 10} words)
          </Button>
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
      {/* Session Top Bar */}
      <header className="study-session-header">
        <div className="study-header-left">
          <h2 className="study-header-title">Study Session</h2>
        </div>

        <div className="study-header-center">
          <div className="study-progress-info">
            <span className="study-progress-pct">{progressPercent}%</span>
            <div className="study-progress-bar-container">
              <div
                className="study-progress-bar-fill"
                style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
              />
            </div>
            <span className="study-progress-pct">{progressPercent}%</span>
          </div>
        </div>

        <div className="study-header-right">
          <span className="study-card-counter">
            Card {session.currentIndex + 1} of {session.queue.length}
          </span>
          {dueCount != null && dueCount > 0 && (
            <div className="study-streak-badge">
              <span>{dueCount} due</span>
            </div>
          )}
          <button
            type="button"
            className="study-exit-btn"
            onClick={session.endSession}
            aria-label="Exit Session"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      {/* Main card container */}
      <div className="study-card-container">
        {currentEntry && selectedMode === 'flashcard' && (
          <FlashcardMode
            key={currentEntry.id}
            entry={currentEntry}
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

        {currentEntry && selectedMode === 'speaking' && (
          <SpeakingMode
            key={currentEntry.id}
            entry={currentEntry}
            onComplete={(grade) => handleCardGrade(grade)}
          />
        )}
      </div>

      {/* Bottom Status Footer matching mockup */}
      <footer className="study-footer-bar">
        <div className="study-stats-pill">
          <span className="study-stat-item">Due today: <strong>{dueCount ?? 0}</strong></span>
          <span className="study-stat-sep">·</span>
          <span className="study-stat-item">Accuracy: <strong>{currentAccuracy}%</strong></span>
          <span className="study-stat-sep">·</span>
          <span className="study-stat-item">Time: <strong>{formatTimer(secondsElapsed)}</strong></span>
        </div>
      </footer>
    </div>
  );
}

