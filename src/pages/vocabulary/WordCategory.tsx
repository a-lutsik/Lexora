import { useState } from 'react';
import { CategorySelect } from '../../components/domain/CategorySelect';
import { Button } from '../../components/ui/Button';
import { useCategories, useCategoryMutation } from '../../hooks/useCategories';
import { useI18n } from '../../hooks/useI18n';
import { formatIpcError } from '../../lib/utils';

type WordCategoryProps = {
  entryId: number;
  languageId: number;
  categoryId: number | null;
};

export function WordCategory({ entryId, languageId, categoryId }: WordCategoryProps) {
  const { t: tUi } = useI18n();
  const categories = useCategories(languageId);
  const mutation = useCategoryMutation();
  const [targetId, setTargetId] = useState(categoryId);
  return (
    <div className="bulk-add-field">
      <label>{tUi('Category')}
        <CategorySelect categories={categories.data ?? []} value={targetId} onChange={setTargetId} disabled={mutation.isPending} />
      </label>
      <Button size="sm" variant="secondary" disabled={mutation.isPending || !categories.data?.length}
        onClick={() => {
          const target = targetId ?? categories.data?.find((category) => category.isGeneral)?.id;
          if (target != null) mutation.mutate({ kind: 'move', ids: [entryId], categoryId: target });
        }} isLoading={mutation.isPending}>{tUi('Move to category')}</Button>
      {categories.isError && <p className="text-secondary text-xs">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Retry categories')}</Button></p>}
      {mutation.isError && <p role="alert" className="add-word-image-error">{formatIpcError(mutation.error, tUi('Could not move words.'))}</p>}
      {mutation.isSuccess && <p role="status">{tUi('Category updated.')}</p>}
    </div>
  );
}
