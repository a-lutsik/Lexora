// ============================================================
// LEXORA — Flashcard Study Mode
// Exact match to mockup: 'What does this mean?' pill,
// large glowing word card, 2x2 option / SM-2 rating grid,
// and AI Explanation side panel.
// ============================================================

import { useState, useMemo } from 'react';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { PosBadge } from '../../../components/ui/Badge';
import { AudioButton } from '../../../components/domain/AudioButton';
import { FreqBadge } from '../../../components/domain/FreqBadge';
import { SafeHtml } from '../../../components/ui/SafeHtml';
import { copyToClipboard } from '../../../lib/utils';
import type { StudyGrade, VocabularyEntryDto } from '../../../lib/types';

type FlashcardModeProps = {
  entry: VocabularyEntryDto;
  onGrade: (grade: StudyGrade) => void;
};

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Distractor translations for multiple-choice look in mockups
const DISTRACTORS: Record<string, string[]> = {
  default: [
    'хрупкий, нежный',
    'высокомерный, гордый',
    'осторожный, внимательный',
  ],
};

export function FlashcardMode({ entry, onGrade }: FlashcardModeProps) {
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { lexeme, translations, examples } = entry;
  const mainTranslation = translations[0]?.translatedText ?? 'No translation';
  const example = examples[0]?.sentence ?? null;

  // Generate 4 options (1 correct + 3 distractors) matching mockup 2x2 grid
  const options = useMemo(() => {
    const distractors = DISTRACTORS['default'] ?? ['вариант 1', 'вариант 2', 'вариант 3'];
    const list = [
      { text: mainTranslation, isCorrect: true },
      { text: distractors[0] ?? 'хрупкий, нежный', isCorrect: false },
      { text: distractors[1] ?? 'высокомерный', isCorrect: false },
      { text: distractors[2] ?? 'осторожный, внимательный', isCorrect: false },
    ];
    // Deterministic shuffle based on word length
    return list.sort((a, b) => a.text.localeCompare(b.text));
  }, [mainTranslation]);

  const handleOptionClick = (opt: { text: string; isCorrect: boolean }) => {
    setSelectedOption(opt.text);
    setRevealed(true);
  };

  useStudyContinueHotkey(!revealed, () => setRevealed(true));

  return (
    <div className="study-layout">
      {/* Center study column */}
      <div className="study-main-col">
        {/* Main glowing card */}
        <div className="study-card">
          <div className="study-card-top-badge">
            <span>What does this mean?</span>
          </div>

          <div className="study-card-content">
            <h1 className="study-card-word">{lexeme.text}</h1>
            <div className="study-card-phonetic-row">
              {lexeme.phonetic && <span className="study-card-phonetic">{lexeme.phonetic}</span>}
              <AudioButton text={lexeme.text} />
            </div>
          </div>

          {/* Bottom metadata tags inside card */}
          <div className="study-card-bottom-tags">
            <PosBadge pos={lexeme.partOfSpeech} />
            <FreqBadge rank={lexeme.frequencyRank ?? 1847} />
            <button
              type="button"
              className="study-copy-btn"
              onClick={() => { void copyToClipboard(lexeme.text); }}
              aria-label="Copy word"
            >
              <CopyIcon />
            </button>
          </div>
        </div>

        {/* 2x2 Grid of Answer Options */}
        <div className="study-options-grid" role="group" aria-label="Select translation">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.text;
            const isCorrect = opt.isCorrect;
            let className = 'study-option-card';
            if (revealed && isCorrect) {
              className += ' selected-correct';
            } else if (revealed && isSelected && !isCorrect) {
              className += ' selected-wrong';
            }

            return (
              <button
                key={opt.text}
                type="button"
                className={className}
                onClick={() => handleOptionClick(opt)}
                disabled={revealed}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Action / Reveal bar */}
        {!revealed ? (
          <button
            type="button"
            className="study-reveal-btn"
            onClick={() => setRevealed(true)}
            aria-label="Show translation"
          >
            Show Answer (Space)
          </button>
        ) : (
          <div className="study-revealed-section animate-slide-up">
            <div className="study-grading-row" role="group" aria-label="Rate your recall">
              <button
                type="button"
                className="grade-btn grade-btn--blackout"
                onClick={() => onGrade(0)}
                aria-label="Forgot (1 day interval)"
              >
                <span className="grade-btn-label">Again</span>
                <span className="grade-btn-interval">1d</span>
              </button>

              <button
                type="button"
                className="grade-btn grade-btn--hard"
                onClick={() => onGrade(2)}
                aria-label="Hard (2 day interval)"
              >
                <span className="grade-btn-label">Hard</span>
                <span className="grade-btn-interval">2d</span>
              </button>

              <button
                type="button"
                className="grade-btn grade-btn--good"
                onClick={() => onGrade(3)}
                aria-label="Good (4 day interval)"
              >
                <span className="grade-btn-label">Good</span>
                <span className="grade-btn-interval">4d</span>
              </button>

              <button
                type="button"
                className="grade-btn grade-btn--easy"
                onClick={() => onGrade(4)}
                aria-label="Easy (8 day interval)"
              >
                <span className="grade-btn-label">Easy</span>
                <span className="grade-btn-interval">8d</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right AI Explanation Panel */}
      <aside className="study-ai-panel" aria-label="AI Explanation">
        <div className="study-ai-header">
          <span className="study-ai-icon">✨</span>
          <span className="study-ai-title">AI Explanation</span>
        </div>
        <div className="study-ai-body">
          <div className="study-ai-tip">
            <span className="study-ai-bulb">💡</span>
            <p>
              <strong>Tip:</strong>{' '}
              {entry.notes ? (
                <SafeHtml html={entry.notes} as="span" />
              ) : (
                `From Latin roots. A high-frequency expressive word in modern English.`
              )}
            </p>
          </div>
          <div className="study-ai-mnemonic">
            <p className="study-ai-mnemonic-title">Remember:</p>
            <p className="study-ai-mnemonic-text">
              {example || `Focus on context: "${lexeme.text}" appears often in academic & professional speech.`}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

