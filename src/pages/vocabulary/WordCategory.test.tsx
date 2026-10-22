import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { WordCategory } from './WordCategory';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import { chooseOption } from '../../test/selectOption';

const categories = [
  { id: 1, languageId: 1, name: 'General', isGeneral: true, wordCount: 1 },
  { id: 2, languageId: 1, name: 'Travel', isGeneral: false, wordCount: 1 },
];

describe('WordCategory', () => {
  beforeEach(() => {
    invokeMock.mockImplementation((cmd: string) => cmd === 'list_categories' ? Promise.resolve(categories) : Promise.resolve(null));
  });

  it('shows General for a stored General id and moves the single entry', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<WordCategory entryId={42} categoryId={1} languageId={1} />);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('General'));
    await chooseOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Travel');
    await user.click(screen.getByRole('button', { name: 'Move to category' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('move_vocabulary_to_category', { ids: [42], categoryId: 2 }));
  });

  it('resolves the General option to its authoritative id', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<WordCategory entryId={42} categoryId={2} languageId={1} />);
    await chooseOption(user, screen.getByRole('combobox', { name: 'Category' }), 'General');
    await user.click(screen.getByRole('button', { name: 'Move to category' }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('move_vocabulary_to_category', { ids: [42], categoryId: 1 }));
  });

  it('keeps a failed move visible without reporting success', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_categories') return Promise.resolve(categories);
      if (cmd === 'move_vocabulary_to_category') return Promise.reject(new Error('Database locked'));
      return Promise.resolve(null);
    });
    renderWithQueryClient(<WordCategory entryId={42} categoryId={1} languageId={1} />);
    await chooseOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Travel');
    await user.click(screen.getByRole('button', { name: 'Move to category' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database locked');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Travel');
  });
});
