// ============================================================
// LEXORA — Flashcard answer options
// Варианты ответа строятся только из реальных данных: правильный
// перевод карточки + переводы других карточек сессии. Никаких
// захардкоженных «заглушек». Детерминированно: одинаковые входы
// дают одинаковый порядок (AGENTS §0.4).
// ============================================================

export type FlashcardOption = {
  text: string;
  isCorrect: boolean;
};

/** Total options shown = 1 correct + up to this many distractors. */
export const MAX_FLASHCARD_DISTRACTORS = 3;

/** FNV-1a 32-bit: tiny deterministic string hash (no Math.random). */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function orderedBy(seed: number, salt: string) {
  return (a: string, b: string): number => {
    const diff = hash32(`${seed}:${salt}:${a}`) - hash32(`${seed}:${salt}:${b}`);
    return diff !== 0 ? diff : a.localeCompare(b);
  };
}

/**
 * Builds the multiple-choice options for a flashcard.
 *
 * Returns `[]` when a multiple-choice question cannot honestly be asked:
 * the card has no translation, or there is no other card to borrow a
 * distractor from. The caller then falls back to the classic flip card.
 */
export function buildFlashcardOptions(
  seed: number,
  correct: string | null | undefined,
  pool: readonly string[],
): FlashcardOption[] {
  const answer = correct?.trim();
  if (!answer) return [];

  const seen = new Set<string>([answer.toLocaleLowerCase()]);
  const distractors: string[] = [];
  for (const raw of pool) {
    const text = raw.trim();
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    distractors.push(text);
  }
  if (distractors.length === 0) return [];

  const picked = [...distractors].sort(orderedBy(seed, 'pick')).slice(0, MAX_FLASHCARD_DISTRACTORS);
  const texts = [answer, ...picked].sort(orderedBy(seed, 'order'));
  return texts.map((text) => ({ text, isCorrect: text === answer }));
}
