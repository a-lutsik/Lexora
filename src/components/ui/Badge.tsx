import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Badge Component
// Статус SRS — точка + подпись (Lingora), остальные — мягкий фон.
// ============================================================

import './Badge.css';
import type { SrsStatus } from '../../lib/types';

type BadgeVariant = 'accent' | 'warn' | 'success' | 'danger' | 'neutral' | SrsStatus;

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
};

const STATUS_VARIANTS: ReadonlySet<string> = new Set<SrsStatus>(['new', 'learning', 'review', 'mature', 'suspended']);

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const isStatus = STATUS_VARIANTS.has(variant);
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {isStatus && <span className="status-dot" data-status={variant} aria-hidden="true" />}
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
  return <span className="pos">{pos}</span>;
}

// Обратная совместимость: компонент перенесён в domain/FreqBadge.
export { FreqBadge as FrequencyBadge } from '../domain/FreqBadge';
