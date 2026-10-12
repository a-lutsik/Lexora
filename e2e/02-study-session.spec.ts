// ============================================================
// LEXORA — E2E Test 2: Study Session Flow
// Mandatory scenario per AGENTS.md §12.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('Study Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/study');
    // Ждём setup screen
    await page.waitForSelector('text=Study Session', { timeout: 10_000 });
  });

  test('setup screen shows due count from mock', async ({ page }) => {
    await expect(page.getByText(/5 cards due/i)).toBeVisible({ timeout: 5000 });
  });

  test('study mode selector is visible', async ({ page }) => {
    await expect(page.getByRole('radiogroup', { name: 'Select study mode' })).toBeVisible();
  });

  test('Start Session button has correct label', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Start Session/ })).toBeVisible();
  });

  test('shell fills a tall viewport without clipping the start button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await expect(page.getByRole('button', { name: /^Start Session/ })).toBeInViewport();

    const filled = await page.evaluate(() => {
      const layout = document.querySelector('.app-layout');
      const sidebar = document.querySelector('.sidebar');
      if (!(layout instanceof HTMLElement) || !(sidebar instanceof HTMLElement)) {
        return { ok: false, layoutHeight: 0, sidebarHeight: 0, viewportHeight: window.innerHeight };
      }
      const layoutHeight = Math.round(layout.getBoundingClientRect().height);
      const sidebarHeight = Math.round(sidebar.getBoundingClientRect().height);
      return {
        ok: layoutHeight >= window.innerHeight - 1 && sidebarHeight >= window.innerHeight - 1,
        layoutHeight,
        sidebarHeight,
        viewportHeight: window.innerHeight,
      };
    });

    expect(filled.ok, `layout ${filled.layoutHeight} sidebar ${filled.sidebarHeight} vs vh ${filled.viewportHeight}`).toBe(true);
  });

  test('starting session shows flashcard with word from mock', async ({ page }) => {
    await page.getByRole('button', { name: /^Start Session/ }).click();

    // Карточка с словом 'apple'
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
    // Прогресс "Card 1 of 1"
    await expect(page.getByText(/Card 1 of/i)).toBeVisible();
  });

  test('Show Answer button reveals translation', async ({ page }) => {
    await page.getByRole('button', { name: /^Start Session/ }).click();
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });

    await page.getByRole('button', { name: 'Show translation' }).click();
    await expect(page.getByText('яблоко')).toBeVisible({ timeout: 5000 });
  });

  test('grading buttons appear after reveal (SM-2 grades)', async ({ page }) => {
    await page.getByRole('button', { name: /^Start Session/ }).click();
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
    await page.getByRole('button', { name: 'Show translation' }).click();

    await expect(page.getByRole('button', { name: /Again/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Hard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Good/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Easy/i })).toBeVisible();
  });

  test('clicking Good completes the session (1 card queue → done screen)', async ({ page }) => {
    await page.getByRole('button', { name: /^Start Session/ }).click();
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
    await page.getByRole('button', { name: 'Show translation' }).click();
    await page.getByRole('button', { name: /Good/i }).click();

    await expect(page.getByText('🎉')).toBeVisible({ timeout: 8000 });
  });

  test('rating group has all 4 SM-2 grade options', async ({ page }) => {
    await page.getByRole('button', { name: /^Start Session/ }).click();
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
    await page.getByRole('button', { name: 'Show translation' }).click();

    const ratingGroup = page.getByRole('group', { name: 'Rate your recall' });
    await expect(ratingGroup).toBeVisible({ timeout: 5000 });

    await expect(ratingGroup.getByRole('button', { name: /Again/i })).toBeVisible();
    await expect(ratingGroup.getByRole('button', { name: /Hard/i })).toBeVisible();
    await expect(ratingGroup.getByRole('button', { name: /Good/i })).toBeVisible();
    await expect(ratingGroup.getByRole('button', { name: /Easy/i })).toBeVisible();
  });
});

test.describe('Study Session Flow — rating persistence', () => {
  test('a failed save keeps the card on screen and shows an error', async ({ page }) => {
    await mockTauriIpc(page, { submit_review: { __error: 'database is locked' } });
    await page.goto('/#/study');
    await page.waitForSelector('text=Study Session', { timeout: 10_000 });

    await page.getByRole('button', { name: /^Start Session/ }).click();
    await expect(page.locator('.study-card-word')).toHaveText('apple', { timeout: 8000 });
    await page.getByRole('button', { name: 'Show translation' }).click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText(/couldn.t save/i, { timeout: 5000 });
    await expect(page.getByText('🎉')).toHaveCount(0);
    await expect(page.locator('.study-card-word')).toHaveText('apple');
  });
});
