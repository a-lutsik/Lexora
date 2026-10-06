// ============================================================
// LEXORA — Definition/Synonyms Study Mode
// The user sees a word definition and/or its synonyms and has
// to recall and type the word itself.
// Falls back to a skip option when neither is available.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type DefinitionModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
  onSkip: () => void;
};

export function DefinitionMode({ entry, onComplete, onSkip }: DefinitionModeProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, translations, reviewState } = entry;
  const synonyms = entry.synonyms ?? [];

  const mainTranslation = translations[0] ?? null;
  // Prefer the usage context (sense); fall back to the plain translation.
  const definition = mainTranslation?.sense ?? mainTranslation?.translatedText ?? null;
  const hasContent = definition !== null || synonyms.length > 0;

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
        mode: 'definition',
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

  // ── Fallback: no definition and no synonyms ──
  if (!hasContent) {
    return (
      <div className="typing-card">
        <PosBadge pos={lexeme.partOfSpeech} />
        <div className="typing-prompt">
          <div className="typing-prompt-label">Definition &amp; Synonyms</div>
          <div className="study-fallback-text">
            No definition or synonyms are available for “{lexeme.text}” yet.
          </div>
        </div>
        <Button variant="secondary" size="md" onClick={onSkip}>
          Skip Card (→)
        </Button>
      </div>
    );
  }

  return (
    <div className="typing-card">
      <PosBadge pos={lexeme.partOfSpeech} />

      {/* Prompt: definition and/or synonyms of the target word */}
      <div className="definition-prompt">
        <div className="definition-prompt-label">
          Guess the word from its definition:
        </div>
        {definition && (
          <p className="definition-text">{definition}</p>
        )}
        {synonyms.length > 0 && (
          <div className="definition-synonyms">
            <span className="definition-synonyms-label" id="definition-synonyms-label">
              Synonyms
            </span>
            <ul
              className="definition-synonym-list"
              aria-labelledby="definition-synonyms-label"
            >
              {synonyms.map((synonym) => (
                <li key={synonym} className="definition-synonym-chip">
                  {synonym}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="typing-form">
        <input
          ref={inputRef}
          type="text"
          className="typing-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type the word…"
          disabled={result !== null}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Word matching the definition"
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
            {result.isCorrect ? '✓ Excellent!' : `Expected: ${result.correctAnswer}`}
          </div>
          <div className="definition-feedback-word">{lexeme.text}</div>
          {result.explanation && (
            <SafeHtml html={result.explanation} className="typing-feedback-explanation" />
          )}
          {result.shortRule && (
            <SafeHtml html={result.shortRule} className="typing-feedback-explanation" />
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
