import { useI18n } from '../../hooks/useI18n';
// ============================================================
// LEXORA — FreqBadge Domain Component
// Частотность слова по рангу — моноширинное число (Lingora: «500»,
// «1,800»), без звёзд и цветного фона. `top` — формулировка для
// карточки слова («top 500»).
// В ui/Badge оставлен реэкспорт FrequencyBadge для совместимости.
// ============================================================

import './domain.css';

type FreqBadgeProps = {
  rank: number | null;
  /** Phrase the rank as "top N" (word details) instead of a bare number (tables). */
  top?: boolean;
};

export function FreqBadge({ rank, top = false }: FreqBadgeProps) {
  const { locale, t: tUi } = useI18n();
  if (rank === null) return null;
  const value = rank.toLocaleString(locale);
  return (
    <span className="num freq-badge">
      {top ? tUi('top {rank}', { rank: value }) : value}
    </span>
  );
}
