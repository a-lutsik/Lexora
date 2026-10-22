import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PopupTranslator } from './PopupTranslator';
import { invokeMock, listenMock, emitMock } from '../test/mocks';
import { renderWithQueryClient } from '../test/render';
import type { TranslationResult } from '../lib/types';

const translationResult: TranslationResult = {
  text: 'apple',
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  mainTranslation: 'яблоко',
  alternatives: ['плод'],
  sourceSynonyms: ['fruit', 'pome'],
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

describe('PopupTranslator', () => {
  it('renders input, header and footer actions', () => {
    renderWithQueryClient(<PopupTranslator />);

    expect(screen.getByText(/^Lexora$/i)).toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Source language' })).toHaveTextContent('Auto');
    expect(
      screen.getByRole('textbox', { name: 'Translate query' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Word' })).toBeDisabled();
    expect(listenMock).toHaveBeenCalledWith(
      'lexora:popup-text',
      expect.any(Function)
    );
  });

  it('shows AI Assistant when a switch callback is provided for long text', async () => {
    const user = userEvent.setup();
    const onOpenAssistant = vi.fn();
    renderWithQueryClient(<PopupTranslator onOpenAssistant={onOpenAssistant} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Translate query' }), {
      target: { value: 'This sentence is definitely long enough to check.' },
    });

    const assistantBtn = screen.getByRole('button', { name: 'Open AI Assistant' });
    expect(assistantBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check Writing' })).not.toBeInTheDocument();

    await user.click(assistantBtn);
    expect(onOpenAssistant).toHaveBeenCalledWith(
      'This sentence is definitely long enough to check.'
    );
  });

  it('shows Check Writing for long text and opens the writing page', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PopupTranslator />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Translate query' }), {
      target: { value: 'This sentence is definitely long enough to check.' },
    });

    const checkBtn = screen.getByRole('button', { name: 'Check Writing' });
    expect(checkBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Add Word' })).not.toBeInTheDocument();

    await user.click(checkBtn);

    expect(emitMock).toHaveBeenCalledWith(
      'lexora:open-writing',
      'This sentence is definitely long enough to check.'
    );
    expect(invokeMock).toHaveBeenCalledWith('open_main_window');
    expect(invokeMock).toHaveBeenCalledWith('close_popup_window');
  });

  it('submits the query and calls translate_text via ipc', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('translate_text', {
        input: {
          text: 'apple',
          sourceLanguage: null,
          targetLanguage: 'ru',
          contextSentence: null,
          lexicalDomain: 'auto',
        },
      });
    });

    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    expect(screen.getByText(/English\s*→\s*Russian/)).toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Word' })).toBeEnabled();
  });

  it('shows a friendly message when translate returns 429', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.reject(new Error('Gemini API error 429: Too Many Requests'));
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many requests/i);
  });

  it('shows a friendly message when no AI model is connected', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.reject(
          new Error(
            'Invalid input: Translation needs an AI model. Open Settings, choose a provider, and add an API key.',
          ),
        );
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Couldn’t translate/i);
    expect(alert).toHaveTextContent(/Open Settings/i);
    expect(alert).toHaveTextContent(/API key/i);
    expect(screen.getByRole('button', { name: '+ Add Word' })).toBeDisabled();
  });

  it('does not call translate for empty/whitespace input', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      '   {Enter}'
    );

    expect(invokeMock).not.toHaveBeenCalledWith(
      'translate_text',
      expect.anything()
    );
  });

  it('closes the popup on Escape', () => {
    renderWithQueryClient(<PopupTranslator />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(invokeMock).toHaveBeenCalledWith('close_popup_window');
  });

  it('closes the popup via the close button', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PopupTranslator />);

    await user.click(screen.getByRole('button', { name: 'Close window' }));
    expect(invokeMock).toHaveBeenCalledWith('close_popup_window');
  });

  it('clears the query field and translation result', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear text' }));

    expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue('');
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
    expect(screen.getByText('Translate a word')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear text' })).not.toBeInTheDocument();
  });

  it('auto-translates pending text from the backend', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve('pending-word');
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('translate_text', {
        input: {
          text: 'pending-word',
          sourceLanguage: null,
          targetLanguage: 'ru',
          contextSentence: null,
          lexicalDomain: 'auto',
        },
      });
    });
    expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue(
      'pending-word'
    );
  });

  it('does not dictionary-translate a captured sentence when the assistant callback is set', async () => {
    let handler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(((event: string, cb: (event: { payload: string }) => void) => {
      if (event === 'lexora:popup-text') {
        handler = cb;
      }
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator onOpenAssistant={vi.fn()} />);
    act(() => {
      handler?.({ payload: 'please open the assistant with this sentence now' });
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      invokeMock.mock.calls.filter((call) => call[0] === 'translate_text')
    ).toHaveLength(0);
    expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue('');
  });

  it('auto-translates pending text again after remount', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve('pending-word');
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      return Promise.resolve(null);
    });

    const first = renderWithQueryClient(<PopupTranslator />);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue(
        'pending-word'
      );
    });
    first.unmount();

    renderWithQueryClient(<PopupTranslator />);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue(
        'pending-word'
      );
    });
    await waitFor(() => {
      const translateCalls = invokeMock.mock.calls.filter(([cmd]) => cmd === 'translate_text');
      expect(translateCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('auto-translates text from the lexora:popup-text event', async () => {
    let handler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(((event: string, cb: (event: { payload: string }) => void) => {
      if (event === 'lexora:popup-text') {
        handler = cb;
      }
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator />);
    act(() => {
      handler?.({ payload: 'event-word' });
    });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('translate_text', {
        input: {
          text: 'event-word',
          sourceLanguage: null,
          targetLanguage: 'ru',
          contextSentence: null,
          lexicalDomain: 'auto',
        },
      });
    });
    expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue(
      'event-word'
    );
  });

  it('clears the query when an empty popup-text event arrives', async () => {
    let handler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(((event: string, cb: (event: { payload: string }) => void) => {
      if (event === 'lexora:popup-text') {
        handler = cb;
      }
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator />);
    act(() => {
      handler?.({ payload: 'manual-open-word' });
    });
    expect(await screen.findByText('яблоко')).toBeInTheDocument();

    act(() => {
      handler?.({ payload: '' });
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Translate query' })).toHaveValue('');
    });
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();
  });

  it('renders source language synonym chips', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );
    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );

    expect(await screen.findByText('fruit')).toBeInTheDocument();
    expect(screen.getByText('pome')).toBeInTheDocument();
    expect(screen.getByLabelText('Source language synonyms')).toBeInTheDocument();
  });

  it('places IPA under the headword', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(
        cmd === 'translate_text'
          ? { ...translationResult, phonetic: '/ˈæp.əl/' }
          : null
      )
    );
    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );

    const heading = await screen.findByRole('heading', { name: 'apple' });
    const ipa = screen.getByText('/ˈæp.əl/');
    expect(heading.compareDocumentPosition(ipa) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(heading.parentElement).toContainElement(ipa);
  });

  it('patches example from lexora:card-enrich event', async () => {
    const user = userEvent.setup();
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    listenMock.mockImplementation(((event: string, cb: (event: { payload: unknown }) => void) => {
      handlers.set(event, cb);
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();

    await waitFor(() => {
      expect(handlers.has('lexora:card-enrich')).toBe(true);
    });

    act(() => {
      handlers.get('lexora:card-enrich')?.({
        payload: {
          lexemeId: 42,
          usageNote: 'Fruit of the Malus tree.',
          exampleSentence: 'She picked a red apple.',
          exampleSentence2: 'An apple a day keeps the doctor away.',
          imagePath: null,
        },
      });
    });

    expect(screen.getByText('No photo yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate photo' })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText((_, el) =>
          Boolean(
            el?.classList.contains('popup-example-text') &&
              el.textContent?.includes('She picked a red')
          )
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText((_, el) =>
          Boolean(
            el?.classList.contains('popup-example-text') &&
              el.textContent?.includes('An apple a day')
          )
        )
      ).toBeInTheDocument();
    });
  });

  it('shows both example sentences from a partial enrich while the photo is still loading', async () => {
    const user = userEvent.setup();
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    listenMock.mockImplementation(((event: string, cb: (event: { payload: unknown }) => void) => {
      handlers.set(event, cb);
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    expect(screen.getByLabelText('Example sentences in context')).toBeInTheDocument();
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
          exampleSentence2: 'An apple a day keeps the doctor away.',
          imagePath: null,
          complete: false,
        },
      });
    });

    expect(screen.getByText('Finding a photo…')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        Boolean(
          el?.classList.contains('popup-example-text') &&
            el.textContent?.includes('She picked a red')
        )
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        Boolean(
          el?.classList.contains('popup-example-text') &&
            el.textContent?.includes('An apple a day')
        )
      )
    ).toBeInTheDocument();
  });

  it('shows the associated photo from lexora:card-enrich instead of abstract art', async () => {
    const user = userEvent.setup();
    const handlers = new Map<string, (event: { payload: unknown }) => void>();
    listenMock.mockImplementation(((event: string, cb: (event: { payload: unknown }) => void) => {
      handlers.set(event, cb);
      return Promise.resolve(() => undefined);
    }) as typeof listenMock);
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'translate_text' ? translationResult : null)
    );

    renderWithQueryClient(<PopupTranslator />);

    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
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
          exampleSentence: null,
          exampleSentence2: null,
          imagePath: '/tmp/apple.jpg',
        },
      });
    });

    const img = await screen.findByRole('img', { name: 'Photo of apple' });
    expect(img).toHaveAttribute('src', 'asset://localhost//tmp/apple.jpg');
    expect(img.closest('.associated-image-frame--hero')).not.toBeNull();
    expect(img.closest('.popup-hero')).not.toBeNull();
    expect(screen.queryByText('Finding a photo…')).not.toBeInTheDocument();
  });

  it('shows an image-specific wait message when refresh hits 429', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.resolve({ ...translationResult, imagePath: '/tmp/old.jpg' });
      }
      if (cmd === 'regenerate_lexeme_image') {
        return Promise.reject(
          new Error(
            'Gemini Image is rate-limited. Wait about 90 seconds, or add an OpenAI API key.'
          )
        );
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByRole('img', { name: 'Photo of apple' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Regenerate photo' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Wait about 90 seconds/i);
    expect(alert).not.toHaveTextContent(/switch modes/i);
  });

  it('passes lexemeId when adding a word', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'add_to_vocabulary') {
        return Promise.resolve({
          id: 1,
          userId: 1,
          lexemeId: 42,
          addedAt: 1,
          isFavorite: false,
          notes: null,
          source: 'popup',
          lexeme: {
            id: 42,
            languageId: 1,
            text: 'apple',
            normalizedText: 'apple',
            partOfSpeech: 'noun',
            frequencyRank: null,
            phonetic: null,
            createdAt: 1,
          },
          translations: [],
          examples: [],
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();

    expect(screen.getByLabelText('Example sentences in context')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Add Word' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('add_to_vocabulary', {
        input: {
          lexemeId: 42,
          text: 'apple',
          sourceLanguage: 'en',
          source: 'popup',
        },
      });
    });

    expect(await screen.findByRole('button', { name: '✓ Added to Vocabulary' })).toBeInTheDocument();
    expect(screen.getByText('яблоко')).toBeInTheDocument();
    expect(screen.queryByText(/Analyzing context/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Example sentences in context')).not.toBeInTheDocument();
    expect(invokeMock.mock.calls.filter(([cmd]) => cmd === 'translate_text')).toHaveLength(1);
  });

  it('does not stack a loading skeleton on top of an existing translation', async () => {
    const user = userEvent.setup();
    let secondTranslate: ((value: TranslationResult) => void) | undefined;
    let translateCalls = 0;
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        translateCalls += 1;
        if (translateCalls === 1) return Promise.resolve(translationResult);
        return new Promise<TranslationResult>((resolve) => {
          secondTranslate = resolve;
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Translate query' });
    await user.clear(input);
    await user.type(input, 'pear{Enter}');

    expect(await screen.findByText(/Analyzing context/)).toBeInTheDocument();
    expect(screen.queryByText('яблоко')).not.toBeInTheDocument();

    act(() => {
      secondTranslate?.({
        ...translationResult,
        text: 'pear',
        mainTranslation: 'груша',
      });
    });
    expect(await screen.findByText('груша')).toBeInTheDocument();
    expect(screen.queryByText(/Analyzing context/)).not.toBeInTheDocument();
  });

  it('does not keep Finding a photo when the translation has no lexeme id', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(
        cmd === 'translate_text'
          ? { ...translationResult, lexemeId: null, isOfflineFallback: true, imagePath: null }
          : null
      )
    );

    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByText('яблоко')).toBeInTheDocument();
    expect(screen.queryByText('Finding a photo…')).not.toBeInTheDocument();
  });

  it('shows a translation error instead of a silent empty card', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.reject(new Error('Empty response from Gemini (finishReason: MAX_TOKENS)'));
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    await user.type(
      screen.getByRole('textbox', { name: 'Translate query' }),
      'apple{Enter}'
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/empty answer/i);
    expect(screen.getByRole('button', { name: '+ Add Word' })).toBeDisabled();
  });

  it.each(['C++', '(', '[x', 'a.b*', '\\'])(
    'renders a result for the regex-special query "%s" without crashing',
    async (query) => {
      const user = userEvent.setup();
      invokeMock.mockImplementation((cmd: string) =>
        Promise.resolve(
          cmd === 'translate_text'
            ? {
                ...translationResult,
                text: query,
                mainTranslation: 'перевод',
                exampleSentence: `Here we use ${query} in a sentence.`,
                exampleSentence2: `And ${query.toUpperCase()} again.`,
              }
            : null,
        ),
      );
      renderWithQueryClient(<PopupTranslator />);

      await user.type(
        screen.getByRole('textbox', { name: 'Translate query' }),
        `${query.replace(/[{[]/g, '$&$&')}{Enter}`,
      );

      expect(await screen.findByText('перевод')).toBeInTheDocument();
      const examples = screen.getByLabelText('Example sentences in context');
      expect(examples.querySelector('.popup-example-highlight')).toHaveTextContent(query);
    },
  );

  it('shows an error and keeps the Add button usable when adding a word fails', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'add_to_vocabulary') return Promise.reject(new Error('database is locked'));
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'apple{Enter}');
    await screen.findByText('яблоко');

    await user.click(screen.getByRole('button', { name: '+ Add Word' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t add this word/i);
    expect(screen.queryByRole('button', { name: '✓ Added to Vocabulary' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Word' })).toBeEnabled();
  });

  it('clears the add error when a new word is looked up', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'add_to_vocabulary') return Promise.reject(new Error('database is locked'));
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupTranslator />);
    const input = screen.getByRole('textbox', { name: 'Translate query' });
    await user.type(input, 'apple{Enter}');
    await screen.findByText('яблоко');
    await user.click(screen.getByRole('button', { name: '+ Add Word' }));
    await screen.findByRole('alert');

    await user.clear(input);
    await user.type(input, 'pear{Enter}');

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  describe('frequency badge', () => {
    async function lookup(frequencyHint: string | null) {
      const user = userEvent.setup();
      invokeMock.mockImplementation((cmd: string) =>
        Promise.resolve(cmd === 'translate_text' ? { ...translationResult, frequencyHint } : null)
      );
      renderWithQueryClient(<PopupTranslator />);
      await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'apple{Enter}');
      await screen.findByText('яблоко');
    }

    it('shows nothing when the word has no frequency data (no invented numbers)', async () => {
      await lookup(null);
      expect(screen.queryByText(/★/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Top \d/)).not.toBeInTheDocument();
      expect(screen.queryByText(/3,241|4,200/)).not.toBeInTheDocument();
    });

    it.each([
      ['top-1000', 'Top 1,000'],
      ['top-5000', 'Top 5,000'],
      ['rank-12345', '★ 12,345'],
    ])('renders the real hint %s as "%s"', async (hint, label) => {
      await lookup(hint);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.queryByText(/3,241|4,200/)).not.toBeInTheDocument();
    });
  });
});

