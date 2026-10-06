// ============================================================
// LEXORA — SafeHtml
// Рендер HTML из внешних источников только после DOMPurify.
// ============================================================

import { useMemo } from 'react';
import { sanitizeHtml } from '../../lib/sanitizeHtml';

type SafeHtmlProps = {
  html: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
};

export function SafeHtml({ html, className, as: Tag = 'div' }: SafeHtmlProps) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  if (sanitized.length === 0) return null;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
