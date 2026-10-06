import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PopupApp } from './PopupApp';
import { invokeMock, listenMock } from '../test/mocks';
import { createTestQueryClient, renderWithQueryClient } from '../test/render';
import { POPUP_ASSISTANT_SIZE, POPUP_DICTIONARY_SIZE } from '../lib/inlineAssistant';
import type { TranslationResult } from '../lib/types';

const translationResult: TranslationResult = {
  text: 'apple',
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  mainTranslation: 'яблоко',
  alternatives: ['плод'],
  sourceSynonyms: [],
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

describe('PopupApp', () => {
  it('shows the dictionary card by default', () => {
    renderWithQueryClient(<PopupApp />);
    expect(screen.getByText(/^Lexora$/i)).toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Source language' })).toHaveTextContent('Auto');
    expect(screen.queryByRole('tab', { name: 'Translate (1)' })).not.toBeInTheDocument();
  });

  it('routes a pending sentence to the inline assistant and resizes', async () => {
    const sentence = 'During the daylight saving time transition the event occurs twice.';
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve(sentence);
      if (cmd === 'translate_text') {
        return Promise.resolve({
          ...translationResult,
          text: sentence,
          mainTranslation: 'Событие происходит дважды.',
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupApp />);

    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Improve (3)' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Translate query' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('resize_popup_window', {
        width: POPUP_ASSISTANT_SIZE.width,
        height: POPUP_ASSISTANT_SIZE.height,
        resizable: true,
      });
    });
  });

  it('keeps a captured word on the dictionary card', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve('apple');
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupApp />);

    expect(await screen.findByText(/^Lexora$/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('resize_popup_window', {
        width: POPUP_DICTIONARY_SIZE.width,
        height: POPUP_DICTIONARY_SIZE.height,
        resizable: false,
      });
    });
  });

  it('still routes a pending sentence after Strict Mode remount', async () => {
    const sentence = 'Please open the assistant with this captured sentence.';
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve(sentence);
      if (cmd === 'translate_text') {
        return Promise.resolve({
          ...translationResult,
          text: sentence,
          mainTranslation: 'Пожалуйста, откройте помощник.',
        });
      }
      return Promise.resolve(null);
    });

    const queryClient = createTestQueryClient();
    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <PopupApp />
        </QueryClientProvider>
      </StrictMode>
    );

    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Translate query' })).not.toBeInTheDocument();
  });

  it('routes a sentence again after unmount even if the same text was just applied', async () => {
    const sentence = 'one two three four five six';
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve(sentence);
      if (cmd === 'translate_text') {
        return Promise.resolve({
          ...translationResult,
          text: sentence,
          mainTranslation: 'Раз два три.',
        });
      }
      return Promise.resolve(null);
    });

    const first = renderWithQueryClient(<PopupApp />);
    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();
    first.unmount();

    renderWithQueryClient(<PopupApp />);
    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Translate query' })).not.toBeInTheDocument();
  });

  it('routes lexora:popup-text sentences to the assistant', async () => {
    let handler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(((event: string, cb: (event: { payload: string }) => void) => {
      if (event === 'lexora:popup-text') {
        handler = cb;
      }
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.resolve({
          ...translationResult,
          mainTranslation: 'Событие происходит дважды.',
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupApp />);
    act(() => {
      handler?.({ payload: 'one two three four five' });
    });

    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();
  });

  it('returns to an empty dictionary card when popup-text is blank', async () => {
    let handler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(((event: string, cb: (event: { payload: string }) => void) => {
      if (event === 'lexora:popup-text') {
        handler = cb;
      }
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.resolve({
          ...translationResult,
          mainTranslation: 'Событие происходит дважды.',
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupApp />);
    act(() => {
      handler?.({ payload: 'please open the assistant with this sentence now' });
    });
    expect(await screen.findByRole('tab', { name: 'Translate (1)' })).toBeInTheDocument();

    act(() => {
      handler?.({ payload: '' });
    });

    expect(await screen.findByText(/^Lexora$/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Translate (1)' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue('');
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('resize_popup_window', {
        width: POPUP_DICTIONARY_SIZE.width,
        height: POPUP_DICTIONARY_SIZE.height,
        resizable: false,
      });
    });
  });
});
