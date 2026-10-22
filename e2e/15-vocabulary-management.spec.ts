import { test, expect } from '@playwright/test';
import { mockTauriIpc, MOCK_VOCABULARY_ENTRY } from './helpers/tauri-mock';

test('word actions and selection stay visible and work at desktop widths', async ({ page }) => {
  await mockTauriIpc(page, {
    list_vocabulary: [MOCK_VOCABULARY_ENTRY, {
      ...MOCK_VOCABULARY_ENTRY, id: 2,
      lexeme: { ...MOCK_VOCABULARY_ENTRY.lexeme, id: 2, text: 'reconcile' },
    }],
    count_vocabulary: 2,
    remove_vocabulary_batch: null,
  });
  await page.goto('/#/vocabulary');
  for (const width of [1440, 1100, 900]) {
    await page.setViewportSize({ width, height: 900 });
    const edit = page.getByRole('button', { name: 'Edit apple', exact: true });
    const remove = page.getByRole('button', { name: 'Remove apple', exact: true });
    await expect(edit).toBeVisible();
    await expect(remove).toBeVisible();
    const box = await remove.boundingBox();
    expect(box).not.toBeNull();
    // The icon is 28px; an ::after outset keeps the clickable area at 44×44 (AGENTS §10).
    const hit = await remove.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const after = getComputedStyle(el, '::after');
      const out = (v: string) => Math.max(0, -(parseFloat(v) || 0));
      return {
        width: rect.width + out(after.left) + out(after.right),
        height: rect.height + out(after.top) + out(after.bottom),
      };
    });
    expect(hit.width).toBeGreaterThanOrEqual(44);
    expect(hit.height).toBeGreaterThanOrEqual(44);
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
  await page.getByRole('button', { name: 'Edit apple', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Edit word and translation' })).toBeVisible();
  await expect(page.getByLabel('Word', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select all words on this page' }).check();
  await page.getByRole('button', { name: 'Remove selected (2)' }).click();
  await expect(page.getByRole('dialog')).toContainText('Remove 2 selected words');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: '/tmp/lexora-vocabulary-management.png' });
});