describe('PopupTranslator collocations', () => {
  const endResult: TranslationResult = { ...translationResult, text: 'end', mainTranslation: 'конец', lexemeId: 7 };

  function mockTranslate(result: TranslationResult) {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(result);
      if (cmd === 'get_collocations') {
        return Promise.resolve([
          {
            id: 1, lexemeId: 7, text: 'in the end', pattern: 'prep + noun', translation: 'в конце концов',
            example: 'In the end, it worked.', focus: 'in', distractors: ['at'], nuance: null, vocabularyEntryId: null,
          },
        ]);
      }
      return Promise.resolve(null);
    });
  }

  it('switches to the collocations view and Esc goes back to the word instead of closing', async () => {
    const user = userEvent.setup();
    mockTranslate(endResult);
    renderWithQueryClient(<PopupTranslator />);

    await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'end{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Show collocations' }));

    expect(await screen.findByText('в конце концов')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith('get_collocations', { lexemeId: 7, targetLanguage: 'ru' });
    expect(screen.queryByText('конец')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByText('конец')).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalledWith('close_popup_window');
  });

  it('moves focus into the view and back to the button', async () => {
    const user = userEvent.setup();
    mockTranslate(endResult);
    renderWithQueryClient(<PopupTranslator />);

    await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'end{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Show collocations' }));
    const back = screen.getByRole('button', { name: 'Back to translation' });
    expect(back).toHaveFocus();

    await user.click(back);
    expect(await screen.findByRole('button', { name: 'Show collocations' })).toHaveFocus();
  });

  it.each([
    ['a multi-word phrase', { text: 'in the end', partOfSpeech: null }],
    ['a phrase part of speech', { text: 'goodbye', partOfSpeech: 'phrase' as const }],
    ['an offline result', { isOfflineFallback: true }],
    ['an unsaved word', { lexemeId: null }],
  ])('hides the button for %s', async (_case, patch) => {
    const user = userEvent.setup();
    mockTranslate({ ...endResult, ...patch });
    renderWithQueryClient(<PopupTranslator />);

    await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'end{Enter}');
    expect(await screen.findByText('конец')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show collocations' })).not.toBeInTheDocument();
  });
});

