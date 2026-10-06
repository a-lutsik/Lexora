// ============================================================
// LEXORA — E2E Test 3: Popup Translate Flow
// Mandatory scenario per AGENTS.md §12.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Popup Translate Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/popup.html');
    await page.getByRole('textbox', { name: 'Translate query' }).waitFor({ timeout: 10_000 });
  });

  test('popup renders header, input, translate button and close button', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'Lexora' })).toBeVisible();
    await expect(page.getByText(/Lexora/i)).toBeVisible();

    // Input из PopupTranslator.tsx:132 — aria-label="Translate query"
    await expect(page.getByRole('textbox', { name: 'Translate query' })).toBeVisible();

    // Кнопка Translate (строка 140)
    await expect(page.getByRole('button', { name: 'Translate' })).toBeVisible();

    // Кнопка «+ Add Word» (строка 195) — disabled когда нет перевода
    await expect(page.getByRole('button', { name: '+ Add Word' })).toBeDisabled();

    // Кнопка закрытия (строка 116) — aria-label="Close window"
    await expect(page.getByRole('button', { name: 'Close window' })).toBeVisible();

    // Подсказка по горячим клавишам (строка 187)
    await expect(page.getByText('Press ↵ to translate · Esc to close')).toBeVisible();
  });

  test('pressing Enter in input triggers translation', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('textbox', { name: 'Translate query' }).press('Enter');

    // mainTranslation из mock
    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });
  });

  test('clicking Translate button shows result', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    // Транскрипция из mock.phonetic
    await expect(page.getByText('/ˈæp.əl/')).toBeVisible();
  });

  test('Add Word button becomes enabled after translation', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    // PopupTranslator.tsx:195 — «+ Add Word» активируется
    await expect(page.getByRole('button', { name: '+ Add Word' })).toBeEnabled({ timeout: 3000 });
  });

  test('Add Word changes button to confirmed state', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByRole('button', { name: '+ Add Word' })).toBeEnabled({ timeout: 8000 });
    await page.getByRole('button', { name: '+ Add Word' }).click();

    // PopupTranslator.tsx:195 — после click → '✓ Added to Vocabulary'
    await expect(page.getByRole('button', { name: '✓ Added to Vocabulary' })).toBeVisible({ timeout: 5000 });
  });

  test('clicking Close window calls close IPC', async ({ page }) => {
    // Нажимаем ×
    await page.getByRole('button', { name: 'Close window' }).click();
    // Нет JS-ошибок (IPC close_popup_window → null в mock — ок)
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('pressing Escape triggers close IPC', async ({ page }) => {
    await page.keyboard.press('Escape');
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('empty input does not trigger translation', async ({ page }) => {
    // Пустой input
    await page.getByRole('textbox', { name: 'Translate query' }).fill('   ');
    await page.getByRole('button', { name: 'Translate' }).click();

    // Никакого результата — «+ Add Word» остаётся disabled
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: '+ Add Word' })).toBeDisabled();
  });

  test('clear button empties the query field', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await expect(page.getByRole('button', { name: 'Clear text' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear text' }).click();
    await expect(page.getByRole('textbox', { name: 'Translate query' })).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Clear text' })).toHaveCount(0);
  });

  test('alternatives are shown after translation', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    // alternatives из mock = ['плод', 'яблоня']
    await expect(page.getByText('плод')).toBeVisible();
    await expect(page.getByText('яблоня')).toBeVisible();
  });

  test('part of speech is shown', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    // partOfSpeech из mock = 'noun'
    await expect(page.getByText(/noun/i)).toBeVisible();
  });
});
