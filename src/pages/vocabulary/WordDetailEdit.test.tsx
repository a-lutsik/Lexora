import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WordDetailEdit } from './WordDetailEdit';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';

describe('WordDetailEdit', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('saves the corrected word and translation, then closes', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    invokeMock.mockImplementation((cmd: string) =>
      Promise.resolve(cmd === 'update_vocabulary_entry' ? { id: 7 } : null)
    );
    renderWithQueryClient(
      <WordDetailEdit entryId={7} text="recieve" translation="получать" onDone={onDone} />
    );

    const word = screen.getByLabelText('Word');
    await user.clear(word);
    await user.type(word, 'receive');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(invokeMock).toHaveBeenCalledWith('update_vocabulary_entry', {
      id: 7,
      text: 'receive',
      translation: 'получать',
    });
  });

  it('shows the error and stays open when the word already exists', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    invokeMock.mockRejectedValue('Invalid input: This word already exists in the dictionary');
    renderWithQueryClient(
      <WordDetailEdit entryId={7} text="recieve" translation="" onDone={onDone} />
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancel closes without saving', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderWithQueryClient(
      <WordDetailEdit entryId={7} text="recieve" translation="" onDone={onDone} />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDone).toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalledWith('update_vocabulary_entry', expect.anything());
  });
});
