import { ipc } from '../lib/ipc';
import { normalizeLangCode } from '../lib/languages';
import { INTERFACE_LANGUAGES } from './locales';
import ukrainianMessages from './uk.json';
import spanishMessages from './es.json';
import frenchMessages from './fr.json';
import italianMessages from './it.json';
import englishMessages from './en.json';
import russianMessages from './ru.json';

type Values = Record<string, string | number>;
const STORAGE_KEY = 'lexora-interface-locale';
const supported = new Set<string>(INTERFACE_LANGUAGES.map(({ code }) => code));
const rtl = new Set(['ar', 'he', 'fa', 'ur']);
const english: Record<string, string> = englishMessages;
const dictionaries: Record<string, Record<string, string>> = { ru: russianMessages, uk: ukrainianMessages, es: spanishMessages, fr: frenchMessages, it: italianMessages };
const listeners = new Set<() => void>();

export function resolveLocale(value: string | null | undefined): string {
  const normalized = normalizeLangCode(value);
  return normalized && supported.has(normalized) ? normalized : 'en';
}

function readSavedLocale(): string {
  try {
    return resolveLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en';
  }
}

let locale = readSavedLocale();

export function getDirection(code: string): 'rtl' | 'ltr' {
  return rtl.has(resolveLocale(code)) ? 'rtl' : 'ltr';
}

function updateDocument(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = getDirection(locale);
}

updateDocument();

export function getLocale(): string {
  return locale;
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function syncNativeLocale(): void {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;
  void ipc.interface.setLocale(locale).catch((error: unknown) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Could not synchronize native interface language', error);
    }
  });
}

function applyLocale(value: string | null): void {
  const next = resolveLocale(value);
  const changed = next !== locale;
  locale = next;
  updateDocument();
  syncNativeLocale();
  if (changed) listeners.forEach((listener) => listener());
}

export function setLocale(value: string): void {
  const next = resolveLocale(value);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Localization remains usable when browser storage is unavailable.
  }
  applyLocale(next);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) applyLocale(event.newValue);
  });
}

function lookup(dictionary: Record<string, string> | undefined, key: string): string | undefined {
  return dictionary && Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : undefined;
}

/** Exact source messages are keys; missing translations retain readable English. */
export function translate(code: string, source: string, values: Values = {}): string {
  const resolved = resolveLocale(code);
  const fallback = lookup(english, source) ?? source;
  const template = lookup(dictionaries[resolved], source) || lookup(dictionaries[resolved], fallback)
    || (resolved === 'ru' && /[а-яё]/i.test(source) ? source : fallback);
  return template.replace(/\{([\w]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

export function t(source: string, values?: Values): string {
  return translate(locale, source, values);
}

// Native menus and notifications use the same saved locale as the webviews.
syncNativeLocale();
