// ============================================================
// LEXORA — E2E helpers: fake-mic record + stop
// Requires Playwright launch flags:
//   --use-fake-ui-for-media-stream --use-fake-device-for-media-stream
// ============================================================

import { expect, type Page } from '@playwright/test';

export async function recordAndStop(page: Page, idleName: string | RegExp): Promise<void> {
  await page.getByRole('button', { name: idleName }).click();
  await expect(page.getByText('Recording…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  // Let MediaRecorder emit at least one timeslice (100ms) of fake audio.
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording…', { exact: true })).toBeHidden();
}

export function rgbOf(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNearRgb(
  actual: string,
  expected: [number, number, number],
  tolerance = 8,
): boolean {
  const rgb = rgbOf(actual);
  if (!rgb) return false;
  return rgb.every((channel, i) => Math.abs(channel - (expected[i] ?? 0)) <= tolerance);
}
