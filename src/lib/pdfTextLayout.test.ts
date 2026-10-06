import { describe, expect, it } from 'vitest';
import {
  collapseSpacedGlyphs,
  reconstructPdfLines,
  type PdfGlyph,
} from './pdfTextLayout';
import { cleanPdfExtractedText } from './pdfTextQuality';
import { chunkPdfExtractedText } from './documentParser';

function glyph(str: string, x: number, y: number, width = 8, height = 12): PdfGlyph {
  return { str, x, y, width, height };
}

describe('reconstructPdfLines', () => {
  it('joins tightly packed letters into words', () => {
    const letters = [...'Прибытие'];
    const items = letters.map((ch, i) => glyph(ch, i * 8, 200, 7.5));
    expect(reconstructPdfLines(items)).toBe('Прибытие');
  });

  it('keeps a space only when the gap is a real word break', () => {
    const left = [...'Выход'].map((ch, i) => glyph(ch, i * 8, 100, 7.5));
    const right = [...'закрывается'].map((ch, i) => glyph(ch, 48 + i * 8, 100, 7.5));
    expect(reconstructPdfLines([...left, ...right])).toBe('Выход закрывается');
  });

  it('splits lines by vertical position, top to bottom', () => {
    const top = [...'Номер'].map((ch, i) => glyph(ch, i * 8, 240, 7.5));
    const bottom = [...'Выход'].map((ch, i) => glyph(ch, i * 8, 200, 7.5));
    expect(reconstructPdfLines([...bottom, ...top])).toBe('Номер\nВыход');
  });
});

describe('collapseSpacedGlyphs', () => {
  it('repairs letter-spaced Cyrillic boarding-pass text', () => {
    expect(collapseSpacedGlyphs('П р и б ы т и е')).toBe('Прибытие');
    expect(collapseSpacedGlyphs('Н о м е р')).toBe('Номер');
    expect(
      collapseSpacedGlyphs('В ы х о д  з а к р ы в а е т с я')
    ).toBe('Выход закрывается');
  });

  it('does not smash normal English sentences', () => {
    expect(collapseSpacedGlyphs('Boarding Pass for Yevhen')).toBe(
      'Boarding Pass for Yevhen'
    );
  });
});

describe('cleanPdfExtractedText', () => {
  it('collapses spaced glyphs after dropping junk lines', () => {
    expect(cleanPdfExtractedText('П р и б ы т и е\n201\nFLYONE')).toBe(
      'Прибытие\nFLYONE'
    );
  });
});

describe('chunkPdfExtractedText', () => {
  it('keeps short form lines as separate source segments', () => {
    const text = [
      'ПОСАДОЧНЫЙ ТАЛОН',
      'FLYONE',
      'Прибытие',
      'Номер',
      'Выход закрывается в',
      '15:40',
    ].join('\n');
    const chunks = chunkPdfExtractedText(text);
    expect(chunks.map((c) => c.originalText)).toEqual([
      'ПОСАДОЧНЫЙ ТАЛОН',
      'FLYONE',
      'Прибытие',
      'Номер',
      'Выход закрывается в',
      '15:40',
    ]);
  });
});
