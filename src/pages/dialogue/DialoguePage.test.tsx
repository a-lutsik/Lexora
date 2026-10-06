import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DialoguePage from './DialoguePage';
import { ChannelMock, invokeMock } from '../../test/mocks';
import { installFakeAudio } from '../../test/fakeAudio';
import type { DialogueSessionDto, ModelRoutes, RealtimeEvent, RoleState } from '../../lib/types';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
  invoke: (...args: unknown[]) => invokeMock(...args),
  // Getter: the hoisted factory runs before imports are initialised.
  get Channel() {
    return ChannelMock;
  },
}));

const openingSession: DialogueSessionDto = {
  id: 10,
  scenarioId: 1,
  scenarioTitle: 'Coffee Shop in London (B2 Level)',
  scenarioLevel: 'B2',
  scenarioSlug: 'coffee-shop-london-b2',
  language: 'en',
  sessionScore: null,
  turnCount: 0,
  status: 'active',
  turns: [
    {
      id: 100,
      sessionId: 10,
      role: 'tutor',
      text: 'What kind of roast would you like with your flat white today?',
      audioPath: null,
      turnScore: null,
      fluencyScore: null,
      clarityScore: null,
      grammarScore: null,
      suggestions: ['medium roast', 'dark roast', 'Arabica', 'single origin'],
      sortOrder: 0,
      createdAt: 1_700_000_000,
    },
  ],
  createdAt: 1_700_000_000,
  updatedAt: 1_700_000_000,
};

const afterReply: DialogueSessionDto = {
  ...openingSession,
  sessionScore: 92,
  turnCount: 1,
  turns: [
    ...openingSession.turns,
    {
      id: 101,
      sessionId: 10,
      role: 'user',
      text: 'medium roast',
      audioPath: null,
      turnScore: 95,
      fluencyScore: 92,
      clarityScore: 92,
      grammarScore: 96,
      suggestions: [],
      sortOrder: 1,
      createdAt: 1_700_000_001,
    },
    {
      id: 102,
      sessionId: 10,
      role: 'tutor',
      text: 'Excellent choice — medium roast it is.',
      audioPath: null,
      turnScore: null,
      fluencyScore: null,
      clarityScore: null,
      grammarScore: null,
      suggestions: ['hot please', 'with oat milk'],
      sortOrder: 2,
      createdAt: 1_700_000_002,
    },
  ],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dialogue']}>
        <DialoguePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function baseInvoke(cmd: string): Promise<unknown> {
      if (cmd === 'get_settings') {
        return { primaryLanguage: 'en', offlineMode: false, aiProvider: 'openai' };
      }
      if (cmd === 'list_dialogue_scenarios') {
        return [
          {
            id: 1,
            slug: 'coffee-shop-london-b2',
            title: 'Coffee Shop in London (B2 Level)',
            level: 'B2',
            language: 'en',
            description: 'Café practice',
            tutorRole: 'barista',
            openingLine:
              openingSession.turns[0]?.text
              ?? 'What kind of roast would you like with your flat white today?',
            suggestedVocab: openingSession.turns[0]?.suggestions ?? [],
            sortOrder: 1,
          },
        ];
      }
      if (cmd === 'start_dialogue_session') return openingSession;
      if (cmd === 'send_dialogue_turn') return afterReply;
      if (cmd === 'play_tts') return null;
      return null;
}

describe('DialoguePage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockImplementation(baseInvoke);
  });

  it('highlights AI Dialogue tab and shows opening tutor line with play', async () => {
    renderPage();
    const dialogueTab = await screen.findByRole('tab', { name: 'AI Dialogue' });
    expect(dialogueTab).toHaveAttribute('aria-selected', 'true');
    expect(dialogueTab).toHaveClass('is-active');

    await expect(
      screen.findByRole('heading', { name: 'Coffee Shop in London (B2 Level)' }),
    ).resolves.toBeInTheDocument();
    expect(
      await screen.findByText('What kind of roast would you like with your flat white today?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play tutor line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Say or send reply' })).toBeInTheDocument();
    expect(screen.getByText('Press or hold Spacebar to reply')).toBeInTheDocument();
  });

  it('shows empty score ring until a reply, then updates from chip', async () => {
    const user = userEvent.setup();
    renderPage();

    const ring = await screen.findByRole('meter', { name: 'Current turn score' });
    expect(ring).toHaveAttribute('aria-valuetext', 'No score yet');
    expect(within(ring).getByText('—')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'medium roast' }));

    await waitFor(() => {
      expect(ring).toHaveAttribute('aria-valuenow', '95');
    });
    expect(within(ring).getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith(
      'send_dialogue_turn',
      expect.objectContaining({
        input: expect.objectContaining({ text: 'medium roast' }),
      }),
    );
  });

  it('toggles recording on Space tap when not in a text field', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    renderPage();
    await screen.findByRole('heading', { name: 'Coffee Shop in London (B2 Level)' });

    await user.keyboard('[Space]');
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });
  });
});

