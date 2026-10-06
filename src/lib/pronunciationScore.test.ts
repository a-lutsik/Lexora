import { describe, expect, it } from 'vitest';
import {
  averageScore,
  gradeLabel,
  isEmptySpeechAttempt,
  isPronunciationPass,
  phonemeStatusClass,
  PRONUNCIATION_PASS_SCORE,
  scoreToStudyGrade,
  scoreTone,
} from './pronunciationScore';

describe('pronunciationScore', () => {
  it('maps score bands to SM-2 grades', () => {
    expect(scoreToStudyGrade(100)).toBe(4);
    expect(scoreToStudyGrade(90)).toBe(4);
    expect(scoreToStudyGrade(89)).toBe(3);
    expect(scoreToStudyGrade(75)).toBe(3);
    expect(scoreToStudyGrade(74)).toBe(2);
    expect(scoreToStudyGrade(50)).toBe(2);
    expect(scoreToStudyGrade(49)).toBe(1);
    expect(scoreToStudyGrade(1)).toBe(1);
    expect(scoreToStudyGrade(0)).toBe(0);
  });

  it('labels grades', () => {
    expect(gradeLabel(4)).toBe('Easy');
    expect(gradeLabel(0)).toBe('Blackout');
  });

  it('classifies phoneme status and score tone', () => {
    expect(phonemeStatusClass('ok')).toBe('ok');
    expect(phonemeStatusClass('close')).toBe('close');
    expect(phonemeStatusClass('unknown')).toBe('miss');
    expect(scoreTone(90)).toBe('success');
    expect(scoreTone(70)).toBe('warn');
    expect(scoreTone(40)).toBe('danger');
  });

  it('averages scores and returns null for empty lists', () => {
    expect(averageScore([])).toBeNull();
    expect(averageScore([80, 100])).toBe(90);
  });

  it('gates shadowing on the 90% pass score', () => {
    expect(PRONUNCIATION_PASS_SCORE).toBe(90);
    expect(isPronunciationPass(90)).toBe(true);
    expect(isPronunciationPass(89)).toBe(false);
    expect(isPronunciationPass(0)).toBe(false);
  });

  it('treats a zero score with no transcript or phonemes as empty speech', () => {
    expect(
      isEmptySpeechAttempt({ overallScore: 0, recognizedText: null, phonemes: [] }),
    ).toBe(true);
    expect(
      isEmptySpeechAttempt({
        overallScore: 0,
        recognizedText: '  ',
        phonemes: [
          {
            id: 1,
            attemptId: 1,
            targetPhoneme: 'æ',
            recognizedPhoneme: null,
            accuracy: 0,
            status: 'miss',
            position: 0,
          },
        ],
      }),
    ).toBe(true);
    expect(
      isEmptySpeechAttempt({
        overallScore: 40,
        recognizedText: 'ship',
        phonemes: [],
      }),
    ).toBe(false);
  });
});
