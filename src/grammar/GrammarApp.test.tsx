import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrammarApp } from './GrammarApp';
import { invokeMock, listenMock } from '../test/mocks';
import { renderWithQueryClient } from '../test/render';
import type { GrammarFieldPayload, WritingCheckDto, WritingIssueDto } from '../lib/types';

const TEXT = 'She dont like apples and she go home.';

function issue(id: number, originalFragment: string, suggestedFix: string, offsetStart: number): WritingIssueDto {
  return {
    id,
    writingCheckId: 0,
    category: 'grammar',
    severity: 'error',
    originalFragment,
    suggestedFix,
    explanation: `Use “${suggestedFix}”.`,
    ruleHint: null,
    offsetStart,
    offsetEnd: offsetStart + originalFragment.length,
    status: 'pending',
  };
}

const CHECK: WritingCheckDto = {
  id: 0,
  originalText: TEXT,
  correctedText: null,
  language: 'en',
  issueCount: 2,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 70,
  summary: null,
  rewriteMode: null,
  issues: [issue(1, 'dont', "doesn't", 4), issue(2, 'go', 'goes', 29)],
  createdAt: 0,
};

const FIELD: GrammarFieldPayload = {
  kind: 'check',
  fieldId: 7,
  text: TEXT,
  appName: 'Mail',
  bundleId: 'com.apple.mail',
};

let field: GrammarFieldPayload;
let applyFails: boolean;

beforeEach(() => {
  field = FIELD;
  applyFails = false;
  invokeMock.mockImplementation(async (cmd: string) => {
    if (cmd === 'get_grammar_field') return field;
    if (cmd === 'check_writing') return CHECK;
    if (cmd === 'apply_grammar_fix' && applyFails) throw 'Validation: The text changed after the check';
    return null;
  });
});

function argsOf(cmd: string): unknown[] {
  return invokeMock.mock.calls.filter(([name]) => name === cmd).map(([, args]) => args);
}

async function openPanel() {
  const badge = await screen.findByRole('button', { name: /2 writing suggestions/i });
  await userEvent.click(badge);
  return screen.findByRole('region', { name: /2 suggestions/i });
}

