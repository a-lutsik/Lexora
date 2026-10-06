import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PronunciationPage from './PronunciationPage';
import { invokeMock } from '../../test/mocks';
import type { MinimalPairDto, PhonemePatternDto, PronunciationAttemptDto } from '../../lib/types';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const pair: MinimalPairDto = {
  id: 1,
  wordA: 'ship',
  wordB: 'sheep',
  ipaA: '/ʃɪp/',
  ipaB: '/ʃiːp/',
  contrastPhonemeA: 'ɪ',
  contrastPhonemeB: 'iː',
  contrastType: 'vowel',
  language: 'en',
};

const problem: PhonemePatternDto = {
  id: 2,
  phoneme: 'θ',
  language: 'en',
  occurrenceCount: 4,
  lastSeenAt: 1,
  sampleTarget: 'θ',
  sampleRecognized: 's',
};

const historyItem: PronunciationAttemptDto = {
  id: 3,
  lexemeId: null,
  audioPath: '/tmp/a.webm',
  overallScore: 81,
  recognizedText: 'ship',
  targetText: 'ship',
  targetIpa: '/ʃɪp/',
  recognizedIpa: '/ʃɪp/',
  stressFeedback: null,
  summary: 'Clear vowels.',
  language: 'en',
  createdAt: 1_700_000_000,
  phonemes: [],
};

function renderPage(path = '/pronunciation') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PronunciationPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mockIpc() {
  invokeMock.mockImplementation((cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'get_settings') return Promise.resolve({ primaryLanguage: 'en' });
    if (cmd === 'get_minimal_pairs') return Promise.resolve([pair]);
    if (cmd === 'get_problem_phonemes') return Promise.resolve([problem]);
    if (cmd === 'get_pronunciation_history') return Promise.resolve([historyItem]);
    if (cmd === 'resolve_word_image') return Promise.resolve(null);
    if (cmd === 'list_languages') {
      return Promise.resolve([
        { id: 1, code: 'en', name: 'English', nativeName: 'English', hasTts: true, hasAsr: true },
      ]);
    }
    if (cmd === 'list_vocabulary') {
      return Promise.resolve([
        {
          id: 1,
          userId: 1,
          lexemeId: 1,
          addedAt: 1,
          isFavorite: false,
          notes: null,
          source: null,
          lexeme: {
            id: 1,
            languageId: 1,
            text: 'apple',
            normalizedText: 'apple',
            partOfSpeech: 'noun',
            frequencyRank: 500,
            phonetic: '/ˈæp.əl/',
            createdAt: 1,
          },
          translations: [],
          examples: [],
          reviewState: null,
        },
      ]);
    }
    if (cmd === 'resolve_pronunciation_model') {
      const text = String(args?.text ?? '').trim().toLowerCase();
      if (text === 'ok' || text === 'okay') {
        return Promise.resolve({ spokenText: 'okay', ipa: '/oʊˈkeɪ/' });
      }
      return Promise.resolve({ spokenText: args?.text ?? '', ipa: null });
    }
    return Promise.resolve(null);
  });
}

describe('PronunciationPage', () => {
  it('renders practice controls and pre-fills a word from the query string', async () => {
    mockIpc();
    renderPage('/pronunciation?word=think&ipa=%2F%CE%B8%C9%AA%C5%8Bk%2F');

    expect(screen.getByRole('heading', { name: 'Pronunciation Coach' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Word or phrase')).toHaveValue('think');
    });
    expect(screen.getByRole('button', { name: 'Record attempt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to Model' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Phrase' })).toBeInTheDocument();
    expect(screen.getByLabelText('Target IPA (optional)')).toHaveValue('/θɪŋk/');
    expect(await screen.findByText('/θ/')).toBeInTheDocument();
  });

  it('switches to minimal pairs and shows the studio contrast', async () => {
    mockIpc();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: 'Minimal pairs' }));
    expect(
      await screen.findByRole('heading', { name: 'Pronunciation: Minimal Pairs' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('sheep')).toBeInTheDocument();
    expect(screen.getAllByText('ship').length).toBeGreaterThan(0);
    expect(screen.getByText(/Phoneme Contrast: \/ɪ\/ vs \/iː\//)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to ship' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to sheep' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Say / Record' })).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Pronunciation score' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Problem sounds' })).not.toBeInTheDocument();
  });

  it('lists history attempts', async () => {
    mockIpc();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: 'History' }));
    expect(await screen.findByText('ship')).toBeInTheDocument();
    expect(screen.getByText('81')).toBeInTheDocument();
  });

  it('opens shadowing from vocabulary and does not copy the Practice phrase', async () => {
    mockIpc();
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Word or phrase'), 'OK');
    await user.click(screen.getByRole('tab', { name: 'Shadowing' }));

    expect(await screen.findByRole('button', { name: 'Say phrase' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Phrase to shadow')).toHaveTextContent('apple');
    });
    expect(screen.queryByRole('textbox', { name: 'Phrase to shadow' })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('OK')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to Model' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Phrase' })).toBeInTheDocument();
    expect(screen.queryByText(/Round \d of 3/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play model audio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record shadow' })).not.toBeInTheDocument();
  });

  it('auto-fills IPA for OK when transcription is left empty', async () => {
    mockIpc();
    const user = userEvent.setup();
    renderPage();

    const word = screen.getByLabelText('Word or phrase');
    await user.type(word, 'OK');

    await waitFor(() => {
      expect(screen.getByLabelText('Target IPA (optional)')).toHaveValue('/oʊˈkeɪ/');
    });
    expect(invokeMock).toHaveBeenCalledWith(
      'resolve_pronunciation_model',
      expect.objectContaining({ text: 'OK', language: 'en' }),
    );
  });
});
