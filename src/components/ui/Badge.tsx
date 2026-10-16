import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Badge Component
// ============================================================

import './Badge.css';
import type { SrsStatus } from '../../lib/types';

type BadgeVariant = 'accent' | 'warn' | 'success' | 'danger' | 'neutral' | SrsStatus;

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
};

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {children}
    </span>
  );
}

// Convenience components
export function SrsStatusBadge({ status }: { status: SrsStatus }) {
  const { t: tUi } = useI18n();
  const labels: Record<SrsStatus, string> = {
    new:       'New',
    learning:  'Learning',
    review:    'Review',
    mature:    'Mature',
    suspended: 'Suspended',
  };

  return <Badge variant={status}>{tUi(labels[status])}</Badge>;
}

export function PosBadge({ pos }: { pos: string | null }) {
  if (pos === null) return null;
  return <Badge variant="neutral">{pos}</Badge>;
}

// Обратная совместимость: компонент перенесён в domain/FreqBadge.
export { FreqBadge as FrequencyBadge } from '../domain/FreqBadge';
