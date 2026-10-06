// ============================================================
// LEXORA — Listening Study Mode
// Hidden word, TTS playback, type what you hear.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { AudioButton } from '../../../components/domain/AudioButton';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { ipc } from '../../../lib/ipc';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type ListeningModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
};

export function ListeningMode({ entry, onComplete }: ListeningModeProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? null;

  // Reset state and auto-play pronunciation on every new card
  useEffect(() => {
    setInput('');
    setResult(null);
    startTime.current = Date.now();
    void ipc.media.playTts(entry.lexeme.text);
    inputRef.current?.focus();
  }, [entry.id, entry.lexeme.text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || result) return;

    const latencyMs = Date.now() - startTime.current;

    evaluateMutation.mutate(
      {
        reviewStateId: reviewState?.id ?? 0,
        mode: 'listening',
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

      {/* Prompt: audio only, word hidden */}
      <div className="typing-prompt">
        <div className="typing-prompt-label">
          Listen and type what you hear:
        </div>
        <div
          className="study-audio-replay"
          onClick={() => inputRef.current?.focus()}
        >
          <AudioButton text={lexeme.text} ariaLabel="Replay pronunciation" />
          <div className="study-audio-hint">Click to replay</div>
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
          placeholder="Type what you heard…"
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

          {/* Reveal the word and its translation after checking */}
          <div className="study-reveal-row">
            <span className="study-reveal-word">{lexeme.text}</span>
            {lexeme.phonetic && (
              <span className="flashcard-phonetic">{lexeme.phonetic}</span>
            )}
            {mainTranslation && (
              <span className="study-reveal-translation">{mainTranslation}</span>
            )}
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
