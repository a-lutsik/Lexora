import { useEffect, useRef, useState } from 'react';
import { useCategoryMutation } from '../../hooks/useCategories';
import { useI18n } from '../../hooks/useI18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../../components/ui/Button';
import { formatIpcError } from '../../lib/utils';
import type { CategoryDto } from '../../lib/types';

type CategoryEditorProps = {
  languageId: number;
  category?: CategoryDto;
  deleting?: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export function CategoryEditor({ languageId, category, deleting = false, onClose, onDeleted }: CategoryEditorProps) {
  const { t: tUi } = useI18n();
  const [name, setName] = useState(category?.name ?? '');
  const mutation = useCategoryMutation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useEffect(() => {
    const previous = document.activeElement;
    const target = dialogRef.current?.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled])');
    (target ?? dialogRef.current)?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !mutation.isPending) onClose(); };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('keydown', escape); if (previous instanceof HTMLElement) previous.focus(); };
  }, [onClose, mutation.isPending]);
  const title = deleting ? tUi('Delete category') : category ? tUi('Rename category') : tUi('Create category');
  const save = () => {
    const action = deleting && category ? { kind: 'remove' as const, id: category.id }
      : category ? { kind: 'rename' as const, id: category.id, name: name.trim() }
        : { kind: 'create' as const, languageId, name: name.trim() };
    mutation.mutate(action, { onSuccess: () => { if (deleting) onDeleted(); onClose(); } });
  };
  return (
    <div className="add-word-overlay" role="dialog" aria-modal="true" aria-labelledby="category-editor-title">
      <div className="add-word-dialog" ref={dialogRef} tabIndex={-1}>
        <h2 id="category-editor-title" className="add-word-title">{title}</h2>
        {deleting ? <p>{tUi('Words in this category will move to General. Learning progress is preserved.')}</p> : (
          <label className="bulk-add-field">{tUi('Category name')}
            <input className="add-word-input" value={name} maxLength={80} dir="auto" autoFocus
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && name.trim() && !mutation.isPending) save(); }} />
          </label>
        )}
        {mutation.isError && <p role="alert" className="add-word-image-error">{formatIpcError(mutation.error, tUi('Could not save category.'))}</p>}
        <div className="add-word-actions">
          <Button onClick={onClose} disabled={mutation.isPending}>{tUi('Cancel')}</Button>
          <Button variant={deleting ? 'danger' : 'primary'} onClick={save} isLoading={mutation.isPending}
            disabled={mutation.isPending || (!deleting && !name.trim())}>{deleting ? tUi('Delete') : tUi('Save')}</Button>
        </div>
      </div>
    </div>
  );
}
