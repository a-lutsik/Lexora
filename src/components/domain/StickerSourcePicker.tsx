// ============================================================
// LEXORA — Multi-select of sticker vocabulary sources
// ============================================================

import type { CollectionDto } from '../../lib/types';
import {
  STICKER_SOURCE_ALL,
  STICKER_SOURCE_MINE,
  collectionSourceToken,
  isAllStickerSources,
  toggleStickerSource,
} from '../../lib/stickerSources';
import './sticker-source-picker.css';

type StickerSourcePickerProps = {
  sources: string[];
  collections: CollectionDto[];
  onChange: (sources: string[]) => void;
  compact?: boolean;
};

export function StickerSourcePicker({
  sources,
  collections,
  onChange,
  compact = false,
}: StickerSourcePickerProps) {
  const collectionIds = collections.map((collection) => collection.id);
  const allChecked = isAllStickerSources(sources, collectionIds);

  const handleToggle = (token: string) => {
    onChange(toggleStickerSource(sources, token, collectionIds));
  };

  return (
    <fieldset
      className={`sticker-source-picker${compact ? ' sticker-source-picker--compact' : ''}`}
    >
      <legend className="sticker-source-picker-legend">
        Words on stickers
      </legend>
      <label className="sticker-source-option">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={() => handleToggle(STICKER_SOURCE_ALL)}
        />
        <span>All vocabulary</span>
      </label>
      <label className="sticker-source-option">
        <input
          type="checkbox"
          checked={allChecked || sources.includes(STICKER_SOURCE_MINE)}
          onChange={() => handleToggle(STICKER_SOURCE_MINE)}
        />
        <span>My words</span>
      </label>
      {collections.map((collection) => {
        const token = collectionSourceToken(collection.id);
        return (
          <label key={collection.id} className="sticker-source-option">
            <input
              type="checkbox"
              checked={allChecked || sources.includes(token)}
              onChange={() => handleToggle(token)}
            />
            <span>{collection.name}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
