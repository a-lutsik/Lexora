import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import CollectionsPage from './CollectionsPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { CollectionDto } from '../../lib/types';

const activePack: CollectionDto = {
  id: 1,
  name: 'Top 1000',
  description: 'Most common words',
  collectionType: 'system',
  languageId: 1,
  wordCount: 1000,
  isActive: true,
  packKey: 'top1000',
  loadStatus: 'ready',
};

const inactivePack: CollectionDto = { ...activePack, id: 2, name: 'Idioms', isActive: false, wordCount: 200 };
const emptyPack: CollectionDto = {
  ...activePack,
  id: 3,
  name: 'Phrasal verbs',
  isActive: false,
  wordCount: 0,
  loadStatus: 'empty',
};

function mockCollections(list: CollectionDto[], overrides: Record<string, () => Promise<unknown>> = {}) {
  invokeMock.mockImplementation((cmd: string) => {
    const override = overrides[cmd];
    if (override) return override();
    if (cmd === 'list_collections') return Promise.resolve(list);
    if (cmd === 'toggle_collection') return Promise.resolve(list[0]);
    return Promise.resolve(null);
  });
}

const callsOf = (name: string) => invokeMock.mock.calls.filter(([cmd]) => cmd === name);

describe('CollectionsPage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('shows an error with Try again instead of an empty grid when loading fails', async () => {
    const user = userEvent.setup();
    let failing = true;
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'list_collections') {
        return failing ? Promise.reject(new Error('db locked')) : Promise.resolve([inactivePack]);
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(<CollectionsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn.t load your collections/i);

    failing = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Idioms')).toBeInTheDocument();
  });

  it('enables a pack with one click (non-destructive)', async () => {
    const user = userEvent.setup();
    mockCollections([inactivePack]);
    renderWithQueryClient(<CollectionsPage />);

    await user.click(await screen.findByRole('button', { name: 'Enable Idioms in SRS' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('toggle_collection', { id: 2, active: true })
    );
  });

  it('asks for confirmation before disabling a pack and does nothing on cancel', async () => {
    const user = userEvent.setup();
    mockCollections([activePack]);
    renderWithQueryClient(<CollectionsPage />);

    await user.click(await screen.findByRole('button', { name: 'Active in SRS, disable Top 1000' }));

    const confirm = screen.getByRole('group', { name: /confirm disabling top 1000/i });
    expect(confirm).toHaveTextContent(/words leave your vocabulary/i);
    expect(callsOf('toggle_collection')).toHaveLength(0);

    await user.click(within(confirm).getByRole('button', { name: 'Keep enabled' }));
    expect(callsOf('toggle_collection')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Active in SRS, disable Top 1000' })).toBeInTheDocument();
  });

  it('disables the pack only after the learner confirms', async () => {
    const user = userEvent.setup();
    mockCollections([activePack]);
    renderWithQueryClient(<CollectionsPage />);

    await user.click(await screen.findByRole('button', { name: 'Active in SRS, disable Top 1000' }));
    await user.click(screen.getByRole('button', { name: 'Disable' }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith('toggle_collection', { id: 1, active: false })
    );
  });

  it('tells the learner when a toggle fails instead of failing silently', async () => {
    const user = userEvent.setup();
    mockCollections([inactivePack], {
      toggle_collection: () => Promise.reject(new Error('locked')),
    });
    renderWithQueryClient(<CollectionsPage />);

    await user.click(await screen.findByRole('button', { name: 'Enable Idioms in SRS' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t update this collection/i);
  });

  describe('loading a pack', () => {
    it('does not fetch pictures unless the learner opts in', async () => {
      const user = userEvent.setup();
      mockCollections([emptyPack]);
      renderWithQueryClient(<CollectionsPage />);

      await user.click(await screen.findByRole('button', { name: /load phrasal verbs into database/i }));

      await waitFor(() =>
        expect(invokeMock).toHaveBeenCalledWith('load_system_pack', { collectionId: 3, withImages: false })
      );
    });

    it('fetches pictures when the learner ticks the option', async () => {
      const user = userEvent.setup();
      mockCollections([emptyPack]);
      renderWithQueryClient(<CollectionsPage />);

      await user.click(await screen.findByRole('checkbox', { name: /also fetch pictures/i }));
      await user.click(screen.getByRole('button', { name: /load phrasal verbs into database/i }));

      await waitFor(() =>
        expect(invokeMock).toHaveBeenCalledWith('load_system_pack', { collectionId: 3, withImages: true })
      );
    });
  });
});
