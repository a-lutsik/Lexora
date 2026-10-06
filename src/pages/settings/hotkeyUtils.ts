// ============================================================
// LEXORA — Hotkey utilities
// Parse/validate/format global shortcuts in
// tauri-plugin-global-shortcut format (e.g. 'CmdOrCtrl+Shift+L').
// ============================================================

const MODIFIER_ORDER = ['CmdOrCtrl', 'Shift', 'Alt', 'Super', 'Ctrl'] as const;

const MODIFIER_LABELS: Record<string, string> = {
  CmdOrCtrl: '⌘',
  Ctrl: '⌃',
  Shift: '⇧',
  Alt: '⌥',
  Super: '⌘',
};

const KEY_LABELS: Record<string, string> = {
  Space: 'Space',
  Enter: '⏎',
  Backspace: '⌫',
  Delete: '⌦',
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  Tab: '⇥',
};

export const MODIFIER_KEY_NAMES = new Set(['Meta', 'Control', 'Shift', 'Alt']);

// Keys we can bind as the main key, besides single characters.
export const NAMED_KEYS: Record<string, string> = {
  ' ': 'Space',
  Spacebar: 'Space',
  Enter: 'Enter',
  Backspace: 'Backspace',
  Delete: 'Delete',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Tab: 'Tab',
};

// Splits a shortcut string into modifiers + main key.
export function parseHotkey(hotkey: string): { modifiers: string[]; key: string | null } {
  const parts = hotkey.split('+').filter((p) => p.length > 0);
  const modifiers = parts
    .filter((p) => MODIFIER_LABELS[p] !== undefined)
    .sort(
      (a, b) =>
        MODIFIER_ORDER.indexOf(a as (typeof MODIFIER_ORDER)[number]) -
        MODIFIER_ORDER.indexOf(b as (typeof MODIFIER_ORDER)[number]),
    );
  const key = parts.find((p) => MODIFIER_LABELS[p] === undefined) ?? null;
  return { modifiers, key };
}

// A shortcut is valid when it has at least one modifier and a main key.
export function isValidHotkey(hotkey: string): boolean {
  const { modifiers, key } = parseHotkey(hotkey);
  return modifiers.length > 0 && key !== null;
}

// Human-readable form: 'CmdOrCtrl+Shift+L' → '⌘⇧L'
export function formatHotkey(hotkey: string): string {
  const { modifiers, key } = parseHotkey(hotkey);
  const parts = modifiers.map((m) => MODIFIER_LABELS[m]);
  if (key !== null) {
    parts.push(KEY_LABELS[key] ?? key);
  }
  return parts.join('');
}
