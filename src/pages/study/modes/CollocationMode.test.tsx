import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollocationMode } from './CollocationMode';
import { invokeMock } from '../../../test/mocks';
import { renderWithQueryClient } from '../../../test/render';
import type { VocabularyEntryDto } from '../../../lib/types';

function entry(withDrill = true): VocabularyEntryDto {
  return {
    id: 11,
    userId: 1,
    lexemeId: 5,
    addedAt: 0,
    isFavorite: false,
    notes: null,
    source: 'collocation',
    lexeme: {
      id: 5,
      languageId: 1,
      text: 'take advantage of',
      normalizedText: 'take advantage of',
      partOfSpeech: 'phrase',
      frequencyRank: null,
      phonetic: null,
      createdAt: 0,
    },
    translations: [],
    examples: [],
    reviewState: {
      id: 21,
      userVocabularyId: 11,
      status: 'new',
      ease: 2.5,
      interval: 0,
      dueAt: 0,
      lapses: 0,
      repetitions: 0,
    },
    collocationDrill: withDrill
      ? {
          focus: 'take',
          distractors: ['make', 'give'],
          translation: 'воспользоваться',
          example: 'You should take advantage of the sale.',
          pattern: 'verb + noun',
          headword: 'advantage',
        }
      : null,
  };
}

describe('CollocationMode', () => {
  it('blanks the partner word and offers it among confusable options', () => {
    renderWithQueryClient(<CollocationMode entry={entry()} onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('воспользоваться')).toBeInTheDocument();
    expect(screen.getByText('_____')).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Select the missing word' });
    expect(group).toHaveTextContent('take');
    expect(group).toHaveTextContent('make');
    expect(group).toHaveTextContent('give');
  });

  it('saves Good for the right word and continues with that grade', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    invokeMock.mockResolvedValue({ dueAt: 0 });
    renderWithQueryClient(<CollocationMode entry={entry()} onComplete={onComplete} onSkip={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'take' }));
    expect(invokeMock).toHaveBeenCalledWith('submit_review', {
      input: expect.objectContaining({ reviewStateId: 21, mode: 'collocation', grade: 3 }),
    });
    expect(screen.getByText('✓ Excellent!')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Continue (Space)' }));
    expect(onComplete).toHaveBeenCalledWith(3);
  });

  it('saves Wrong for a confusable word and shows the full collocation', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    invokeMock.mockResolvedValue({ dueAt: 0 });
    renderWithQueryClient(<CollocationMode entry={entry()} onComplete={onComplete} onSkip={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'make' }));
    expect(invokeMock).toHaveBeenCalledWith('submit_review', {
      input: expect.objectContaining({ grade: 1 }),
    });
    expect(screen.getByText('Expected: take advantage of')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Continue (Space)' }));
    expect(onComplete).toHaveBeenCalledWith(1);
  });

  it('offers to skip a card without a collocation exercise', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    renderWithQueryClient(<CollocationMode entry={entry(false)} onComplete={vi.fn()} onSkip={onSkip} />);

    await user.click(screen.getByRole('button', { name: 'Skip Card (→)' }));
    expect(onSkip).toHaveBeenCalled();
  });
});
