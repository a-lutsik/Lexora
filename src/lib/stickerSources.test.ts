import { describe, expect, it } from 'vitest';
import {
  STICKER_SOURCE_ALL,
  STICKER_SOURCE_MINE,
  collectionSourceToken,
  expandStickerSources,
  isAllStickerSources,
  normalizeStickerSources,
  parseCollectionSourceId,
  toggleStickerSource,
} from './stickerSources';

describe('stickerSources', () => {
  it('parses collection tokens', () => {
    expect(parseCollectionSourceId('c:12')).toBe(12);
    expect(parseCollectionSourceId('mine')).toBeNull();
    expect(parseCollectionSourceId('c:x')).toBeNull();
  });

  it('expands "all" into mine + every collection', () => {
    expect(expandStickerSources([STICKER_SOURCE_ALL], [1, 2])).toEqual([
      STICKER_SOURCE_MINE,
      'c:1',
      'c:2',
    ]);
  });

  it('collapses a full explicit selection back to "all"', () => {
    expect(
      normalizeStickerSources([STICKER_SOURCE_MINE, 'c:1', 'c:2'], [1, 2]),
    ).toEqual([STICKER_SOURCE_ALL]);
  });

  it('keeps at least "mine" when every token is removed', () => {
    expect(normalizeStickerSources([], [1])).toEqual([STICKER_SOURCE_MINE]);
  });

  it('toggles all → mine, then back to all', () => {
    const ids = [1, 3];
    const mineOnly = toggleStickerSource([STICKER_SOURCE_ALL], STICKER_SOURCE_ALL, ids);
    expect(mineOnly).toEqual([STICKER_SOURCE_MINE]);
    expect(isAllStickerSources(mineOnly, ids)).toBe(false);

    expect(toggleStickerSource(mineOnly, STICKER_SOURCE_ALL, ids)).toEqual([
      STICKER_SOURCE_ALL,
    ]);
  });

  it('toggles a single collection off an "all" selection', () => {
    const next = toggleStickerSource([STICKER_SOURCE_ALL], collectionSourceToken(2), [1, 2]);
    expect(next).toEqual([STICKER_SOURCE_MINE, 'c:1']);
  });
});
