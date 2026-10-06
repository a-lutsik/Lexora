// ============================================================
// LEXORA — E2E Test 10: AI Dialogue smoke
// ============================================================

import { test, expect } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

test.describe('AI Dialogue', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriIpc(page);
    await page.goto('/#/dialogue');
    await page.waitForSelector('.dialogue-page', { timeout: 10_000 });
  });

  test('sidebar Dialogue nav is active and tabs render', async ({ page }) => {
    const nav = page.getByRole('link', { name: 'AI Dialogue' });
    await expect(nav).toBeVisible();
    await expect(nav).toHaveClass(/active/);

    const dialogueTab = page.getByRole('tab', { name: 'AI Dialogue' });
    const scenariosTab = page.getByRole('tab', { name: 'Practice Scenarios' });
    await expect(dialogueTab).toBeVisible();
    await expect(scenariosTab).toBeVisible();
    await expect(dialogueTab).toHaveAttribute('aria-selected', 'true');
  });

  test('shows coffee shop scenario header, space badge, and Say / Send', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Coffee Shop in London (B2 Level)' }),
    ).toBeVisible();
    await expect(
      page.getByText('What kind of roast would you like with your flat white today?'),
    ).toBeVisible();
    await expect(page.getByText('Press or hold Spacebar to reply')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Say or send reply' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play tutor line' })).toBeVisible();
  });

  test('Practice Scenarios tab lists catalog', async ({ page }) => {
    await page.getByRole('tab', { name: 'Practice Scenarios' }).click();
    await expect(page.getByRole('heading', { name: 'Practice Scenarios' })).toBeVisible();
    await expect(page.getByText('Airport Check-in (B1 Level)')).toBeVisible();
  });

  test('chip reply updates turn and session scores', async ({ page }) => {
    await expect(page.getByRole('meter', { name: 'Current turn score' })).toHaveAttribute(
      'aria-valuetext',
      'No score yet',
    );

    await page.getByRole('button', { name: 'medium roast' }).click();
    await expect(page.getByRole('meter', { name: 'Current turn score' })).toHaveAttribute(
      'aria-valuenow',
      '95',
    );
    await expect(page.getByText('92%', { exact: true }).first()).toBeVisible();
  });
});
