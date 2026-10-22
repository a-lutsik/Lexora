import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — HotkeyInput
// Captures a global shortcut combo in tauri-plugin-global-shortcut
// format (e.g. 'CmdOrCtrl+Shift+L'). Click / Enter to record,
// Esc cancels. Renders the current value in human-readable form
// (⌘⇧L) when idle.
// ============================================================

import { useState, type KeyboardEvent } from 'react';
import { formatHotkey, MODIFIER_KEY_NAMES, NAMED_KEYS, parseHotkey } from './hotkeyUtils';

// Builds a shortcut string from a keyboard event, or null when the
// pressed key is a pure modifier (keep recording) or not bindable.
function comboFromEvent(e: KeyboardEvent): string | null {
  if (MODIFIER_KEY_NAMES.has(e.key)) return null;

  // Physical key first: Alt (macOS) and non-Latin layouts change `e.key`
  // ('√' for Alt+V, 'м' for V on a Russian layout), but the global shortcut
  // is bound to the physical key.
  const physical = /^Key([A-Z])$/.exec(e.code) ?? /^Digit([0-9])$/.exec(e.code);

  let key: string;
  if (physical?.[1] !== undefined) {
    key = physical[1];
  } else if (e.key.length === 1 && e.key !== ' ') {
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
  const { t: tUi } = useI18n();
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

  // One .kbd chip per key: ⌘ ⇧ L.
  const { modifiers, key } = parseHotkey(value);
  const keyChips = (key === null ? modifiers : [...modifiers, key]).map(formatHotkey);

  const classNames = [
    'field',
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
          ? tUi("{label}: recording, press new shortcut or Escape to cancel", { label: label })
          : tUi("{label}: {value2}, activate to change shortcut", { label: label, value2: formatHotkey(value) })
      }
    >
      {isRecording ? (
        <span className="settings-hotkey-recording">{tUi("Press shortcut…")}</span>
      ) : (
        keyChips.map((chip, index) => (
          <kbd key={`${chip}-${index}`} className="kbd">{chip}</kbd>
        ))
      )}
    </button>
  );
}
