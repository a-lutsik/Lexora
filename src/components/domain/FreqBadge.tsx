import { useI18n } from '../../hooks/useI18n';
// ============================================================
// LEXORA — FreqBadge Domain Component
// Бейдж частотности слова по рангу (★ 1,500).
// Логика перенесена из ui/Badge (FrequencyBadge); там оставлен
// реэкспорт для обратной совместимости.
// ============================================================

import { Badge } from '../ui/Badge';

type FreqBadgeProps = {
  rank: number | null;
};

export function FreqBadge({ rank }: FreqBadgeProps) {
  const { locale } = useI18n();
  if (rank === null) return null;
  return (
    <Badge variant="warn">
      ★ {rank.toLocaleString(locale)}
    </Badge>
  );
}
