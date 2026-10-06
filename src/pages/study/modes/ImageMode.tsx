// ============================================================
// LEXORA — Image Association Study Mode
// Local image as the prompt; recall and type the word.
// Falls back to the translation when no image is cached.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { ipc } from '../../../lib/ipc';
import { STALE_TIME } from '../../../lib/constants';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import type { EvaluationResult, StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type ImageModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
};

export function ImageMode({ entry, onComplete }: ImageModeProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const startTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluateMutation = useEvaluateAnswer();
  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? 'No translation';

  const { data: imagePath, isLoading: isImageLoading } = useQuery({
    queryKey: ['media', 'image', entry.lexemeId],
    queryFn: () => ipc.media.getImage(entry.lexemeId),
    staleTime: STALE_TIME.LONG,
  });
  const imageUrl = imagePath ? convertFileSrc(imagePath) : null;

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
        mode: 'image',
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

      {/* Prompt: image or translation fallback */}
      <div className="typing-prompt">
        <div className="typing-prompt-label">
          What is this in the target language?
        </div>

        {isImageLoading ? (
          <div className="study-image-frame study-image-frame--loading" aria-busy="true">
            <span className="text-muted">Loading image…</span>
          </div>
        ) : imageUrl ? (
          <div className="study-image-frame">
            <img src={imageUrl} alt={mainTranslation} className="study-image" />
          </div>
        ) : (
          <>
            <div className="typing-prompt-word">{mainTranslation}</div>
            <div className="study-media-note">
              Image not available — using translation hint instead.
            </div>
          </>
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
          placeholder="Type the word in English…"
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
