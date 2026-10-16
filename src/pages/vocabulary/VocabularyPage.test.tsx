import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import VocabularyPage from './VocabularyPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import { DEFAULT_VOCABULARY_FILTERS } from '../../lib/constants';
import { useSettingsStore } from '../../stores/settingsStore';
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
      if (cmd === 'list_categories') return Promise.resolve([]);
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
      if (cmd === 'list_categories') return Promise.resolve([]);
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
      if (cmd === 'list_categories') return Promise.resolve([]);
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
      if (cmd === 'list_categories') return Promise.resolve([]);
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
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderPage();

    await screen.findByRole('row', { name: /word1/ });
    expect(screen.queryByRole('navigation', { name: 'Vocabulary pages' })).not.toBeInTheDocument();
  });
});

describe('VocabularyPage — word management', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS } });
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') return Promise.resolve([makeEntry(1), makeEntry(2)]);
      if (cmd === 'count_vocabulary') return Promise.resolve(2);
      if (cmd === 'update_vocabulary_entry') return Promise.resolve(makeEntry(1));
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
  });

  it('edits a word directly from its row without opening details', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit word1' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit word and translation' });
    await user.clear(within(dialog).getByLabelText('Word'));
    await user.type(within(dialog).getByLabelText('Word'), 'corrected');
    await user.type(within(dialog).getByLabelText('Translation'), 'исправленный');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('update_vocabulary_entry', {
      id: 1, text: 'corrected', translation: 'исправленный',
    }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('selects the current page with Space and removes only after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    const select = await screen.findByRole('checkbox', { name: 'Select word1' });
    select.focus();
    await user.keyboard(' ');
    expect(select).toBeChecked();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Select all words on this page' }));
    expect(screen.getByRole('checkbox', { name: 'Select word2' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Remove selected (2)' }));
    expect(invokeMock).not.toHaveBeenCalledWith('remove_vocabulary_batch', expect.anything());
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('remove_vocabulary_batch', { ids: [1, 2] }));
  });

  it('keeps selection and displays an error when removal fails', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') return Promise.resolve([makeEntry(1)]);
      if (cmd === 'count_vocabulary') return Promise.resolve(1);
      if (cmd === 'remove_vocabulary_batch') return Promise.reject(new Error('database locked'));
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
    renderPage();
    await user.click(await screen.findByRole('checkbox', { name: 'Select word1' }));
    await user.click(screen.getByRole('button', { name: 'Remove selected (1)' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('database locked');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('checkbox', { name: 'Select word1' })).toBeChecked();
  });

  it('confirms individual removal and clears selection when filters change', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('checkbox', { name: 'Select word2' }));
    await user.click(screen.getByRole('button', { name: 'Remove word1' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('word1');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('remove_vocabulary_batch', { ids: [1] }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('checkbox', { name: 'Select word2' }));
    await user.click(screen.getByRole('button', { name: 'Show New words' }));
    expect(screen.queryByRole('button', { name: /Remove selected/ })).not.toBeInTheDocument();
  });
  it('keeps the editor open during saving and shows a failed save', async () => {
    const user = userEvent.setup();
    let rejectSave: ((reason: Error) => void) | undefined;
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_vocabulary') return Promise.resolve([makeEntry(1)]);
      if (cmd === 'count_vocabulary') return Promise.resolve(1);
      if (cmd === 'update_vocabulary_entry') return new Promise((_resolve, reject) => { rejectSave = reject; });
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit word1' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    rejectSave?.(new Error('save failed'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save the changes. Please try again.');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refreshes the count and returns from a page emptied by removal', async () => {
    const user = userEvent.setup();
    let removed = false;
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS, page: 2 } });
    invokeMock.mockImplementation((cmd: string, args?: unknown) => {
      if (cmd === 'list_vocabulary') {
        const { filters } = args as { filters: VocabularyFilters };
        return Promise.resolve(filters.page === 1 ? [makeEntry(1)] : removed ? [] : [makeEntry(51)]);
      }
      if (cmd === 'count_vocabulary') return Promise.resolve(removed ? 50 : 51);
      if (cmd === 'remove_vocabulary_batch') removed = true;
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Remove word51' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('row', { name: /word1:/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /word51:/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('50 words total')).toBeInTheDocument());
    expect(useVocabularyStore.getState().filters.page).toBe(1);
  });

});

