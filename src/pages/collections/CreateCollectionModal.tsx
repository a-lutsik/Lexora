// ============================================================
// LEXORA — Create Collection Modal
// ============================================================

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
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
      className="collection-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createMutation.isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-collection-title"
    >
      <form
        className="collection-modal-dialog animate-slide-up"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) createMutation.mutate();
        }}
      >
        <div className="collection-modal-header">
          <h2 id="create-collection-title" className="collection-modal-title">
            New Collection
          </h2>
          <button
            type="button"
            className="collection-modal-close"
            onClick={onClose}
            disabled={createMutation.isPending}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <label className="collection-modal-label" htmlFor="collection-name">
          Collection name
        </label>
        <input
          id="collection-name"
          className="collection-modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Travel, Work emails, Exam week…"
          maxLength={80}
          autoFocus
          required
          aria-label="Collection name"
        />

        <label className="collection-modal-label" htmlFor="collection-description">
          Description <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="collection-description"
          className="collection-modal-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What belongs in this list?"
          rows={3}
          maxLength={240}
        />

        {createMutation.isError && (
          <p className="collection-modal-error" role="alert">
            {formatIpcError(createMutation.error, 'Could not create the collection')}
          </p>
        )}

        <div className="collection-modal-actions">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            isLoading={createMutation.isPending}
            aria-label="Create collection"
          >
            Create collection
          </Button>
        </div>
      </form>
    </div>
  );
}
