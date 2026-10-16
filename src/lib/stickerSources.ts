// Persisted source tokens: all, mine, c:<collectionId>, cat:<categoryId>.
export const STICKER_SOURCE_ALL = 'all';
export const STICKER_SOURCE_MINE = 'mine';
export const DEFAULT_STICKER_SOURCES: string[] = [STICKER_SOURCE_ALL];

export function collectionSourceToken(collectionId: number): string {
  return `c:${collectionId}`;
}

export function categorySourceToken(categoryId: number): string {
  return `cat:${categoryId}`;
}

function parseSourceId(token: string, prefix: string): number | null {
  if (!token.startsWith(prefix)) return null;
  const raw = token.slice(prefix.length);
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseCollectionSourceId(token: string): number | null {
  return parseSourceId(token, 'c:');
}

export function expandStickerSources(sources: readonly string[], allCollectionIds: readonly number[]): string[] {
  return sources.includes(STICKER_SOURCE_ALL)
    ? [STICKER_SOURCE_MINE, ...allCollectionIds.map(collectionSourceToken)]
    : [...sources];
}

export function isAllStickerSources(sources: readonly string[], allCollectionIds: readonly number[]): boolean {
  return sources.includes(STICKER_SOURCE_ALL) || (
    sources.includes(STICKER_SOURCE_MINE) &&
    allCollectionIds.every((id) => sources.includes(collectionSourceToken(id)))
  );
}

export function normalizeStickerSources(sources: readonly string[], allCollectionIds: readonly number[]): string[] {
  if (sources.includes(STICKER_SOURCE_ALL)) return [STICKER_SOURCE_ALL];
  const unique = [...new Set(sources)].filter((token) =>
    token === STICKER_SOURCE_MINE || parseCollectionSourceId(token) !== null || parseSourceId(token, 'cat:') !== null,
  );
  const normalized = unique.includes(STICKER_SOURCE_MINE)
    ? unique.filter((token) => !token.startsWith('cat:'))
    : unique;
  // Keep "mine" explicit: future collections must not broaden this selection.
  if (allCollectionIds.length > 0 && isAllStickerSources(normalized, allCollectionIds)) return [STICKER_SOURCE_ALL];
  return normalized;
}

export function toggleStickerSource(
  sources: readonly string[],
  token: string,
  allCollectionIds: readonly number[],
  allCategoryIds: readonly number[] = [],
): string[] {
  if (token === STICKER_SOURCE_ALL) {
    return isAllStickerSources(sources, allCollectionIds) ? [STICKER_SOURCE_MINE] : [STICKER_SOURCE_ALL];
  }
  let expanded = expandStickerSources(sources, allCollectionIds);
  if (token === STICKER_SOURCE_MINE) {
    const hasMine = expanded.includes(STICKER_SOURCE_MINE);
    expanded = expanded.filter((item) => item !== STICKER_SOURCE_MINE && !item.startsWith('cat:'));
    return normalizeStickerSources(hasMine ? expanded : [...expanded, STICKER_SOURCE_MINE], allCollectionIds);
  }
  if (parseSourceId(token, 'cat:') !== null && expanded.includes(STICKER_SOURCE_MINE)) {
    expanded = [...expanded.filter((item) => item !== STICKER_SOURCE_MINE), ...allCategoryIds.map(categorySourceToken)];
  }
  return normalizeStickerSources(
    expanded.includes(token) ? expanded.filter((item) => item !== token) : [...expanded, token],
    allCollectionIds,
  );
}
