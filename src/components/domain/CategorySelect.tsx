import { useI18n } from '../../hooks/useI18n';
import type { CategoryDto } from '../../lib/types';

type CategorySelectProps = {
  categories: CategoryDto[];
  value: number | null;
  onChange: (id: number | null) => void;
  allCategories?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

export function CategorySelect({ categories, value, onChange, allCategories = false, disabled = false, ariaLabel }: CategorySelectProps) {
  const { t: tUi } = useI18n();
  const displayedValue = !allCategories && categories.some((category) => category.id === value && category.isGeneral) ? '' : (value ?? '');
  const hasSelected = value == null || categories.some((category) => category.id === value);
  return (
    <select className="vocabulary-category-select" value={displayedValue} disabled={disabled}
      aria-label={ariaLabel ?? tUi('Category')}
      onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}>
      <option value="">{allCategories ? tUi('All categories') : tUi('General')}</option>
      {!hasSelected && <option value={value ?? ''}>{tUi('Selected category')}</option>}
      {categories.filter((category) => allCategories || !category.isGeneral).map((category) => (
        <option key={category.id} value={category.id}>{category.isGeneral ? tUi('General') : category.name}</option>
      ))}
    </select>
  );
}
