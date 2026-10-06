import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveInterpreterTab } from './LiveInterpreterTab';
import { ChannelMock, invokeMock } from '../../../test/mocks';
import { installFakeAudio } from '../../../test/fakeAudio';
import { createTestQueryClient, renderWithQueryClient } from '../../../test/render';
import type { ModelRoutes, RealtimeEvent, RoleState } from '../../../lib/types';

function interpreterRoutes(state: RoleState, message = ''): ModelRoutes {
  return {
    package: 'gemini',
    illustrations: false,
    roles: [
      {
        role: 'live_interpreter',
        group: 'voice',
        state,
        provider: 'gemini',
        model: 'gemini-3.5-live-translate-preview',
        modelLabel: 'Gemini 3.5 Live Translate',
        message,
        usingFallback: false,
        chain: [{ provider: 'gemini', model: 'gemini-3.5-live-translate-preview' }],
      },
    ],
  };
}

describe('LiveInterpreterTab', () => {
  let channel: ChannelMock<RealtimeEvent> | null = null;
  let routes = interpreterRoutes('ready');

  beforeEach(() => {
    channel = null;
    routes = interpreterRoutes('ready');
    installFakeAudio();
    invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === 'get_model_routes') return routes;
      if (cmd === 'realtime_start') {
        channel = args?.onEvent as ChannelMock<RealtimeEvent>;
        return {
          sessionId: 4,
          model: 'gemini-3.5-live-translate-preview',
          inputSampleRate: 16_000,
          outputSampleRate: 24_000,
        };
      }
      return null;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('interprets into the target language and shows original + translation', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LiveInterpreterTab sourceLang="auto" targetLang="ru" />);

    await user.click(screen.getByLabelText(/Repeat speech that is already in Russian/));
    const start = screen.getByRole('button', { name: 'Start live interpretation into Russian' });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('realtime_start', {
        input: {
          mode: 'interpreter',
          targetLanguage: 'ru',
          sourceLanguage: null,
          echoTargetLanguage: true,
        },
        onEvent: expect.any(ChannelMock),
      }),
    );

    act(() => {
      channel?.onmessage({ type: 'inputTranscript', text: 'Where is the station?', language: 'en' });
      channel?.onmessage({ type: 'outputTranscript', text: 'Где вокзал?', language: 'ru' });
    });
    expect(screen.getByText('Where is the station?')).toBeInTheDocument();
    expect(screen.getByText('Где вокзал?')).toHaveAttribute('lang', 'ru');

    await user.click(screen.getByRole('button', { name: 'Stop live interpretation' }));
    expect(invokeMock).toHaveBeenCalledWith('realtime_stop', { sessionId: 4 });
  });

  it('stops the session when the target language changes', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();
    const withClient = (targetLang: string) => (
      <QueryClientProvider client={client}>
        <LiveInterpreterTab sourceLang="en" targetLang={targetLang} />
      </QueryClientProvider>
    );
    const view = render(withClient('ru'));
    const start = screen.getByRole('button', { name: 'Start live interpretation into Russian' });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);
    await screen.findByRole('button', { name: 'Stop live interpretation' });

    view.rerender(withClient('de'));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('realtime_stop', { sessionId: 4 }));
    expect(await screen.findByText(/Target language changed/)).toBeInTheDocument();
  });

  it('explains why interpretation is unavailable', async () => {
    routes = interpreterRoutes('unsupported', 'OpenAI пока не поддерживается для живого перевода');
    renderWithQueryClient(<LiveInterpreterTab sourceLang="auto" targetLang="ru" />);
    expect(
      await screen.findByText(/Live interpretation is unavailable: OpenAI пока не поддерживается/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start live interpretation into Russian' })).toBeDisabled();
  });
});
