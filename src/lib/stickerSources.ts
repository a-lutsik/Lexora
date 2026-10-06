// ============================================================
// LEXORA — Sticker source filter tokens
// Persisted in settings as JSON string[]:
//   "all"     — every word in the study queue
//   "mine"    — user-added (source != collection)
//   "c:<id>"  — lexemes that belong to that collection
// ============================================================

export const STICKER_SOURCE_ALL = 'all';
export const STICKER_SOURCE_MINE = 'mine';
export const DEFAULT_STICKER_SOURCES: string[] = [STICKER_SOURCE_ALL];

export function collectionSourceToken(collectionId: number): string {
  return `c:${collectionId}`;
}

export function parseCollectionSourceId(token: string): number | null {
  const match = /^c:(\d+)$/.exec(token);
  const raw = match?.[1];
  if (raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function expandStickerSources(
  sources: readonly string[],
  allCollectionIds: readonly number[],
): string[] {
  if (sources.includes(STICKER_SOURCE_ALL)) {
    return [STICKER_SOURCE_MINE, ...allCollectionIds.map(collectionSourceToken)];
  }
  return [...sources];
}

export function isAllStickerSources(
  sources: readonly string[],
  allCollectionIds: readonly number[],
): boolean {
  if (sources.includes(STICKER_SOURCE_ALL)) return true;
  if (allCollectionIds.length === 0) {
    return sources.includes(STICKER_SOURCE_MINE);
  }
  return (
    sources.includes(STICKER_SOURCE_MINE) &&
    allCollectionIds.every((id) => sources.includes(collectionSourceToken(id)))
  );
}

export function normalizeStickerSources(
  sources: readonly string[],
  allCollectionIds: readonly number[],
): string[] {
  if (sources.includes(STICKER_SOURCE_ALL)) {
    return [STICKER_SOURCE_ALL];
  }

  const unique: string[] = [];
  for (const token of sources) {
    if (token === STICKER_SOURCE_MINE || parseCollectionSourceId(token) !== null) {
      if (!unique.includes(token)) unique.push(token);
    }
  }

  const hasMine = unique.includes(STICKER_SOURCE_MINE);
  const selectedCols = unique
    .map(parseCollectionSourceId)
    .filter((id): id is number => id !== null);
  const allColsSelected =
    allCollectionIds.length > 0 &&
    allCollectionIds.every((id) => selectedCols.includes(id));

  if (hasMine && allColsSelected) {
    return [STICKER_SOURCE_ALL];
  }
  if (unique.length === 0) {
    return [STICKER_SOURCE_MINE];
  }
  return unique;
}

export function toggleStickerSource(
  sources: readonly string[],
  token: string,
  allCollectionIds: readonly number[],
): string[] {
  if (token === STICKER_SOURCE_ALL) {
    return isAllStickerSources(sources, allCollectionIds)
      ? [STICKER_SOURCE_MINE]
      : [STICKER_SOURCE_ALL];
  }

  const expanded = expandStickerSources(sources, allCollectionIds);
  const has = expanded.includes(token);
  const next = has ? expanded.filter((item) => item !== token) : [...expanded, token];
  return normalizeStickerSources(next, allCollectionIds);
}

export function stickerSourcesToQueueFilter(sources: readonly string[]): {
  includeMine?: boolean;
  collectionIds?: number[];
} {
  if (sources.includes(STICKER_SOURCE_ALL) || sources.length === 0) {
    return {};
  }
  return {
    includeMine: sources.includes(STICKER_SOURCE_MINE),
    collectionIds: sources
      .map(parseCollectionSourceId)
      .filter((id): id is number => id !== null),
  };
}
