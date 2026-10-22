import { test, expect } from '@playwright/test';
import { mockTauriIpc, MOCK_VOCABULARY_ENTRY } from './helpers/tauri-mock';

test('categories support creation, filtered adding, moving and sticker sources', async ({ page }) => {
  const categories = [
    { id: 1, languageId: 1, name: 'General', isGeneral: true, wordCount: 0 },
    { id: 2, languageId: 1, name: 'Travel', isGeneral: false, wordCount: 1 },
  ];
  await mockTauriIpc(page, {
    list_categories: categories,
    create_category: { ...categories[1], id: 3, name: 'Work' },
    list_vocabulary: [MOCK_VOCABULARY_ENTRY],
    count_vocabulary: 1,
    move_vocabulary_to_category: null,
  });
  await page.goto('/#/vocabulary');
  await expect(page.getByRole('row', { name: /apple:/ })).toBeVisible();
  await page.evaluate(() => {
    const w = window as unknown as Window & {
      __TAURI_INTERNALS__: { invoke: (cmd: string, args?: unknown) => Promise<unknown> };
      __categoryCalls: Array<{ cmd: string; args: unknown }>;
    };
    w.__categoryCalls = [];
    const original = w.__TAURI_INTERNALS__.invoke;
    w.__TAURI_INTERNALS__.invoke = (cmd, args) => {
      w.__categoryCalls.push({ cmd, args });
      return original(cmd, args);
    };
  });

  // Category creation is the last entry of the category filter list (frame 1a has no separate button).
  await page.getByRole('combobox', { name: 'Filter by category' }).click();
  await page.getByRole('option', { name: 'New category…', exact: true }).click();
  await page.getByRole('textbox', { name: 'Category name' }).fill('Work');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'create_category', args: { name: 'Work', languageId: 1 } });

  await page.getByRole('combobox', { name: 'Filter by category' }).click();
  await page.getByRole('option', { name: 'Travel', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'list_vocabulary', args: { filters: expect.objectContaining({ categoryId: 2, page: 1 }) } });
  await page.getByRole('checkbox', { name: 'Select apple', exact: true }).check();
  await page.getByRole('combobox', { name: 'Move to category', exact: true }).click();
  await page.getByRole('option', { name: 'Travel', exact: true }).click();
  await page.getByRole('button', { name: 'Move selected', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'move_vocabulary_to_category', args: { ids: [1], categoryId: 2 } });

  for (const width of [1440, 1100, 900]) {
    await page.setViewportSize({ width, height: 900 });
    for (const control of ['Filter by category', 'Search vocabulary']) {
      const box = await page.getByRole(control.startsWith('Filter') ? 'combobox' : 'searchbox', { name: control }).boundingBox();
      expect(box).not.toBeNull();
      if (box) expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: '/private/tmp/lexora-categories.png' });

  await page.getByRole('button', { name: 'Add word', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Category', exact: true })).toHaveText('Travel');
  await page.getByRole('textbox', { name: 'Word or phrase to translate' }).fill('airport');
  await page.getByRole('button', { name: 'Add to vocabulary', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'add_to_vocabulary', args: { input: expect.objectContaining({ text: 'airport', categoryId: 2 }) } });
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Stickers & ambient review', exact: true }).click();
  const sourcePicker = page.getByRole('group', { name: 'Words on stickers' });
  await sourcePicker.getByText('Categories', { exact: true }).click();
  await expect(sourcePicker.locator('details').getByRole('checkbox', { name: 'Travel', exact: true })).toBeVisible();
  await sourcePicker.getByRole('checkbox', { name: 'All vocabulary', exact: true }).uncheck();
  await sourcePicker.getByRole('checkbox', { name: 'My words', exact: true }).uncheck();
  await sourcePicker.locator('details').getByRole('checkbox', { name: 'Travel', exact: true }).check();
  await expect(sourcePicker.locator('details').getByRole('checkbox', { name: 'Travel', exact: true })).toBeChecked();
  await expect(sourcePicker.locator('details').getByRole('checkbox', { name: 'General', exact: true })).not.toBeChecked();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'update_settings', args: { settings: expect.objectContaining({ stickerSources: ['cat:2'] }) } });
  await sourcePicker.locator('details').getByRole('checkbox', { name: 'Travel', exact: true }).uncheck();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__categoryCalls')))
    .toContainEqual({ cmd: 'update_settings', args: { settings: expect.objectContaining({ stickerSources: [] }) } });
  await expect(sourcePicker.getByRole('checkbox', { name: 'All vocabulary', exact: true })).not.toBeChecked();
  await page.getByRole('link', { name: 'Vocabulary', exact: true }).click();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Stickers & ambient review', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Words on stickers' }).getByRole('checkbox', { name: 'All vocabulary', exact: true })).not.toBeChecked();
});
