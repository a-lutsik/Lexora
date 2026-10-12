import { describe, expect, it } from 'vitest';
import { buildFlashcardOptions, MAX_FLASHCARD_DISTRACTORS } from './flashcardOptions';

const POOL = ['дом', 'кошка', 'собака', 'машина', 'дерево'];

describe('buildFlashcardOptions', () => {
  it('contains the correct answer exactly once and only real pool words as distractors', () => {
    const options = buildFlashcardOptions(7, 'яблоко', POOL);

    expect(options.filter((o) => o.isCorrect)).toEqual([{ text: 'яблоко', isCorrect: true }]);
    const distractors = options.filter((o) => !o.isCorrect).map((o) => o.text);
    expect(distractors).toHaveLength(MAX_FLASHCARD_DISTRACTORS);
    for (const d of distractors) expect(POOL).toContain(d);
  });

  it('is deterministic: same inputs give the same options in the same order', () => {
    expect(buildFlashcardOptions(42, 'яблоко', POOL)).toEqual(buildFlashcardOptions(42, 'яблоко', POOL));
  });

  it('does not always put the correct answer in the same position', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 40; seed += 1) {
      positions.add(buildFlashcardOptions(seed, 'яблоко', POOL).findIndex((o) => o.isCorrect));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('drops pool entries equal to the answer (case-insensitive) and duplicates', () => {
    const options = buildFlashcardOptions(1, 'Дом', ['дом', 'ДОМ', 'кот', 'кот', '  ', '']);
    expect(options.map((o) => o.text).sort()).toEqual(['Дом', 'кот'].sort());
  });

  it('uses fewer options when the pool is small instead of inventing filler', () => {
    const options = buildFlashcardOptions(1, 'яблоко', ['груша']);
    expect(options).toHaveLength(2);
  });

  it('returns no options when there is nothing real to choose from', () => {
    expect(buildFlashcardOptions(1, 'яблоко', [])).toEqual([]);
    expect(buildFlashcardOptions(1, 'яблоко', ['яблоко'])).toEqual([]);
  });

  it('returns no options when the card has no translation', () => {
    expect(buildFlashcardOptions(1, null, POOL)).toEqual([]);
    expect(buildFlashcardOptions(1, undefined, POOL)).toEqual([]);
    expect(buildFlashcardOptions(1, '   ', POOL)).toEqual([]);
  });

  it('never leaks the old hardcoded placeholder phrases', () => {
    const texts = buildFlashcardOptions(3, 'house', ['Haus']).map((o) => o.text);
    expect(texts.join(' ')).not.toMatch(/хрупкий|высокомерный|осторожный/);
  });
});
