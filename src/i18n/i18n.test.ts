import { beforeEach, describe, expect, it, vi } from 'vitest';
import { providerLabel, targetLabel } from '../lib/modelRouting';
import { pluralize, formatRelativeDate, formatIpcError } from '../lib/utils';
import { invokeMock } from '../test/mocks';
import { INTERFACE_LANGUAGES } from './locales';
import { LANGUAGE_CATALOG } from '../lib/languages';
import { getLocale, setLocale, subscribeLocale, t, translate, getDirection, resolveLocale } from './index';

describe('offline interface localization', () => {
  beforeEach(() => setLocale('en'));

  it('synchronizes interface selection with native windows and menus', () => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', { value: {}, configurable: true });
    invokeMock.mockResolvedValue(undefined);
    try {
      setLocale('fr');
      expect(invokeMock).toHaveBeenCalledWith('set_interface_locale', { locale: 'fr' });
    } finally {
      Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
      setLocale('en');
    }
  });

  it('localizes controlled backend validation and built-in model labels', () => {
    setLocale('fr');
    expect(formatIpcError({ Validation: 'A category with this name already exists' }, 'Save failed')).toBe('Une catégorie portant ce nom existe déjà');
    expect(formatIpcError({ Validation: 'Category name must contain 1–80 characters' }, 'Save failed')).toBe('Le nom de la catégorie doit contenir entre 1 et 80 caractères');
    expect(formatIpcError({ NotFound: 'Category 17 not found' }, 'Save failed')).toBe('Catégorie introuvable');
    expect(providerLabel('custom')).toBe('Ollama / serveur personnel');
    expect(targetLabel([{ provider: 'offline', id: 'dictionary', label: 'Встроенный словарь', capabilities: ['text'], tier: 'local', status: { kind: 'stable' }, price: null }], { provider: 'offline', model: 'dictionary' })).toBe('Hors ligne · Dictionnaire intégré');
    expect(targetLabel([], { provider: 'custom', model: 'General' })).toBe('Ollama / serveur personnel · General');
    expect(targetLabel([], { provider: 'openai', model: 'my-custom-model' })).toBe('OpenAI · my-custom-model');
  });

  it('supports exactly the six requested interface languages', () => {
    expect(INTERFACE_LANGUAGES.map(({ code }) => code)).toEqual(['en', 'ru', 'uk', 'es', 'fr', 'it']);
    for (const language of INTERFACE_LANGUAGES) {
      expect(translate(language.code, 'Settings')).not.toBe('');
      if (language.code !== 'en') expect(translate(language.code, 'Settings')).not.toBe('Settings');
    }
  });

  it('switches immediately, persists independently of translation languages and normalizes aliases', () => {
    setLocale('ru-RU');
    expect(getLocale()).toBe('ru');
    expect(t('Settings')).toBe('Настройки');
    expect(localStorage.getItem('lexora-interface-locale')).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(localStorage.getItem('lexora-settings-ui')).toBeNull();
  });

  it('uses readable English fallback and interpolates without interpreting markup', () => {
    expect(translate('ru', 'Missing {count} words', { count: 2 })).toBe('Missing 2 words');
    expect(translate('ru', 'Hello {name}', { name: '<b>Jane</b>' })).toBe('Hello <b>Jane</b>');
    expect(translate('xx', 'Settings')).toBe('Settings');
  });

  it('falls back to English for removed locales and resets obsolete RTL direction', () => {
    const allowed = new Set<string>(INTERFACE_LANGUAGES.map(({ code }) => code));
    for (const language of LANGUAGE_CATALOG) {
      if (!allowed.has(language.code)) expect(resolveLocale(language.code)).toBe('en');
    }
    document.documentElement.dir = 'rtl';
    setLocale('ar');
    expect(getLocale()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(getDirection('ar')).toBe('ltr');
    expect(resolveLocale('uk-UA')).toBe('uk');
    expect(resolveLocale('es-MX')).toBe('es');
  });

  it('notifies subscribers and synchronizes other windows through storage events', () => {
    const changes: string[] = [];
    const unsubscribe = subscribeLocale(() => changes.push(getLocale()));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lexora-interface-locale', newValue: 'fr' }));
    expect(t('Settings')).toBe('Paramètres');
    expect(changes).toEqual(['fr']);
    unsubscribe();
    setLocale('it');
    expect(changes).toEqual(['fr']);
  });

  it('localizes plural forms and relative dates using the interface locale', () => {
    setLocale('ru');
    expect(pluralize(1, 'word')).toBe('1 слово');
    expect(pluralize(2, 'word')).toBe('2 слова');
    expect(pluralize(5, 'word')).toBe('5 слов');
    expect(pluralize(21, 'word')).toBe('21 слово');
    expect(formatRelativeDate(Date.now() / 1000)).toBe('сегодня');
  });

  it('provides English fallback for original Russian interface copy', () => {
    expect(translate('en', 'Сохранить')).toBe('Save');
    expect(translate('es', 'Не удалось сохранить ключ')).toBe('No se ha podido guardar la clave');
  });

  it('handles inherited property names as plain message text', () => {
    expect(translate('ru', 'toString')).toBe('toString');
    expect(translate('en', 'constructor')).toBe('constructor');
    expect(translate('ru', '__proto__')).toBe('__proto__');
  });

  it('keeps switching usable when persistence is unavailable', () => {
    const blockedStorage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    try {
      setLocale('ru');
      expect(t('Settings')).toBe('Настройки');
    } finally { blockedStorage.mockRestore(); }
  });

  it('rejects unknown locales with a safe English fallback', () => {
    setLocale('unsupported');
    expect(getLocale()).toBe('en');
  });
});
