import { useI18n } from '../../hooks/useI18n';
import type { CategoryDto } from '../../lib/types';
import { Select, type SelectOption } from '../ui/Select';

type CategorySelectProps = {
  categories: CategoryDto[];
  value: number | null;
  onChange: (id: number | null) => void;
  allCategories?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  /** Adds a last "New category…" entry that calls this instead of changing the value. */
  onCreate?: () => void;
};

/** Option value of the "General" / "All categories" entry. */
const NO_CATEGORY = '';
/** Option value of the "New category…" action (category ids are numeric, so it cannot collide). */
const CREATE_CATEGORY = 'create-category';

export function CategorySelect({ categories, value, onChange, allCategories = false, disabled = false, ariaLabel, id, onCreate }: CategorySelectProps) {
  const { t: tUi } = useI18n();
  const isGeneralSelected = !allCategories && categories.some((category) => category.id === value && category.isGeneral);
  const selected = isGeneralSelected || value == null ? NO_CATEGORY : String(value);
  const hasSelected = value == null || categories.some((category) => category.id === value);
  const options: SelectOption[] = [
    { value: NO_CATEGORY, label: allCategories ? tUi('All categories') : tUi('General') },
    ...(hasSelected ? [] : [{ value: String(value), label: tUi('Selected category') }]),
    ...categories
      .filter((category) => allCategories || !category.isGeneral)
      .map((category) => ({ value: String(category.id), label: category.isGeneral ? tUi('General') : category.name })),
    ...(onCreate ? [{ value: CREATE_CATEGORY, label: tUi('New category…') }] : []),
  ];
  return (
    <Select
      className="vocabulary-category-select"
      id={id}
      options={options}
      value={selected}
      disabled={disabled}
      ariaLabel={ariaLabel ?? tUi('Category')}
      onChange={(next) => {
        if (next === CREATE_CATEGORY) onCreate?.();
        else onChange(next === NO_CATEGORY ? null : Number(next));
      }}
    />
  );
}
