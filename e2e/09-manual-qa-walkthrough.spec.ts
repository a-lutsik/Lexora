// ============================================================
// LEXORA — Manual QA Walkthrough
// Clicks every primary control the way a tester would:
// sidebar, vocabulary, study modes, writing, translate,
// pronunciation, collections, stats, settings, popup, stickers.
// ============================================================

import { test, expect, type Page } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';
import { recordAndStop } from './helpers/record';

const pageErrors: string[] = [];
const consoleErrors: string[] = [];

async function openApp(page: Page, hash = '/#/vocabulary'): Promise<void> {
  await mockTauriIpc(page);
  page.on('pageerror', (err) => pageErrors.push(`${hash}: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${hash}: ${msg.text()}`);
  });
  await page.goto(hash);
}

test.describe('Manual QA walkthrough', () => {
  test.beforeEach(() => {
    pageErrors.length = 0;
    consoleErrors.length = 0;
  });

  test.afterEach(() => {
    expect(pageErrors, `JS exceptions:\n${pageErrors.join('\n')}`).toEqual([]);
    const realConsole = consoleErrors.filter(
      (line) => !line.includes('[e2e mock] Unhandled IPC'),
    );
    expect(realConsole, `console.error:\n${realConsole.join('\n')}`).toEqual([]);
  });

  test('sidebar opens every main screen', async ({ page }) => {
    await openApp(page);
    await page.waitForSelector('[aria-label="Vocabulary list"]', { timeout: 10_000 });

    const nav: Array<{ name: string | RegExp; heading: string | RegExp }> = [
      { name: 'Vocabulary', heading: 'My Vocabulary' },
      { name: /Study/, heading: 'Study Session' },
      { name: 'Writing', heading: 'Writing Assistant' },
      { name: 'Translate', heading: 'Translation Hub' },
      { name: 'Pronunciation', heading: 'Pronunciation Coach' },
      { name: 'Collections', heading: 'Collections' },
      { name: 'Statistics', heading: 'Learning Statistics' },
      { name: 'Settings', heading: 'Settings' },
    ];

    for (const item of nav) {
      await page.getByRole('link', { name: item.name }).click();
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible({
        timeout: 8000,
      });
    }
  });

  test('Vocabulary: filters, search, add menu, details, bulk paste', async ({ page }) => {
    await openApp(page, '/#/vocabulary');
    await page.waitForSelector('[aria-label="Vocabulary list"]', { timeout: 10_000 });

    await expect(page.getByText('apple')).toBeVisible();
    await expect(page.getByText('яблоко')).toBeVisible();

    for (const filter of ['All', 'New', 'Learning', 'Review', 'Mature']) {
      const chip = page.getByRole('button', { name: `Show ${filter} words` });
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByRole('button', { name: 'Show All words' }).click();

    await page.getByPlaceholder('Search words…').fill('app');
    await expect(page.getByRole('row', { name: /apple/i })).toBeVisible();

    await page.getByRole('button', { name: 'Play pronunciation of apple' }).click();
    await page.getByRole('button', { name: 'Open details for apple' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'apple' })).toBeVisible();

    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await page.getByRole('button', { name: 'Pronounce word' }).click();
    await page.getByLabel('PERSONAL NOTES').fill('QA mnemonic');
    await page.getByRole('button', { name: 'Save Notes' }).click();
    await page.getByRole('button', { name: 'Practice pronunciation of apple' }).click();
    await expect(page.getByRole('heading', { name: 'Pronunciation Coach' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('input#pron-target')).toHaveValue('apple');

    await page.getByRole('link', { name: 'Vocabulary' }).click();
    await page.getByRole('button', { name: 'Start study session' }).click();
    await expect(page.getByRole('heading', { name: 'Study Session' })).toBeVisible();

    await page.getByRole('link', { name: 'Vocabulary' }).click();
    await page.getByRole('button', { name: 'More add options' }).click();
    await expect(page.getByRole('menuitem', { name: 'Add one' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Paste list' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Upload file' })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Paste list' }).click();
    const bulk = page.getByRole('dialog');
    await expect(bulk).toBeVisible();
    await bulk.getByLabel('Word list, one per line').fill('pear\norange');
    await expect(page.getByText('2 words ready')).toBeVisible();
    await bulk.getByRole('button', { name: 'Add 2 words' }).click();
    await expect(bulk.getByRole('status')).toBeVisible({ timeout: 5000 });
    await bulk.getByRole('button', { name: 'Cancel' }).click();
    await expect(bulk).not.toBeVisible();

    await page.getByRole('button', { name: 'More add options' }).click();
    await page.getByRole('menuitem', { name: 'Upload file' }).click();
    await expect(page.getByRole('heading', { name: /Upload/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
  });

  test('Study: all 8 modes start and complete a card', async ({ page }) => {
    await openApp(page, '/#/study');
    await page.waitForSelector('text=Study Session', { timeout: 10_000 });

    const modes = [
      'Flashcards',
      'Typing Mode',
      'Listening',
      'Fill the Gap',
      'Image Association',
      'Irregular Verbs',
      'Definition',
      'Speaking',
    ] as const;

    for (const mode of modes) {
      await page.getByRole('radio', { name: new RegExp(mode) }).click();
      await expect(page.getByRole('radio', { name: new RegExp(mode) })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await page.getByRole('button', { name: 'Start study session' }).click();

      if (mode === 'Flashcards') {
        await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
        await page.getByRole('button', { name: 'Copy word' }).click();
        await page.getByRole('button', { name: 'яблоко' }).click();
        await expect(page.getByRole('group', { name: 'Rate your recall' })).toBeVisible();
        await page.getByRole('button', { name: /Good/i }).click();
      } else if (mode === 'Speaking') {
        await expect(page.getByText('Say this word aloud:')).toBeVisible({ timeout: 8000 });
        await recordAndStop(page, /Record pronunciation/i);
        await expect(page.getByRole('button', { name: /Continue/ })).toBeVisible({
          timeout: 8000,
        });
        await page.getByRole('button', { name: /Continue/ }).click();
      } else if (mode === 'Fill the Gap') {
        await expect(page.getByLabel('Missing word')).toBeVisible({ timeout: 8000 });
        await page.getByLabel('Missing word').fill('apple');
        await page.getByRole('button', { name: /Check/i }).click();
        await page.getByRole('button', { name: /Continue/ }).click();
      } else if (mode === 'Definition') {
        const skip = page.getByRole('button', { name: /Skip Card/i });
        if (await skip.isVisible().catch(() => false)) {
          await skip.click();
        } else {
          await page.getByLabel('Word matching the definition').fill('apple');
          await page.getByRole('button', { name: /Check/i }).click();
          await page.getByRole('button', { name: /Continue/ }).click();
        }
      } else {
        const answer = page.getByLabel(/Your answer|Missing word/i).first();
        await expect(answer).toBeVisible({ timeout: 8000 });
        await answer.fill('apple');
        await page.getByRole('button', { name: /Check/i }).click();
        await page.getByRole('button', { name: /Continue/ }).click();
      }

      await expect(page.getByText('🎉')).toBeVisible({ timeout: 8000 });
      await page.getByRole('button', { name: 'Back to Study Overview' }).click();
      await expect(page.getByRole('heading', { name: 'Study Session' })).toBeVisible();
    }
  });

  test('Writing: check, apply, accept all, rewrite, copy, exercises', async ({ page }) => {
    await openApp(page, '/#/writing');
    await page.waitForSelector('textarea#writing-input', { timeout: 10_000 });

    const input = page.locator('textarea#writing-input');
    await input.fill('She go to school yesterday.');
    await page.getByRole('button', { name: 'Check writing' }).click();
    await expect(page.getByText('Subject-verb agreement')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Accept all issues' }).click();
    await expect(page.getByText(/accepted|All issues resolved/i).first()).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Copy suggested text' }).click();
    await page.getByRole('button', { name: 'Use suggested text as input' }).click();
    await expect(input).not.toHaveValue('She go to school yesterday.');

    await page.getByRole('button', { name: 'Generate exercises from error patterns' }).click();
    await expect(page.getByLabel('Generated exercises')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('She ___ to the store yesterday.')).toBeVisible();

    await input.fill('Can you please check this as soon as possible?');
    await page.getByRole('button', { name: 'Rewrite text' }).click();
    await expect(page.getByText('Elevated formality.')).toBeVisible({ timeout: 8000 });
  });

  test('Translate: text, image, document, audio, history controls', async ({ page }) => {
    await openApp(page, '/#/translate');
    await expect(page.getByRole('heading', { name: 'Translation Hub' })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Swap source and target languages' }).click();
    await page.getByRole('button', { name: 'Swap source and target languages' }).click();

    const source = page.getByRole('textbox', { name: 'Source text to translate' });
    await source.fill('Artificial Intelligence is revolutionizing language learning.');
    await page.getByRole('button', { name: 'Listen to source text' }).click();
    await page.getByRole('button', { name: 'Translate text' }).click();
    await expect(
      page.getByText('Искусственный интеллект революционизирует изучение языков.').first(),
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Listen to translation' }).click();
    await page.getByRole('button', { name: 'Copy translation to clipboard' }).click();
    await page.getByRole('button', { name: 'Formal' }).click();
    await page.getByRole('button', { name: 'Casual' }).click();
    await page.getByRole('button', { name: 'Academic' }).click();
    await page.getByRole('button', { name: 'Standard' }).click();
    await page.getByRole('button', { name: /Save to Vocabulary/i }).click();
    await expect(page.getByText(/Saved to Vocabulary/i)).toBeVisible();
    await page.getByRole('button', { name: 'Clear input text' }).click();
    await expect(source).toHaveValue('');

    await page.getByRole('tab', { name: /Image & Photo/i }).click();
    await page.locator('input[type="file"][accept*="image"]').setInputFiles({
      name: 'sign.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await expect(page.getByText('No Parking')).toBeVisible({ timeout: 8000 });
    if (await page.getByRole('button', { name: 'Side-by-Side' }).isVisible()) {
      await page.getByRole('button', { name: 'Side-by-Side' }).click();
    }
    await page.getByRole('button', { name: '✕ Clear' }).click();

    await page.getByRole('tab', { name: /Document/i }).click();
    await page.locator('input[type="file"][accept*=".txt"]').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('First paragraph of notes.\n\nSecond paragraph of notes.'),
    });
    await expect(page.getByText('notes.txt')).toBeVisible();
    await page.getByRole('button', { name: /Start Translation/i }).click();
    await expect(page.getByRole('button', { name: /Download translated document/i })).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole('button', { name: 'Formal' }).click();
    if (await page.getByRole('button', { name: 'Glossary' }).isVisible()) {
      await page.getByRole('button', { name: 'Glossary' }).click();
    }

    await page.getByRole('tab', { name: /Speech & Audio/i }).click();
    await page.getByRole('button', { name: 'Upload an audio file' }).click();
    await page.locator('input[type="file"][accept*="audio"]').setInputFiles({
      name: 'speech.webm',
      mimeType: 'audio/webm',
      buffer: Buffer.from('fake-audio-binary-data'),
    });
    await expect(page.getByText('Good morning everyone.')).toBeVisible({ timeout: 8000 });
    const saveCardBtn = page.getByRole('button', { name: 'Save to vocabulary as an SRS card' }).first();
    await saveCardBtn.click();
    await expect(saveCardBtn).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('tab', { name: /History/i }).click();
    await page.getByRole('button', { name: /^All$/ }).click();
    await page.getByRole('button', { name: /Text/i }).first().click();
    await page.getByRole('button', { name: /Image/i }).first().click();
    await page.getByRole('button', { name: /Document/i }).first().click();
    await page.getByRole('button', { name: /Audio/i }).first().click();
    await page.getByRole('button', { name: /^All$/ }).click();
    await page.getByRole('button', { name: 'Remove from favorites' }).or(
      page.getByRole('button', { name: 'Add to favorites' }),
    ).first().click();
    await page.getByRole('button', { name: 'Copy translation' }).first().click();
    await page.getByRole('button', { name: 'Delete history entry' }).first().click();
    await expect(page.getByRole('button', { name: /Clear History/i })).toBeVisible();
  });

  test('Pronunciation: practice, shadowing, pairs, history, tips', async ({ page }) => {
    await openApp(page, '/#/pronunciation');
    await page.waitForSelector('.pronunciation-page', { timeout: 10_000 });

    await page.locator('input#pron-target').fill('apple');
    await page.getByRole('button', { name: 'Listen to Model' }).click();
    await recordAndStop(page, /Record attempt/i);
    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole('button', { name: /Get articulation tip for p/ }).click();
    await expect(page.getByText(/Close both lips/)).toBeVisible();

    await page.getByRole('tab', { name: 'Shadowing' }).click();
    await page.locator('input#pron-shadow-target').fill('I think this is the path');
    await page.getByRole('button', { name: 'Say phrase' }).click();
    await expect(page.getByText('Speak now')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Stop recording' }).click();
    await expect(page.getByText('Passed')).toBeVisible({ timeout: 8000 });

    await page.getByRole('tab', { name: 'Minimal pairs' }).click();
    await page.getByRole('button', { name: /Listen to/i }).first().click();
    await page.getByRole('button', { name: 'Next pair' }).click();
    await recordAndStop(page, /Say \/ Record/i);
    await expect(page.getByRole('meter', { name: 'Pronunciation score' })).toBeVisible({
      timeout: 8000,
    });

    await page.getByRole('tab', { name: 'History' }).click();
    await expect(page.locator('.pronunciation-history-word').first()).toHaveText('apple');
  });

  test('Collections: enable SRS; New Collection is wired', async ({ page }) => {
    await openApp(page, '/#/collections');
    await page.waitForSelector('.collections-page', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Enable in SRS' }).first().click();
    await expect(page.getByRole('heading', { name: 'Top 5000 Words' })).toBeVisible();

    await page.getByRole('button', { name: 'Create new collection' }).click();
    const dialog = page.getByRole('dialog', { name: 'New Collection' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Collection name').fill('Work emails');
    await dialog.getByRole('button', { name: 'Create collection' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('Stats page shows all metric sections', async ({ page }) => {
    await openApp(page, '/#/stats');
    await page.waitForSelector('.stats-page', { timeout: 10_000 });
    await expect(page.getByText('TOTAL VOCABULARY')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accuracy by Error Type' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Writing Mistake Patterns' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pronunciation' })).toBeVisible();
  });

  test('Settings: toggles, tests, shortcuts, save', async ({ page }) => {
    await openApp(page, '/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });

    const privacy = page.getByRole('checkbox', { name: /Writing privacy mode/i });
    await privacy.check();
    await expect(privacy).toBeChecked();

    const fallback = page.getByRole('checkbox', { name: /Enable Automatic Fallback/i });
    await fallback.uncheck();
    await expect(fallback).not.toBeChecked();
    await fallback.check();

    const quiet = page.getByRole('checkbox', { name: /Quiet hours/i });
    await quiet.check();
    await expect(page.getByLabel('Quiet hours start')).toBeVisible();
    await page.getByLabel('Quiet hours start').fill('21:00');
    await page.getByLabel('Quiet hours end').fill('08:00');

    await page.locator('#settings-sticker-count').fill('4');
    await page.locator('#settings-sticker-opacity').fill('0.7');

    await page.getByRole('button', { name: '⚡ Test AI Connection' }).click();
    await expect(
      page.getByText(/Connection successful|Account ID is required|API Token is required|API Key is required/i),
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: '⚡ Test Fallback Connection' }).click();
    await expect(page.getByText('GEMINI API Key is required for fallback.')).toBeVisible({
      timeout: 8000,
    });

    await page.getByRole('button', { name: '⚡ Test Image Connection' }).click();
    await expect(page.getByText('✕ Image connection failed')).toBeVisible({
      timeout: 8000,
    });

    await page.getByRole('button', { name: 'Open Translator' }).click();
    await page.getByRole('button', { name: 'Focus' }).click();
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText(/Settings saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Popup: translate extras and assistant entry points', async ({ page }) => {
    await openApp(page, '/popup.html');
    await page.getByRole('textbox', { name: 'Translate query' }).waitFor({ timeout: 10_000 });

    await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
    await page.getByRole('button', { name: 'Translate' }).click();
    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Pronounce word' }).click();
    await page.getByRole('button', { name: 'Listen audio' }).click();
    await page.getByRole('button', { name: 'Save bookmark' }).click();
    await page.getByRole('button', { name: '+ Add Word' }).click();
    await expect(page.getByRole('button', { name: '✓ Added to Vocabulary' })).toBeVisible();
    await page.getByRole('button', { name: 'Close window' }).click();
  });

  test('Desktop sticker controls respond', async ({ page }) => {
    await openApp(page, '/sticker.html');
    await page.waitForTimeout(1000);

    const remember = page.getByRole('button', { name: /Помню|I remember|Got it/i }).first();
    const forgot = page.getByRole('button', { name: /Не помню|Forgot|Don't remember/i }).first();
    const pin = page.getByRole('button', { name: 'Pin on top' });
    const close = page.getByRole('button', { name: 'Close sticker' });
    const toggle = page.getByRole('button', { name: 'Toggle translation visibility' });

    await expect(page.locator('body')).not.toBeEmpty();
    if (await toggle.isVisible().catch(() => false)) await toggle.click();
    if (await pin.isVisible().catch(() => false)) await pin.click();
    if (await remember.isVisible().catch(() => false)) await remember.click();
    if (await forgot.isVisible().catch(() => false)) await forgot.click();
    if (await close.isVisible().catch(() => false)) await close.click();
  });
});
