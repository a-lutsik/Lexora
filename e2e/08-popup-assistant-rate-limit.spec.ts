// ============================================================
// LEXORA — E2E: Popup rate-limit (429) friendly message
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Popup rate-limit fuse', () => {
  test('dictionary translate shows friendly 429 message', async ({ page }) => {
    await mockTauriIpc(page, {
      translate_text: {
        __error: 'OpenAI: Too many requests (429). Wait a few seconds, then try again.',
      },
    });
    await page.goto('/popup.html');
    await page.getByRole('textbox', { name: 'Translate query' }).waitFor({ timeout: 10_000 });

    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();

    await expect(page.getByRole('alert')).toContainText(/Too many requests/i, {
      timeout: 8000,
    });
  });

  test('assistant Text tab shows friendly 429 after rewrite fails', async ({ page }) => {
    await mockTauriIpc(page, {
      get_pending_popup_text:
        'Please review this email before sending it out to the client today.',
      rewrite_text: {
        __error: 'Gemini API error 429: Too Many Requests',
      },
      translate_text: {
        __error: 'Gemini API error 429: Too Many Requests',
      },
    });
    await page.goto('/popup.html');

    // Sentence → assistant; default mode is Translate (also rate-limited)
    await expect(page.getByRole('tab', { name: /Translate \(1\)/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('alert')).toContainText(/Too many requests/i, {
      timeout: 8000,
    });

    // Switch to Text and change register → also rate-limited rewrite
    await page.getByRole('tab', { name: /Text \(2\)/i }).click();
    await page.getByRole('radio', { name: 'Business' }).click();
    await expect(page.getByRole('alert')).toContainText(/Too many requests/i, {
      timeout: 8000,
    });
  });
});
