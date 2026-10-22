// ============================================================
// LEXORA — E2E Test 5: Pronunciation Coach
// Functions (practice / shadowing / pairs / history / speaking)
// plus design-token and a11y layout checks.
// ============================================================

import { test, expect } from '@playwright/test';
import { DEFAULT_IPC_RESPONSES, MOCK_VOCABULARY_ENTRY, mockTauriIpc } from './helpers/tauri-mock';
import { recordAndStop } from './helpers/record';

/** Computed colour of a CSS token (`--bg`, `--live`…) in the live page — the palette is oklch, so RGB constants would be stale. */
async function tokenColor(page: import('@playwright/test').Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

test.describe('Pronunciation Coach Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/pronunciation');
    await page.waitForSelector('.pronunciation-page', { timeout: 10_000 });
  });

  test('renders pronunciation coach header and tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Speak' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Practice' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Shadowing' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Minimal pairs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Practice' })).toHaveAttribute('aria-selected', 'true');
  });

  test('Speak nav is active and sidebar uses accent tokens', async ({ page }) => {
    const speak = page.getByRole('link', { name: 'Pronunciation' });
    await expect(speak).toBeVisible();
    await expect(speak).toHaveClass(/active/);

    const iconColor = await speak.locator('.nav-icon').evaluate((el) => getComputedStyle(el).color);
    expect(iconColor, `Speak icon color ${iconColor}`).toBe(await tokenColor(page, '--acc-text'));
  });

  test('practice tab allows typing target text and shows play button', async ({ page }) => {
    const input = page.locator('input#pron-target');
    await expect(input).toBeVisible();
    await input.fill('apple');

    await expect(page.getByRole('button', { name: 'Listen', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hold to record/i })).toBeVisible();
  });

  test('pre-fills word and IPA from the query string', async ({ page }) => {
    await page.goto('/#/pronunciation?word=think&ipa=%2F%CE%B8%C9%AA%C5%8Bk%2F');
    await expect(page.locator('input#pron-target')).toHaveValue('think');
    await expect(page.locator('input#pron-ipa')).toHaveValue('/θɪŋk/');
  });

  test('records an attempt and shows phoneme feedback, score, and tip', async ({ page }) => {
    await page.locator('input#pron-target').fill('apple');
    await recordAndStop(page, /Hold to record/i);

    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toHaveAttribute(
      'aria-valuenow',
      '92',
    );
    await expect(page.getByText('Clear vowels and crisp consonants.')).toBeVisible();
    await expect(page.getByText('Heard:')).toBeVisible();
    await expect(page.locator('.pronunciation-heard')).toHaveText('apple');
    await expect(page.getByLabel('Phoneme scores')).toBeVisible();
    await expect(page.getByText('/æ/')).toBeVisible();
    await expect(page.getByText('heard /b/')).toBeVisible();

    await page.getByRole('button', { name: /Get articulation tip for p/ }).click();
    await expect(page.getByText(/Close both lips/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Tongue:/)).toBeVisible();
  });

  test('does not show the unsupported-environment error after Record', async ({ page }) => {
    await page.locator('input#pron-target').fill('Self-healing');
    await page.getByRole('button', { name: /Hold to record/i }).click();
    await expect(page.getByText('Recording is not supported in this environment.')).toHaveCount(0);
    await expect(page.getByText('Recording…', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Stop recording' }).click();
  });

  test('shadowing Say records after the model and passes at 92%', async ({ page }) => {
    await page.getByRole('tab', { name: 'Shadowing' }).click();
    await expect(page.getByRole('tab', { name: 'Shadowing' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/Round \d of 3/)).toHaveCount(0);

    await expect(page.getByLabel('Phrase to shadow')).toHaveText('apple');
    await expect(page.getByRole('textbox', { name: 'Phrase to shadow' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Say phrase' }).click();
    await expect(page.getByText('Speak now')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Stop recording' }).click();

    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toContainText('92');
    await expect(page.getByText('Passed', { exact: true })).toBeVisible();
    await expect(page.getByText(/Round \d of 3/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Postpone phrase' })).toHaveCount(0);
  });

  test('switching to Minimal pairs tab renders pair contrast card', async ({ page }) => {
    await page.getByRole('tab', { name: 'Minimal pairs' }).click();

    await expect(page.getByRole('heading', { name: 'Pronunciation: Minimal Pairs' })).toBeVisible();
    await expect(page.locator('.pairs-card-word').first()).toHaveText('ship', { timeout: 5000 });
    await expect(page.locator('.pairs-card-word').nth(1)).toHaveText('sheep');
    await expect(page.getByText('/ʃɪp/').first()).toBeVisible();
    await expect(page.getByText('/ʃiːp/').first()).toBeVisible();
    await expect(page.getByText(/Phoneme Contrast: \/ɪ\/ vs \/iː\//)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Listen to ship' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Listen to sheep' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next pair' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Say / Record' })).toBeVisible();
    await expect(page.locator('.pairs-card.is-target')).toBeVisible();
  });

  test('minimal pair recording scores the prompted word', async ({ page }) => {
    await page.getByRole('tab', { name: 'Minimal pairs' }).click();
    await expect(page.locator('.pairs-card.is-target')).toBeVisible();
    await recordAndStop(page, /Say \/ Record/i);
    await expect(page.getByRole('meter', { name: 'Pronunciation score' })).toBeVisible({ timeout: 8000 });
  });

  test('switching to History tab shows recent attempts', async ({ page }) => {
    await page.getByRole('tab', { name: 'History' }).click();

    await expect(page.locator('.pronunciation-history-word').first()).toHaveText('apple', { timeout: 5000 });
    await expect(page.locator('.pronunciation-history-score').first()).toHaveText('92');
  });

  test('problem sounds sidebar lists weak phonemes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Problem sounds' })).toBeVisible();
    await expect(page.getByText('/θ/')).toBeVisible();
    await expect(page.getByText('×5')).toBeVisible();
  });

  test('layout uses design tokens, 44px targets, and no horizontal overflow', async ({ page }) => {
    const pageEl = page.locator('.pronunciation-page');
    const pageBg = await pageEl.evaluate((el) => getComputedStyle(el).backgroundColor);
    const layoutBg = await page.locator('.app-layout').evaluate((el) => getComputedStyle(el).backgroundColor);
    const bgToken = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--bg)';
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    expect(layoutBg, `layout bg ${layoutBg}`).toBe(bgToken);
    expect(pageBg === bgToken || pageBg === 'rgba(0, 0, 0, 0)', `page bg ${pageBg}`).toBe(true);

    await expect(page.locator('.drill-scene')).toBeVisible();

    // Lingora: активная вкладка — сегмент (.seg__item) с кольцом из линии, без акцентной рамки
    const activeTab = page.getByRole('tab', { name: 'Practice' });
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');
    const tabRadius = await activeTab.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(tabRadius)).toBeGreaterThanOrEqual(6);

    const recordBtn = page.getByRole('button', { name: /Hold to record/i });
    const box = await recordBtn.boundingBox();
    expect(box).not.toBeNull();
    // 40px pill; ::after extends the hit target to 44px (AGENTS §10).
    const hitOutset = await recordBtn.evaluate((el) => -parseFloat(getComputedStyle(el, '::after').top));
    expect((box?.height ?? 0) + 2 * hitOutset).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('error text uses the accessible danger token', async ({ page }) => {
    await page.evaluate(() => {
      const host = document.querySelector('.pronunciation-page');
      if (!host) return;
      const p = document.createElement('p');
      p.className = 'record-control-error';
      p.textContent = 'Microphone permission denied. Allow access in system settings.';
      host.appendChild(p);
    });
    const color = await page.locator('.record-control-error').evaluate((el) => getComputedStyle(el).color);
    expect(color, `error color ${color}`).toBe(await tokenColor(page, '--live'));
  });
});

test.describe('Shadowing below pass threshold', () => {
  test('stays on the phrase and postpones only by hand', async ({ page }) => {
    const scored = DEFAULT_IPC_RESPONSES.evaluate_pronunciation as Record<string, unknown>;
    await mockTauriIpc(page, {
      evaluate_pronunciation: {
        ...scored,
        overallScore: 84,
        summary: 'The first vowel is too open.',
      },
      list_vocabulary: [
        MOCK_VOCABULARY_ENTRY,
        {
          ...MOCK_VOCABULARY_ENTRY,
          id: 2,
          lexemeId: 2,
          lexeme: {
            ...MOCK_VOCABULARY_ENTRY.lexeme,
            id: 2,
            text: 'banana',
            normalizedText: 'banana',
            phonetic: '/bəˈnɑːnə/',
          },
        },
      ],
    });
    await page.goto('/#/pronunciation');
    await page.waitForSelector('.pronunciation-page', { timeout: 10_000 });

    await page.getByRole('tab', { name: 'Shadowing' }).click();
    await expect(page.getByLabel('Phrase to shadow')).toHaveText('apple');
    await page.getByRole('button', { name: 'Say phrase' }).click();
    await expect(page.getByText('Speak now')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Stop recording' }).click();

    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toContainText('84', { timeout: 8000 });
    await expect(page.getByText('Need 90% to pass')).toBeVisible();
    await expect(page.getByLabel('Phrase to shadow')).toHaveText('apple');
    await expect(page.getByText(/Close both lips/)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Postpone phrase' }).click();
    await expect(page.getByLabel('Phrase to shadow')).toHaveText('banana');
    await expect(page.getByText('Need 90% to pass')).toHaveCount(0);
    await expect(page.getByRole('meter', { name: 'Current pronunciation score' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});

test.describe('Speaking study mode', () => {
  test('starts a speaking session and scores a recording', async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/study');
    await page.waitForSelector('h1:has-text("Study")', { timeout: 10_000 });

    await page.getByRole('radio', { name: /Speaking/ }).click();
    await page.getByRole('button', { name: /^Start session/ }).click();

    await expect(page.getByText('Say this word aloud:')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.flashcard-word')).toHaveText('apple');
    await expect(page.getByRole('button', { name: 'Play model pronunciation' })).toBeVisible();

    await recordAndStop(page, /Record pronunciation/i);
    await expect(page.getByRole('meter', { name: 'Pronunciation score' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Easy')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/ })).toBeVisible();
  });
});
