// ============================================================
// LEXORA — Stage 4 E2E Test Suite (Multimodal Translation Hub)
// Covers: Text Translation, Image & Photo OCR with Bounding Box Overlay,
// Document Structure Translation, Speech/Audio, and Translation History.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Stage 4: Multimodal Translation Hub Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/translate');
    await page.waitForLoadState('domcontentloaded');
  });

  test('01: renders Translation Hub header, tabs, and language selector', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Translate' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Text/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Image & Photo/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Document/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Speech & Audio/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /History/i })).toBeVisible();

    // Language selection bar
    await expect(page.getByRole('combobox', { name: 'Source language' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Target language' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swap source and target languages' })).toBeVisible();
  });

  test('02: executes text translation and saves card to vocabulary', async ({ page }) => {
    const inputArea = page.getByRole('textbox', { name: 'Source text to translate' });
    await inputArea.fill('Artificial Intelligence is revolutionizing language learning.');

    const translateBtn = page.getByRole('button', { name: 'Translate text' });
    await translateBtn.click();

    // Verify translated output
    await expect(
      page.getByText('Искусственный интеллект революционизирует изучение языков.').first()
    ).toBeVisible();

    // Save to vocabulary
    const saveBtn = page.getByRole('button', { name: /Save to Vocabulary/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(page.getByText(/Saved to Vocabulary/i)).toBeVisible();
  });

  test('03: uploads image and renders OCR bounding box overlays', async ({ page }) => {
    // Switch to Image & Photo tab
    await page.getByRole('tab', { name: /Image & Photo/i }).click();

    // Upload an image via hidden file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles({
      name: 'sign.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      ),
    });

    // Verify OCR overlay rendered
    await expect(page.getByText('No Parking')).toBeVisible();
    await expect(page.getByText('Парковка запрещена')).toBeVisible();

    // Switch view mode to Side-by-Side
    const sideBySideBtn = page.getByRole('button', { name: 'Side-by-Side' });
    await expect(sideBySideBtn).toBeVisible();
    await sideBySideBtn.click();

    // Verify extracted block card in list
    await expect(page.locator('.image-block-card').first()).toBeVisible();
  });

  test('04: processes document translation with chunk progress and download', async ({ page }) => {
    // Switch to Document tab
    await page.getByRole('tab', { name: /Document/i }).click();

    // Upload document
    const fileInput = page.locator('input[type="file"][accept*=".txt"]');
    await fileInput.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('First paragraph of notes.\n\nSecond paragraph of notes.'),
    });

    // Verify document loaded
    await expect(page.getByText('notes.txt')).toBeVisible();

    // Start translation
    const startBtn = page.getByRole('button', { name: /Start Translation/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify translated segment appears and download button is ready
    await expect(page.getByText(/Переведенный фрагмент/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download translated document/i })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Source document' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Translated document' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Formal' })).toBeVisible();
  });

  test('05: performs speech & audio translation with dual transcripts', async ({ page }) => {
    // Switch to Speech & Audio tab
    await page.getByRole('tab', { name: /Speech & Audio/i }).click();

    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles({
      name: 'speech.webm',
      mimeType: 'audio/webm',
      buffer: Buffer.from('fake-audio-binary-data'),
    });

    // Verify dual results
    await expect(page.getByText('Good morning everyone.')).toBeVisible();
    await expect(page.getByText('Доброе утро всем.')).toBeVisible();

    // Verify save as card
    const saveCardBtn = page.getByRole('button', { name: 'Save to vocabulary as an SRS card' }).first();
    await expect(saveCardBtn).toBeVisible();
    await saveCardBtn.click();
    await expect(saveCardBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('06: manages translation history with filtering, favoriting, and deletion', async ({ page }) => {
    // Switch to History tab
    await page.getByRole('tab', { name: /History/i }).click();

    // Verify history entries
    await expect(page.getByText('Hello world')).toBeVisible();
    await expect(page.getByText('Привет мир')).toBeVisible();
    await expect(page.getByText('No Parking')).toBeVisible();
    await expect(page.getByText('Парковка запрещена')).toBeVisible();

    // Filter by Image mode
    await page.getByRole('group', { name: 'Filter history by mode' }).getByRole('button', { name: 'Image' }).click();

    // Toggle favorite star
    const starBtn = page.locator('.btn-star').first();
    await starBtn.click();

    // Clear History button check
    await expect(page.getByRole('button', { name: /Clear History/i })).toBeVisible();
  });
});
