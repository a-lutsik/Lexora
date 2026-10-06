import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import VocabularyPage from './VocabularyPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';

describe('VocabularyPage add split menu', () => {
  it('opens Add Word modal from the primary button', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue([]);
    renderWithQueryClient(
      <MemoryRouter>
        <VocabularyPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Add new word' }));
    expect(screen.getByRole('dialog', { name: /Add Word to Vocabulary/i })).toBeInTheDocument();
  });

  it('opens Paste list from the split menu', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue([]);
    renderWithQueryClient(
      <MemoryRouter>
        <VocabularyPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'More add options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Paste list' }));
    expect(screen.getByRole('heading', { name: 'Paste Word List' })).toBeInTheDocument();
  });
});
