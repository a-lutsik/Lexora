import { getLocale } from '../../i18n';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Vocabulary pager
// Словарь отдаётся страницами (perPage слов): без пейджера всё,
// что за первой страницей, было недоступно.
// ============================================================

import { IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';

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
  const from = (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + shown;
  // Известен итог — дальше есть слова, только если он больше показанного;
  // иначе полная страница значит, что дальше, скорее всего, есть ещё.
  const hasNext = total != null ? to < total : shown >= perPage;

  // Подвал виден всегда, когда в списке есть слова (frame 1a); пустой первой странице он не нужен.
  if (shown === 0 && !hasPrevious) return null;
  const range = shown === 0 ? tUi("Page {page}", { page }) : `${from.toLocaleString(getLocale())}–${to.toLocaleString(getLocale())}`;
  const label = total != null && shown > 0 ? tUi("{range} of {total}", { range, total: total.toLocaleString(getLocale()) }) : range;

  return (
    <nav className="vocabulary-pager" aria-label={tUi("Vocabulary pages")}>
      <span className="vocabulary-pager__status" aria-live="polite">
        {tUi(label)}
      </span>
      <span className="spacer" />
      <IconButton
        variant="secondary"
        size="sm"
        icon={<Icon name="chevron_left" size={17} />}
        disabled={!hasPrevious}
        onClick={() => onPageChange(page - 1)}
        aria-label={tUi("Previous page")}
      />
      <IconButton
        variant="secondary"
        size="sm"
        icon={<Icon name="chevron_right" size={17} />}
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        aria-label={tUi("Next page")}
      />
    </nav>
  );
}
