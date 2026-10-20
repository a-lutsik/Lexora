import { describe, expect, it } from 'vitest';
import en from './en.json';
import ru from './ru.json';
import uk from './uk.json';
import es from './es.json';
import fr from './fr.json';
import itMessages from './it.json';
import messages from './messages.json';
import { translate } from './index';
import { pluralize, formatIpcError } from '../lib/utils';
import { collectionDisplayName } from '../lib/collectionLabels';
import { localizeModelMessage } from '../lib/interfaceText';
import { setLocale } from './index';

const catalogs: Record<string, Record<string, string>> = { en, ru, uk, es, fr, it: itMessages };
const placeholders = (value: string) => [...new Set(value.match(/\{\w+\}/g) ?? [])].sort();

describe('complete interface catalogs', () => {
  for (const [locale, dictionary] of Object.entries(catalogs)) {
    it(`${locale} explicitly translates every application message without relying on fallback`, () => {
      for (const source of messages) {
        expect(Object.prototype.hasOwnProperty.call(dictionary, source), `${locale}: ${source}`).toBe(true);
        const value = dictionary[source];
        expect(value?.trim(), `${locale}: ${source}`).toBeTruthy();
        expect(placeholders(value), `${locale}: ${source}`).toEqual(placeholders(source));
      }
    });
  }

  it('localizes errors, native actions, plurals and built-in metadata while retaining user data', () => {
    try {
      setLocale('uk');
      expect(pluralize(2, 'word')).toBe('2 слова');
      expect(pluralize(5, 'word')).toBe('5 слів');
      expect(formatIpcError('HTTP 401: invalid key', 'fallback')).not.toMatch(/API key was rejected/);
      expect(localizeModelMessage('Нужен ключ Gemini')).toContain('Gemini');
      expect(localizeModelMessage('Нужен ключ Gemini')).not.toContain('Нужен');
      expect(collectionDisplayName({ name: 'Business', packKey: 'business' })).not.toBe('Business');
      expect(collectionDisplayName({ name: 'My personal English title' })).toBe('My personal English title');
      for (const locale of Object.keys(catalogs)) {
        const rendered = translate(locale, 'Added to Vocabulary: {word}', { word: 'water' });
        expect(rendered).toContain('water');
        expect(rendered).not.toContain('{word}');
      }
    } finally {
      setLocale('en');
    }
  });
});
