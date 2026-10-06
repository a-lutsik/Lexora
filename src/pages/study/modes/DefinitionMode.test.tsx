// ============================================================
// LEXORA — DefinitionMode tests
// ============================================================

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DefinitionMode } from './DefinitionMode';
import { invokeMock } from '../../../test/mocks';
import { renderWithQueryClient } from '../../../test/render';
import type { EvaluationResult, VocabularyEntryDto } from '../../../lib/types';

function makeEntry(overrides: Partial<VocabularyEntryDto> = {}): VocabularyEntryDto {
  return {
    id: 1,
    userId: 1,
    lexemeId: 10,
    addedAt: 1700000000,
    isFavorite: false,
    notes: null,
    source: null,
    lexeme: {
      id: 10,
      languageId: 1,
      text: 'enormous',
      normalizedText: 'enormous',
      partOfSpeech: 'adj',
      frequencyRank: 2500,
      phonetic: null,
      createdAt: 1700000000,
    },
    translations: [
      {
        id: 100,
        lexemeId: 10,
        targetLanguageId: 2,
        translatedText: 'огромный',
        sense: 'extremely large in size or amount',
        confidence: 0.95,
      },
    ],
    examples: [],
    synonyms: ['huge', 'vast', 'immense'],
    reviewState: {
      id: 5,
      userVocabularyId: 1,
      status: 'review',
      ease: 2.5,
      interval: 7,
      dueAt: 1700000000,
      lapses: 0,
      repetitions: 3,
    },
    ...overrides,
  };
}

const correctResult: EvaluationResult = {
  isCorrect: true,
  grade: 3,
  errorType: null,
  correctAnswer: 'enormous',
  explanation: null,
  shortRule: null,
};

describe('DefinitionMode', () => {
  it('renders the definition and synonym chips', () => {
    renderWithQueryClient(
      <DefinitionMode entry={makeEntry()} onComplete={vi.fn()} onSkip={vi.fn()} />
    );

    expect(screen.getByText('extremely large in size or amount')).toBeInTheDocument();
    expect(screen.getByText('huge')).toBeInTheDocument();
    expect(screen.getByText('vast')).toBeInTheDocument();
    expect(screen.getByText('immense')).toBeInTheDocument();
  });

  it('falls back to translatedText when sense is missing', () => {
    const entry = makeEntry();
    const firstTranslation = entry.translations[0];
    if (!firstTranslation) throw new Error('test setup: translation missing');
    entry.translations = [{ ...firstTranslation, sense: null }];

    renderWithQueryClient(
      <DefinitionMode entry={entry} onComplete={vi.fn()} onSkip={vi.fn()} />
    );

    expect(screen.getByText('огромный')).toBeInTheDocument();
  });

  it('hides the synonyms block when the list is empty', () => {
    renderWithQueryClient(
      <DefinitionMode
        entry={makeEntry({ synonyms: [] })}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.queryByText('Synonyms')).not.toBeInTheDocument();
    expect(screen.getByText('extremely large in size or amount')).toBeInTheDocument();
  });

  it('submits the answer with mode definition and target text', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(correctResult);

    renderWithQueryClient(
      <DefinitionMode entry={makeEntry()} onComplete={vi.fn()} onSkip={vi.fn()} />
    );

    await user.type(screen.getByLabelText('Word matching the definition'), 'enormous');
    await user.click(screen.getByRole('button', { name: /check answer/i }));

    expect(invokeMock).toHaveBeenCalledWith('evaluate_answer', {
      input: expect.objectContaining({
        reviewStateId: 5,
        mode: 'definition',
        userAnswer: 'enormous',
        targetText: 'enormous',
      }),
    });

    // Feedback reveals the word after answering
    expect(await screen.findByText('✓ Excellent!')).toBeInTheDocument();
    expect(screen.getByText('enormous', { selector: '.definition-feedback-word' }))
      .toBeInTheDocument();
  });

  it('continues when Space is pressed after feedback', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    invokeMock.mockResolvedValue(correctResult);

    renderWithQueryClient(
      <DefinitionMode entry={makeEntry()} onComplete={onComplete} onSkip={vi.fn()} />
    );

    await user.type(screen.getByLabelText('Word matching the definition'), 'enormous');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    expect(await screen.findByRole('button', { name: /continue/i })).toBeInTheDocument();

    await user.keyboard(' ');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(3, expect.any(Number));
  });

  it('shows Skip Card fallback when neither definition nor synonyms exist', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const entry = makeEntry({ translations: [], synonyms: [] });

    renderWithQueryClient(
      <DefinitionMode entry={entry} onComplete={vi.fn()} onSkip={onSkip} />
    );

    expect(screen.getByText(/no definition or synonyms/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Word matching the definition')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /skip card/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
