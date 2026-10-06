// ============================================================
// LEXORA — ListeningMode tests
// ============================================================

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListeningMode } from './ListeningMode';
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
      text: 'up to you',
      normalizedText: 'up to you',
      partOfSpeech: 'phrase',
      frequencyRank: 400,
      phonetic: null,
      createdAt: 1700000000,
    },
    translations: [
      {
        id: 100,
        lexemeId: 10,
        targetLanguageId: 2,
        translatedText: 'на твоё усмотрение',
        sense: null,
        confidence: 0.9,
      },
    ],
    examples: [],
    synonyms: [],
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
  correctAnswer: 'up to you',
  explanation: 'Correct!',
  shortRule: null,
};

describe('ListeningMode', () => {
  it('lets the learner type spaces in the answer field', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(null);

    renderWithQueryClient(
      <ListeningMode entry={makeEntry()} onComplete={vi.fn()} />
    );

    const input = screen.getByLabelText('Your answer');
    await user.type(input, 'up to you');

    expect(input).toHaveValue('up to you');
  });

  it('continues to the next card when Space is pressed after feedback', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'evaluate_answer') return Promise.resolve(correctResult);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <ListeningMode entry={makeEntry()} onComplete={onComplete} />
    );

    await user.type(screen.getByLabelText('Your answer'), 'up to you');
    await user.click(screen.getByRole('button', { name: /check answer/i }));
    expect(await screen.findByRole('button', { name: /continue/i })).toBeInTheDocument();

    await user.keyboard(' ');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(3, expect.any(Number));
  });

  it('shows the word and translation on separate lines, without a fallback label', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'evaluate_answer') return Promise.resolve(correctResult);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <ListeningMode entry={makeEntry({ translations: [] })} onComplete={vi.fn()} />
    );

    await user.type(screen.getByLabelText('Your answer'), 'up to you');
    await user.click(screen.getByRole('button', { name: /check answer/i }));

    expect(await screen.findByText('up to you', { selector: '.study-reveal-word' }))
      .toBeInTheDocument();
    expect(screen.queryByText('No translation')).not.toBeInTheDocument();
    expect(screen.queryByText(/up to youNo translation/i)).not.toBeInTheDocument();
  });
});
