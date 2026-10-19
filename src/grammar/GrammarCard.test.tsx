import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GrammarCard } from './GrammarCard';
import { invokeMock, listenMock } from '../test/mocks';
import type { GrammarMark } from '../lib/types';

const MARK: GrammarMark = {
  id: 4,
  start: 7,
  end: 9,
  kind: 'error',
  title: 'Grammar',
  original: 'of',
  suggestion: 'to',
  explanation: 'Use “to” after “access”.',
};

let card: GrammarMark | null;

beforeEach(() => {
  card = MARK;
  invokeMock.mockImplementation(async (cmd: string) => (cmd === 'get_grammar_card' ? card : null));
});

function cardCalls(): unknown[] {
  return invokeMock.mock.calls.filter(([name]) => name === 'grammar_card_action').map(([, args]) => args);
}

describe('GrammarCard', () => {
  it('shows what to change and why', async () => {
    render(<GrammarCard />);
    expect(await screen.findByRole('region', { name: 'Grammar' })).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByText('to')).toBeInTheDocument();
    expect(screen.getByText(/after “access”/)).toBeInTheDocument();
  });

  it('relays Apply, Dismiss and the panel link to the backend', async () => {
    render(<GrammarCard />);
    await userEvent.click(await screen.findByRole('button', { name: 'Apply' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await userEvent.click(screen.getByRole('button', { name: 'See all suggestions' }));
    expect(cardCalls()).toEqual([
      { issueId: 4, action: 'apply' },
      { issueId: 4, action: 'dismiss' },
      { issueId: 4, action: 'open' },
    ]);
  });

  it('empties when the backend hides the card', async () => {
    const { container } = render(<GrammarCard />);
    await screen.findByRole('region', { name: 'Grammar' });
    const listener = listenMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'lexora:grammar-card',
    ) as unknown as [string, (event: { payload: unknown }) => void] | undefined;

    act(() => listener?.[1]({ payload: null }));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
