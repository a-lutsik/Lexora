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

    await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();
    await expect(page.getByText('Total vocabulary')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
    await expect(page.getByText('87%')).toBeVisible();

    // Verify sections
    await expect(page.getByRole('heading', { name: 'Accuracy by error type' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Writing mistake patterns' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'AI models' })).toBeVisible();
    await expect(page.getByText(/^Scenario: .*Google Gemini/)).toBeVisible();
    // The model package chooser is collapsed until «Change scenario» is pressed.
    await expect(page.getByRole('radio', { name: /^Google Gemini/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Change scenario' }).click();
    await expect(page.getByRole('radio', { name: /^Google Gemini/ })).toBeChecked();
    // Gemini key not saved yet → roles wait for the key, check is disabled.
    await expect(page.getByRole('button', { name: 'Test: Quick translation' })).toBeDisabled();

    await page.getByRole('button', { name: 'Privacy', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByText('Writing privacy mode')).toBeVisible();
  });

  test('choosing a package fills every role', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Change scenario' }).click();
    // The radio is visually hidden inside the card — click the card like a user.
    await page.locator('label.ai-package').filter({ hasText: /^OpenAI/ }).click();
    await expect(page.getByRole('radio', { name: /^OpenAI/ })).toBeChecked();
    await page.getByLabel(/API key OpenAI/i).fill('sk-proj-e2e-test-key');
    await page.getByRole('button', { name: 'Enable OpenAI package' }).click();

    await expect(page.getByText('OpenAI package enabled')).toBeVisible();
    await expect(page.getByText(/^Scenario: .*OpenAI/)).toBeVisible();
    const groups = page.getByRole('list', { name: 'Feature readiness' });
    await expect(groups.getByText('GPT-6.1 Sol')).toBeVisible();
    await expect(groups.getByText('GPT Transcribe')).toBeVisible();
    await expect(groups.getByText('GPT-4o mini TTS')).toBeVisible();
    await expect(groups.getByText('GPT Image 2.5 Flare')).toBeVisible();
    // Live voice is Gemini-only for now — shown, not hidden.
    await expect(groups.getByText('Unsupported')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Test: Quick translation' })).toBeEnabled();
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
    await expect(row).toContainText('Quick translation');
    await expect(row).toContainText('Unavailable');
    await expect(row).toContainText('Модель снята с поддержки');
    await expect(page.getByText('Custom models per role (advanced)')).toBeVisible();
  });
});
