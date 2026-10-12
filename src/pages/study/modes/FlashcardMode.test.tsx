// ============================================================
// LEXORA — FlashcardMode tests
// Оценка карточки обязана попадать в SRS; варианты ответа и
// подсказки — только из реальных данных.
// ============================================================

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlashcardMode } from './FlashcardMode';
import { invokeMock } from '../../../test/mocks';
import { renderWithQueryClient } from '../../../test/render';
import type { VocabularyEntryDto } from '../../../lib/types';

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
      text: 'house',
      normalizedText: 'house',
      partOfSpeech: 'noun',
      frequencyRank: 400,
      phonetic: null,
      createdAt: 1700000000,
    },
    translations: [
      {
        id: 100,
        lexemeId: 10,
        targetLanguageId: 2,
        translatedText: 'дом',
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

const POOL = ['кошка', 'собака', 'машина'];

async function reveal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /show translation/i }));
}

describe('FlashcardMode', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ dueAt: 1700600000 });
  });

  it('saves the rating through submit_review and only then advances', async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={onGrade} />);

    await reveal(user);
    await user.click(screen.getByRole('button', { name: 'Good' }));

    await waitFor(() => expect(onGrade).toHaveBeenCalledWith(3));
    expect(invokeMock).toHaveBeenCalledWith('submit_review', {
      input: { reviewStateId: 5, mode: 'flashcard', grade: 3, latencyMs: expect.any(Number) },
    });
    expect(onGrade).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Again', 0],
    ['Hard', 2],
    ['Easy', 4],
  ] as const)('maps "%s" to grade %i', async (label, grade) => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={onGrade} />);

    await reveal(user);
    await user.click(screen.getByRole('button', { name: label }));

    await waitFor(() => expect(onGrade).toHaveBeenCalledWith(grade));
    expect(invokeMock).toHaveBeenCalledWith(
      'submit_review',
      { input: expect.objectContaining({ grade }) },
    );
  });

  it('does not advance and shows an error when saving fails, then succeeds on retry', async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    invokeMock.mockRejectedValueOnce(new Error('db is locked'));
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={onGrade} />);

    await reveal(user);
    await user.click(screen.getByRole('button', { name: 'Good' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t save/i);
    expect(onGrade).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Good' }));
    await waitFor(() => expect(onGrade).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits only once when a rating button is clicked repeatedly', async () => {
    const user = userEvent.setup();
    let resolveSave: (value: { dueAt: number }) => void = () => undefined;
    invokeMock.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />);

    await reveal(user);
    const good = screen.getByRole('button', { name: 'Good' });
    await user.click(good);
    await user.click(good);

    expect(invokeMock.mock.calls.filter(([cmd]) => cmd === 'submit_review')).toHaveLength(1);
    resolveSave({ dueAt: 1700600000 });
  });

  it('advances without calling the backend when the card has no review state', async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    renderWithQueryClient(
      <FlashcardMode entry={makeEntry({ reviewState: null })} distractorPool={POOL} onGrade={onGrade} />,
    );

    await reveal(user);
    await user.click(screen.getByRole('button', { name: 'Easy' }));

    expect(onGrade).toHaveBeenCalledWith(4);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('offers the real translation plus distractors taken from the session only', () => {
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />);

    const group = screen.getByRole('group', { name: /select translation/i });
    const texts = Array.from(group.querySelectorAll('button')).map((b) => b.textContent);
    expect(texts).toHaveLength(4);
    expect(texts).toContain('дом');
    for (const text of texts) {
      if (text !== 'дом') expect(POOL).toContain(text);
    }
    expect(texts.join(' ')).not.toMatch(/хрупкий|высокомерный|осторожный/);
  });

  it('reveals the grading buttons after choosing an option', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Good' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'кошка' }));

    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
  });

  it('falls back to a flip card that shows the translation on reveal when there is nothing to choose from', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={[]} onGrade={vi.fn()} />);

    expect(screen.queryByRole('group', { name: /select translation/i })).not.toBeInTheDocument();
    expect(screen.getByText(/do you remember this word/i)).toBeInTheDocument();

    await reveal(user);

    expect(screen.getByText('дом')).toBeInTheDocument();
  });

  it('says so honestly when the card has no translation', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <FlashcardMode entry={makeEntry({ translations: [] })} distractorPool={POOL} onGrade={vi.fn()} />,
    );

    await reveal(user);

    expect(screen.getByText(/no translation saved/i)).toBeInTheDocument();
  });

  it('labels rating buttons plainly, without invented intervals', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />);

    await reveal(user);

    for (const label of ['Again', 'Hard', 'Good', 'Easy']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(/^\d+d$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/day interval/i)).not.toBeInTheDocument();
  });

  it('shows no invented "AI explanation" when the word has no notes or examples', () => {
    renderWithQueryClient(<FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />);

    expect(screen.queryByText(/ai explanation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/latin roots/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('shows the learner’s own notes and example when present', () => {
    renderWithQueryClient(
      <FlashcardMode
        entry={makeEntry({
          notes: 'Remember the plural',
          examples: [{ id: 1, lexemeId: 10, sentence: 'This house is old.', translation: null, source: null, difficulty: null }],
        })}
        distractorPool={POOL}
        onGrade={vi.fn()}
      />,
    );

    expect(screen.getByRole('complementary', { name: /notes and example/i })).toBeInTheDocument();
    expect(screen.getByText('Remember the plural')).toBeInTheDocument();
    expect(screen.getByText('This house is old.')).toBeInTheDocument();
  });

  it('shows the real frequency rank and hides the badge when it is unknown', () => {
    const { unmount } = renderWithQueryClient(
      <FlashcardMode entry={makeEntry()} distractorPool={POOL} onGrade={vi.fn()} />,
    );
    expect(screen.getByText(/★ 400/)).toBeInTheDocument();
    unmount();

    renderWithQueryClient(
      <FlashcardMode
        entry={makeEntry({ lexeme: { ...makeEntry().lexeme, frequencyRank: null } })}
        distractorPool={POOL}
        onGrade={vi.fn()}
      />,
    );
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});
