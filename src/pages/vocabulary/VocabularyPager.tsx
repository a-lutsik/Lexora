import { getLocale } from '../../i18n';
import { useI18n } from "../../hooks/useI18n";
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
  const { t: tUi } = useI18n();
  const hasPrevious = page > 1;
  // Полная страница — значит, дальше, скорее всего, есть ещё.
  const hasNext = shown >= perPage;

  if (!hasPrevious && !hasNext) return null;

  const from = (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + shown;
  const range = shown === 0 ? tUi("Page {page}", { page }) : `${from.toLocaleString(getLocale())}–${to.toLocaleString(getLocale())}`;
  const label = total != null && shown > 0 ? tUi("{range} of {total}", { range, total: total.toLocaleString(getLocale()) }) : range;

  return (
    <nav className="vocabulary-pager" aria-label={tUi("Vocabulary pages")}>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasPrevious}
        onClick={() => onPageChange(page - 1)}
        aria-label={tUi("Previous page")}
      >{tUi("← Previous")}</Button>
      <span className="vocabulary-pager-status text-secondary text-sm" aria-live="polite">
        {tUi(label)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        aria-label={tUi("Next page")}
      >{tUi("Next →")}</Button>
    </nav>
  );
}
