// ============================================================
// LEXORA — Playwright E2E Config
// Тесты запускаются против dev-сервера Vite (localhost:1420).
// Tauri IPC (window.__TAURI_INTERNALS__) мокируется через
// page.addInitScript() в каждом тесте.
//
// Запуск:
//   npm run test:e2e              # все тесты
//   npm run test:e2e -- --ui      # интерактивный режим
//   npm run test:e2e -- --headed  # с видимым браузером
// ============================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Запускаем тесты последовательно (Tauri — single-user desktop app)
  workers: 1,
  fullyParallel: false,
  retries: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    // Dev-сервер Vite
    baseURL: 'http://localhost:1420',
    // Сохраняем скриншоты только при ошибках
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Имитируем macOS Retina для точного pixel-проверки
    deviceScaleFactor: 2,
    permissions: ['microphone'],
    launchOptions: {
      // PLAYWRIGHT_CHROMIUM_PATH: use a preinstalled Chromium when its build
      // differs from the one this @playwright/test version expects.
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {}),
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
