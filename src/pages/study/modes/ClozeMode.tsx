import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Cloze (Fill the Gap) Study Mode
// Example sentence with the target word blanked out.
// Falls back to a skip option when no usable example exists.
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { escapeRegExp } from '../../../lib/utils';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type ClozeModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
  onSkip: () => void;
};

type GappedSentence = {
  before: string;
  after: string;
};

// Replace the first case-insensitive occurrence of the word with a gap.
// Returns null when the word is not present in the sentence.
function buildGappedSentence(sentence: string, word: string): GappedSentence | null {
  const match = new RegExp(escapeRegExp(word), 'i').exec(sentence);
  if (!match) return null;
  return {
    before: sentence.slice(0, match.index),
    after: sentence.slice(match.index + match[0].length),
  };
}

export function ClozeMode({ entry, onComplete, onSkip }: ClozeModeProps) {
  const { t: tUi } = useI18n();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, reviewState } = entry;
  const example = entry.examples[0] ?? null;

  const gapped = useMemo(
    () => (example ? buildGappedSentence(example.sentence, lexeme.text) : null),
    [example, lexeme.text]
  );

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
        mode: 'cloze',
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

  // ── Fallback: no example sentence with the target word ──
  if (!gapped) {
    return (
      <div className="typing-card">
        <PosBadge pos={lexeme.partOfSpeech} />
        <div className="typing-prompt">
          <div className="typing-prompt-label">{tUi("Fill the Gap")}</div>
          <div className="study-fallback-text">{tUi("No example sentence is available for “")}{lexeme.text}{tUi("” yet.")}</div>
        </div>
        <Button variant="secondary" size="md" onClick={onSkip}>{tUi("Skip Card (→)")}</Button>
      </div>
    );
  }

  return (
    <div className="typing-card">
      <PosBadge pos={lexeme.partOfSpeech} />

      {/* Prompt: sentence with a gap */}
      <div className="typing-prompt">
        <div className="typing-prompt-label">{tUi("Complete the sentence:")}</div>
        <div className="cloze-sentence">
          {gapped.before}
          <span className="cloze-gap">_____</span>
          {gapped.after}
        </div>
        {example?.translation && (
          <div className="cloze-translation-hint">{example.translation}</div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="typing-form">
        <input dir="auto"
          ref={inputRef}
          type="text"
          className="typing-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tUi("Type the missing word…")}
          disabled={result !== null}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={tUi("Missing word")}
        />

        {!result && (
          <div className="typing-submit">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={evaluateMutation.isPending}
            >{tUi("Check Answer (↵)")}</Button>
          </div>
        )}
      </form>

      {/* Evaluation Feedback */}
      {result && (
        <div
          role="status"
          className={`typing-feedback ${
            result.isCorrect
              ? 'typing-feedback--correct'
              : result.errorType === 'typo'
              ? 'typing-feedback--typo'
              : 'typing-feedback--wrong'
          }`}
        >
          <div className="typing-feedback-title">
            {result.isCorrect ? tUi("✓ Excellent!") : tUi("Expected: {value1}", { value1: result.correctAnswer })}
          </div>
          {result.explanation && (
            <SafeHtml html={result.explanation} className="typing-feedback-explanation" />
          )}
          {result.shortRule && (
            <SafeHtml html={result.shortRule} className="typing-feedback-explanation" />
          )}

          <div className="typing-feedback-actions">
            <Button variant="secondary" size="md" onClick={handleNext}>{tUi("Continue (Space)")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
