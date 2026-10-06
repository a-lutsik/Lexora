// ============================================================
// LEXORA — Session Store (Zustand)
// Состояние текущей сессии изучения (in-memory, не persisted).
// ============================================================

import { create } from 'zustand';
import type { StudyGrade, StudyMode, VocabularyEntryDto } from '../lib/types';

type StudySessionCard = {
  entry: VocabularyEntryDto;
  mode: StudyMode;
  startedAt: number;
};

type SessionStats = {
  total: number;
  correct: number;
  wrong: number;
  grades: StudyGrade[];
  totalTimeMs: number;
};

type SessionState = {
  isActive: boolean;
  queue: VocabularyEntryDto[];
  currentIndex: number;
  currentCard: StudySessionCard | null;
  stats: SessionStats;

  // Действия
  startSession: (queue: VocabularyEntryDto[], mode: StudyMode) => void;
  recordAnswer: (grade: StudyGrade, latencyMs: number) => void;
  nextCard: (mode: StudyMode) => void;
  endSession: () => void;
};

const emptyStats = (): SessionStats => ({
  total: 0,
  correct: 0,
  wrong: 0,
  grades: [],
  totalTimeMs: 0,
});

export const useSessionStore = create<SessionState>()((set, get) => ({
  isActive: false,
  queue: [],
  currentIndex: 0,
  currentCard: null,
  stats: emptyStats(),

  startSession: (queue, mode) => {
    const first = queue[0];
    set({
      isActive: true,
      queue,
      currentIndex: 0,
      stats: emptyStats(),
      currentCard: first
        ? { entry: first, mode, startedAt: Date.now() }
        : null,
    });
  },

  recordAnswer: (grade, latencyMs) => {
    const { stats } = get();
    set({
      stats: {
        total: stats.total + 1,
        correct: grade >= 3 ? stats.correct + 1 : stats.correct,
        wrong:   grade < 3  ? stats.wrong   + 1 : stats.wrong,
        grades:  [...stats.grades, grade],
        totalTimeMs: stats.totalTimeMs + latencyMs,
      },
    });
  },

  nextCard: (mode) => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    const nextEntry = queue[nextIndex];

    set({
      currentIndex: nextIndex,
      currentCard: nextEntry
        ? { entry: nextEntry, mode, startedAt: Date.now() }
        : null,
    });
  },

  endSession: () => {
    set({
      isActive: false,
      queue: [],
      currentIndex: 0,
      currentCard: null,
    });
  },
}));
