import { expect, test } from '@playwright/test';
import { DEFAULT_IPC_RESPONSES, mockTauriIpc } from './helpers/tauri-mock';
import { readFileSync } from 'node:fs';

const catalogs: Record<string, Record<string, string>> = Object.fromEntries(
  ['en', 'ru', 'uk', 'es', 'fr', 'it'].map((locale) => [locale,
    JSON.parse(readFileSync(new URL(`../src/i18n/${locale}.json`, import.meta.url), 'utf8')),
  ]),
);
const routes = [
  ['vocabulary', 'Vocabulary'], ['study', 'Study'], ['writing', 'Writing'],
  ['translate', 'Translate'], ['pronunciation', 'Speak'],
  ['collections', 'Collections'], ['stats', 'Statistics'], ['settings', 'Settings'],
];

for (const [locale, dictionary] of Object.entries(catalogs)) {
  test(`${locale}: all routes, popup, stickers and writing-check window use the interface language`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await mockTauriIpc(page, {
      set_interface_locale: null,
      get_grammar_watch_settings: { enabled: false, excludedApps: [] },
      get_grammar_watch_status: { supported: true, accessibilityTrusted: true },
      get_grammar_field: { kind: 'check', fieldId: 7, text: 'She go to school yesterday.', appName: 'Mail', bundleId: 'com.apple.mail' },
      check_writing: DEFAULT_IPC_RESPONSES['check_writing'],
    });
    await page.addInitScript((code: string) => localStorage.setItem('lexora-interface-locale', code), locale);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const [route, title] of routes) {
      await page.goto(`/#/${route}`);
      await expect(page.getByRole('heading', { name: dictionary[title], exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('link', { name: dictionary['Settings'], exact: true })).toBeVisible();
    }
    await page.goto('/#/dialogue');
    await expect(page.getByRole('tab', { name: dictionary['Conversation'], exact: true })).toBeVisible();

    // Exercise dynamic metadata, without translating the learner's English text.
    await page.goto('/#/writing');
    await page.locator('textarea').fill('She go to school yesterday.');
    await page.getByRole('button', { name: dictionary['Check writing'], exact: true }).click();
    await expect(page.locator('.writing-issue--pending')).toBeVisible();
    // The explanation lives in the collapsible card: open it first.
    await page.locator('.writing-issue--pending .writing-issue__head').first().click();
    await expect(page.locator('.writing-issue-meta').getByText(dictionary['Grammar'], { exact: true }).first()).toBeVisible();
    // Severity is the dot's colour; its translated name is kept for screen readers.
    await expect(page.locator('.writing-issue-meta').getByText(dictionary['error'], { exact: true }).first()).toBeAttached();
    await expect(page.getByText('Past tense requires "went".', { exact: true })).toBeVisible();
    if (locale === 'fr') await page.screenshot({ path: info.outputPath('french-writing.png') });

    await page.setViewportSize({ width: 460, height: 600 });
    await page.goto('/popup.html');
    await expect(page.getByRole('textbox', { name: dictionary['Translate query'], exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: dictionary['Close window'], exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: dictionary['Translate'], exact: true })).toBeVisible();
    if (locale === 'fr') await page.screenshot({ path: info.outputPath('french-popup.png') });

    await page.setViewportSize({ width: 340, height: 400 });
    await page.goto('/sticker.html');
    await expect(page.getByRole('button', { name: dictionary['Помню ✓'], exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: dictionary['Позже'], exact: true })).toBeVisible();
    if (locale === 'fr') await page.screenshot({ path: info.outputPath('french-sticker.png') });

    await page.setViewportSize({ width: 440, height: 560 });
    await page.goto('/grammar.html');
    await page.locator('.grammar-badge').click();
    await expect(page.getByRole('button', { name: dictionary['Close suggestions'], exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: dictionary['Apply fix: {change}'].replace('{change}', 'go → went'), exact: true })).toHaveText(dictionary['Apply']);
    await expect(page.locator('.grammar-card-category')).toHaveText(dictionary['Grammar']);
    expect(errors).toEqual([]);
  });
}
