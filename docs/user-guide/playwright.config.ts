import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'capture.spec.ts',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:1420',
    deviceScaleFactor: 2,
    viewport: { width: 1360, height: 860 },
    colorScheme: 'dark',
    actionTimeout: 6000,
    ...devices['Desktop Chrome'],
    viewport: { width: 1360, height: 860 },
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  },
});
