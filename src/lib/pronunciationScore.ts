// ============================================================
// LEXORA — Pronunciation score helpers (pure)
// Map 0–100 assessment to SM-2 grades. Deterministic.
// ============================================================

import type { PhonemeScoreDto, StudyGrade } from './types';

/** Shadowing stays on the phrase until this score (inclusive). */
export const PRONUNCIATION_PASS_SCORE = 90;

export function isPronunciationPass(score: number): boolean {
  return score >= PRONUNCIATION_PASS_SCORE;
}

export function isEmptySpeechAttempt(attempt: {
  overallScore: number;
  recognizedText: string | null;
  phonemes: readonly PhonemeScoreDto[];
}): boolean {
  const heard = attempt.recognizedText?.trim() ?? '';
  return attempt.overallScore === 0 && (heard.length === 0 || attempt.phonemes.length === 0);
}

export function scoreTone(score: number): 'success' | 'warn' | 'danger' {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warn';
  return 'danger';
}

export function phonemeStatusClass(status: string): 'ok' | 'close' | 'miss' {
  if (status === 'ok' || status === 'close' || status === 'miss') {
    return status;
  }
  return 'miss';
}

/**
 * Convert an overall pronunciation score (0–100) into an SM-2 grade.
 * 90–100 easy, 75–89 good, 50–74 hard, 1–49 wrong, 0 blackout.
 */
export function scoreToStudyGrade(score: number): StudyGrade {
  if (score >= 90) return 4;
  if (score >= 75) return 3;
  if (score >= 50) return 2;
  if (score >= 1) return 1;
  return 0;
}

export function gradeLabel(grade: StudyGrade): string {
  switch (grade) {
    case 4:
      return 'Easy';
    case 3:
      return 'Good';
    case 2:
      return 'Hard';
    case 1:
      return 'Again';
    default:
      return 'Blackout';
  }
}

export function averageScore(scores: readonly number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, n) => acc + n, 0);
  return Math.round(sum / scores.length);
}
