// ============================================================
// LEXORA — Icon (Material Symbols Rounded, weight 300, одноцветные)
// Шрифт самохостится (public/fonts), поэтому работает офлайн.
// Размер задаётся через data-size (см. Icon.css), без inline-стилей.
// ============================================================

import { cx } from '../../lib/utils';
import './Icon.css';

export type IconSize = 14 | 16 | 17 | 18 | 19 | 20 | 22 | 24 | 28 | 32;

/** Имя глифа Material Symbols, например `menu_book`, `volume_up`. */
export type IconName = string;

type IconProps = {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Когда иконка несёт смысл без текста рядом — подпись для скринридера. */
  label?: string;
};

export function Icon({ name, size = 18, className, label }: IconProps) {
  return (
    <span
      className={cx('icon', className)}
      data-size={size}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
