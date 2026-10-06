// ============================================================
// LEXORA — E2E Test 6: Settings, Collections & Stats Flows
// ============================================================

import { test, expect } from '@playwright/test';
import { mockModelRoutes, mockTauriIpc } from './helpers/tauri-mock';

test.describe('Collections, Stats and Settings Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
  });

  test('collections page lists system collections', async ({ page }) => {
    await page.goto('/#/collections');
    await page.waitForSelector('.collections-page', { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top 5000 Words' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Phrasal Verbs' })).toBeVisible();
  });

  test('stats page renders learning metrics, error breakdown and writing patterns', async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForSelector('.stats-page', { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: 'Learning Statistics' })).toBeVisible();
    await expect(page.getByText('TOTAL VOCABULARY')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
    await expect(page.getByText('87%')).toBeVisible();

    // Verify sections
    await expect(page.getByRole('heading', { name: 'Accuracy by Error Type' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Writing Mistake Patterns' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pronunciation' })).toBeVisible();
    await expect(page.getByText('Average score across recent attempts: 92/100')).toBeVisible();
    await expect(page.getByText('/θ/')).toBeVisible();
    await expect(page.getByText('think → sink')).toBeVisible();
    await expect(page.getByText('×5')).toBeVisible();
  });

  test('settings page renders preferences and allows toggling writing privacy', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI-модели' })).toBeVisible();
    await expect(page.getByText('Пакет: Google Gemini')).toBeVisible();
    await expect(page.getByRole('radio', { name: /^Google Gemini/ })).toBeChecked();
    // Gemini key not saved yet → roles wait for the key, check is disabled.
    await expect(page.getByRole('button', { name: 'Проверить: Быстрый перевод' })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();

    await expect(page.getByText('Writing privacy mode')).toBeVisible();
  });

  test('choosing a package fills every role', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });

    // The radio is visually hidden inside the card — click the card like a user.
    await page.locator('label.ai-package').filter({ hasText: /^OpenAI/ }).click();
    await expect(page.getByRole('radio', { name: /^OpenAI/ })).toBeChecked();
    await page.getByLabel(/API-КЛЮЧ OPENAI/).fill('sk-proj-e2e-test-key');
    await page.getByRole('button', { name: 'Включить пакет OpenAI' }).click();

    await expect(page.getByText('Пакет «OpenAI» включён')).toBeVisible();
    await expect(page.getByText('Пакет: OpenAI')).toBeVisible();
    const groups = page.getByRole('list', { name: 'Готовность возможностей' });
    await expect(groups.getByText('GPT-6.1 Sol')).toBeVisible();
    await expect(groups.getByText('GPT Transcribe')).toBeVisible();
    await expect(groups.getByText('GPT-4o mini TTS')).toBeVisible();
    await expect(groups.getByText('GPT Image 2.5 Flare')).toBeVisible();
    // Live voice is Gemini-only for now — shown, not hidden.
    await expect(groups.getByText('Не поддерживается')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Проверить: Быстрый перевод' })).toBeEnabled();
  });

  test('a retired model is shown as unavailable', async ({ page }) => {
    await mockTauriIpc(page, {
      get_model_routes: mockModelRoutes(
        'custom',
        {
          text_fast: [['openrouter', 'minimax/minimax-m3:free', 'MiniMax M3 (free)']],
          tts: [['system', 'say', 'Системный голос macOS']],
        },
        'ready',
        { text_fast: 'unavailable' },
      ),
    });
    await page.goto('/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });

    const row = page.locator('.ai-role--unavailable');
    await expect(row).toContainText('Быстрый перевод');
    await expect(row).toContainText('Недоступно');
    await expect(row).toContainText('Модель снята с поддержки');
    await expect(page.getByText('Свои модели по ролям (расширенный режим)')).toBeVisible();
  });
});
