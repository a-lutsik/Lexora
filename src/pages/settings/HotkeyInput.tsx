// ============================================================
// LEXORA — HotkeyInput
// Captures a global shortcut combo in tauri-plugin-global-shortcut
// format (e.g. 'CmdOrCtrl+Shift+L'). Click / Enter to record,
// Esc cancels. Renders the current value in human-readable form
// (⌘⇧L) when idle.
// ============================================================

import { useState, type KeyboardEvent } from 'react';
import { formatHotkey, MODIFIER_KEY_NAMES, NAMED_KEYS } from './hotkeyUtils';

// Builds a shortcut string from a keyboard event, or null when the
// pressed key is a pure modifier (keep recording) or not bindable.
function comboFromEvent(e: KeyboardEvent): string | null {
  if (MODIFIER_KEY_NAMES.has(e.key)) return null;

  let key: string;
  if (e.key.length === 1 && e.key !== ' ') {
    key = e.key.toUpperCase();
  } else if (NAMED_KEYS[e.key] !== undefined) {
    key = NAMED_KEYS[e.key];
  } else if (/^F([1-9]|1[0-2])$/.test(e.key)) {
    key = e.key;
  } else {
    return null;
  }

  const modifiers: string[] = [];
  if (e.metaKey || e.ctrlKey) modifiers.push('CmdOrCtrl');
  if (e.shiftKey) modifiers.push('Shift');
  if (e.altKey) modifiers.push('Alt');

  return [...modifiers, key].join('+');
}

type HotkeyInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hasError?: boolean;
};

export function HotkeyInput({ value, onChange, label, hasError = false }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);

  const stopRecording = () => setIsRecording(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) {
      // Enter / Space start recording via onClick; nothing else to intercept.
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      stopRecording();
      return;
    }

    const combo = comboFromEvent(e);
    if (combo) {
      onChange(combo);
      stopRecording();
    }
  };

  const classNames = [
    'settings-hotkey-input',
    isRecording ? 'settings-hotkey-input--recording' : '',
    hasError ? 'settings-hotkey-input--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => setIsRecording((prev) => !prev)}
      onKeyDown={handleKeyDown}
      onBlur={stopRecording}
      aria-label={
        isRecording
          ? `${label}: recording, press new shortcut or Escape to cancel`
          : `${label}: ${formatHotkey(value)}, activate to change shortcut`
      }
    >
      <kbd className="settings-kbd">
        {isRecording ? 'Press shortcut…' : formatHotkey(value)}
      </kbd>
    </button>
  );
}
