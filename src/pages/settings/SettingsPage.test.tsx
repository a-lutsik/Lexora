import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import SettingsPage from './SettingsPage';
import { invokeMock } from '../../test/mocks';
import { createTestQueryClient } from '../../test/render';
import type { AppSettings } from '../../lib/types';

const SETTINGS: AppSettings = {
  primaryLanguage: 'en',
  interfaceLanguage: 'ru',
  aiProvider: 'gemini',
  aiModel: 'gemini-3.8-flash',
  customBaseUrl: null,
  cloudflareAccountId: null,
  ttsVoice: 'default',
  stickerCount: 2,
  stickerOpacity: 0.9,
  stickerSources: ['all'],
  quietHoursStart: null,
  quietHoursEnd: null,
  offlineMode: false,
  writingPrivacyMode: false,
  writingAutoCheck: false,
  hotkeyTranslate: 'CmdOrCtrl+Shift+L',
  hotkeyStickers: 'CmdOrCtrl+Shift+S',
  hotkeyVoiceTranslate: 'CmdOrCtrl+Shift+V',
  fallbackAiProvider: 'gemini',
  fallbackAiModel: 'gemini-3.5-flash-lite',
  fallbackEnabled: true,
  imageModel: 'none',
  fallbackImageModel: 'none',
  setupProfile: 'gemini-free',
  ttsEngine: 'gemini',
  modelPackage: 'gemini',
};

let saved: AppSettings;
let failSave: string | null;

function updates(): AppSettings[] {
  return invokeMock.mock.calls
    .filter(([name]) => name === 'update_settings')
    .map(([, args]) => (args as { settings: AppSettings }).settings);
}

function renderPage(section?: string) {
  const path = section ? `/settings?section=${section}` : '/settings';
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  saved = { ...SETTINGS };
  failSave = null;
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    switch (cmd) {
      case 'get_settings':
        return saved;
      case 'update_settings':
        if (failSave) throw new Error(failSave);
        saved = args?.settings as AppSettings;
        return saved;
      case 'get_api_keys_status':
        return { gemini: true };
      case 'get_model_routes':
        return { package: 'gemini', illustrations: false, roles: [] };
      case 'list_languages':
        return [{ id: 1, code: 'en', name: 'English', nativeName: 'English' }];
      case 'list_collections':
      case 'list_categories':
      case 'get_model_catalog':
      case 'get_ai_usage':
        return [];
      case 'get_grammar_watch_settings':
        return { enabled: false, excludedApps: [] };
      case 'get_grammar_watch_status':
        return { supported: true, accessibilityTrusted: true };
      default:
        return null;
    }
  });
});

describe('SettingsPage', () => {
  it('opens AI models first and switches to the chosen section only', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('heading', { name: 'AI models' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(within(nav).getByRole('group', { name: 'Learning' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'AI models' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('heading', { name: 'Privacy' })).not.toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Privacy' }));
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'AI models' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Privacy' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the section named in the URL and filters the list by name', async () => {
    const user = userEvent.setup();
    renderPage('backup');
    expect(await screen.findByRole('heading', { name: 'Backup / Export' })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    await user.type(within(nav).getByRole('searchbox', { name: 'Search settings' }), 'short');
    expect(within(nav).getAllByRole('button')).toHaveLength(1);
    expect(within(nav).getByRole('button', { name: 'Global shortcuts' })).toBeInTheDocument();
  });

  it('groups the sections like the design: AI, Learning, Desktop, Data', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'AI models' });
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    const groups = within(nav).getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['AI', 'Learning', 'Desktop', 'Data']);
    const links = (name: string) =>
      within(within(nav).getByRole('group', { name })).getAllByRole('button').map((b) => b.textContent);
    expect(links('AI')).toEqual(['AI models', 'AI usage']);
    expect(links('Learning')).toEqual(['Languages']);
    expect(links('Desktop')).toEqual([
      'Appearance',
      'Writing check in other apps',
      'Stickers & ambient review',
      'Global shortcuts',
    ]);
    expect(links('Data')).toEqual(['Privacy', 'Backup & export']);
    // macOS overlay title bar: the nav title row drags the window.
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toHaveAttribute('data-tauri-drag-region');
  });

  it('saves a change as soon as it is made and says so', async () => {
    const user = userEvent.setup();
    renderPage('privacy');
    const privacy = await screen.findByRole('checkbox', { name: 'Writing privacy mode' });
    await waitFor(() => expect(privacy).not.toBeChecked());

    await user.click(privacy);
    await waitFor(() => expect(updates()).toHaveLength(1));
    expect(updates()[0]).toMatchObject({ writingPrivacyMode: true, hotkeyTranslate: 'CmdOrCtrl+Shift+L' });
    expect(await screen.findByText('✓ Saved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Settings' })).not.toBeInTheDocument();
  });

  it('shows a failed save next to the field and keeps the edit', async () => {
    const user = userEvent.setup();
    failSave = 'disk is read-only';
    renderPage('privacy');
    const autoCheck = await screen.findByRole('checkbox', { name: 'Writing auto-check' });
    await waitFor(() => expect(autoCheck).not.toBeChecked());

    await user.click(autoCheck);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Not saved: disk is read-only');
    // The error sits in the auto-check block, not under the privacy mode field.
    expect(alert.parentElement).toContainElement(autoCheck);
    expect(autoCheck).toBeChecked();
  });

  it('waits for a slider to settle before saving it', async () => {
    renderPage('stickers');
    const count = await screen.findByLabelText(/max concurrent stickers|max stickers at once/i);
    fireEvent.change(count, { target: { value: '3' } });
    fireEvent.change(count, { target: { value: '4' } });
    expect(updates()).toHaveLength(0);
    await waitFor(() => expect(updates()).toHaveLength(1));
    expect(updates()[0]).toMatchObject({ stickerCount: 4 });
  });

  it('switches the app theme from the Appearance row', async () => {
    const user = userEvent.setup();
    renderPage('appearance');
    const appearance = await screen.findByRole('radiogroup', { name: 'Theme' });
    await user.click(within(appearance).getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(within(appearance).getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(appearance).getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('marks AI models with an amber dot while a role waits for a key', async () => {
    const base = invokeMock.getMockImplementation();
    invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === 'get_model_routes') {
        return {
          package: 'gemini',
          illustrations: false,
          roles: [{
            role: 'text_fast', group: 'text', state: 'needs_key', provider: 'gemini', model: null,
            modelLabel: null, message: '', usingFallback: false, chain: [],
          }],
        };
      }
      return base?.(cmd, args);
    });
    renderPage('privacy');
    const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
    const aiModels = within(nav).getByRole('button', { name: 'AI models' });
    await waitFor(() => expect(aiModels).toHaveAccessibleDescription('Key required'));
    expect(within(nav).getByRole('button', { name: 'Privacy' })).not.toHaveAccessibleDescription();
  });

  it('refuses to save two actions on the same shortcut and says why', async () => {
    renderPage('shortcuts');
    const stickers = await screen.findByRole('button', { name: /^Toggle Stickers shortcut/ });
    fireEvent.click(stickers);
    fireEvent.keyDown(stickers, { key: 'L', code: 'KeyL', metaKey: true, shiftKey: true });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Two actions use the same shortcut/);
    expect(updates()).toHaveLength(0);
  });
});
