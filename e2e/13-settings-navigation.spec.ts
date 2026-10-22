// ============================================================
// LEXORA — E2E Test 13: Settings navigation
// Settings is two columns: grouped sections on the left, exactly
// one section open on the right. Every section is one click away
// and can be opened by deep link.
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

const SECTIONS: Array<{ link: string; id: string; group: string }> = [
  { link: 'AI models', id: 'settings-ai-models', group: 'AI' },
  { link: 'AI usage', id: 'settings-ai-usage', group: 'AI' },
  { link: 'Languages', id: 'settings-language', group: 'Learning' },
  { link: 'Appearance', id: 'settings-appearance', group: 'Desktop' },
  { link: 'Writing check in other apps', id: 'settings-writing-check', group: 'Desktop' },
  { link: 'Stickers & ambient review', id: 'settings-stickers', group: 'Desktop' },
  { link: 'Global shortcuts', id: 'settings-shortcuts', group: 'Desktop' },
  { link: 'Privacy', id: 'settings-privacy', group: 'Data' },
  { link: 'Backup & export', id: 'settings-backup', group: 'Data' },
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

  test('the nav lists every section in its group and opens AI models first', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await expect(nav.getByRole('button')).toHaveCount(SECTIONS.length);
    for (const section of SECTIONS) {
      const group = nav.getByRole('group', { name: section.group });
      await expect(group.getByRole('button', { name: section.link, exact: true })).toBeVisible();
    }
    await expect(page.locator('#settings-ai-models')).toBeVisible();
    await expect(nav.getByRole('button', { name: 'AI models', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  for (const section of SECTIONS) {
    test(`«${section.link}» opens its section and closes the others`, async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Settings sections' });
      await nav.getByRole('button', { name: section.link, exact: true }).click();
      await expect(page.locator(`#${section.id}`)).toBeVisible();
      await expect(nav.getByRole('button', { name: section.link, exact: true })).toHaveAttribute('aria-current', 'page');
      for (const other of SECTIONS) {
        if (other.id !== section.id) await expect(page.locator(`#${other.id}`)).toHaveCount(0);
      }
      // The open section is kept in the URL, so reload and deep links land on it.
      await expect(page).toHaveURL(new RegExp(`section=${section.id.replace('settings-', '')}`));
    });
  }

  test('a deep link opens the section directly', async ({ page }) => {
    await page.goto('/#/settings?section=backup');
    await expect(page.locator('#settings-backup')).toBeVisible();
    await expect(page.locator('#settings-ai-models')).toHaveCount(0);
  });

  test('the search box narrows the list to matching sections', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await nav.getByRole('searchbox', { name: 'Search settings' }).fill('stick');
    await expect(nav.getByRole('button')).toHaveCount(1);
    await expect(nav.getByRole('button', { name: 'Stickers & ambient review', exact: true })).toBeVisible();
    await nav.getByRole('searchbox', { name: 'Search settings' }).fill('zzz');
    await expect(nav.getByRole('status')).toHaveText('No settings match your search');
  });

  test('the writing check setting is one click away', async ({ page }, info) => {
    await page.getByRole('button', { name: 'Writing check in other apps', exact: true }).click();
    const toggle = page.getByRole('checkbox', { name: 'Suggest fixes while I type in any app' });
    await expect(toggle).toBeInViewport();
    await info.attach('writing-check', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
