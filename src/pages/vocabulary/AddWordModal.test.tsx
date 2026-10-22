import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AddWordModal } from './AddWordModal';
import { invokeMock, listenMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { TranslationResult } from '../../lib/types';
import { chooseOption } from '../../test/selectOption';

const translationResult: TranslationResult = {
  text: 'apple',
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  mainTranslation: 'яблоко',
  alternatives: ['плод'],
  sourceSynonyms: ['fruit'],
  partOfSpeech: 'noun',
  phonetic: null,
  usageNote: null,
  exampleSentence: null,
  exampleSentence2: null,
  frequencyHint: null,
  fromCache: false,
  isOfflineFallback: false,
  lexemeId: 42,
  imagePath: null,
};

describe('AddWordModal', () => {
  it('shows the associated photo after enrich and keeps it when adding to vocabulary', async () => {
    const user = userEvent.setup();
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    listenMock.mockImplementation(((event: string, cb: (event: { payload: unknown }) => void) => {
      handlers.set(event, cb);
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'regenerate_lexeme_image') return Promise.resolve('/tmp/apple-2.jpg');
      if (cmd === 'add_to_vocabulary') {
        return Promise.resolve({
          id: 1,
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
            frequencyRank: null,
            createdAt: 1,
          },
          translations: [],
          examples: [],
          reviewState: null,
        });
      }
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <AddWordModal isOpen onClose={() => undefined} />
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Word or phrase to translate' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    expect(screen.getByText('Finding a photo…')).toBeInTheDocument();

    await waitFor(() => {
      expect(handlers.has('lexora:card-enrich')).toBe(true);
    });
    act(() => {
      handlers.get('lexora:card-enrich')?.({
        payload: {
          lexemeId: 42,
          usageNote: null,
          exampleSentence: 'She picked a red apple.',
          exampleSentence2: null,
          imagePath: '/tmp/apple.jpg',
        },
      });
    });

    const img = await screen.findByRole('img', { name: 'Photo of apple' });
    expect(img).toHaveAttribute('src', 'asset://localhost//tmp/apple.jpg');
    // The example underlines the word (frame 2b), so the sentence spans several nodes.
    const underlined = screen.getByText('apple', { selector: 'u' });
    expect(underlined.parentElement).toHaveTextContent('She picked a red apple.');

    await user.click(screen.getByRole('button', { name: 'Regenerate photo' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('regenerate_lexeme_image', { lexemeId: 42 });
    });
    expect(await screen.findByRole('img', { name: 'Photo of apple' })).toHaveAttribute(
      'src',
      'asset://localhost//tmp/apple-2.jpg?v=1'
    );

    await user.click(screen.getByRole('button', { name: 'Add to vocabulary' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('add_to_vocabulary', {
        input: expect.objectContaining({
          lexemeId: 42,
          text: 'apple',
          sourceLanguage: 'en',
          source: 'manual',
        }),
      });
    });
  });

  it('shows a translation error when the provider fails', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.reject(new Error('Empty response from Gemini (finishReason: MAX_TOKENS)'));
      }
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderWithQueryClient(<AddWordModal isOpen onClose={() => undefined} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Word or phrase to translate' }),
      'apple{Enter}'
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/empty answer/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/Couldn’t translate/i);
  });

  it('clears word, notes, and translation when opened again', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Add Word
          </button>
          <AddWordModal isOpen={open} onClose={() => setOpen(false)} />
        </>
      );
    }

    renderWithQueryClient(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Word or phrase to translate' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^notes/i), 'from an article');
    expect(screen.getByLabelText(/^notes/i)).toHaveValue('from an article');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    expect(screen.getByRole('textbox', { name: 'Word or phrase to translate' })).toHaveValue('');
    expect(screen.getByLabelText(/^notes/i)).toHaveValue('');
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
  });
});

describe('AddWordModal categories', () => {
  it('saves the chosen category with the word', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_categories') return Promise.resolve([
        { id: 1, languageId: 1, name: 'General', isGeneral: true, wordCount: 0 },
        { id: 2, languageId: 1, name: 'Travel', isGeneral: false, wordCount: 0 },
      ]);
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
    renderWithQueryClient(<AddWordModal isOpen onClose={() => undefined} />);
    await chooseOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Travel');
    await user.type(screen.getByRole('textbox', { name: 'Word or phrase to translate' }), 'airport');
    await user.click(screen.getByRole('button', { name: 'Add to vocabulary' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('add_to_vocabulary', {
      input: expect.objectContaining({ text: 'airport', categoryId: 2 }),
    }));
  });

  it('never silently replaces an explicitly chosen unavailable category with General', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_categories') return Promise.reject(new Error('offline database'));
      if (cmd === 'add_to_vocabulary') return Promise.reject(new Error('Category no longer exists'));
      if (cmd === 'list_categories') return Promise.resolve([]);
      return Promise.resolve(null);
    });
    renderWithQueryClient(<AddWordModal isOpen initialCategoryId={99} onClose={() => undefined} />);
    await user.type(screen.getByRole('textbox', { name: 'Word or phrase to translate' }), 'airport');
    await user.click(screen.getByRole('button', { name: 'Add to vocabulary' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Category no longer exists');
    expect(invokeMock).toHaveBeenCalledWith('add_to_vocabulary', {
      input: expect.objectContaining({ categoryId: 99 }),
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

it('uses the stored General id when adding without selecting another category', async () => {
  const user = userEvent.setup();
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'list_categories') return Promise.resolve([{ id: 17, languageId: 1, name: 'General', isGeneral: true, wordCount: 0 }]);
    return Promise.resolve(null);
  });
  renderWithQueryClient(<AddWordModal isOpen onClose={() => undefined} />);
  await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('list_categories', { languageId: 1 }));
  await user.type(screen.getByRole('textbox', { name: 'Word or phrase to translate' }), 'apple');
  await user.click(screen.getByRole('button', { name: 'Add to vocabulary' }));
  await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('add_to_vocabulary', {
    input: expect.objectContaining({ categoryId: 17 }),
  }));
});
