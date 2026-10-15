import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DialoguePage from './DialoguePage';
import { ChannelMock, invokeMock } from '../../test/mocks';
import { installFakeAudio } from '../../test/fakeAudio';
import type {
  DialogueScenarioDto,
  DialogueSessionDto,
  ModelRoutes,
  RealtimeEvent,
  RoleState,
} from '../../lib/types';

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
            kind: 'guided',
            origin: 'builtin',
            baseSlug: null,
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
    expect(await screen.findByText(/Live conversation is unavailable: Gemini API key is required/)).toBeInTheDocument();
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

describe('DialoguePage — failed auto-start', () => {
  const startCalls = () =>
    invokeMock.mock.calls.filter(([cmd]) => cmd === 'start_dialogue_session').length;

  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('tries once, shows the error and does not hammer the backend', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'start_dialogue_session') throw new Error('AI provider is not configured');
      return baseInvoke(cmd);
    });

    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // Give a runaway effect loop time to show itself (it made thousands of calls per second).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(startCalls()).toBe(1);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('starts the scenario when the learner presses "Try again"', async () => {
    const user = userEvent.setup();
    let failing = true;
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'start_dialogue_session') {
        if (failing) throw new Error('offline');
        return openingSession;
      }
      return baseInvoke(cmd);
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(startCalls()).toBe(2);

    failing = false;
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByText('What kind of roast would you like with your flat white today?'),
    ).toBeInTheDocument();
    expect(startCalls()).toBe(3);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('starts the scenario once on success', async () => {
    invokeMock.mockImplementation(baseInvoke);
    renderPage();
    await screen.findByText('What kind of roast would you like with your flat white today?');
    expect(startCalls()).toBe(1);
  });
});

// ── Scenarios in the learner's language + the learner's own scenarios ──

function scenario(overrides: Partial<DialogueScenarioDto>): DialogueScenarioDto {
  return {
    id: 50,
    slug: 'kaffeehaus-b2-de',
    title: 'Im Café (B2)',
    level: 'B2',
    language: 'de',
    description: 'Bestelle einen Kaffee.',
    tutorRole: 'You are a barista. Speak only German.',
    openingLine: 'Guten Tag! Was darf es sein?',
    suggestedVocab: ['Milchkaffee'],
    sortOrder: 1,
    kind: 'guided',
    origin: 'generated',
    baseSlug: 'coffee-shop-london-b2',
    ...overrides,
  };
}

type Backend = {
  language: string;
  scenarios: DialogueScenarioDto[];
  generate?: () => Promise<unknown>;
  create?: (input: unknown) => Promise<unknown>;
};

function useBackend(backend: Backend) {
  invokeMock.mockReset();
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    switch (cmd) {
      case 'get_settings':
        return { primaryLanguage: backend.language, offlineMode: false, aiProvider: 'openai' };
      case 'list_dialogue_scenarios':
        return backend.scenarios.filter((sc) => sc.language === args?.['language']);
      case 'generate_dialogue_scenarios':
        return backend.generate?.() ?? { created: 0, remaining: 0 };
      case 'create_dialogue_scenario':
        return backend.create?.(args?.['input']) ?? null;
      case 'start_dialogue_session':
        return { ...openingSession, language: backend.language };
      default:
        return null;
    }
  });
}

