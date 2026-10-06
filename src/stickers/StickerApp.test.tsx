import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { StickerApp } from './StickerApp';
import { stickerSlotFromLabel } from './stickerSlots';
import { invokeMock, listenMock, tauriWindowMock } from '../test/mocks';
import { renderWithQueryClient } from '../test/render';
import type { VocabularyEntryDto } from '../lib/types';

function makeEntry(overrides: Partial<VocabularyEntryDto> = {}): VocabularyEntryDto {
  return {
    id: 10,
    userId: 1,
    lexemeId: 20,
    addedAt: 1_700_000_000,
    isFavorite: false,
    notes: null,
    source: 'manual',
    lexeme: {
      id: 20,
      languageId: 1,
      text: 'apple',
      normalizedText: 'apple',
      partOfSpeech: 'noun',
      frequencyRank: 500,
      phonetic: null,
      createdAt: 1_700_000_000,
    },
    translations: [
      {
        id: 30,
        lexemeId: 20,
        targetLanguageId: 2,
        translatedText: 'яблоко',
        sense: null,
        confidence: null,
      },
    ],
    examples: [],
    reviewState: {
      id: 40,
      userVocabularyId: 10,
      status: 'review',
      ease: 2.5,
      interval: 3,
      dueAt: Math.floor(Date.now() / 1000) - 3600,
      lapses: 0,
      repetitions: 2,
    },
    ...overrides,
  };
}

beforeEach(() => {
  invokeMock.mockResolvedValue(null);
});

describe('stickerSlotFromLabel', () => {
  it('reads the numeric slot from the window label', () => {
    expect(stickerSlotFromLabel('sticker-0')).toBe(0);
    expect(stickerSlotFromLabel('sticker-2')).toBe(2);
    expect(stickerSlotFromLabel('main')).toBe(0);
  });
});

