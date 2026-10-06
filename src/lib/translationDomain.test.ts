import { describe, expect, it } from 'vitest';
import {
  isSingleWordWithoutContext,
  lexicalDomainLabel,
  normalizeLexicalDomain,
  resolveLexicalDomainForRequest,
} from './translationDomain';

describe('translationDomain', () => {
  it('normalizes unknown values to auto', () => {
    expect(normalizeLexicalDomain('it')).toBe('it');
    expect(normalizeLexicalDomain('sports')).toBe('auto');
    expect(normalizeLexicalDomain(null)).toBe('auto');
  });

  it('forces general for single-word auto without context', () => {
    expect(resolveLexicalDomainForRequest('auto', 'Bug')).toBe('general');
    expect(resolveLexicalDomainForRequest('auto', '  bug  ')).toBe('general');
    expect(isSingleWordWithoutContext('Bug')).toBe(true);
  });

  it('defers detection for phrases and contextual words', () => {
    expect(resolveLexicalDomainForRequest('auto', 'We found a bug')).toBeNull();
    expect(resolveLexicalDomainForRequest('auto', 'Bug', 'fix the app')).toBeNull();
    expect(isSingleWordWithoutContext('Bug', 'fix the app')).toBe(false);
  });

  it('keeps manual domains', () => {
    expect(resolveLexicalDomainForRequest('it', 'Bug')).toBe('it');
    expect(resolveLexicalDomainForRequest('medicine', 'cold')).toBe('medicine');
  });

  it('returns human labels', () => {
    expect(lexicalDomainLabel('it')).toBe('IT / Tech');
    expect(lexicalDomainLabel('auto')).toBe('Auto-detect');
  });
});
