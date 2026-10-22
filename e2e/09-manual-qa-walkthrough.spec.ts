// ============================================================
// LEXORA — Manual QA Walkthrough
// Clicks every primary control the way a tester would:
// sidebar, vocabulary, study modes, writing, translate,
// pronunciation, collections, stats, settings, popup, stickers.
// ============================================================

import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_IPC_RESPONSES, mockTauriIpc } from './helpers/tauri-mock';
import { recordAndStop } from './helpers/record';

const pageErrors: string[] = [];
const consoleErrors: string[] = [];

async function openApp(
  page: Page,
  hash = '/#/vocabulary',
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await mockTauriIpc(page, overrides);
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
      { name: 'Vocabulary', heading: 'Vocabulary' },
      { name: /Study/, heading: 'Study' },
      { name: 'Writing', heading: 'Writing' },
      { name: 'Translate', heading: 'Translate' },
      { name: 'Pronunciation', heading: 'Speak' },
      { name: 'Collections', heading: 'Collections' },
      { name: 'Statistics', heading: 'Statistics' },
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
    await expect(page.getByRole('heading', { name: 'Speak' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('input#pron-target')).toHaveValue('apple');

    await page.getByRole('link', { name: 'Vocabulary' }).click();
    await page.getByRole('button', { name: 'Study Now' }).click();
    await expect(page.getByRole('heading', { name: 'Study' })).toBeVisible();

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
    await page.waitForSelector('h1:has-text("Study")', { timeout: 10_000 });

    const modes = [
      'Flashcards',
      'Typing',
      'Listening',
      'Fill the gap',
      'Image association',
      'Irregular verbs',
      'Definition',
      'Speaking',
    ] as const;

    for (const mode of modes) {
      await page.getByRole('radio', { name: new RegExp(mode) }).click();
      await expect(page.getByRole('radio', { name: new RegExp(mode) })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await page.getByRole('button', { name: /^Start session/ }).click();

      if (mode === 'Flashcards') {
        await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
        await page.getByRole('button', { name: 'Copy word' }).click();
        // A single-card queue has no honest distractors, so the card flips.
        await page.getByRole('button', { name: 'Show translation' }).click();
        await expect(page.getByText('яблоко').first()).toBeVisible();
        await expect(page.getByRole('group', { name: 'Rate your recall' })).toBeVisible();
        await page.getByRole('button', { name: /Good/i }).click();
      } else if (mode === 'Speaking') {
        await expect(page.getByText('Say this word aloud:')).toBeVisible({ timeout: 8000 });
        await recordAndStop(page, /Record pronunciation/i);
        await expect(page.getByRole('button', { name: /Continue/ })).toBeVisible({
          timeout: 8000,
        });
        await page.getByRole('button', { name: /Continue/ }).click();
      } else if (mode === 'Fill the gap') {
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

      await expect(page.getByRole('heading', { name: 'Session Complete!' })).toBeVisible({ timeout: 8000 });
      await page.getByRole('button', { name: 'Back to Study Overview' }).click();
      await expect(page.getByRole('heading', { name: 'Study' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Translate' })).toBeVisible({
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
    await page.getByRole('button', { name: 'Listen', exact: true }).click();
    await recordAndStop(page, /Hold to record/i);
    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole('button', { name: /Get articulation tip for p/ }).click();
    await expect(page.getByText(/Close both lips/)).toBeVisible();

    await page.getByRole('tab', { name: 'Shadowing' }).click();
    // The shadowing phrase comes from the vocabulary queue (read-only).
    await expect(page.getByLabel('Phrase to shadow')).not.toBeEmpty();
    await page.getByRole('button', { name: 'Say phrase' }).click();
    await expect(page.getByText('Speak now')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Stop recording' }).click();
    await expect(page.getByText('Passed', { exact: true })).toBeVisible({ timeout: 8000 });

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

  test('Collections: enable SRS; New collection is wired', async ({ page }) => {
    // A system pack that is already loaded can be enabled in SRS
    // (empty packs show «Load into database» instead).
    const collections = DEFAULT_IPC_RESPONSES.list_collections as Array<Record<string, unknown>>;
    await openApp(page, '/#/collections', {
      list_collections: collections.map((col, index) =>
        index === 0 ? { ...col, wordCount: 5000, loadStatus: 'ready' } : col,
      ),
    });
    await page.waitForSelector('.collections-page', { timeout: 10_000 });

    // The loaded pack is turned on for SRS with its «In Study» switch;
    // the empty packs offer «Load … into database» instead.
    await expect(page.getByRole('button', { name: 'Load Phrasal verbs into database' })).toBeVisible();
    const enable = page.getByRole('button', { name: /^Enable Top 5000 words in SRS$/i });
    await enable.click();
    await expect(page.getByRole('heading', { name: /Top 5000 words/i })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await page.getByRole('button', { name: 'Create new collection' }).click();
    const dialog = page.getByRole('dialog', { name: 'New collection' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Collection name').fill('Work emails');
    await dialog.getByRole('button', { name: 'Create collection' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('Stats page shows all metric sections', async ({ page }) => {
    await openApp(page, '/#/stats');
    await page.waitForSelector('.stats-page', { timeout: 10_000 });
    await expect(page.getByText('Total vocabulary')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accuracy by error type' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Writing mistake patterns' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pronunciation' })).toBeVisible();
  });

  test('Settings: toggles, model check, shortcuts, autosave', async ({ page }) => {
    await openApp(page, '/#/settings');
    await page.waitForSelector('.settings-page', { timeout: 10_000 });
    const nav = page.getByRole('navigation', { name: 'Settings sections' });

    // Provider checks live in the AI models panel (per-role «Test»).
    const check = page.locator('#settings-ai-models button:enabled', { hasText: /^Test$/ }).first();
    if ((await check.count()) > 0) {
      await check.click();
      await expect(page.getByRole('status').filter({ hasText: /Connected/ }).first()).toBeVisible({
        timeout: 8000,
      });
    }

    await nav.getByRole('button', { name: 'Privacy', exact: true }).click();
    const privacy = page.getByRole('checkbox', { name: /Writing privacy mode/i });
    await privacy.check();
    await expect(privacy).toBeChecked();

    await nav.getByRole('button', { name: 'Global shortcuts', exact: true }).click();
    await page.getByRole('button', { name: 'Open Translator' }).click();

    await nav.getByRole('button', { name: 'Stickers & ambient review', exact: true }).click();
    const quiet = page.getByRole('checkbox', { name: /Quiet hours/i });
    await quiet.check();
    await expect(page.getByLabel('Quiet hours start')).toBeVisible();
    await page.getByLabel('Quiet hours start').fill('21:00');
    await page.getByLabel('Quiet hours end').fill('08:00');

    await page.locator('#settings-sticker-count').fill('4');
    await page.locator('#settings-sticker-opacity').fill('0.7');

    // No Save button: the change is written as soon as the slider settles.
    // The live region is a zero-height sticky anchor; the visible part is its «✓ Saved» note.
    await expect(page.getByRole('status').getByText(/Saved/)).toBeVisible({ timeout: 5000 });
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
    const remember = page.getByRole('button', { name: 'Remembered ✓' });
    await expect(remember).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Toggle translation visibility' }).click();
    await page.getByRole('button', { name: 'Pin on top' }).click();
    // Grading dismisses the card; the mock has no next card, so it goes away.
    await remember.click();
    await expect(remember).toBeHidden();

    await page.reload();
    const forgot = page.getByRole('button', { name: 'Forgot ✕' });
    await expect(forgot).toBeVisible({ timeout: 10_000 });
    await forgot.click();
    await expect(forgot).toBeHidden();

    await page.reload();
    await page.getByRole('button', { name: 'Close sticker' }).click();
  });

  // Grading dismisses the card (the sticker hides itself), so each answer
  // needs a fresh card — one test per button.
  for (const [label, button] of [
    ['remember', /^Remembered/],
    ['forgot', /^Forgot/],
  ] as const) {
    test(`Desktop sticker: "${label}" grades the card and dismisses it`, async ({ page }) => {
      await openApp(page, '/sticker.html');
      const answer = page.getByRole('button', { name: button }).first();
      await expect(answer).toBeVisible({ timeout: 8000 });
      await answer.click();
      await expect(page.getByRole('button', { name: /^(Remembered|Forgot)/ })).toHaveCount(0, {
        timeout: 5000,
      });
    });
  }
});
