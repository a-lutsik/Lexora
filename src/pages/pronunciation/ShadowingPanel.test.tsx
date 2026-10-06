import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithQueryClient } from '../../test/render';
import type { ArticulationTipResult, PronunciationAttemptDto, VocabularyEntryDto } from '../../lib/types';
import type { ShadowPhase } from '../../hooks/useShadowDrill';

const drill = {
  phase: 'idle' as ShadowPhase,
  latest: undefined as PronunciationAttemptDto | undefined,
  tip: undefined as ArticulationTipResult | undefined,
  tipPending: false,
  attempt: 0,
  passed: false,
  noSpeech: false,
  playbackUrl: null as string | null,
  error: null as string | null,
  recorderStatus: 'idle' as const,
  analyser: null as AnalyserNode | null,
  canSay: true,
  say: vi.fn(async () => undefined),
  postpone: vi.fn(),
};

const vocabA: VocabularyEntryDto = {
  id: 1,
  userId: 1,
  lexemeId: 11,
  addedAt: 1,
  isFavorite: false,
  notes: null,
  source: null,
  lexeme: {
    id: 11,
    languageId: 1,
    text: 'Participant',
    normalizedText: 'participant',
    partOfSpeech: 'noun',
    frequencyRank: null,
    phonetic: '/pɑːˈtɪsɪpənt/',
    createdAt: 1,
  },
  translations: [],
  examples: [],
  reviewState: null,
};

const vocabB: VocabularyEntryDto = {
  ...vocabA,
  id: 2,
  lexemeId: 12,
  lexeme: { ...vocabA.lexeme, id: 12, text: 'Banana', normalizedText: 'banana', phonetic: '/bəˈnɑːnə/' },
};

const drillHost: { onAdvance: () => void } = {
  onAdvance: () => undefined,
};

vi.mock('../../hooks/useShadowDrill', () => ({
  useShadowDrill: (args: { onAdvance: () => void }) => {
    drillHost.onAdvance = args.onAdvance;
    return drill;
  },
}));

vi.mock('../../hooks/useVocabulary', () => ({
  useVocabulary: () => ({ data: [vocabA, vocabB], isLoading: false }),
}));

vi.mock('../../hooks/useLanguages', () => ({
  useLanguages: () => ({ data: [{ id: 1, code: 'en', name: 'English', nativeName: 'English', hasTts: true, hasAsr: true }] }),
  resolveLanguageId: () => 1,
}));

import { ShadowingPanel } from './ShadowingPanel';

const failAttempt: PronunciationAttemptDto = {
  id: 9,
  lexemeId: null,
  audioPath: '/tmp/a.webm',
  overallScore: 84,
  recognizedText: 'participant',
  targetText: 'Participant',
  targetIpa: null,
  recognizedIpa: null,
  stressFeedback: 'Stress the second syllable.',
  summary: 'The first vowel is too open.',
  language: 'en',
  createdAt: 1_700_000_000,
  phonemes: [
    {
      id: 1,
      attemptId: 9,
      targetPhoneme: 'ə',
      recognizedPhoneme: 'æ',
      accuracy: 40,
      status: 'miss',
      position: 0,
    },
  ],
};

const passAttempt: PronunciationAttemptDto = {
  ...failAttempt,
  id: 10,
  overallScore: 92,
  summary: 'Clear vowels and crisp consonants.',
};

function renderPanel() {
  return renderWithQueryClient(<ShadowingPanel language="en" />);
}

describe('ShadowingPanel', () => {
  beforeEach(() => {
    drill.phase = 'idle';
    drill.latest = undefined;
    drill.tip = undefined;
    drill.tipPending = false;
    drill.attempt = 0;
    drill.passed = false;
    drill.noSpeech = false;
    drill.playbackUrl = null;
    drill.error = null;
    drill.canSay = true;
    drill.say.mockClear();
    drill.postpone.mockClear();
    drill.postpone.mockImplementation(() => drillHost.onAdvance());
  });

  it('shows the vocabulary word as read-only, not a text field', async () => {
    renderPanel();
    const phrase = await screen.findByLabelText('Phrase to shadow');
    expect(phrase).toHaveTextContent('Participant');
    expect(screen.queryByRole('textbox', { name: 'Phrase to shadow' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Target IPA')).toHaveTextContent('/pɑːˈtɪsɪpənt/');
  });

  it('shows Say / Record and does not use a three-round counter', async () => {
    renderPanel();
    expect(await screen.findByRole('button', { name: 'Say phrase' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to Model' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Phrase' })).toBeInTheDocument();
    expect(screen.getByText('Say / Record')).toBeInTheDocument();
    expect(screen.queryByText(/Round \d of 3/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Postpone phrase' })).not.toBeInTheDocument();
  });

  it('keeps the phrase and shows Postpone when the score is below 90%', async () => {
    drill.phase = 'feedback';
    drill.latest = failAttempt;
    drill.attempt = 2;
    drill.passed = false;
    drill.tip = {
      phoneme: 'ə',
      tip: 'Relax the jaw and keep the vowel central.',
      tonguePosition: 'mid',
      lipPosition: 'neutral',
    };
    renderPanel();

    expect(screen.getAllByText('84%').length).toBeGreaterThan(0);
    expect(screen.getByText('Need 90% to pass')).toBeInTheDocument();
    expect(screen.getByText('The first vowel is too open.')).toBeInTheDocument();
    expect(screen.getByText(/Relax the jaw/)).toBeInTheDocument();
    expect(screen.getByLabelText('Phrase to shadow')).toHaveTextContent('Participant');
    expect(screen.getByText('Attempt 2')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Postpone phrase' }));
    expect(drill.postpone).toHaveBeenCalledTimes(1);
  });

  it('marks a 92% attempt as passed without Postpone', () => {
    drill.phase = 'feedback';
    drill.latest = passAttempt;
    drill.attempt = 1;
    drill.passed = true;
    renderPanel();

    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Postpone phrase' })).not.toBeInTheDocument();
  });

  it('Next Phrase advances via postpone', async () => {
    renderPanel();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next Phrase' }));
    expect(drill.postpone).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByLabelText('Phrase to shadow')).toHaveTextContent('Banana');
    });
  });

  it('shows Stop on Voice and Record while recording', async () => {
    drill.phase = 'recording';
    drill.canSay = false;
    renderPanel();

    const voice = await screen.findByRole('button', { name: 'Stop' });
    expect(voice).toHaveTextContent('Stop');
    expect(screen.getByRole('button', { name: 'Stop recording' })).toHaveTextContent('Stop');
    expect(screen.getByText('Speak now')).toBeInTheDocument();
  });

  it('shows Scoring label and spinner while the attempt is processed', async () => {
    drill.phase = 'scoring';
    drill.canSay = false;
    renderPanel();

    const cta = await screen.findByRole('button', { name: 'Scoring pronunciation' });
    expect(cta).toHaveTextContent('Scoring…');
    expect(cta).toHaveAttribute('aria-busy', 'true');
    expect(cta.querySelector('.drill-cta-spinner')).toBeInTheDocument();
    expect(screen.getByText('Scoring your pronunciation…')).toBeInTheDocument();
  });
});
