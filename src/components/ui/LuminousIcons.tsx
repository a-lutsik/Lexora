// ============================================================
// LEXORA — Icon aliases (Lingora)
// Раньше здесь были «неоновые» двухцветные SVG. Теперь каждый экспорт —
// тонкая обёртка над одноцветным Material Symbol (см. Icon.tsx), чтобы
// существующие импорты продолжали работать. Новый код использует <Icon />.
// ============================================================

import { Icon, type IconSize } from './Icon';

export type LuminousIconProps = {
  className?: string;
  size?: number;
};

function toIconSize(size: number | undefined, fallback: IconSize): IconSize {
  const allowed: IconSize[] = [14, 16, 17, 18, 19, 20, 22, 24, 28, 32];
  if (size == null) return fallback;
  let best: IconSize = fallback;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const candidate of allowed) {
    const diff = Math.abs(candidate - size);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best;
}

function alias(name: string, fallback: IconSize) {
  return function AliasIcon({ className, size }: LuminousIconProps) {
    return <Icon name={name} className={className} size={toIconSize(size, fallback)} />;
  };
}

// ── Sidebar navigation ─────────────────────────────────────
export const IconNavBook        = alias('menu_book', 19);
export const IconNavCards       = alias('style', 19);
export const IconNavPen         = alias('edit_note', 19);
export const IconNavTranslate   = alias('translate', 19);
export const IconNavMic         = alias('mic', 19);
export const IconNavDialogue    = alias('forum', 19);
export const IconNavCollections = alias('collections_bookmark', 19);
export const IconNavStats       = alias('bar_chart', 19);
export const IconNavSettings    = alias('settings', 19);

// ── Action icons ───────────────────────────────────────────
export const IconMic       = alias('mic', 16);
export const IconUpload    = alias('upload_file', 16);
export const IconPlay      = alias('play_arrow', 16);
export const IconCopy      = alias('content_copy', 16);
export const IconCheck     = alias('check', 16);
export const IconMore      = alias('more_horiz', 16);
export const IconSwap      = alias('swap_horiz', 18);
export const IconSpeaker   = alias('volume_up', 16);
export const IconUser      = alias('record_voice_over', 16);
export const IconPhoto     = alias('image', 32);
export const IconFile      = alias('description', 32);
export const IconClipboard = alias('content_paste', 16);
export const IconDownload  = alias('download', 16);
export const IconSparkles  = alias('auto_awesome', 16);

export function IconBookmark({ className, size, filled = false }: LuminousIconProps & { filled?: boolean }) {
  return <Icon name={filled ? 'bookmark_added' : 'bookmark_add'} className={className} size={toIconSize(size, 16)} />;
}

export function IconStar({ className, size, filled = false }: LuminousIconProps & { filled?: boolean }) {
  return <Icon name={filled ? 'star_rate' : 'star'} className={className} size={toIconSize(size, 16)} />;
}