function liveRoutes(state: RoleState, message = ''): ModelRoutes {
  return {
    package: 'gemini',
    illustrations: false,
    roles: [
      {
        role: 'realtime_voice',
        group: 'voice',
        state,
        provider: 'gemini',
        model: 'gemini-3.8-live',
        modelLabel: 'Gemini 3.8 Live',
        message,
        usingFallback: false,
        chain: [{ provider: 'gemini', model: 'gemini-3.8-live' }],
      },
    ],
  };
}

describe('DialoguePage — live conversation', () => {
  let channel: ChannelMock<RealtimeEvent> | null = null;
  let routes: ModelRoutes = liveRoutes('ready');

  const emit = (event: RealtimeEvent) =>
    act(() => {
      channel?.onmessage(event);
    });

  beforeEach(() => {
    channel = null;
    routes = liveRoutes('ready');
    installFakeAudio();
    invokeMock.mockReset();
    invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === 'get_model_routes') return routes;
      if (cmd === 'realtime_start') {
        channel = args?.onEvent as ChannelMock<RealtimeEvent>;
        return { sessionId: 1, model: 'gemini-3.8-live', inputSampleRate: 16_000, outputSampleRate: 24_000 };
      }
      return baseInvoke(cmd);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('explains why live mode cannot start without a Gemini key', async () => {
    routes = liveRoutes('needs_key', 'Нужен ключ Gemini');
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('What kind of roast would you like with your flat white today?');

    await user.click(screen.getByRole('button', { name: 'Live conversation' }));
    expect(await screen.findByText(/Live conversation is unavailable: Нужен ключ Gemini/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start live conversation' })).toBeDisabled();
    expect(screen.queryByText('Press or hold Spacebar to reply')).not.toBeInTheDocument();
  });

  it('streams a live exchange into the thread until it is saved and scored', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('What kind of roast would you like with your flat white today?');

    await user.click(screen.getByRole('button', { name: 'Live conversation' }));
    const start = await screen.findByRole('button', { name: 'Start live conversation' });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('realtime_start', {
        input: { mode: 'dialogue', dialogueSessionId: 10 },
        onEvent: expect.any(ChannelMock),
      }),
    );
    expect(await screen.findByRole('button', { name: 'End live conversation' })).toBeInTheDocument();

    emit({ type: 'inputTranscript', text: 'medium roast', language: 'en' });
    emit({ type: 'outputTranscript', text: 'Excellent choice — medium roast it is.', language: null });
    emit({ type: 'turnComplete' });
    expect(screen.getByText('medium roast', { selector: '.dialogue-msg--live p' })).toBeInTheDocument();

    emit({ type: 'turnSaved', session: afterReply });
    await waitFor(() => {
      expect(document.querySelector('.dialogue-msg--live')).toBeNull();
    });
    expect(screen.getByText('Excellent choice — medium roast it is.')).toBeInTheDocument();
    const ring = screen.getByRole('meter', { name: 'Current turn score' });
    expect(ring).toHaveAttribute('aria-valuenow', '95');

    await user.click(screen.getByRole('button', { name: 'End live conversation' }));
    expect(invokeMock).toHaveBeenCalledWith('realtime_stop', { sessionId: 1 });
  });
});
