// ============================================================
// LEXORA — Client-side pronunciation session aggregates
// ============================================================

import { averageScore, isPronunciationPass, PRONUNCIATION_PASS_SCORE } from './pronunciationScore';

export type SessionScoreStats = {
  average: number | null;
  passed: number;
  total: number;
  threshold: number;
};

export function computeSessionStats(scores: readonly number[]): SessionScoreStats {
  const total = scores.length;
  const passed = scores.filter((score) => isPronunciationPass(score)).length;
  return {
    average: averageScore(scores),
    passed,
    total,
    threshold: PRONUNCIATION_PASS_SCORE,
  };
}
