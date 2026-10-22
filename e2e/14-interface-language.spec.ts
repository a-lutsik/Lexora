import { expect, test } from '@playwright/test';
import { LANGUAGE_CATALOG } from '../src/lib/languages';
import { mockTauriIpc } from './helpers/tauri-mock';

test.beforeEach(async ({ page }) => {
  await mockTauriIpc(page, {
    get_grammar_watch_settings: { enabled: false, excludedApps: [] },
    get_grammar_watch_status: { supported: true, accessibilityTrusted: true },
  });
  await page.goto('/#/settings?section=language');
  await page.waitForSelector('.settings-page');
  await page.waitForSelector('#settings-learning-lang');
});

/** Native name of a language label: «Russian (Русский)» → «Русский»; «English» → «English». */
const nativeName = (label: string | null) => /\(([^)]+)\)\s*$/.exec(label ?? '')?.[1] ?? (label ?? '').trim();

test('interface locale switches immediately, persists, and leaves source/target intact', async ({ page }) => {
  const source = await page.locator('#settings-learning-lang').textContent();
  const target = await page.locator('#settings-translation-lang').textContent();
  await page.getByRole('button', { name: 'Languages', exact: true }).click();
  await page.locator('#settings-interface-lang').click();
  await expect(page.getByRole('option')).toHaveCount(6);
  await page.getByRole('option', { name: 'Русский ru', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Настройки', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  // Language names follow the UI locale; the chosen languages themselves must not change.
  await expect(page.locator('#settings-learning-lang')).toContainText(nativeName(source));
  await expect(page.locator('#settings-translation-lang')).toContainText(nativeName(target));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Настройки', exact: true })).toBeVisible();
  await expect(page.locator('#settings-interface-lang')).toHaveText(/Русский/);
});

test('only interface languages are restricted, while learning languages retain the full catalog', async ({ page }) => {
  await page.getByRole('button', { name: 'Languages', exact: true }).click();
  await page.locator('#settings-interface-lang').click();
  await expect(page.getByRole('option')).toHaveText([
    'Englishen', 'Русскийru', 'Українськаuk', 'Españoles', 'Françaisfr', 'Italianoit',
  ]);
  await page.getByRole('option', { name: 'English en', exact: true }).click();
  for (const selector of ['#settings-learning-lang', '#settings-translation-lang']) {
    await page.locator(selector).click();
    await expect(page.getByRole('option')).toHaveCount(LANGUAGE_CATALOG.length);
    await page.getByRole('option', { name: /Deutsch/ }).click();
  }
});

test('an obsolete saved interface locale falls back to English after reload', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('lexora-interface-locale', 'ar'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#settings-interface-lang')).toHaveText('English');
});
