import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GrammarWatchSection } from './GrammarWatchSection';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { GrammarWatchSettings, GrammarWatchStatus } from '../../lib/types';

let settings: GrammarWatchSettings;
let status: GrammarWatchStatus;

beforeEach(() => {
  settings = { enabled: false, excludedApps: ['com.apple.Terminal'] };
  status = { supported: true, accessibilityTrusted: true };
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'get_grammar_watch_settings') return settings;
    if (cmd === 'get_grammar_watch_status') return status;
    if (cmd === 'update_grammar_watch_settings') {
      settings = args?.settings as GrammarWatchSettings;
      return settings;
    }
    return null;
  });
});

function updates(): unknown[] {
  return invokeMock.mock.calls
    .filter(([name]) => name === 'update_grammar_watch_settings')
    .map(([, args]) => (args as { settings: unknown }).settings);
}

describe('GrammarWatchSection', () => {
  it('is off by default and turns on immediately', async () => {
    renderWithQueryClient(<GrammarWatchSection panelId="settings-writing-check" />);
    const toggle = await screen.findByRole('checkbox', { name: /suggest fixes while i type/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(updates()).toEqual([{ enabled: true, excludedApps: ['com.apple.Terminal'] }]),
    );
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('is disabled where the platform cannot watch other apps', async () => {
    status = { supported: false, accessibilityTrusted: false };
    renderWithQueryClient(<GrammarWatchSection panelId="settings-writing-check" />);
    expect(await screen.findByText('Available on macOS and Windows.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /suggest fixes while i type/i })).toBeDisabled();
  });

  it('asks for Accessibility access when it is missing', async () => {
    settings = { ...settings, enabled: true };
    status = { supported: true, accessibilityTrusted: false };
    renderWithQueryClient(<GrammarWatchSection panelId="settings-writing-check" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Grant access' }));
    await waitFor(() =>
      expect(invokeMock.mock.calls.some(([name]) => name === 'request_grammar_watch_access')).toBe(
        true,
      ),
    );
  });

  it('adds and removes excluded apps', async () => {
    renderWithQueryClient(<GrammarWatchSection panelId="settings-writing-check" />);
    const input = await screen.findByLabelText(/never check in these apps/i);
    await waitFor(() => expect(input).toBeEnabled());
    await userEvent.type(input, ' com.tinyspeck.slackmacgap {Enter}');
    await waitFor(() =>
      expect(updates()).toEqual([
        { enabled: false, excludedApps: ['com.apple.Terminal', 'com.tinyspeck.slackmacgap'] },
      ]),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Check again in com.apple.Terminal' }));
    await waitFor(() =>
      expect(updates()[1]).toEqual({ enabled: false, excludedApps: ['com.tinyspeck.slackmacgap'] }),
    );
  });
});
