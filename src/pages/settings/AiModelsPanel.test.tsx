import { setLocale } from '../../i18n';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiModelsPanel } from './AiModelsPanel';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type {
  AppSettings,
  ModelRole,
  ModelRoutes,
  ModelSpec,
  RoleGroup,
  RoleState,
  RoleStatus,
  RouteTarget,
} from '../../lib/types';

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
  fallbackAiProvider: 'gemini',
  fallbackAiModel: 'gemini-3.5-flash-lite',
  fallbackEnabled: true,
  imageModel: 'none',
  fallbackImageModel: 'none',
  setupProfile: 'gemini-free',
  ttsEngine: 'gemini',
  modelPackage: 'gemini',
};

const CATALOG: ModelSpec[] = [
  spec('gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash', ['text', 'vision', 'audio_input', 'transcription']),
  spec('gemini', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', ['text', 'vision', 'audio_input', 'transcription']),
  spec('anthropic', 'claude-sonnet-5-5', 'Claude Sonnet 5.5', ['text', 'vision'], 'paid'),
  spec('deepseek', 'deepseek-chat', 'DeepSeek Chat', ['text'], 'paid'),
  spec('gemini', 'gemini-3.8-live', 'Gemini 3.8 Live', ['realtime_voice']),
  spec('gemini', 'gemini-3.5-live-translate-preview', 'Gemini 3.5 Live Translate', ['live_translation']),
  spec('gemini', 'gemini-3.8-flash-lite-tts', 'Gemini 3.8 Flash-Lite TTS', ['speech']),
  spec('system', 'say', 'Системный голос macOS', ['speech'], 'local'),
  spec('gemini', 'gemini-3.1-flash-lite-image', 'Nano Banana 2 Lite', ['image_generation'], 'paid'),
];

function spec(
  provider: string,
  id: string,
  label: string,
  capabilities: ModelSpec['capabilities'],
  tier: ModelSpec['tier'] = 'free_tier',
): ModelSpec {
  return { provider, id, label, capabilities, tier, status: { kind: 'stable' }, price: null };
}

const GROUPS: Record<ModelRole, RoleGroup> = {
  text_fast: 'text',
  text_quality: 'text',
  vision: 'images',
  speech_to_text: 'voice',
  realtime_voice: 'voice',
  live_interpreter: 'voice',
  tts: 'voice',
  image_gen: 'illustrations',
};

const CHAINS: Record<ModelRole, RouteTarget[]> = {
  text_fast: [
    { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
    { provider: 'gemini', model: 'gemini-3.8-flash' },
  ],
  text_quality: [
    { provider: 'gemini', model: 'gemini-3.8-flash' },
    { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
  ],
  vision: [{ provider: 'gemini', model: 'gemini-3.8-flash' }],
  speech_to_text: [{ provider: 'gemini', model: 'gemini-3.8-flash' }],
  realtime_voice: [{ provider: 'gemini', model: 'gemini-3.8-live' }],
  live_interpreter: [{ provider: 'gemini', model: 'gemini-3.5-live-translate-preview' }],
  tts: [
    { provider: 'gemini', model: 'gemini-3.8-flash-lite-tts' },
    { provider: 'system', model: 'say' },
  ],
  image_gen: [],
};

function routes(
  state: RoleState,
  overrides: Partial<Record<ModelRole, RouteTarget[]>> = {},
  packageId: ModelRoutes['package'] = 'gemini',
): ModelRoutes {
  const chains = { ...CHAINS, ...overrides };
  const roles: RoleStatus[] = (Object.keys(GROUPS) as ModelRole[]).map((role) => {
    const chain = chains[role];
    const first = chain[0];
    return {
      role,
      group: GROUPS[role],
      state: chain.length === 0 ? 'off' : state,
      provider: first?.provider ?? null,
      model: first?.model ?? null,
      modelLabel: first ? (CATALOG.find((m) => m.id === first.model)?.label ?? first.model) : null,
      message: chain.length === 0 ? 'Выключено' : state === 'needs_key' ? 'Нужен ключ Gemini' : '',
      usingFallback: false,
      chain,
    };
  });
  return { package: packageId, illustrations: false, roles };
}

let currentRoutes: ModelRoutes;

function renderPanel(keysStatus: Record<string, boolean> = {}, onSettingsChanged = vi.fn()) {
  renderWithQueryClient(
    <AiModelsPanel
      settings={SETTINGS}
      keysStatus={keysStatus}
      onOpenWizard={vi.fn()}
      onSettingsChanged={onSettingsChanged}
    />,
  );
  return onSettingsChanged;
}

beforeEach(() => {
  setLocale('ru');
  // jsdom has no layout: the custom Select scrolls the highlighted option into view.
  Element.prototype.scrollIntoView = vi.fn();
  currentRoutes = routes('needs_key');
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'get_model_routes') return currentRoutes;
    if (cmd === 'get_model_catalog') return CATALOG;
    if (cmd === 'apply_model_package') {
      const input = args?.input as { package: ModelRoutes['package'] };
      currentRoutes = routes('ready', {}, input.package);
      return { routes: currentRoutes, settings: { ...SETTINGS, modelPackage: input.package } };
    }
    if (cmd === 'set_role_route') {
      const input = args?.input as { role: ModelRole; targets: RouteTarget[] };
      currentRoutes = routes('ready', { [input.role]: input.targets }, 'custom');
      return { routes: currentRoutes, settings: { ...SETTINGS, modelPackage: 'custom' } };
    }
    if (cmd === 'list_provider_models') {
      return args?.provider === 'gemini'
        ? [
            { id: 'gemini-4-flash-preview', label: 'Gemini 4 Flash Preview', capabilities: ['text', 'vision'] },
            { id: 'gemini-4-flash-tts', label: null, capabilities: ['speech'] },
          ]
        : [];
    }
    if (cmd === 'set_advanced_models') {
      return { ...SETTINGS, advancedModels: args?.enabled === true };
    }
    if (cmd === 'test_model_role') {
      const role = args?.role as ModelRole;
      return role === 'text_fast'
        ? { ok: true, latencyMs: 420, message: '', sampleTranslation: 'интуиция' }
        : { ok: false, latencyMs: 30, message: 'Gemini TTS: voice not available', sampleTranslation: null };
    }
    return null;
  });
});

