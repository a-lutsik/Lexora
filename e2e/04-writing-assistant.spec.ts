// ============================================================
// LEXORA — E2E Test 4: Writing Assistant Flow
// Tests checking text, diff view, applying/ignoring fixes,
// accept all, rewriting, and error pattern exercises.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Writing Assistant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/writing');
    await page.waitForSelector('textarea#writing-input', { timeout: 10_000 });
  });

  test('renders writing editor and actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Writing Assistant' })).toBeVisible();
    await expect(page.locator('textarea#writing-input')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check writing' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Rewrite text' })).toBeDisabled();
  });

  test('checks writing and displays highlighted diff and issue card', async ({ page }) => {
    const input = page.locator('textarea#writing-input');
    await input.fill('She go to school yesterday.');

    const checkBtn = page.getByRole('button', { name: 'Check writing' });
    await expect(checkBtn).toBeEnabled();
    await checkBtn.click();

    // Verify summary and score
    await expect(page.getByText('Subject-verb agreement and tense errors found.')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('70')).toBeVisible();

    // Verify diff panes
    await expect(page.getByRole('heading', { name: 'Original' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Suggested' })).toBeVisible();
    await expect(page.locator('.writing-mark')).toHaveText('go');
    await expect(page.locator('.writing-diff-body--suggested')).toHaveText('She went to school yesterday.');

    await page.locator('.writing-mark').click();
    await expect(page.getByRole('dialog', { name: /Fix for go/i })).toBeVisible();
    await expect(page.getByText('Past tense requires "went".')).toBeVisible();
    await expect(page.getByRole('button', { name: /Apply fix/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ignore issue/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save .* as flashcard/i })).toBeVisible();
  });

  test('applying a fix updates the status', async ({ page }) => {
    const input = page.locator('textarea#writing-input');
    await input.fill('She go to school yesterday.');
    await page.getByRole('button', { name: 'Check writing' }).click();

    await page.locator('.writing-mark').click();
    await expect(page.getByRole('button', { name: /Apply fix/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Apply fix/i }).click();

    await expect(page.getByText('accepted')).toBeVisible({ timeout: 5000 });
  });

  test('rewrites text with chosen mode', async ({ page }) => {
    const input = page.locator('textarea#writing-input');
    await input.fill('Can you please check this as soon as possible?');

    const rewriteBtn = page.getByRole('button', { name: 'Rewrite text' });
    await rewriteBtn.click();

    await expect(page.getByText('Elevated formality.')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.writing-diff-body--suggested')).toHaveText(
      'Please review this at your earliest convenience.'
    );
  });

  test('auto-checks text after a pause when auto-check is enabled', async ({ page }) => {
    await mockTauriIpc(page, {
      get_settings: {
        primaryLanguage: 'en',
        interfaceLanguage: 'en',
        aiProvider: 'cloudflare',
        aiModel: '@cf/meta/llama-3.1-8b-instruct',
        customBaseUrl: null,
        cloudflareAccountId: null,
        ttsVoice: 'default',
        stickerCount: 2,
        stickerOpacity: 0.9,
        quietHoursStart: null,
        quietHoursEnd: null,
        offlineMode: false,
        writingPrivacyMode: false,
        writingAutoCheck: true,
        fallbackEnabled: true,
        fallbackAiProvider: 'gemini',
        fallbackAiModel: 'gemini-3.6-flash',
        hotkeyTranslate: 'CmdOrCtrl+Shift+L',
        hotkeyStickers: 'CmdOrCtrl+Shift+S',
      },
    });
    await page.reload();
    await page.waitForSelector('textarea#writing-input', { timeout: 10_000 });

    const autoSwitch = page.getByRole('switch', { name: 'Auto-check writing' });
    await expect(autoSwitch).toHaveAttribute('aria-checked', 'true');

    await page.locator('textarea#writing-input').fill('She go to school yesterday.');
    await expect(page.getByText('Waiting to check')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Subject-verb agreement and tense errors found.')).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('.writing-mark')).toHaveText('go');
  });

  test('does not garble suggested text when AI returns inclusive offsets', async ({ page }) => {
    const original = "Hi Andrew I would say I can't do it but I had to fix that bug";
    const greeting = 'Hi Andrew I';
    const but = 'it but';
    const bug = 'bug';
    const butAt = original.indexOf(but);
    const bugAt = original.indexOf(bug);

    await mockTauriIpc(page, {
      check_writing: {
        id: 1,
        originalText: original,
        correctedText: null,
        language: 'en',
        issueCount: 3,
        acceptedCount: 0,
        rejectedCount: 0,
        overallScore: 80,
        summary: 'The message contains minor punctuation errors that can be corrected for clarity.',
        rewriteMode: null,
        createdAt: Math.floor(Date.now() / 1000),
        issues: [
          {
            id: 1,
            writingCheckId: 1,
            category: 'punctuation',
            severity: 'warning',
            originalFragment: greeting,
            suggestedFix: 'Hi Andrew, I',
            explanation: 'Add a comma after the greeting.',
            ruleHint: null,
            offsetStart: 0,
            offsetEnd: greeting.length - 1,
            status: 'pending',
          },
          {
            id: 2,
            writingCheckId: 1,
            category: 'punctuation',
            severity: 'warning',
            originalFragment: but,
            suggestedFix: 'it, but',
            explanation: 'Add a comma before but.',
            ruleHint: null,
            offsetStart: butAt,
            offsetEnd: butAt + but.length - 1,
            status: 'pending',
          },
          {
            id: 3,
            writingCheckId: 1,
            category: 'punctuation',
            severity: 'warning',
            originalFragment: bug,
            suggestedFix: 'bug.',
            explanation: 'End the sentence with a period.',
            ruleHint: null,
            offsetStart: bugAt,
            offsetEnd: bugAt + bug.length - 1,
            status: 'pending',
          },
        ],
      },
    });
    await page.reload();
    await page.waitForSelector('textarea#writing-input', { timeout: 10_000 });

    await page.locator('textarea#writing-input').fill(original);
    await page.getByRole('button', { name: 'Check writing' }).click();

    await expect(page.locator('.writing-diff-body--suggested')).toHaveText(
      "Hi Andrew, I would say I can't do it, but I had to fix that bug.",
      { timeout: 8000 },
    );
    await expect(page.locator('.writing-mark')).toHaveText([greeting, but, bug]);
    await expect(page.getByText('II')).toHaveCount(0);
    await expect(page.getByText('butt')).toHaveCount(0);
    await expect(page.getByText('bug.g')).toHaveCount(0);
  });
});
