// ============================================================
// LEXORA — Shared Tauri API mocks
// Отдельный модуль: vi.mock-фабрики могут ссылаться
// на импортированные binding'и, но не на локальные export const.
// ============================================================

import { vi } from 'vitest';

export const invokeMock = vi.fn();
export const emitMock = vi.fn(() => Promise.resolve());

export const tauriWindowMock = {
  label: 'sticker-0',
  hide: vi.fn(() => Promise.resolve()),
  show: vi.fn(() => Promise.resolve()),
  setAlwaysOnTop: vi.fn(() => Promise.resolve()),
  onFocusChanged: vi.fn(() => Promise.resolve(() => undefined)),
  startResizeDragging: vi.fn(() => Promise.resolve()),
};

export const listenMock = vi.fn(() => Promise.resolve(() => undefined));

/** Stand-in for `Channel` from @tauri-apps/api/core: tests call `onmessage` directly. */
export class ChannelMock<T = unknown> {
  id = 0;
  onmessage: (message: T) => void = () => undefined;
}
