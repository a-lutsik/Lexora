// ============================================================
// LEXORA — E2E Test 1: Add Word Flow
// Mandatory scenario per AGENTS.md §12.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Add Word Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/vocabulary');
    // Ждём React hydration
    await page.waitForSelector('[aria-label="Vocabulary list"]', { timeout: 10_000 });
  });

  test('vocabulary page renders word list with mock data', async ({ page }) => {
    // Слово из mock list_vocabulary
    await expect(page.getByText('apple')).toBeVisible({ timeout: 8000 });
    // Кнопка добавления слова
    await expect(page.getByRole('button', { name: 'Add new word' })).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Search words…')).toBeVisible({ timeout: 5000 });
  });

  test('clicking Add new word opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Add Word to Vocabulary')).toBeVisible();
    await expect(dialog.getByPlaceholder(/Type word or phrase in/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Translate' })).toBeVisible();

    const input = dialog.getByRole('textbox', { name: 'Word or phrase to translate' });
    const translateBtn = dialog.getByRole('button', { name: 'Translate' });
    const inputBox = await input.boundingBox();
    const btnBox = await translateBtn.boundingBox();
    if (!inputBox || !btnBox) throw new Error('Input or Translate button is not laid out');
    expect(inputBox.width).toBeGreaterThan(240);
    expect(inputBox.x + inputBox.width).toBeLessThan(btnBox.x);
  });

  test('typing word + click Translate shows translation result', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Word or phrase to translate' }).fill('apple');
    await dialog.getByRole('button', { name: 'Translate' }).click();

    await expect(dialog.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByText('/ˈæp.əl/')).toBeVisible();
    await expect(dialog.getByText(/every morning/i)).toBeVisible();
  });

  test('Enter in input triggers translate', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByRole('textbox', { name: 'Word or phrase to translate' });
    await input.fill('apple');
    await input.press('Enter');

    await expect(dialog.getByText('яблоко')).toBeVisible({ timeout: 8000 });
  });

  test('Add to Vocabulary button becomes enabled after translation', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Word or phrase to translate' }).fill('apple');
    await dialog.getByRole('button', { name: 'Translate' }).click();

    await expect(dialog.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByRole('button', { name: '+ Add to Vocabulary' })).toBeEnabled({ timeout: 3000 });
  });

  test('clicking Add to Vocabulary saves entry and shows success', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Word or phrase to translate' }).fill('apple');
    await dialog.getByRole('button', { name: 'Translate' }).click();

    await expect(dialog.getByText('яблоко')).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: '+ Add to Vocabulary' }).click();

    await expect(dialog.getByRole('button', { name: '✓ Added to Vocabulary!' })).toBeVisible({ timeout: 5000 });
  });

  test('Close dialog button closes modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('reopening Add Word starts with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new word' }).click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByRole('textbox', { name: 'Word or phrase to translate' });
    await input.fill('apple');
    await dialog.getByLabel(/personal notes/i).fill('from an article');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'Add new word' }).click();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('textbox', { name: 'Word or phrase to translate' })).toHaveValue('');
    await expect(dialog.getByLabel(/personal notes/i)).toHaveValue('');
  });
});
