// ============================================================
// LEXORA — StudyPage tests (setup screen + end-to-end flashcard session)
// ============================================================

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import StudyPage from './StudyPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import { useSessionStore } from '../../stores/sessionStore';
import type { VocabularyEntryDto } from '../../lib/types';

function makeEntry(id: number, overrides: Partial<VocabularyEntryDto> = {}): VocabularyEntryDto {
  return {
    id,
    userId: 1,
    lexemeId: id,
    addedAt: 1,
    isFavorite: false,
    notes: null,
    source: null,
    lexeme: {
      id,
      languageId: 1,
      text: `word${id}`,
      normalizedText: `word${id}`,
      partOfSpeech: 'noun',
      phonetic: null,
      frequencyRank: null,
      createdAt: 1,
    },
    translations: [
      { id, lexemeId: id, targetLanguageId: 2, translatedText: `перевод${id}`, sense: null, confidence: 1 },
    ],
    examples: [],
    reviewState: {
      id: id * 10,
      userVocabularyId: id,
      status: 'review',
      ease: 2.5,
      interval: 3,
      dueAt: 1,
      lapses: 0,
      repetitions: 2,
    },
    ...overrides,
  };
}

function mockStudy(queue: () => Promise<VocabularyEntryDto[]>, dueCount = 5282) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'get_study_queue') return queue();
    if (cmd === 'get_due_count') return Promise.resolve(dueCount);
    if (cmd === 'submit_review') return Promise.resolve({ dueAt: 1_700_000_000 });
    return Promise.resolve(null);
  });
}

describe('StudyPage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useSessionStore.getState().endSession();
  });

  describe('setup screen', () => {
    it('shows the real session size, not the total number of due cards', async () => {
      mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2)]), 5282);
      renderWithQueryClient(<StudyPage />);

      const start = await screen.findByRole('button', { name: /^Start Session/ });
      await waitFor(() => expect(start).toHaveTextContent('Start Session (2 words)'));
      // The headline may say how many cards are due; the button must say how many you will study.
      expect(start).not.toHaveTextContent('5282');
    });

    it('does not offer a session (and never says "Session Complete") when nothing is queued', async () => {
      const user = userEvent.setup();
      mockStudy(() => Promise.resolve([]), 0);
      renderWithQueryClient(<StudyPage />);

      expect(await screen.findByText(/nothing to review right now/i)).toBeInTheDocument();
      const start = screen.getByRole('button', { name: /^Start Session/ });
      expect(start).toBeDisabled();

      await user.click(start);
      expect(screen.queryByText(/session complete/i)).not.toBeInTheDocument();
    });

    it('shows an error with Try again when the queue cannot be loaded, and recovers', async () => {
      const user = userEvent.setup();
      let failing = true;
      mockStudy(() => (failing ? Promise.reject(new Error('db locked')) : Promise.resolve([makeEntry(1)])));
      renderWithQueryClient(<StudyPage />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/couldn.t load your cards/i);
      expect(screen.queryByText(/nothing to review/i)).not.toBeInTheDocument();

      failing = false;
      await user.click(within(alert).getByRole('button', { name: 'Try again' }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^Start Session/ })).toBeEnabled(),
      );
    });

    it('leaves out cards that have no review state, since they cannot be scheduled', async () => {
      mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2, { reviewState: null })]));
      renderWithQueryClient(<StudyPage />);

      const start = await screen.findByRole('button', { name: /^Start Session/ });
      await waitFor(() => expect(start).toHaveTextContent('Start Session (1 word)'));
    });
  });

  describe('mode selector keyboard support', () => {
    async function renderSetup() {
      mockStudy(() => Promise.resolve([makeEntry(1)]));
      renderWithQueryClient(<StudyPage />);
      await screen.findByRole('radiogroup', { name: 'Select study mode' });
      return userEvent.setup();
    }

    const selected = () =>
      screen.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true');

    it('keeps exactly one mode in the tab order (roving tabindex)', async () => {
      await renderSetup();

      const tabbable = screen.getAllByRole('radio').filter((r) => r.tabIndex === 0);
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]).toHaveTextContent('Flashcards');
    });

    it('moves the selection and focus with the arrow keys, wrapping around', async () => {
      const user = await renderSetup();
      const radios = screen.getAllByRole('radio');

      radios[0]?.focus();
      await user.keyboard('{ArrowRight}');
      expect(selected()).toHaveTextContent('Typing Mode');
      expect(selected()).toHaveFocus();

      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(selected()).toHaveTextContent('Speaking');
      expect(selected()).toHaveFocus();
    });

    it('jumps with Home/End', async () => {
      const user = await renderSetup();
      screen.getAllByRole('radio')[0]?.focus();

      await user.keyboard('{End}');
      expect(selected()).toHaveTextContent('Speaking');
      await user.keyboard('{Home}');
      expect(selected()).toHaveTextContent('Flashcards');
    });

    it('selects the focused mode with Space as well as Enter', async () => {
      const user = await renderSetup();
      const typing = screen.getByRole('radio', { name: /typing mode/i });

      typing.focus();
      await user.keyboard(' ');
      expect(selected()).toHaveTextContent('Typing Mode');
    });
  });

  it('runs a flashcard session end to end and saves each rating', async () => {
    const user = userEvent.setup();
    mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2)]));
    renderWithQueryClient(<StudyPage />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Start Session/ })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: /^Start Session/ }));

    for (const reviewStateId of [10, 20]) {
      await user.click(await screen.findByRole('button', { name: 'Show translation' }));
      await user.click(screen.getByRole('button', { name: 'Good' }));
      await waitFor(() =>
        expect(invokeMock).toHaveBeenCalledWith('submit_review', {
          input: expect.objectContaining({ reviewStateId, grade: 3, mode: 'flashcard' }),
        }),
      );
    }

    expect(await screen.findByText('Session Complete!')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