describe('AiModelsPanel', () => {
  it('shows the active package and readiness of every group', async () => {
    renderPanel();
    expect(await screen.findByText('Пакет: Google Gemini')).toBeInTheDocument();

    const groups = screen.getByRole('list', { name: 'Готовность возможностей' });
    const voice = within(groups).getByText('Голос').closest('li');
    expect(voice).not.toBeNull();
    expect(within(voice as HTMLElement).getAllByText('Нужен ключ').length).toBeGreaterThan(0);
    expect(within(voice as HTMLElement).getByText('Живой диалог')).toBeInTheDocument();
    expect(
      within(groups).getByText('Иллюстрации', { selector: '.ai-group-title' }).closest('li'),
    ).toHaveClass('ai-group--off');
  });

  it('needs a key before the Gemini package can be saved, then sends it with the package', async () => {
    const user = userEvent.setup();
    const onSettingsChanged = renderPanel();
    await screen.findByText('Пакет: Google Gemini');

    const save = screen.getByRole('button', { name: 'Сохранить пакет Google Gemini' });
    expect(save).toBeDisabled();
    expect(screen.getByText('Сначала вставьте ключ')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/API-КЛЮЧ GEMINI/), 'AIzaSyTestKey1234567890abcdef');
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('apply_model_package', {
        input: {
          package: 'gemini',
          apiKey: 'AIzaSyTestKey1234567890abcdef',
          illustrations: false,
          cloudflareAccountId: null,
          customBaseUrl: null,
        },
      }),
    );
    expect(await screen.findByText(/Пакет «Google Gemini» включён/)).toBeInTheDocument();
    expect(onSettingsChanged).toHaveBeenCalledWith(expect.objectContaining({ modelPackage: 'gemini' }));
  });

  it('warns when the pasted key belongs to another provider', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(await screen.findByLabelText(/API-КЛЮЧ GEMINI/), 'sk-proj-abc123');
    expect(screen.getByRole('alert')).toHaveTextContent('Похоже на ключ OpenAI, а нужен ключ Gemini');
  });

  it('switches to OpenAI with paid illustrations', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Пакет: Google Gemini');

    await user.click(screen.getByRole('radio', { name: /^OpenAI/ }));
    await user.type(screen.getByLabelText(/API-КЛЮЧ OPENAI/), 'sk-proj-test');
    await user.click(screen.getByRole('checkbox', { name: /AI-иллюстрации к словам/ }));
    await user.click(screen.getByRole('button', { name: 'Включить пакет OpenAI' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('apply_model_package', {
        input: expect.objectContaining({ package: 'openai', illustrations: true, apiKey: 'sk-proj-test' }),
      }),
    );
  });

  it('checks a role and shows success or the provider error', async () => {
    currentRoutes = routes('ready');
    const user = userEvent.setup();
    renderPanel({ gemini: true });

    await user.click(await screen.findByRole('button', { name: 'Проверить: Быстрый перевод' }));
    expect(await screen.findByText('✓ Работает · 420 мс')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith('test_model_role', { role: 'text_fast' });

    await user.click(screen.getByRole('button', { name: 'Проверить: Озвучка' }));
    expect(await screen.findByText(/voice not available/)).toBeInTheDocument();
    // Illustrations are off and their check would cost money — no free click.
    expect(screen.getByRole('button', { name: 'Проверить (платно): Иллюстрации' })).toBeDisabled();
  });

  it('mixes providers only in the advanced editor', async () => {
    currentRoutes = routes('ready');
    const user = userEvent.setup();
    renderPanel({ gemini: true });
    await screen.findByText('Пакет: Google Gemini');
    expect(screen.queryByRole('group', { name: 'Качественный текст' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: /Продвинутый режим/ }));
    const editor = await screen.findByRole('group', { name: 'Качественный текст' });
    await user.click(within(editor).getByRole('combobox', { name: 'Основная модель: Качественный текст' }));
    await user.click(within(editor).getByRole('option', { name: /Anthropic · Claude Sonnet 5\.5/ }));
    await user.click(within(editor).getByRole('button', { name: 'Сохранить модель: Качественный текст' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('set_role_route', {
        input: {
          role: 'text_quality',
          targets: [
            { provider: 'anthropic', model: 'claude-sonnet-5-5' },
            { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
          ],
        },
      }),
    );
    expect(await screen.findByText('Свои модели по ролям (расширенный режим)')).toBeInTheDocument();
    // The new provider shows up in the keys list, still without a key.
    expect(await screen.findByLabelText(/^Anthropic/)).toBeInTheDocument();
    expect(screen.getByText('нет ключа')).toBeInTheDocument();
  });

  it('saves the advanced switch and offers DeepSeek for translation', async () => {
    currentRoutes = routes('ready');
    const user = userEvent.setup();
    const onSettingsChanged = renderPanel({ gemini: true });
    const toggle = await screen.findByRole('switch', { name: /Продвинутый режим/ });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('set_advanced_models', { enabled: true }));
    expect(onSettingsChanged).toHaveBeenCalledWith(expect.objectContaining({ advancedModels: true }));

    const editor = await screen.findByRole('group', { name: 'Быстрый перевод' });
    await user.click(within(editor).getByRole('combobox', { name: 'Основная модель: Быстрый перевод' }));
    expect(within(editor).getByRole('option', { name: /DeepSeek · DeepSeek Chat/ })).toBeInTheDocument();
  });

  it('keeps manual models but hides their editors when the switch is off', async () => {
    currentRoutes = routes('ready', {}, 'custom');
    renderWithQueryClient(
      <AiModelsPanel
        settings={{ ...SETTINGS, modelPackage: 'custom', advancedModels: false }}
        keysStatus={{ gemini: true }}
        onOpenWizard={vi.fn()}
        onSettingsChanged={vi.fn()}
      />,
    );
    expect(await screen.findByRole('switch', { name: /Продвинутый режим/ })).not.toBeChecked();
    expect(await screen.findByText(/Сейчас работают модели, выбранные вручную/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Быстрый перевод' })).not.toBeInTheDocument();
  });

  it('asks for a key before listing models of a keyed provider', async () => {
    currentRoutes = routes('ready');
    const user = userEvent.setup();
    renderPanel({ gemini: true });
    await user.click(await screen.findByRole('switch', { name: /Продвинутый режим/ }));

    const editor = await screen.findByRole('group', { name: 'Быстрый перевод' });
    await user.click(within(editor).getByRole('combobox', { name: 'Запасная модель: Быстрый перевод' }));
    await user.click(within(editor).getByRole('option', { name: 'Любая модель провайдера…' }));
    await user.click(within(editor).getByRole('combobox', { name: 'Провайдер (запасная): Быстрый перевод' }));
    await user.click(within(editor).getByRole('option', { name: 'OpenAI' }));

    expect(
      within(editor).getByText('Сохраните ключ OpenAI, чтобы подтянуть список его моделей'),
    ).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalledWith('list_provider_models', { provider: 'openai' });
  });

  it('accepts a model id that is not in the catalog', async () => {
    currentRoutes = routes('ready');
    const user = userEvent.setup();
    renderPanel({ gemini: true });
    await user.click(await screen.findByRole('switch', { name: /Продвинутый режим/ }));

    const editor = await screen.findByRole('group', { name: 'Перевод картинок' });
    await user.click(within(editor).getByRole('combobox', { name: 'Запасная модель: Перевод картинок' }));
    await user.click(within(editor).getByRole('option', { name: 'Любая модель провайдера…' }));
    const save = within(editor).getByRole('button', { name: 'Сохранить модель: Перевод картинок' });
    expect(save).toBeDisabled();
    // The provider's own list is offered, narrowed to models that can see images.
    expect(await within(editor).findByText('Доступно моделей: 1 — начните вводить название')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith('list_provider_models', { provider: 'gemini' });
    const suggestions = editor.querySelectorAll('datalist option');
    expect(Array.from(suggestions, (o) => o.getAttribute('value'))).toEqual(['gemini-4-flash-preview']);

    await user.type(within(editor).getByLabelText('ID модели (запасная): Перевод картинок'), 'gemini-4-flash-preview');
    await user.click(save);
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('set_role_route', {
        input: {
          role: 'vision',
          targets: [
            { provider: 'gemini', model: 'gemini-3.8-flash' },
            { provider: 'gemini', model: 'gemini-4-flash-preview' },
          ],
        },
      }),
    );
  });
});

// These existing interaction scenarios exercise the Russian UI explicitly.
afterEach(() => setLocale('en'));
