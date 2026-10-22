// ============================================================
// LEXORA — Study keyboard & interval helpers (pure, no React)
// Цифры 1–9 выбирают режим / вариант / оценку, но не мешают вводу
// текста и собственным клавишам контролов (combobox, listbox).
// ============================================================

type Translate = (source: string, values?: Record<string, string | number>) => string;

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/** Elements that own the keyboard: typing or a picker list must not be hijacked. */
const KEYBOARD_OWNER_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"], [role="listbox"], [role="menu"], [role="dialog"]';

/** Elements that activate on Enter themselves (a global Enter must not fire twice). */
const ENTER_OWNER_SELECTOR = 'button, a[href], [role="button"], [role="radio"], [role="link"]';

function closestOf(target: EventTarget | null, selector: string): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest(selector) !== null;
}

/** A plain key press: no modifiers, no auto-repeat, no IME composition. */
function isPlainPress(event: KeyboardEvent): boolean {
  return !event.repeat && !event.isComposing && !event.metaKey && !event.ctrlKey && !event.altKey;
}

/** Digit 1–`max` from a plain key press outside text fields and pickers; otherwise null. */
export function hotkeyDigit(event: KeyboardEvent, max: number): number | null {
  if (event.defaultPrevented || !isPlainPress(event)) return null;
  if (!/^[1-9]$/.test(event.key)) return null;
  if (closestOf(event.target, KEYBOARD_OWNER_SELECTOR)) return null;
  const digit = Number(event.key);
  return digit <= max ? digit : null;
}

/** Enter that no focused control will handle itself. */
export function isFreeEnter(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || !isPlainPress(event) || event.shiftKey) return false;
  if (event.key !== 'Enter') return false;
  return !closestOf(event.target, `${KEYBOARD_OWNER_SELECTOR}, ${ENTER_OWNER_SELECTOR}`);
}

/** "<1 m" / "N m" (< 1 h) / "N h" (< 1 d) / "N d". */
export function formatDueIn(seconds: number, t: Translate): string {
  if (seconds < SECONDS_PER_MINUTE) return t('<1 m');
  if (seconds < SECONDS_PER_HOUR) return t('{value1} m', { value1: Math.floor(seconds / SECONDS_PER_MINUTE) });
  if (seconds < SECONDS_PER_DAY) return t('{value1} h', { value1: Math.floor(seconds / SECONDS_PER_HOUR) });
  return t('{value1} d', { value1: Math.floor(seconds / SECONDS_PER_DAY) });
}

/** Rough session length: 36 s per card, at least one minute. */
export function estimateMinutes(cards: number): number {
  return Math.max(1, Math.round((cards * 36) / 60));
}
