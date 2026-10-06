import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetupWizard } from './SetupWizard';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
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
  modelPackage: 'gemini',
};

const GEMINI_KEY = 'AIzaSyD-test-key-0123456789abcdefg';

function renderWizard() {
  const onApplied = vi.fn();
  const onClose = vi.fn();
  renderWithQueryClient(
    <SetupWizard settings={SETTINGS} keysStatus={{}} onClose={onClose} onApplied={onApplied} />,
  );
  return { onApplied, onClose };
}

beforeEach(() => {
  invokeMock.mockImplementation(async (cmd: string) => {
    if (cmd === 'apply_model_package') {
      return { routes: { package: 'gemini', illustrations: false, roles: [] }, settings: SETTINGS };
    }
    return null;
  });
});

describe('SetupWizard', () => {
  it('recommends the free Gemini key first and applies the Gemini package with it', async () => {
    const user = userEvent.setup();
    const { onApplied } = renderWizard();

    await user.click(screen.getByRole('button', { name: 'Выбрать сценарий: Бесплатно' }));
    const [first] = screen.getAllByRole('button', { name: /:/ });
    if (!first) throw new Error('no scenario variants rendered');
    expect(first).toHaveAccessibleName(/^Google Gemini — один бесплатный ключ:/);
    expect(first).toHaveTextContent('Рекомендуем');

    await user.click(first);
    await user.type(screen.getByLabelText(/API KEY — Gemini/), GEMINI_KEY);
    await user.click(screen.getByRole('button', { name: 'Продолжить к проверке' }));
    expect(screen.getByText('AI-перевод (Gemini)')).toBeInTheDocument();
    expect(screen.getByText('Нейроголос (Gemini)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить ключ и включить сценарий' }));
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('apply_model_package', {
        input: {
          package: 'gemini',
          illustrations: false,
          apiKey: GEMINI_KEY,
          cloudflareAccountId: null,
        },
      }),
    );
    expect(onApplied).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Готово!' })).toBeInTheDocument();
  });

  it('«Без ключей» switches to the offline package without a key', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Выбрать сценарий: Бесплатно' }));
    await user.click(screen.getByRole('button', { name: /^Без ключей:/ }));
    await user.click(screen.getByRole('button', { name: 'Включить выбранный сценарий' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('apply_model_package', {
        input: { package: 'offline', illustrations: false, apiKey: null, cloudflareAccountId: null },
      }),
    );
  });

  it('paid Gemini turns on AI illustrations', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Выбрать сценарий: Платно' }));
    await user.click(screen.getByRole('button', { name: /^Google Gemini \+ AI-иллюстрации:/ }));
    await user.type(screen.getByLabelText(/API KEY — Gemini/), GEMINI_KEY);
    await user.click(screen.getByRole('button', { name: 'Продолжить к проверке' }));
    expect(screen.getByText('AI-картинки (Gemini)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сохранить ключ и включить сценарий' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('apply_model_package', {
        input: expect.objectContaining({ package: 'gemini', illustrations: true }),
      }),
    );
  });
});