describe('PopupTranslator language pair', () => {
  function mockSettings(primaryLanguage: string, interfaceLanguage: string) {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_settings') return Promise.resolve({ primaryLanguage, interfaceLanguage });
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      return Promise.resolve(null);
    });
  }

  it('always shows the pair as codes in the header, before any lookup', async () => {
    mockSettings('en', 'ru');
    renderWithQueryClient(<PopupTranslator />);

    const pair = await screen.findByTestId('popup-language-pair');
    await waitFor(() => expect(pair).toHaveTextContent(/Auto.*RU/));
    expect(screen.getByText(/Auto\s*→\s*Russian/)).toBeInTheDocument();
  });

  it('swaps source and target from the header', async () => {
    const user = userEvent.setup();
    mockSettings('en', 'ru');
    renderWithQueryClient(<PopupTranslator />);
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Target language' })).toHaveTextContent('Russian'),
    );

    await user.click(screen.getByRole('button', { name: 'Swap languages' }));

    expect(screen.getByRole('combobox', { name: 'Source language' })).toHaveTextContent('Russian');
    expect(screen.getByRole('combobox', { name: 'Target language' })).toHaveTextContent('English');
  });

  it('refuses to translate when source and target are the same language', async () => {
    const user = userEvent.setup();
    mockSettings('en', 'en');
    renderWithQueryClient(<PopupTranslator />);
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Target language' })).toHaveTextContent('English'),
    );

    await user.click(screen.getByRole('combobox', { name: 'Source language' }));
    await user.click(screen.getAllByRole('option', { name: /^English/ })[0] as HTMLElement);
    expect(screen.getByRole('combobox', { name: 'Source language' })).toHaveTextContent('English');

    expect(screen.getByText(/Source and target languages are the same/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Translate query' }), 'apple{Enter}');
    expect(invokeMock).not.toHaveBeenCalledWith('translate_text', expect.anything());
  });
});
