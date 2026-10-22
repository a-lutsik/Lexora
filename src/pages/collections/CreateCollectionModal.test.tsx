import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateCollectionModal } from './CreateCollectionModal';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';

describe('CreateCollectionModal', () => {
  it('creates a named collection and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'create_collection') {
        return Promise.resolve({
          id: 3,
          name: 'Work emails',
          description: null,
          collectionType: 'user',
          languageId: 1,
          wordCount: 0,
          isActive: false,
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <CreateCollectionModal isOpen languageId={1} onClose={onClose} />
    );

    expect(screen.getByRole('dialog', { name: 'New collection' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Collection name'), 'Work emails');
    await user.click(screen.getByRole('button', { name: 'Create collection' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('create_collection', {
        input: { name: 'Work emails', description: null, languageId: 1 },
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does not submit an empty name', async () => {
    const user = userEvent.setup();
    invokeMock.mockClear();
    renderWithQueryClient(
      <CreateCollectionModal isOpen languageId={1} onClose={() => undefined} />
    );

    await user.click(screen.getByRole('button', { name: 'Create collection' }));
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
