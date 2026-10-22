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
    <section className="word-panel__section word-category">
      <label htmlFor={`word-category-${entryId}`} className="section-label word-panel__section-label">{tUi('Category')}</label>
      <div className="word-category__row">
        <CategorySelect id={`word-category-${entryId}`} categories={categories.data ?? []} value={targetId} onChange={setTargetId} disabled={mutation.isPending} />
        <Button variant="secondary" disabled={mutation.isPending || !categories.data?.length}
          onClick={() => {
            const target = targetId ?? categories.data?.find((category) => category.isGeneral)?.id;
            if (target != null) mutation.mutate({ kind: 'move', ids: [entryId], categoryId: target });
          }} isLoading={mutation.isPending}>{tUi('Move to category')}</Button>
      </div>
      {categories.isError && <p className="inline-note">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Retry categories')}</Button></p>}
      {mutation.isError && <p role="alert" className="inline-error">{formatIpcError(mutation.error, tUi('Could not move words.'))}</p>}
      {mutation.isSuccess && <p role="status" className="inline-note">{tUi('Category updated.')}</p>}
    </section>
  );
}
