// ============================================================
// LEXORA — HTML sanitizer (DOMPurify)
// Любой HTML из AI / внешних источников проходит через это
// перед dangerouslySetInnerHTML. См. AGENTS.md §9 XSS.
// ============================================================

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'mark',
  'span',
  'br',
  'p',
  'code',
  'ul',
  'ol',
  'li',
];

const ALLOWED_ATTR = ['class'];

/** Санитизирует HTML из внешнего источника. Пустая строка → ''. */
export function sanitizeHtml(dirty: string): string {
  if (dirty.length === 0) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}
