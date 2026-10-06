// ============================================================
// LEXORA — languages helpers tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_CATALOG,
  languageLabel,
  normalizeLangCode,
  PACK_EXPECTED_COUNTS,
} from './languages';

describe('normalizeLangCode', () => {
  it('maps region tags to base codes', () => {
    expect(normalizeLangCode('pt-BR')).toBe('pt');
    expect(normalizeLangCode('zh-CN')).toBe('zh');
    expect(normalizeLangCode('en-US')).toBe('en');
  });

  it('returns null for auto / empty', () => {
    expect(normalizeLangCode('auto')).toBeNull();
    expect(normalizeLangCode('')).toBeNull();
    expect(normalizeLangCode(null)).toBeNull();
  });
});

describe('language catalog', () => {
  it('includes common Source and Target languages', () => {
    const codes = new Set(LANGUAGE_CATALOG.map((l) => l.code));
    for (const code of ['en', 'ru', 'it', 'de', 'ko', 'pt', 'tr', 'ja', 'zh']) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it('labels Italian with native name', () => {
    expect(languageLabel('it', true)).toContain('Italian');
    expect(languageLabel('it', true)).toContain('Italiano');
  });
});

describe('PACK_EXPECTED_COUNTS', () => {
  it('lists top_5000 as 5000', () => {
    expect(PACK_EXPECTED_COUNTS.top_5000).toBe(5000);
  });
});
