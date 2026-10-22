import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WordDetail } from './WordDetail';
import { invokeMock } from '../../test/mocks';
import { createTestQueryClient, renderWithQueryClient } from '../../test/render';
import type { VocabularyEntryDto } from '../../lib/types';

const entry: VocabularyEntryDto = {
  id: 7,
  userId: 1,
  lexemeId: 42,
  addedAt: 1,
  isFavorite: false,
  notes: null,
  source: 'manual',
  lexeme: {
    id: 42,
    languageId: 1,
    text: 'apple',
    normalizedText: 'apple',
    partOfSpeech: 'noun',
    phonetic: null,
    frequencyRank: 120,
    createdAt: 1,
  },
  translations: [
    {
      id: 1,
      lexemeId: 42,
      targetLanguageId: 2,
      translatedText: 'яблоко',
      sense: null,
      confidence: 1,
    },
  ],
  examples: [],
  reviewState: {
    id: 1,
    userVocabularyId: 7,
    status: 'new',
    ease: 2.5,
    interval: 0,
    dueAt: 1,
    lapses: 0,
    repetitions: 0,
  },
};

describe('WordDetail', () => {
  it('renders the saved associated photograph for the vocabulary entry', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_vocabulary_entry') return Promise.resolve(entry);
      if (cmd === 'get_image_path') return Promise.resolve('/tmp/apple.jpg');
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'apple' })).toBeInTheDocument();
    const img = await screen.findByRole('img', { name: 'Photo of apple' });
    expect(img).toHaveAttribute('src', 'asset://localhost//tmp/apple.jpg');
  });

  it('shows the short language name on the translation language trigger and drags the window by its header', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_vocabulary_entry') return Promise.resolve(entry);
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} />
      </MemoryRouter>
    );

    const trigger = await screen.findByRole('combobox', { name: 'View translation in language' });
    // Frame 1b: the 120px trigger reads "Russian", not a clipped "Russian (Русский)".
    expect(trigger).toHaveTextContent(/^Russian$/);
    const head = screen.getByRole('button', { name: 'Close word details' }).closest('.word-panel__head');
    expect(head).toHaveAttribute('data-tauri-drag-region');
  });

  describe('when the word cannot be shown', () => {
    beforeEach(() => {
      invokeMock.mockReset();
    });

    function renderDetail(onClose: () => void = () => undefined) {
      return renderWithQueryClient(
        <MemoryRouter>
          <WordDetail id={7} onClose={onClose} />
        </MemoryRouter>
      );
    }

    it('shows an error with Try again instead of loading forever, and recovers on retry', async () => {
      const user = userEvent.setup();
      let failing = true;
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'get_vocabulary_entry') {
          return failing ? Promise.reject(new Error('db is locked')) : Promise.resolve(entry);
        }
        if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
      });

      renderDetail();

      expect(await screen.findByRole('heading', { name: /couldn.t load this word/i })).toBeInTheDocument();
      expect(screen.queryByText(/loading word details/i)).not.toBeInTheDocument();

      failing = false;
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('heading', { name: 'apple' })).toBeInTheDocument();
    });

    it('closes with Escape and with the Close button from the error state', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      invokeMock.mockRejectedValue(new Error('boom'));

      renderDetail(onClose);
      await screen.findByRole('heading', { name: /couldn.t load this word/i });

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('lets Escape close the window even while it is still loading', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      invokeMock.mockReturnValue(new Promise(() => undefined));

      renderDetail(onClose);
      expect(await screen.findByText(/loading word details/i)).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('says the word is gone (without a retry) when it no longer exists', async () => {
      invokeMock.mockResolvedValue(null);

      renderDetail();

      expect(
        await screen.findByRole('heading', { name: /no longer in your vocabulary/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });
  });

  it('does not steal focus from the notes field when the parent re-renders with a new onClose', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_vocabulary_entry' ? entry : null)
    );
    const view = (onClose: () => void) => (
      <MemoryRouter>
        <WordDetail id={7} onClose={onClose} />
      </MemoryRouter>
    );

    const client = createTestQueryClient();
    const { rerender } = render(view(() => undefined), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    const notes = await screen.findByLabelText('Personal notes');
    await user.click(notes);
    expect(notes).toHaveFocus();

    rerender(view(() => undefined));

    expect(notes).toHaveFocus();
  });

  it('shows an error when saving notes fails', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_vocabulary_entry') return Promise.resolve(entry);
      if (cmd === 'update_vocabulary_notes') return Promise.reject(new Error('disk full'));
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} />
      </MemoryRouter>
    );
    await user.click(await screen.findByRole('button', { name: 'Save notes' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t save your notes/i)
    );
  });

  describe('removing the word', () => {
    function setup(removeResult: () => Promise<unknown>) {
      const onClose = vi.fn();
      invokeMock.mockReset();
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'get_vocabulary_entry') return Promise.resolve(entry);
        if (cmd === 'remove_from_vocabulary') return removeResult();
        if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
      });
      renderWithQueryClient(
        <MemoryRouter>
          <WordDetail id={7} onClose={onClose} />
        </MemoryRouter>
      );
      return onClose;
    }

    const removeCalls = () => invokeMock.mock.calls.filter(([cmd]) => cmd === 'remove_from_vocabulary');

    it('asks for confirmation first and deletes nothing on a single click or on cancel', async () => {
      const user = userEvent.setup();
      const onClose = setup(() => Promise.resolve(undefined));

      await user.click(await screen.findByRole('button', { name: /remove apple from vocabulary/i }));
      expect(screen.getByText(/remove .apple. from your vocabulary\?/i)).toBeInTheDocument();
      expect(removeCalls()).toHaveLength(0);

      await user.click(screen.getByRole('button', { name: 'Keep word' }));
      expect(removeCalls()).toHaveLength(0);
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /remove apple from vocabulary/i })).toBeInTheDocument();
    });

    it('removes the word after confirmation and closes the window', async () => {
      const user = userEvent.setup();
      const onClose = setup(() => Promise.resolve(undefined));

      await user.click(await screen.findByRole('button', { name: /remove apple from vocabulary/i }));
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(invokeMock).toHaveBeenCalledWith('remove_from_vocabulary', { id: 7 });
    });

    it('keeps the window open and explains when removal fails', async () => {
      const user = userEvent.setup();
      const onClose = setup(() => Promise.reject(new Error('locked')));

      await user.click(await screen.findByRole('button', { name: /remove apple from vocabulary/i }));
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t remove this word/i);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('opens as a side panel next to the list, not a modal that traps focus', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_vocabulary_entry' ? entry : null)
    );
    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} />
        <button type="button">after the panel</button>
      </MemoryRouter>
    );
    const panel = await screen.findByRole('dialog', { name: 'apple' });
    expect(panel).not.toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveFocus();

    const outside = screen.getByRole('button', { name: 'after the panel' });
    for (let i = 0; i < 40 && document.activeElement !== outside; i += 1) {
      await user.tab();
    }
    expect(outside).toHaveFocus();
  });

  it('steps to the previous and next word with the header arrows and the arrow keys', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_vocabulary_entry' ? entry : null)
    );
    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} position={{ index: 2, total: 3 }}
          onPrevious={onPrevious} onNext={onNext} />
      </MemoryRouter>
    );
    expect(await screen.findByText('Word 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous word' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Next word' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    screen.getByRole('dialog', { name: 'apple' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onNext).toHaveBeenCalledTimes(2);
    await user.keyboard('{ArrowUp}');
    expect(onPrevious).toHaveBeenCalledTimes(2);

    // Arrow keys inside the notes field move the caret, not the word.
    await user.click(screen.getByLabelText('Personal notes'));
    await user.keyboard('{ArrowDown}');
    expect(onNext).toHaveBeenCalledTimes(2);
  });

  it('disables the arrows that have no word to go to', async () => {
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_vocabulary_entry' ? entry : null)
    );
    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} position={{ index: 1, total: 1 }} />
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: 'apple' });
    expect(screen.getByRole('button', { name: 'Previous word' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next word' })).toBeDisabled();
  });
});