const categories = [
  { id: 1, languageId: 1, name: 'General', isGeneral: true, wordCount: 1 },
  { id: 2, languageId: 1, name: 'Travel', isGeneral: false, wordCount: 1 },
];

describe('VocabularyPage — categories', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS } });
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_categories') return Promise.resolve(categories);
      if (cmd === 'list_vocabulary') return Promise.resolve([makeEntry(1), makeEntry(2)]);
      if (cmd === 'count_vocabulary') return Promise.resolve(2);
      if (cmd === 'create_category') return Promise.resolve({ ...categories[1], id: 3, name: 'Work' });
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
  });

  it('defaults to all categories and resets pagination and selection when filtering', async () => {
    const user = userEvent.setup();
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS, page: 2 } });
    renderPage();
    expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveValue('');
    await user.click(await screen.findByRole('checkbox', { name: 'Select word1' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '2');
    await waitFor(() => expect(listCalls()[listCalls().length - 1]).toEqual(expect.objectContaining({ categoryId: 2, page: 1 })));
    expect(screen.queryByRole('button', { name: 'Move selected' })).not.toBeInTheDocument();
  });

  it('creates and renames categories and protects General from deletion', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: 'Travel' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '1');
    expect(screen.queryByRole('button', { name: 'Delete category' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Category' }));
    await user.type(screen.getByRole('textbox', { name: 'Category name' }), ' Work ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('create_category', { name: 'Work', languageId: 1 }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '2');
    await user.click(screen.getByRole('button', { name: 'Rename category' }));
    await user.clear(screen.getByRole('textbox', { name: 'Category name' }));
    await user.type(screen.getByRole('textbox', { name: 'Category name' }), 'Trips');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('rename_category', { id: 2, name: 'Trips' }));
  });

  it('moves only selected words into the chosen category', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: 'Travel' });
    await user.click(await screen.findByRole('checkbox', { name: 'Select word2' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Move to category' }), '2');
    await user.click(screen.getByRole('button', { name: 'Move selected' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('move_vocabulary_to_category', { ids: [2], categoryId: 2 }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Move selected' })).not.toBeInTheDocument());
  });

  it('confirms category deletion and returns to all words after it succeeds', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: 'Travel' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '2');
    await user.click(screen.getByRole('button', { name: 'Delete category' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete category' });
    expect(dialog).toHaveTextContent('Words in this category will move to General. Learning progress is preserved.');
    expect(invokeMock).not.toHaveBeenCalledWith('delete_category', expect.anything());
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('delete_category', { id: 2 }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveValue(''));
  });

  it('retains the selected category when opening the add form', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('option', { name: 'Travel' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '2');
    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    expect(within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Category' })).toHaveValue('2');
  });
});


describe('VocabularyPage category language scope', () => {
  it('clears a previous language category after returning to Vocabulary in another language', async () => {
    useVocabularyStore.setState({ filters: { ...DEFAULT_VOCABULARY_FILTERS, categoryId: 2, page: 3 } });
    useSettingsStore.setState({ activeLanguageId: 3 });
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_categories') return Promise.resolve([{ id: 7, languageId: 3, name: 'General', isGeneral: true, wordCount: 0 }]);
      if (cmd === 'list_vocabulary') return Promise.resolve([]);
      if (cmd === 'count_vocabulary') return Promise.resolve(0);
      return Promise.resolve(null);
    });
    const view = renderPage();
    await waitFor(() => expect(useVocabularyStore.getState().filters).toEqual(expect.objectContaining({ categoryId: null, page: 1 })));
    expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveValue('');
    view.unmount();
    useSettingsStore.setState({ activeLanguageId: 1 });
  });
});
