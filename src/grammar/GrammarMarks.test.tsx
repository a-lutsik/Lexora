import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GrammarMarks } from './GrammarMarks';
import { invokeMock, listenMock } from '../test/mocks';
import type { GrammarMarksPayload } from '../lib/types';

const PAYLOAD: GrammarMarksPayload = {
  regions: [
    { id: 1, kind: 'error', rects: [{ x: 10, y: 4, width: 30, height: 18 }] },
    {
      id: 2,
      kind: 'improvement',
      rects: [
        { x: 50, y: 4, width: 20, height: 18 },
        { x: 0, y: 26, width: 40, height: 18 },
      ],
    },
  ],
};

beforeEach(() => {
  invokeMock.mockImplementation(async (cmd: string) => (cmd === 'get_grammar_marks' ? PAYLOAD : null));
});

describe('GrammarMarks', () => {
  it('paints red and yellow underlines under the measured words', async () => {
    const { container } = render(<GrammarMarks />);
    await waitFor(() => expect(container.querySelectorAll('rect')).toHaveLength(3));

    const errors = container.querySelectorAll('rect.is-error');
    const improvements = container.querySelectorAll('rect.is-improvement');
    expect(errors).toHaveLength(1);
    expect(improvements).toHaveLength(2);
    // The line sits on the bottom edge of the word.
    expect(errors[0]?.getAttribute('y')).toBe('20');
    expect(errors[0]?.getAttribute('x')).toBe('10');
    expect(errors[0]?.getAttribute('width')).toBe('30');
  });

  it('follows marks events and clears them', async () => {
    invokeMock.mockImplementation(async () => ({ regions: [] }));
    const { container } = render(<GrammarMarks />);
    await waitFor(() => expect(listenMock).toHaveBeenCalled());
    const listener = listenMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'lexora:grammar-marks',
    ) as unknown as [string, (event: { payload: unknown }) => void] | undefined;

    act(() => listener?.[1]({ payload: PAYLOAD }));
    expect(container.querySelectorAll('rect')).toHaveLength(3);

    // Malformed payloads are ignored; an empty one clears the lines.
    act(() => listener?.[1]({ payload: 'nope' }));
    expect(container.querySelectorAll('rect')).toHaveLength(3);
    act(() => listener?.[1]({ payload: { regions: [] } }));
    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });
});
