// ============================================================
// LEXORA — Sticker window helpers
// Вынесено из StickerApp.tsx (react-refresh: файл компонента
// экспортирует только компоненты).
// ============================================================

import type { ReviewStateDto } from '../lib/types';

/** Источники или изучаемый язык изменились (см. stickers.rs). */
export const STICKER_FILTER_CHANGED_EVENT = 'stickers://filter-changed';
export const STICKER_SYNC_VISIBILITY_EVENT = 'stickers://sync-visibility';

const MS_PER_SECOND = 1000;

/**
 * Карточка ещё не к повторению: очередь стикеров подмешивает зрелые слова
 * «для свежести» (mature refresh). Новые слова к повторению всегда.
 */
export function isEarlyStickerReview(reviewState: ReviewStateDto, nowMs: number): boolean {
  return reviewState.status !== 'new' && reviewState.dueAt * MS_PER_SECOND > nowMs;
}

// Извлекает индекс слота из label окна ("sticker-2" → 2).
export function stickerSlotFromLabel(label: string): number {
  const match = /^sticker-(\d+)$/.exec(label);
  const raw = match?.[1];
  if (raw === undefined) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
