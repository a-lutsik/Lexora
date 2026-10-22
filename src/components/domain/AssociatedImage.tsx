import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Associated photograph for a lexeme
// Concrete photo (cached locally), never abstract placeholder art.
// ============================================================

import { convertFileSrc } from '@tauri-apps/api/core';
import { cx } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import './domain.css';

type AssociatedImageProps = {
  path: string | null;
  alt: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  size?: 'thumb' | 'card' | 'hero';
  onRegenerate?: () => void;
  /** Bump after regenerate so the asset protocol does not show a stale file. */
  cacheNonce?: number;
};

export function AssociatedImage({
  path,
  alt,
  isLoading = false,
  isRefreshing = false,
  size = 'card',
  onRegenerate,
  cacheNonce,
}: AssociatedImageProps) {
  const { t: tUi } = useI18n();
  const url = path
    ? cacheNonce
      ? `${convertFileSrc(path)}?v=${cacheNonce}`
      : convertFileSrc(path)
    : null;
  const showRefresh = onRegenerate != null && !isLoading;

  if (!url && !isLoading && !showRefresh) {
    return null;
  }

  const findingPhoto = isLoading || isRefreshing;

  return (
    <div
      className={cx(
        'associated-image-frame',
        size === 'thumb' && 'associated-image-frame--thumb',
        size === 'card' && 'associated-image-frame--card',
        size === 'hero' && 'associated-image-frame--hero',
        isLoading && !url && 'associated-image-frame--loading',
        isRefreshing && 'associated-image-frame--refreshing'
      )}
      aria-busy={findingPhoto || undefined}
    >
      {url ? (
        <img key={url} src={url} alt={alt} className="associated-image" />
      ) : (
        <span
          className="associated-image-status"
          role={findingPhoto ? 'status' : undefined}
        >
          {findingPhoto ? (
            <span className="associated-image-loader" aria-hidden="true">
              <span className="associated-image-loader-ring" />
              <Icon name="image_search" size={18} />
            </span>
          ) : null}
          {findingPhoto ? tUi("Finding a photo…") : tUi("No photo yet")}
        </span>
      )}
      {showRefresh && (
        <button
          type="button"
          className="associated-image-refresh"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRegenerate();
          }}
          disabled={isRefreshing}
          aria-label={isRefreshing ? tUi("Finding another photo") : tUi("Regenerate photo")}
        >
          <Icon name="refresh" size={16} />
        </button>
      )}
    </div>
  );
}
