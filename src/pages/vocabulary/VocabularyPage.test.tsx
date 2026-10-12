import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import VocabularyPage from './VocabularyPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import { DEFAULT_VOCABULARY_FILTERS } from '../../lib/constants';
import { useVocabularyStore } from '../../stores/vocabularyStore';
import type { VocabularyEntryDto, VocabularyFilters } from '../../lib/types';

describe('VocabularyPage add split menu', () => {
  it('opens Add Word modal from the primary button', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue([]);
    renderWithQueryClient(
      <MemoryRouter>
        <VocabularyPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    expect(screen.getByRole('dialog', { name: /Add Word to Vocabulary/i })).toBeInTheDocument();
  });

  it('opens Paste list from the split menu', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue([]);
    renderWithQueryClient(
      <MemoryRouter>
        <VocabularyPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'More add options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Paste list' }));
    expect(screen.getByRole('heading', { name: 'Paste Word List' })).toBeInTheDocument();
  });
});

function makeEntry(id: number): VocabularyEntryDto {
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
    translations: [],
    examples: [],
    reviewState: null,
  };
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <VocabularyPage />
    </MemoryRouter>
  );
}

function listCalls(): VocabularyFilters[] {
  return invokeMock.mock.calls
    .filter(([cmd]) => cmd === 'list_vocabulary')
    .map(([, args]) => (args as { filters: VocabularyFilters }).filters);
}

describe('VocabularyPage — loading states', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS } });
  });

  it('shows an error with Try again instead of a silent empty table, and recovers', async () => {
    const user = userEvent.setup();
    let failing = true;
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') {
        return failing ? Promise.reject(new Error('db is locked')) : Promise.resolve([makeEntry(1)]);
      }
      if (cmd === 'count_vocabulary') return Promise.resolve(1);
      return Promise.resolve(null);
    });

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn.t load your vocabulary/i);
    expect(screen.queryByText(/no words yet/i)).not.toBeInTheDocument();

    failing = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('row', { name: /word1/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('distinguishes "nothing matches the search" from an empty library and can clear filters', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') return Promise.resolve([]);
      if (cmd === 'count_vocabulary') return Promise.resolve(5282);
      return Promise.resolve(null);
    });
    renderPage();
    expect(await screen.findByText(/no words yet/i)).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search vocabulary' }), 'zzz');

    expect(await screen.findByText(/no words match your search/i)).toBeInTheDocument();
    expect(screen.queryByText(/no words yet/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText(/no words yet/i)).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search vocabulary' })).toHaveValue('');
  });
});

describe('VocabularyPage — pagination', () => {
  const fullPage = Array.from({ length: DEFAULT_VOCABULARY_FILTERS.perPage }, (_, i) => makeEntry(i + 1));

  beforeEach(() => {
    invokeMock.mockReset();
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS } });
  });

  it('lets the learner reach words beyond the first page and go back', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string, args?: { filters?: VocabularyFilters }) => {
      if (cmd === 'list_vocabulary') {
        return Promise.resolve(args?.filters?.page === 2 ? [makeEntry(51), makeEntry(52)] : fullPage);
      }
      if (cmd === 'count_vocabulary') return Promise.resolve(52);
      return Promise.resolve(null);
    });

    renderPage();

    expect(await screen.findByText('1–50 of 52')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByRole('row', { name: /word51/ })).toBeInTheDocument();
    expect(listCalls().some((f) => f.page === 2)).toBe(true);
    expect(screen.getByText('51–52 of 52')).toBeInTheDocument();
    // Short page: nothing after it.
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findByText('1–50 of 52')).toBeInTheDocument();
  });

  it('goes back to page 1 when the search changes', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string, args?: { filters?: VocabularyFilters }) => {
      if (cmd === 'list_vocabulary') {
        return Promise.resolve(args?.filters?.page === 2 ? [makeEntry(51)] : fullPage);
      }
      if (cmd === 'count_vocabulary') return Promise.resolve(51);
      return Promise.resolve(null);
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Next page' }));
    await screen.findByRole('row', { name: /word51/ });

    await user.type(screen.getByRole('searchbox', { name: 'Search vocabulary' }), 'w');

    await waitFor(() => {
      const calls = listCalls();
      const last = calls[calls.length - 1];
      expect(last?.search).toBe('w');
      expect(last?.page).toBe(1);
    });
  });

  it('shows no pager when everything fits on one page', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') return Promise.resolve([makeEntry(1), makeEntry(2)]);
      if (cmd === 'count_vocabulary') return Promise.resolve(2);
      return Promise.resolve(null);
    });

    renderPage();

    await screen.findByRole('row', { name: /word1/ });
    expect(screen.queryByRole('navigation', { name: 'Vocabulary pages' })).not.toBeInTheDocument();
  });
});
