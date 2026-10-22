import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Create Collection Modal
// Shared modal anatomy (Lingora 2e): head · body · foot.
// ============================================================

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { ipc } from '../../lib/ipc';
import { formatIpcError } from '../../lib/utils';

type CreateCollectionModalProps = {
  isOpen: boolean;
  languageId: number;
  onClose: () => void;
};

export function CreateCollectionModal({
  isOpen,
  languageId,
  onClose,
}: CreateCollectionModalProps) {
  const { t: tUi } = useI18n();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      ipc.collections.create({
        name: name.trim(),
        description: description.trim() || null,
        languageId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      setName('');
      setDescription('');
      onClose();
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createMutation.isPending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose, createMutation.isPending]);

  if (!isOpen) return null;

  const canSubmit = name.trim().length > 0 && !createMutation.isPending;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createMutation.isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-collection-title"
    >
      <div className="modal collection-modal">
        <form
          className="collection-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) createMutation.mutate();
          }}
        >
          <div className="modal__head">
            <div className="modal__head-text">
              <h2 id="create-collection-title" className="modal__title">{tUi("New collection")}</h2>
            </div>
            <IconButton
              className="modal__close"
              icon={<Icon name="close" size={20} />}
              onClick={onClose}
              disabled={createMutation.isPending}
              aria-label={tUi("Close dialog")}
            />
          </div>

          <div className="modal__body">
            <div className="collection-modal__field">
              <label className="label" htmlFor="collection-name">{tUi("Collection name")}</label>
              <div className="field">
                <input dir="auto"
                  id="collection-name"
                  className="field__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tUi("Travel, Work emails, Exam week…")}
                  maxLength={80}
                  autoFocus
                  required
                  aria-label={tUi("Collection name")}
                />
              </div>
            </div>

            <div className="collection-modal__field">
              <label className="label" htmlFor="collection-description">{tUi("Description ")}<span className="label__optional">{tUi("(optional)")}</span>
              </label>
              <div className="field field--textarea">
                <textarea dir="auto"
                  id="collection-description"
                  className="field__input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={tUi("What belongs in this list?")}
                  rows={3}
                  maxLength={240}
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="inline-error collection-modal__error" role="alert">
                {formatIpcError(createMutation.error, tUi("Could not create the collection"))}
              </p>
            )}
          </div>

          <div className="modal__foot">
            <span className="hint">
              <kbd className="kbd">{tUi("Esc")}</kbd>
              {tUi("close")}
            </span>
            <span className="spacer" />
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={createMutation.isPending}
            >{tUi("Cancel")}</Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit}
              isLoading={createMutation.isPending}
              aria-label={tUi("Create collection")}
            >{tUi("Create collection")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
