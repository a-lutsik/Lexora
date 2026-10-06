// ============================================================
// LEXORA — Sticker window helpers
// Вынесено из StickerApp.tsx (react-refresh: файл компонента
// экспортирует только компоненты).
// ============================================================

export const STICKER_SOURCES_CHANGED_EVENT = 'stickers://sources-changed';
export const STICKER_SYNC_VISIBILITY_EVENT = 'stickers://sync-visibility';

// Извлекает индекс слота из label окна ("sticker-2" → 2).
export function stickerSlotFromLabel(label: string): number {
  const match = /^sticker-(\d+)$/.exec(label);
  const raw = match?.[1];
  if (raw === undefined) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