describe('GrammarApp', () => {
  it('renders nothing while no field is watched', async () => {
    field = { kind: 'hidden' };
    const { container } = renderWithQueryClient(<GrammarApp />);
    await waitFor(() => expect(argsOf('get_grammar_field')).toHaveLength(1));
    expect(container).toBeEmptyDOMElement();
  });

  it('checks the field text without storing it and shows the count', async () => {
    renderWithQueryClient(<GrammarApp />);
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    expect(argsOf('check_writing')).toEqual([{ input: { text: TEXT, ephemeral: true } }]);
  });

  it('opens the panel and applies one fix into the field', async () => {
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    expect(argsOf('set_grammar_panel_open')).toEqual([{ open: true }]);
    expect(screen.getByRole('heading', { name: /· Mail/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Apply fix: dont → doesn't/ }));

    await waitFor(() =>
      expect(argsOf('apply_grammar_fix')).toEqual([
        {
          input: {
            fieldId: 7,
            checkedText: TEXT,
            correctedText: "She doesn't like apples and she go home.",
          },
        },
      ]),
    );
    expect(await screen.findByRole('region', { name: /1 suggestion/i })).toBeInTheDocument();

    // The next fix is based on the already corrected text.
    await userEvent.click(screen.getByRole('button', { name: /Apply fix: go → goes/ }));
    await waitFor(() => expect(argsOf('apply_grammar_fix')).toHaveLength(2));
    expect(argsOf('apply_grammar_fix')[1]).toEqual({
      input: {
        fieldId: 7,
        checkedText: "She doesn't like apples and she go home.",
        correctedText: "She doesn't like apples and she goes home.",
      },
    });
    expect(await screen.findByText(/No mistakes found/)).toBeInTheDocument();
  });

  it('applies all fixes at once', async () => {
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Apply all (2)' }));
    await waitFor(() =>
      expect(argsOf('apply_grammar_fix')).toEqual([
        {
          input: {
            fieldId: 7,
            checkedText: TEXT,
            correctedText: "She doesn't like apples and she goes home.",
          },
        },
      ]),
    );
  });

  it('dismissing a suggestion keeps the field untouched', async () => {
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: /Dismiss fix: dont → doesn't/ }));
    expect(await screen.findByRole('region', { name: /1 suggestion/i })).toBeInTheDocument();
    expect(argsOf('apply_grammar_fix')).toHaveLength(0);
  });

  it('shows why a fix could not be applied', async () => {
    applyFails = true;
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: /Apply fix: dont → doesn't/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/text changed/i);
    // Nothing was applied locally.
    expect(screen.getByRole('region', { name: /2 suggestions/i })).toBeInTheDocument();
  });

  it('Escape closes the panel and returns focus to the app', async () => {
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    await userEvent.keyboard('{Escape}');
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    expect(argsOf('set_grammar_panel_open')).toEqual([{ open: true }, { open: false }]);
  });

  it('can stop checking in the current app', async () => {
    renderWithQueryClient(<GrammarApp />);
    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: "Don't check in Mail" }));
    expect(argsOf('exclude_grammar_app')).toEqual([{ bundleId: 'com.apple.mail' }]);
  });

  it('underlines the open suggestions inside the field', async () => {
    renderWithQueryClient(<GrammarApp />);
    await screen.findByRole('button', { name: /2 writing suggestions/i });
    const lastMarks = () => argsOf('set_grammar_marks').slice(-1)[0];
    await waitFor(() => expect(lastMarks()).not.toEqual({ input: null }));
    expect(lastMarks()).toMatchObject({
      input: {
        fieldId: 7,
        text: TEXT,
        marks: [
          { id: 1, start: 4, end: 8, kind: 'error', original: 'dont', suggestion: "doesn't" },
          { id: 2, start: 29, end: 31, kind: 'error', original: 'go', suggestion: 'goes' },
        ],
      },
    });
  });

  it('carries out the buttons of the hover card', async () => {
    renderWithQueryClient(<GrammarApp />);
    await screen.findByRole('button', { name: /2 writing suggestions/i });
    await waitFor(() => expect(listenMock).toHaveBeenCalled());
    const cardListener = listenMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'lexora:grammar-mark-action',
    ) as unknown as [string, (event: { payload: unknown }) => void] | undefined;
    expect(cardListener).toBeDefined();

    act(() => cardListener?.[1]({ payload: { issueId: 1, action: 'apply' } }));
    await waitFor(() =>
      expect(argsOf('apply_grammar_fix')).toEqual([
        {
          input: {
            fieldId: 7,
            checkedText: TEXT,
            correctedText: "She doesn't like apples and she go home.",
          },
        },
      ]),
    );

    act(() => cardListener?.[1]({ payload: { issueId: 2, action: 'dismiss' } }));
    expect(await screen.findByRole('button', { name: /checking your text|writing suggestion|No mistakes/i })).toBeInTheDocument();
    expect(argsOf('apply_grammar_fix')).toHaveLength(1);
  });

  it('follows field events from the backend', async () => {
    field = { kind: 'hidden' };
    renderWithQueryClient(<GrammarApp />);
    await waitFor(() => expect(listenMock).toHaveBeenCalled());
    const fieldListener = listenMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'lexora:grammar-field',
    ) as unknown as [string, (event: { payload: unknown }) => void] | undefined;
    expect(fieldListener).toBeDefined();

    act(() => fieldListener?.[1]({ payload: { kind: 'pending', fieldId: 7 } }));
    expect(await screen.findByRole('button', { name: /checking your text/i })).toBeInTheDocument();

    act(() => fieldListener?.[1]({ payload: FIELD }));
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();

    // Malformed payloads are ignored.
    act(() => fieldListener?.[1]({ payload: { kind: 'bogus' } }));
    expect(screen.getByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
  });
});


it('cancels the delayed panel close when its window unmounts', async () => {
  const view = renderWithQueryClient(<GrammarApp />);
  await openPanel();
  vi.useFakeTimers();
  try {
    fireEvent.click(screen.getByRole('button', { name: /Apply all/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(argsOf('apply_grammar_fix')).toHaveLength(1);
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(argsOf('set_grammar_panel_open')).toEqual([{ open: true }]);
  } finally {
    vi.useRealTimers();
  }
});
