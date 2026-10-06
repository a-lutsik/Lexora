import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AddWordModal } from './AddWordModal';
import { invokeMock, listenMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { TranslationResult } from '../../lib/types';

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
    expect(screen.getByText(/She picked a red apple/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Regenerate photo' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('regenerate_lexeme_image', { lexemeId: 42 });
    });
    expect(await screen.findByRole('img', { name: 'Photo of apple' })).toHaveAttribute(
      'src',
      'asset://localhost//tmp/apple-2.jpg?v=1'
    );

    await user.click(screen.getByRole('button', { name: '+ Add to Vocabulary' }));
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
    await user.type(screen.getByLabelText(/personal notes/i), 'from an article');
    expect(screen.getByLabelText(/personal notes/i)).toHaveValue('from an article');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Word' }));
    expect(screen.getByRole('textbox', { name: 'Word or phrase to translate' })).toHaveValue('');
    expect(screen.getByLabelText(/personal notes/i)).toHaveValue('');
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
  });
});
