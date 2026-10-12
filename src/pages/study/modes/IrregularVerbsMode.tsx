// ============================================================
// LEXORA — Irregular Verbs Study Mode
// Base form shown; user types past simple + past participle.
// Falls back to plain typing when verb forms are not seeded.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { TypingMode } from './TypingMode';
import { escapeRegExp } from '../../../lib/utils';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type IrregularVerbsModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
};

type VerbForms = {
  past: string;
  participle: string;
};

// Tolerant patterns for forms stored in translation text / sense, e.g.:
//   "прош. went, прич. gone — шёл"
//   "past: went, past participle: gone"
const FORM_PATTERNS: RegExp[] = [
  /прош\.?\s*([a-z'/ -]+?)\s*[,;]\s*прич\.?\s*([a-z'/ -]+?)(?:\s*[—–-]\s*.+)?$/i,
  /past(?:\s*simple)?[:.]\s*([a-z'/ -]+?)\s*[,;]\s*(?:past\s*)?participle[:.]\s*([a-z'/ -]+)/i,
];

// Extract past simple + past participle from translations.
// Returns null when no recognizable form data is present.
function parseVerbForms(entry: VocabularyEntryDto): VerbForms | null {
  const base = entry.lexeme.text.trim().toLowerCase();

  for (const translation of entry.translations) {
    const candidates = [translation.sense, translation.translatedText]
      .filter((v): v is string => v !== null && v.trim().length > 0);

    for (const text of candidates) {
      for (const pattern of FORM_PATTERNS) {
        const m = pattern.exec(text);
        const past = m?.[1]?.trim();
        const participle = m?.[2]?.trim();
        if (past && participle) return { past, participle };
      }

      // Triple form: "go — went — gone" / "go / went / gone" (base must match)
      const triple = new RegExp(
        `^\\s*${escapeRegExp(base)}\\s*[—–/\\-]\\s*([a-z']+)\\s*[—–/\\-]\\s*([a-z']+)`,
        'i'
      ).exec(text);
      const past = triple?.[1]?.trim();
      const participle = triple?.[2]?.trim();
      if (past && participle) return { past, participle };
    }
  }

  return null;
}

export function IrregularVerbsMode({ entry, onComplete }: IrregularVerbsModeProps) {
  const [pastInput, setPastInput] = useState('');
  const [participleInput, setParticipleInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const pastInputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, reviewState } = entry;
  const forms = parseVerbForms(entry);

  useEffect(() => {
    setPastInput('');
    setParticipleInput('');
    setResult(null);
    startTime.current = Date.now();
    pastInputRef.current?.focus();
  }, [entry.id]);

  const handleNext = () => {
    if (!result || !forms) return;
    const latencyMs = Date.now() - startTime.current;
    onComplete(result.grade, latencyMs);
  };

  useStudyContinueHotkey(result !== null && forms !== null, handleNext);

  // Fallback: no verb forms seeded — plain typing practice
  if (!forms) {
    return <TypingMode entry={entry} onComplete={onComplete} />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastInput.trim() || !participleInput.trim() || result) return;

    const latencyMs = Date.now() - startTime.current;

    evaluateMutation.mutate(
      {
        reviewStateId: reviewState?.id ?? 0,
        mode: 'irregular_verbs',
        userAnswer: `${pastInput.trim()};${participleInput.trim()}`,
        targetText: `${forms.past};${forms.participle}`,
        latencyMs,
      },
      {
        onSuccess: (evalRes) => {
          setResult(evalRes);
        },
      }
    );
  };

  return (
    <div className="typing-card">
      <PosBadge pos={lexeme.partOfSpeech} />

      {/* Prompt: base form */}
      <div className="typing-prompt">
        <div className="typing-prompt-label">
          Give the past simple and past participle of:
        </div>
        <div className="typing-prompt-word">{lexeme.text}</div>
      </div>

      {/* Input form: two fields */}
      <form onSubmit={handleSubmit} className="typing-form">
        <div className="irregular-inputs">
          <div className="irregular-field">
            <label className="irregular-field-label" htmlFor={`past-${entry.id}`}>
              Past Simple
            </label>
            <input
              ref={pastInputRef}
              id={`past-${entry.id}`}
              type="text"
              className="typing-input"
              value={pastInput}
              onChange={(e) => setPastInput(e.target.value)}
              placeholder="went"
              disabled={result !== null}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="irregular-field">
            <label className="irregular-field-label" htmlFor={`participle-${entry.id}`}>
              Past Participle
            </label>
            <input
              id={`participle-${entry.id}`}
              type="text"
              className="typing-input"
              value={participleInput}
              onChange={(e) => setParticipleInput(e.target.value)}
              placeholder="gone"
              disabled={result !== null}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </div>

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
            {result.isCorrect
              ? '✓ Excellent!'
              : `Correct forms: ${forms.past} — ${forms.participle}`}
          </div>
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
