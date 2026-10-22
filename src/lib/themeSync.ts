// ============================================================
// LEXORA — Theme sync between windows
// Each Tauri window (main, popup, stickers, grammar) is its own webview:
// a `storage` event from another webview is not delivered, so a theme
// change is broadcast as a Tauri event and every window applies it.
// ============================================================

import { emit, listen } from '@tauri-apps/api/event';
import { useSettingsStore } from '../stores/settingsStore';
import { applyTheme, isThemePreference, watchSystemTheme, type ThemePreference } from './theme';

export const THEME_EVENT = 'lexora:theme-changed';

/** Tell the other windows about a theme the user just picked. */
export function broadcastTheme(theme: ThemePreference): void {
  void emit(THEME_EVENT, theme).catch(() => undefined);
}

/**
 * Apply the stored theme now, follow the OS while it is `system`, and adopt
 * themes announced by other windows. Returns a cleanup function.
 */
export function startThemeSync(): () => void {
  let stopSystemWatch = () => undefined as void;

  const adopt = (theme: ThemePreference) => {
    stopSystemWatch();
    applyTheme(theme);
    stopSystemWatch = theme === 'system' ? watchSystemTheme(() => applyTheme('system')) : () => undefined;
  };

  adopt(useSettingsStore.getState().theme);

  let unlisten: (() => void) | null = null;
  let stopped = false;
  void listen<unknown>(THEME_EVENT, (event) => {
    if (!isThemePreference(event.payload)) return;
    // setState, not setTheme: applying a received theme must not re-broadcast it.
    useSettingsStore.setState({ theme: event.payload });
    adopt(event.payload);
  })
    .then((fn) => {
      if (stopped) fn();
      else unlisten = fn;
    })
    .catch(() => undefined);

  return () => {
    stopped = true;
    stopSystemWatch();
    unlisten?.();
  };
}
