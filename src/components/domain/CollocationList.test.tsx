import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollocationList } from './CollocationList';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { CollocationDto } from '../../lib/types';

function collocation(id: number, text: string, extra: Partial<CollocationDto> = {}): CollocationDto {
  return {
    id,
    lexemeId: 7,
    text,
    pattern: 'prep + noun',
    translation: `${text} (ru)`,
    example: `It happened ${text}.`,
    focus: null,
    distractors: [],
    nuance: null,
    vocabularyEntryId: null,
    ...extra,
  };
}

const LIST = [
  collocation(1, 'in the end', { nuance: 'итог после всего' }),
  collocation(2, 'at the end of'),
  collocation(3, 'by the end', { vocabularyEntryId: 90 }),
];

function mockIpc(list: CollocationDto[], afterAdd?: (ids: number[]) => CollocationDto[]) {
  invokeMock.mockImplementation((cmd: string, args?: { input?: { collocationIds: number[] } }) => {
    if (cmd === 'get_collocations') return Promise.resolve(list);
    if (cmd === 'add_collocations_to_vocabulary' && afterAdd) {
      return Promise.resolve(afterAdd(args?.input?.collocationIds ?? []));
    }
    return Promise.resolve(null);
  });
}

const markAdded = (ids: number[]) =>
  LIST.map((c) => (ids.includes(c.id) ? { ...c, vocabularyEntryId: 100 + c.id } : c));

describe('CollocationList', () => {
  it('loads collocations for the word and target language and shows meaning, example and nuance', async () => {
    mockIpc(LIST);
    renderWithQueryClient(<CollocationList lexemeId={7} word="end" targetLanguage="ru" />);

    expect(screen.getByText('Finding collocations…')).toBeInTheDocument();
    expect(await screen.findByText('in the end (ru)')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith('get_collocations', { lexemeId: 7, targetLanguage: 'ru' });
    expect(screen.getByText('итог после всего')).toBeInTheDocument();
    expect(screen.getAllByText('prep + noun')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '“by the end” is in your vocabulary' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add all (2)' })).toBeEnabled();
  });

  it('adds one collocation', async () => {
    const user = userEvent.setup();
    mockIpc(LIST, markAdded);
    renderWithQueryClient(<CollocationList lexemeId={7} word="end" targetLanguage="ru" />);

    await user.click(await screen.findByRole('button', { name: 'Add “in the end” to vocabulary' }));

    expect(invokeMock).toHaveBeenCalledWith('add_collocations_to_vocabulary', {
      input: { lexemeId: 7, targetLanguage: 'ru', collocationIds: [1] },
    });
    expect(await screen.findByRole('button', { name: '“in the end” is in your vocabulary' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add all (1)' })).toBeEnabled();
  });

  it('adds all collocations that are not in the vocabulary yet', async () => {
    const user = userEvent.setup();
    mockIpc(LIST, markAdded);
    renderWithQueryClient(<CollocationList lexemeId={7} word="end" targetLanguage="ru" />);

    await user.click(await screen.findByRole('button', { name: 'Add all (2)' }));

    expect(invokeMock).toHaveBeenCalledWith('add_collocations_to_vocabulary', {
      input: { lexemeId: 7, targetLanguage: 'ru', collocationIds: [1, 2] },
    });
    expect(await screen.findByRole('button', { name: 'All collocations are in your vocabulary' })).toBeDisabled();
  });

  it('shows an empty state and a back button', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    mockIpc([]);
    renderWithQueryClient(<CollocationList lexemeId={7} word="zxqv" targetLanguage="ru" onBack={onBack} />);

    expect(await screen.findByText('No common collocations found for this word.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to translation' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows the provider error and retries on request', async () => {
    const user = userEvent.setup();
    invokeMock.mockRejectedValueOnce({ Provider: 'rate limited' });
    renderWithQueryClient(<CollocationList lexemeId={7} word="end" targetLanguage="ru" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    mockIpc(LIST);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('in the end (ru)')).toBeInTheDocument());
  });
});
