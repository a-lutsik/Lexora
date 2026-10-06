// ============================================================
// LEXORA — Associated photograph for a lexeme
// Concrete photo (cached locally), never abstract placeholder art.
// ============================================================

import { convertFileSrc } from '@tauri-apps/api/core';
import { cx } from '../../lib/utils';
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

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function PhotoSearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function AssociatedImage({
  path,
  alt,
  isLoading = false,
  isRefreshing = false,
  size = 'card',
  onRegenerate,
  cacheNonce,
}: AssociatedImageProps) {
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
          className="associated-image-status text-muted text-xs"
          role={findingPhoto ? 'status' : undefined}
        >
          {findingPhoto ? (
            <span className="associated-image-loader" aria-hidden="true">
              <span className="associated-image-loader-ring" />
              <PhotoSearchIcon />
            </span>
          ) : null}
          {findingPhoto ? 'Finding a photo…' : 'No photo yet'}
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
          aria-label={isRefreshing ? 'Finding another photo' : 'Regenerate photo'}
        >
          <RefreshIcon />
        </button>
      )}
    </div>
  );
}
