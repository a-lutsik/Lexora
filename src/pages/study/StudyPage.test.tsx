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

type StudyMocks = {
  summary?: unknown;
  activity?: unknown;
  categories?: unknown;
};

function mockStudy(queue: () => Promise<VocabularyEntryDto[]>, dueCount = 5282, extra: StudyMocks = {}) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'get_study_queue') return queue();
    if (cmd === 'get_due_count') return Promise.resolve(dueCount);
    if (cmd === 'submit_review') return Promise.resolve({ dueAt: 1_700_000_000 });
    if (cmd === 'get_stats_summary') return Promise.resolve(extra.summary ?? null);
    if (cmd === 'get_daily_activity') return Promise.resolve(extra.activity ?? null);
    if (cmd === 'list_categories') return Promise.resolve(extra.categories ?? []);
    return Promise.resolve(null);
  });
}

function day(date: string, reviewed: number, accuracy: number) {
  return { date, reviewed, added: 0, accuracy };
}

const queueCalls = () =>
  invokeMock.mock.calls
    .filter(([cmd]) => cmd === 'get_study_queue')
    .map(([, args]) => (args as { filters: Record<string, unknown> }).filters);
const lastQueueCall = () => {
  const calls = queueCalls();
  return calls[calls.length - 1];
};

describe('StudyPage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useSessionStore.getState().endSession();
  });

  describe('setup screen', () => {
    it('shows the real session size, not the total number of due cards', async () => {
      mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2)]), 5282);
      renderWithQueryClient(<StudyPage />);

      const start = await screen.findByRole('button', { name: /^Start session/ });
      await waitFor(() => expect(start).toHaveTextContent('Start session · 2 cards'));
      // The headline may say how many cards are due; the button must say how many you will study.
      expect(start).not.toHaveTextContent('5282');
    });

    it('does not offer a session (and never says "Session Complete") when nothing is queued', async () => {
      const user = userEvent.setup();
      mockStudy(() => Promise.resolve([]), 0);
      renderWithQueryClient(<StudyPage />);

      expect(await screen.findByText(/nothing to review right now/i)).toBeInTheDocument();
      const start = screen.getByRole('button', { name: /^Start session/ });
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
        expect(screen.getByRole('button', { name: /^Start session/ })).toBeEnabled(),
      );
    });

    it('leaves out cards that have no review state, since they cannot be scheduled', async () => {
      mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2, { reviewState: null })]));
      renderWithQueryClient(<StudyPage />);

      const start = await screen.findByRole('button', { name: /^Start session/ });
      await waitFor(() => expect(start).toHaveTextContent('Start session · 1 card'));
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
      expect(selected()).toHaveTextContent('Typing');
      expect(selected()).toHaveFocus();

      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(selected()).toHaveTextContent('Collocations');
      expect(selected()).toHaveFocus();
    });

    it('jumps with Home/End', async () => {
      const user = await renderSetup();
      screen.getAllByRole('radio')[0]?.focus();

      await user.keyboard('{End}');
      expect(selected()).toHaveTextContent('Collocations');
      await user.keyboard('{Home}');
      expect(selected()).toHaveTextContent('Flashcards');
    });

    it('selects the focused mode with Space as well as Enter', async () => {
      const user = await renderSetup();
      const typing = screen.getByRole('radio', { name: /^typing/i });

      typing.focus();
      await user.keyboard(' ');
      expect(selected()).toHaveTextContent('Typing');
    });
  });

  describe('mode picker (frame 1c)', () => {
    const selected = () =>
      screen.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true');

    async function renderPicker(extra: StudyMocks = {}, dueCount = 5) {
      mockStudy(() => Promise.resolve([makeEntry(1)]), dueCount, extra);
      renderWithQueryClient(<StudyPage />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^Start session/ })).toBeEnabled(),
      );
      return userEvent.setup();
    }

    it('estimates the session length at 36 s per card in the subtitle', async () => {
      mockStudy(() => Promise.resolve([1, 2, 3, 4, 5].map((id) => makeEntry(id))), 5);
      renderWithQueryClient(<StudyPage />);
      expect(await screen.findByText('5 cards due today · about 3 min')).toBeInTheDocument();
    });

    it('estimates the next session, not the whole backlog, when many cards are due', async () => {
      const sessionOf20 = Array.from({ length: 20 }, (_, i) => makeEntry(i + 1));
      mockStudy(() => Promise.resolve(sessionOf20), 5260);
      renderWithQueryClient(<StudyPage />);
      expect(await screen.findByText('5,260 cards due today · about 12 min')).toBeInTheDocument();
    });

    it('numbers the mode cards 1–9 and hints the keys under the start button', async () => {
      await renderPicker();
      const keys = screen.getAllByRole('radio').map((r) => r.querySelector('.kbd')?.textContent);
      expect(keys).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
      const hint = screen.getByText(/to pick a mode/).closest('.hint');
      expect(hint).toHaveTextContent('↵to start ·1–9to pick a mode');
    });

    it('selects a mode with the digit keys', async () => {
      const user = await renderPicker();

      await user.keyboard('2');
      expect(selected()).toHaveTextContent('Typing');
      await user.keyboard('9');
      expect(selected()).toHaveTextContent('Collocations');
      await user.keyboard('1');
      expect(selected()).toHaveTextContent('Flashcards');
    });

    it('leaves digit keys to a focused picker control', async () => {
      const user = await renderPicker();

      screen.getByRole('combobox', { name: 'Category' }).focus();
      await user.keyboard('2');
      expect(selected()).toHaveTextContent('Flashcards');
    });

    it('starts the session with Enter', async () => {
      const user = await renderPicker();

      await user.keyboard('{Enter}');

      expect(await screen.findByRole('button', { name: 'Show translation' })).toBeInTheDocument();
    });

    it('starts the session with Enter on the focused, selected mode card', async () => {
      const user = await renderPicker();
      screen.getByRole('radio', { name: /^flashcards/i }).focus();

      await user.keyboard('{Enter}');

      expect(await screen.findByRole('button', { name: 'Show translation' })).toBeInTheDocument();
    });

    it('switches the queue between Mixed (with new cards) and Due only', async () => {
      const user = await renderPicker({}, 5);
      const mixed = screen.getByRole('button', { name: 'Mixed' });
      expect(mixed).toHaveAttribute('aria-pressed', 'true');
      expect(lastQueueCall()).toMatchObject({ includeNew: true });

      await user.click(await screen.findByRole('button', { name: 'Due · 5' }));

      await waitFor(() => expect(lastQueueCall()).toMatchObject({ includeNew: false }));
      expect(screen.getByRole('button', { name: 'Due · 5' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('filters the queue by the chosen category', async () => {
      const user = await renderPicker({
        categories: [
          { id: 1, name: 'General', languageId: 1, isGeneral: true, wordCount: 4 },
          { id: 3, name: 'Work', languageId: 1, isGeneral: false, wordCount: 2 },
        ],
      });
      expect(lastQueueCall()).not.toHaveProperty('categoryIds');

      await user.click(screen.getByRole('combobox', { name: 'Category' }));
      await user.click(await screen.findByRole('option', { name: 'Work' }));

      await waitFor(() =>
        expect(lastQueueCall()).toMatchObject({ includeMine: false, categoryIds: [3] }),
      );
    });

    it('shows today’s reviews, this week’s accuracy and the streak from the stats commands', async () => {
      await renderPicker({
        summary: { totalWords: 9, dueToday: 5, streak: 12, accuracyPercent: 40, wordsAddedThisWeek: 0, matureCount: 0 },
        activity: [
          day('2026-10-16', 0, 0),
          day('2026-10-17', 10, 80),
          day('2026-10-18', 0, 0),
          day('2026-10-19', 0, 0),
          day('2026-10-20', 0, 0),
          day('2026-10-21', 0, 0),
          day('2026-10-22', 12, 75),
        ],
      });

      const cell = (label: string) => screen.getByText(label).closest('.stat');
      await waitFor(() => expect(cell('Reviewed today')).toHaveTextContent('12'));
      // (8 + 9) correct of 22 reviews this week — not the all-time accuracy (40%).
      expect(cell('Accuracy this week')).toHaveTextContent('77%');
      expect(cell('Streak')).toHaveTextContent('12 days');
      expect(invokeMock).toHaveBeenCalledWith('get_daily_activity', { days: 7, languageId: 1 });
    });

    it('hides stats it has no value for', async () => {
      await renderPicker({ summary: null, activity: [day('2026-10-22', 0, 0)] });

      expect(await screen.findByText('Reviewed today')).toBeInTheDocument();
      expect(screen.queryByText('Accuracy this week')).not.toBeInTheDocument();
      expect(screen.queryByText('Streak')).not.toBeInTheDocument();
    });

    it('shows no stat grid at all when the stats are unavailable', async () => {
      await renderPicker({ summary: null, activity: null });

      expect(screen.queryByText('Reviewed today')).not.toBeInTheDocument();
      expect(document.querySelector('.stat-grid')).toBeNull();
    });
  });

  it('marks the session top bar as a window drag region and hints the rating keys', async () => {
    const user = userEvent.setup();
    mockStudy(() => Promise.resolve([makeEntry(1)]));
    renderWithQueryClient(<StudyPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Start session/ })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: /^Start session/ }));

    expect(document.querySelector('.focus-topbar')).toHaveAttribute('data-tauri-drag-region');
    expect(screen.getByText(/show answer/).closest('.hint')).toHaveTextContent('Spaceshow answer ·1–4rate');
  });

  it('runs a flashcard session end to end and saves each rating', async () => {
    const user = userEvent.setup();
    mockStudy(() => Promise.resolve([makeEntry(1), makeEntry(2)]));
    renderWithQueryClient(<StudyPage />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Start session/ })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: /^Start session/ }));

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
