// ============================================================
// LEXORA — E2E Test 13: Settings navigation
// Settings is one long scroll; every section must be reachable in one
// click from the sticky bar, and none may hide under it.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

const SECTIONS: Array<{ link: string; id: string }> = [
  { link: 'AI models', id: 'settings-ai-models' },
  { link: 'AI usage', id: 'settings-ai-usage' },
  { link: 'Language', id: 'settings-language' },
  { link: 'Privacy', id: 'settings-privacy' },
  { link: 'Writing check', id: 'settings-writing-check' },
  { link: 'Stickers', id: 'settings-stickers' },
  { link: 'Shortcuts', id: 'settings-shortcuts' },
  { link: 'Backup', id: 'settings-backup' },
];

test.describe('Settings navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page, {
      get_grammar_watch_settings: { enabled: false, excludedApps: [] },
      get_grammar_watch_status: { supported: true, accessibilityTrusted: true },
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/settings');
    await page.waitForSelector('.settings-page');
  });

  test('the nav lists every section and every target exists', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await expect(nav.getByRole('button')).toHaveCount(SECTIONS.length);
    for (const section of SECTIONS) {
      await expect(nav.getByRole('button', { name: section.link, exact: true })).toBeVisible();
      await expect(page.locator(`#${section.id}`)).toHaveCount(1);
    }
  });

  for (const section of SECTIONS) {
    test(`«${section.link}» jumps to its section, below the bar`, async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Settings sections' });
      await nav.getByRole('button', { name: section.link, exact: true }).click();
      const target = page.locator(`#${section.id}`);
      await expect(target).toBeInViewport();
      const navBox = await nav.boundingBox();
      const targetBox = await target.boundingBox();
      if (!navBox || !targetBox) throw new Error('Nav or section is not laid out');
      expect(targetBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
    });
  }

  test('the nav stays visible while scrolling', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await nav.getByRole('button', { name: 'Backup', exact: true }).click();
    await expect(nav).toBeInViewport({ ratio: 1 });
  });

  test('the writing check setting is one click away', async ({ page }, info) => {
    await page.getByRole('button', { name: 'Writing check', exact: true }).click();
    const toggle = page.getByRole('checkbox', { name: 'Suggest fixes while I type in any app' });
    await expect(toggle).toBeInViewport();
    await info.attach('writing-check', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
