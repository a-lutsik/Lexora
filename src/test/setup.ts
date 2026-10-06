// ============================================================
// LEXORA — Vitest global setup
// jest-dom матчеры + моки Tauri API, чтобы компоненты,
// использующие ipc, рендерились в jsdom без Tauri-рантайма.
// Моки живут в ./mocks и доступны тестам для настройки поведения.
// ============================================================

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { ChannelMock, invokeMock, listenMock, emitMock, tauriWindowMock } from './mocks';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
  convertFileSrc: (path: string) => `asset://localhost/${path}`,
  Channel: ChannelMock,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: listenMock,
  emit: emitMock,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => tauriWindowMock,
}));

vi.mock('../lib/pdfExtract', () => ({
  extractPdfPageText: vi.fn(async () => ''),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── Гигиена между тестами ───────────────────────────────────

afterEach(() => {
  cleanup();
  invokeMock.mockReset();
  emitMock.mockClear();
  tauriWindowMock.label = 'sticker-0';
  tauriWindowMock.hide.mockClear();
  tauriWindowMock.show.mockClear();
  tauriWindowMock.setAlwaysOnTop.mockClear();
  tauriWindowMock.onFocusChanged.mockClear();
  tauriWindowMock.startResizeDragging.mockClear();
  listenMock.mockClear();
  localStorage.clear();
});
