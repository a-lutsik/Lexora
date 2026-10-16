import { useRef, useEffect } from 'react';
import { collectionDisplayName } from '../../lib/collectionLabels';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Multi-select of sticker vocabulary sources
// ============================================================

import type { CategoryDto, CollectionDto } from '../../lib/types';
import {
  STICKER_SOURCE_ALL,
  STICKER_SOURCE_MINE,
  collectionSourceToken,
  categorySourceToken,
  isAllStickerSources,
  toggleStickerSource,
} from '../../lib/stickerSources';
import './sticker-source-picker.css';

type StickerSourcePickerProps = {
  sources: string[];
  collections: CollectionDto[];
  categories?: CategoryDto[];
  onChange: (sources: string[]) => void;
  compact?: boolean;
};

export function StickerSourcePicker({
  sources,
  collections,
  categories = [],
  onChange,
  compact = false,
}: StickerSourcePickerProps) {
  const { t: tUi } = useI18n();
  const collectionIds = collections.map((collection) => collection.id);
  const categoryIds = categories.map((category) => category.id);
  const mineRef = useRef<HTMLInputElement>(null);
  const someCategories = sources.some((token) => token.startsWith('cat:'));
  useEffect(() => {
    if (mineRef.current) mineRef.current.indeterminate = someCategories && !sources.includes(STICKER_SOURCE_MINE) && !sources.includes(STICKER_SOURCE_ALL);
  }, [someCategories, sources]);
  const allChecked = isAllStickerSources(sources, collectionIds);

  const handleToggle = (token: string) => {
    onChange(toggleStickerSource(sources, token, collectionIds, categoryIds));
  };

  return (
    <fieldset
      className={`sticker-source-picker${compact ? ' sticker-source-picker--compact' : ''}`}
    >
      <legend className="sticker-source-picker-legend">{tUi("Words on stickers")}</legend>
      <label className="sticker-source-option">
        <input dir="auto"
          type="checkbox"
          checked={allChecked}
          onChange={() => handleToggle(STICKER_SOURCE_ALL)}
        />
        <span>{tUi("All vocabulary")}</span>
      </label>
      <label className="sticker-source-option">
        <input dir="auto"
          type="checkbox"
          ref={mineRef}
          checked={allChecked || sources.includes(STICKER_SOURCE_MINE)}
          onChange={() => handleToggle(STICKER_SOURCE_MINE)}
        />
        <span>{tUi("My words")}</span>
      </label>
      {categories.length > 0 && (
        <details className="sticker-source-categories" open={someCategories || undefined}>
          <summary>{tUi("Categories")}</summary>
          {categories.map((category) => (
            <label key={category.id} className="sticker-source-option">
              <input type="checkbox"
                checked={allChecked || sources.includes(STICKER_SOURCE_MINE) || sources.includes(categorySourceToken(category.id))}
                onChange={() => handleToggle(categorySourceToken(category.id))}
              />
              <span>{category.isGeneral ? tUi('General') : category.name}</span>
            </label>
          ))}
        </details>
      )}
      {collections.map((collection) => {
        const token = collectionSourceToken(collection.id);
        return (
          <label key={collection.id} className="sticker-source-option">
            <input dir="auto"
              type="checkbox"
              checked={allChecked || sources.includes(token)}
              onChange={() => handleToggle(token)}
            />
            <span>{collectionDisplayName(collection)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
