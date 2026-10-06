import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkAddModal } from './BulkAddModal';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(async () => '/tmp/words.txt'),
}));

describe('BulkAddModal', () => {
  beforeEach(() => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'add_vocabulary_batch') {
        return Promise.resolve({
          added: 2,
          skipped: 0,
          items: [
            { text: 'apple', lexemeId: 1 },
            { text: 'get along', lexemeId: 2 },
          ],
          translateQueued: true,
        });
      }
      if (cmd === 'import_word_list') {
        return Promise.resolve({
          added: 1,
          skipped: 0,
          items: [{ text: 'pear', lexemeId: 3 }],
          translateQueued: true,
        });
      }
      return Promise.resolve(null);
    });
  });

  it('submits a pasted list via add_vocabulary_batch', async () => {
    const user = userEvent.setup();
    const onQueued = vi.fn();
    renderWithQueryClient(
      <BulkAddModal isOpen mode="paste" onClose={() => undefined} onQueued={onQueued} />
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Word list, one per line' }),
      'apple{Enter}get along'
    );
    expect(screen.getByText(/2 words ready/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add 2 words' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('add_vocabulary_batch', {
        input: {
          texts: ['apple', 'get along'],
          sourceLanguage: 'en',
          source: 'bulk',
        },
      });
    });
    expect(onQueued).toHaveBeenCalledWith(
      expect.objectContaining({ added: 2, translateQueued: true })
    );
  });

  it('imports a chosen file via import_word_list', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <BulkAddModal isOpen mode="file" onClose={() => undefined} />
    );

    await user.click(screen.getByRole('button', { name: 'Choose file…' }));
    expect(await screen.findByText(/Selected: words.txt/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add words from file' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('import_word_list', {
        input: {
          path: '/tmp/words.txt',
          sourceLanguage: 'en',
          source: 'file',
        },
      });
    });
  });
});