describe('DialoguePage — scenarios per language', () => {
  const startCalls = () =>
    invokeMock.mock.calls.filter(([cmd]) => cmd === 'start_dialogue_session');

  it('starts the first scenario of the learner language, not the English coffee shop', async () => {
    useBackend({ language: 'de', scenarios: [scenario({})] });
    renderPage();

    await waitFor(() => expect(startCalls()).toHaveLength(1));
    expect(startCalls()[0]?.[1]).toEqual({ input: { scenarioId: 50, language: 'de' } });
  });

  it('offers to open Practice Scenarios when the language has none, without starting a session', async () => {
    const user = userEvent.setup();
    useBackend({ language: 'de', scenarios: [] });
    renderPage();

    expect(await screen.findByText(/no scenarios in German yet/i)).toBeInTheDocument();
    expect(startCalls()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Open Practice Scenarios' }));
    expect(screen.getByRole('heading', { name: 'Practice Scenarios' })).toBeInTheDocument();
  });

  it('generates the scenarios from the English ones and lists them', async () => {
    const user = userEvent.setup();
    const backend: Backend = { language: 'de', scenarios: [] };
    backend.generate = async () => {
      backend.scenarios = [scenario({})];
      return { created: 1, remaining: 0 };
    };
    useBackend(backend);
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    await user.click(await screen.findByRole('button', { name: 'Generate scenarios in German' }));

    expect(invokeMock).toHaveBeenCalledWith('generate_dialogue_scenarios', { language: 'de' });
    expect(await screen.findByRole('status')).toHaveTextContent('Generated 1 scenarios.');
    expect(await screen.findByText('Im Café (B2)')).toBeInTheDocument();
  });

  it('tells the learner to press again when only part of the scenarios were generated', async () => {
    const user = userEvent.setup();
    useBackend({
      language: 'de',
      scenarios: [scenario({})],
      generate: async () => ({ created: 2, remaining: 3 }),
    });
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    await user.click(await screen.findByRole('button', { name: 'Generate scenarios in German' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/2 scenarios, 3 left/);
  });

  it('shows the generation error', async () => {
    const user = userEvent.setup();
    useBackend({
      language: 'de',
      scenarios: [scenario({})],
      generate: async () => {
        throw new Error('AI provider is not configured');
      },
    });
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    await user.click(await screen.findByRole('button', { name: 'Generate scenarios in German' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('does not offer generation for English, which already has the built-in scenarios', async () => {
    const user = userEvent.setup();
    useBackend({ language: 'en', scenarios: [scenario({ language: 'en', origin: 'builtin' })] });
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    expect(await screen.findByRole('button', { name: 'Add scenario' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generate scenarios/ })).not.toBeInTheDocument();
  });
});

describe('DialoguePage — own scenarios', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  async function openAddDialog() {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    await user.click(await screen.findByRole('button', { name: 'Add scenario' }));
    return { user, dialog: await screen.findByRole('dialog', { name: 'Add scenario' }) };
  }

  it('creates a situation scenario from a title and a description', async () => {
    const create = vi.fn(async () => scenario({ id: 51, origin: 'custom' }));
    useBackend({ language: 'de', scenarios: [scenario({})], create });
    const { user, dialog } = await openAddDialog();

    const submit = within(dialog).getByRole('button', { name: 'Create scenario' });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Title'), 'Beim Arzt');
    await user.type(
      within(dialog).getByLabelText('Describe the situation'),
      'Ich habe Kopfschmerzen und brauche einen Termin.',
    );
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      language: 'de',
      level: 'B1',
      kind: 'guided',
      title: 'Beim Arzt',
      description: 'Ich habe Kopfschmerzen und brauche einen Termin.',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('creates a free conversation without a title or description', async () => {
    const create = vi.fn(async () => scenario({ id: 52, origin: 'custom', kind: 'free' }));
    useBackend({ language: 'de', scenarios: [scenario({})], create });
    const { user, dialog } = await openAddDialog();

    await user.click(within(dialog).getByRole('radio', { name: /Free conversation/ }));
    const submit = within(dialog).getByRole('button', { name: 'Create scenario' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'free', language: 'de', title: '', description: '' }),
    );
  });

  it('keeps the dialog open and shows the error when creating fails', async () => {
    const create = vi.fn(async () => {
      throw new Error('AI provider is not configured');
    });
    useBackend({ language: 'de', scenarios: [scenario({})], create });
    const { user, dialog } = await openAddDialog();

    await user.click(within(dialog).getByRole('radio', { name: /Free conversation/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Create scenario' }));

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes the dialog with Escape', async () => {
    useBackend({ language: 'de', scenarios: [scenario({})] });
    const { user } = await openAddDialog();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes a custom scenario after a second press and never offers it for built-ins', async () => {
    const user = userEvent.setup();
    const builtin = scenario({ id: 1, slug: 'coffee-shop-london-b2', language: 'en', origin: 'builtin', title: 'Coffee' });
    const custom = scenario({ id: 7, slug: 'custom-1', language: 'en', origin: 'custom', title: 'Mine' });
    useBackend({ language: 'en', scenarios: [builtin, custom] });
    renderPage();

    await user.click(await screen.findByRole('tab', { name: 'Practice Scenarios' }));
    await screen.findByText('Mine');
    expect(screen.queryByRole('button', { name: 'Delete Coffee' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Mine' }));
    expect(invokeMock).not.toHaveBeenCalledWith('delete_dialogue_scenario', expect.anything());

    await user.click(screen.getByRole('button', { name: 'Confirm deleting Mine' }));
    expect(invokeMock).toHaveBeenCalledWith('delete_dialogue_scenario', { id: 7 });
  });
});
