// ============================================================
// LEXORA — Typing Study Mode
// Input text box, instant feedback with typo tolerance.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';

type TypingModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
};

export function TypingMode({ entry, onComplete }: TypingModeProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? 'No translation';

  useEffect(() => {
    setInput('');
    setResult(null);
    startTime.current = Date.now();
    inputRef.current?.focus();
  }, [entry.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || result) return;

    const latencyMs = Date.now() - startTime.current;

    evaluateMutation.mutate(
      {
        reviewStateId: reviewState?.id ?? 0,
        mode: 'typing',
        userAnswer: input.trim(),
        targetText: lexeme.text,
        latencyMs,
      },
      {
        onSuccess: (evalRes) => {
          setResult(evalRes);
        },
      }
    );
  };

  const handleNext = () => {
    if (!result) return;
    const latencyMs = Date.now() - startTime.current;
    onComplete(result.grade, latencyMs);
  };

  useStudyContinueHotkey(result !== null, handleNext);

  return (
    <div className="typing-card">
      <PosBadge pos={lexeme.partOfSpeech} />

      {/* Prompt: Translation to translate back */}
      <div className="typing-prompt">
        <div className="typing-prompt-label">
          Translate into target language:
        </div>
        <div className="typing-prompt-word">
          {mainTranslation}
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="typing-form">
        <input
          ref={inputRef}
          type="text"
          className="typing-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type in English…"
          disabled={result !== null}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Your answer"
        />

        {!result && (
          <div className="typing-submit">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={evaluateMutation.isPending}
            >
              Check Answer (↵)
            </Button>
          </div>
        )}
      </form>

      {/* Evaluation Feedback */}
      {result && (
        <div
          className={`typing-feedback ${
            result.isCorrect
              ? 'typing-feedback--correct'
              : result.errorType === 'typo'
              ? 'typing-feedback--typo'
              : 'typing-feedback--wrong'
          }`}
        >
          <div className="typing-feedback-title">
            {result.isCorrect ? '✓ Excellent!' : `Expected: ${result.correctAnswer}`}
          </div>
          {result.explanation && (
            <SafeHtml html={result.explanation} className="typing-feedback-explanation" />
          )}

          <div className="typing-feedback-actions">
            <Button variant="secondary" size="md" onClick={handleNext}>
              Continue (Space)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