describe('StickerApp', () => {
  it('hides the window and renders nothing when the queue is empty', async () => {
    renderWithQueryClient(<StickerApp />);

    await waitFor(() => {
      expect(tauriWindowMock.hide).toHaveBeenCalled();
    });
    expect(screen.queryByText('Всё повторено 🎉')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close sticker' })).not.toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalledWith('show_sticker_window');
    expect(invokeMock).toHaveBeenCalledWith(
      'get_sticker_card',
      expect.objectContaining({
        filters: expect.objectContaining({ languageId: 1, limit: 50 }),
      })
    );
  });

  it('shows the window only when this sticker slot has a card', async () => {
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('show_sticker_window');
    });
  });

  it('hides extra sticker slots when there are fewer cards than windows', async () => {
    tauriWindowMock.label = 'sticker-1';
    invokeMock.mockImplementation(() => Promise.resolve(null));
    renderWithQueryClient(<StickerApp />);

    await waitFor(() => {
      expect(tauriWindowMock.hide).toHaveBeenCalled();
    });
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalledWith('show_sticker_window');
  });

  it('assigns a unique queue card to each sticker slot', async () => {
    tauriWindowMock.label = 'sticker-1';
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(
        cmd === 'get_sticker_card'
          ? makeEntry({
              id: 11,
              lexemeId: 21,
              lexeme: { ...makeEntry().lexeme, id: 21, text: 'banana', normalizedText: 'banana' },
            })
          : null,
      ),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('banana')).toBeInTheDocument();
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
  });

  it('hides the sticker after the last assigned card is reviewed', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Помню/ }));

    await waitFor(() => {
      expect(tauriWindowMock.hide).toHaveBeenCalled();
    });
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
  });

  it('hides the translation via the eye button', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByText('яблоко')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle translation visibility' }));
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
  });

  it('picks up the gloss once a backfilled translation arrives', async () => {
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    listenMock.mockImplementation(((event: string, cb: (event: { payload: unknown }) => void) => {
      handlers.set(event, cb);
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);

    let translated = false;
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd !== 'get_sticker_card') return Promise.resolve(null);
      return Promise.resolve(translated ? makeEntry() : makeEntry({ translations: [] }));
    });
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();

    translated = true;
    await act(async () => {
      handlers.get('lexora:translation-backfilled')?.({ payload: { lexemeId: 20 } });
    });

    expect(await screen.findByText('яблоко')).toBeInTheDocument();
  });

  it('renders phonetic transcription when the lexeme has one', async () => {
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(
        cmd === 'get_sticker_card'
          ? makeEntry({ lexeme: { ...makeEntry().lexeme, phonetic: '/ˈæp.əl/' } })
          : null,
      )
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByText('/ˈæp.əl/')).toBeInTheDocument();
  });

  it('does not render a phonetic line when transcription is missing', async () => {
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.queryByText('/ˈæp.əl/')).not.toBeInTheDocument();
  });

  it('disables the context button when there is no example', async () => {
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No examples available' })).toBeDisabled();
  });

  it('toggles the example sentence via the context icon', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(
        cmd === 'get_sticker_card'
          ? makeEntry({
              examples: [
                {
                  id: 1,
                  lexemeId: 20,
                  sentence: 'An apple a day keeps the doctor away.',
                  translation: 'Яблоко в день — и врач не нужен.',
                  source: null,
                  difficulty: 1,
                },
              ],
            })
          : null,
      )
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    expect(screen.queryByText(/An apple a day/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show example in context' }));
    expect(
      screen.getByText((_content, element) =>
        element?.classList.contains('sticker-example') === true &&
        (element.textContent ?? '').includes('An apple a day'),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide example in context' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Hide example in context' }));
    expect(screen.getByText('яблоко')).toBeInTheDocument();
    expect(
      screen.queryByText((_content, element) =>
        element?.classList.contains('sticker-example') === true,
      ),
    ).not.toBeInTheDocument();
  });

  it('"Помню" evaluates the answer with the right arguments', async () => {
    const user = userEvent.setup();
    const entry = makeEntry();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? entry : null)
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Помню/ }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('evaluate_answer', {
        input: {
          reviewStateId: 40,
          mode: 'flashcard',
          userAnswer: 'apple',
          targetText: 'apple',
          latencyMs: expect.any(Number),
        },
      });
    });
  });

  it('"Не помню" sends an empty userAnswer', async () => {
    const user = userEvent.setup();
    const entry = makeEntry();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? entry : null)
    );
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Не помню/ }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('evaluate_answer', {
        input: expect.objectContaining({
          reviewStateId: 40,
          userAnswer: '',
        }),
      });
    });
  });

  it('pin and close buttons talk to the current window', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'get_sticker_card' ? makeEntry() : null),
    );
    renderWithQueryClient(<StickerApp />);

    await screen.findByText('apple');

    const pin = screen.getByRole('button', { name: 'Pin on top' });
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    expect(pin).not.toHaveClass('pinned');

    await user.click(pin);
    expect(invokeMock).toHaveBeenCalledWith('set_sticker_pinned', { pinned: true });
    expect(pin).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Close sticker' }));
    expect(tauriWindowMock.hide).toHaveBeenCalled();
    expect(invokeMock).toHaveBeenCalledWith(
      'dismiss_sticker_card',
      expect.objectContaining({ entryId: 10 }),
    );
  });

  it('does not show another sticker\'s card after Помню', async () => {
    const user = userEvent.setup();
    const apple = makeEntry();
    const cherry = makeEntry({
      id: 12,
      lexemeId: 22,
      lexeme: { ...makeEntry().lexeme, id: 22, text: 'cherry', normalizedText: 'cherry' },
      reviewState: {
        id: 42,
        userVocabularyId: 12,
        status: 'review',
        ease: 2.5,
        interval: 3,
        dueAt: Math.floor(Date.now() / 1000) - 3600,
        lapses: 0,
        repetitions: 2,
      },
    });

    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_sticker_card') return Promise.resolve(apple);
      if (cmd === 'dismiss_sticker_card') return Promise.resolve(cherry);
      return Promise.resolve(null);
    });
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Помню/ }));

    expect(await screen.findByText('cherry')).toBeInTheDocument();
    expect(screen.queryByText('banana')).not.toBeInTheDocument();
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith(
      'dismiss_sticker_card',
      expect.objectContaining({ entryId: apple.id }),
    );
  });

  it('opens a multi-select source filter on the sticker', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_sticker_card') return Promise.resolve(makeEntry());
      if (cmd === 'list_collections') {
        return Promise.resolve([
          {
            id: 1,
            name: 'Top 5000 Words',
            description: null,
            collectionType: 'system',
            languageId: 1,
            wordCount: 10,
            isActive: true,
          },
          {
            id: 3,
            name: 'Irregular Verbs',
            description: null,
            collectionType: 'system',
            languageId: 1,
            wordCount: 5,
            isActive: true,
          },
        ]);
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<StickerApp />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filter sticker sources' }));

    expect(screen.getByText('All vocabulary')).toBeInTheDocument();
    expect(screen.getByText('My words')).toBeInTheDocument();
    expect(screen.getByText('Top 5000 Words')).toBeInTheDocument();
    expect(screen.getByText('Irregular Verbs')).toBeInTheDocument();
  });
});
