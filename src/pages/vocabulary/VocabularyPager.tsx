// ============================================================
// LEXORA — Vocabulary pager
// Словарь отдаётся страницами (perPage слов): без пейджера всё,
// что за первой страницей, было недоступно.
// ============================================================

import { Button } from '../../components/ui/Button';

type VocabularyPagerProps = {
  /** 1-based номер текущей страницы. */
  page: number;
  perPage: number;
  /** Сколько слов пришло на текущей странице. */
  shown: number;
  /** Всего слов (только когда фильтры не сужают выборку), иначе null. */
  total: number | null;
  onPageChange: (page: number) => void;
};

export function VocabularyPager({ page, perPage, shown, total, onPageChange }: VocabularyPagerProps) {
  const hasPrevious = page > 1;
  // Полная страница — значит, дальше, скорее всего, есть ещё.
  const hasNext = shown >= perPage;

  if (!hasPrevious && !hasNext) return null;

  const from = (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + shown;
  const range = shown === 0 ? `Page ${page}` : `${from.toLocaleString()}–${to.toLocaleString()}`;
  const label = total != null && shown > 0 ? `${range} of ${total.toLocaleString()}` : range;

  return (
    <nav className="vocabulary-pager" aria-label="Vocabulary pages">
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasPrevious}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ← Previous
      </Button>
      <span className="vocabulary-pager-status text-secondary text-sm" aria-live="polite">
        {label}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next →
      </Button>
    </nav>
  );
}
