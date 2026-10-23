import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrammarApp } from './GrammarApp';
import { invokeMock, listenMock } from '../test/mocks';
import { createTestQueryClient, renderWithQueryClient } from '../test/render';
import { QueryClientProvider } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/constants';
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

/** Backend stand-in: one "dont" issue per occurrence in the checked text. */
function checkOf(text: string): WritingCheckDto {
  const issues: WritingIssueDto[] = [];
  for (let at = text.indexOf('dont'); at !== -1; at = text.indexOf('dont', at + 1)) {
    issues.push(issue(issues.length + 1, 'dont', "doesn't", at));
  }
  return { ...CHECK, originalText: text, issueCount: issues.length, issues };
}

function checkedTexts(): unknown[] {
  return argsOf('check_writing').map((args) =>
    typeof args === 'object' && args !== null && 'input' in args ? args.input : args,
  );
}

function fieldListenerOf(): ((event: { payload: unknown }) => void) | undefined {
  const call = listenMock.mock.calls.find((c: unknown[]) => c[0] === 'lexora:grammar-field') as
    | [string, (event: { payload: unknown }) => void]
    | undefined;
  return call?.[1];
}

const PARA_1 = 'She dont like apples.';
const PARA_2 = 'He go home early.';
const PARA_2_EDITED = 'He dont go home early.';

function useIncrementalBackend() {
  invokeMock.mockImplementation(async (cmd: string, args?: unknown) => {
    if (cmd === 'get_grammar_field') return field;
    if (cmd === 'check_writing') {
      const input =
        typeof args === 'object' && args !== null && 'input' in args ? args.input : null;
      const text =
        typeof input === 'object' && input !== null && 'text' in input && typeof input.text === 'string'
          ? input.text
          : '';
      return checkOf(text);
    }
    return null;
  });
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

  it('re-checks only the paragraph that changed', async () => {
    useIncrementalBackend();
    const first = `${PARA_1}\n${PARA_2}`;
    const second = `${PARA_1}\n${PARA_2_EDITED}`;
    field = { ...FIELD, text: first };
    renderWithQueryClient(<GrammarApp />);
    expect(await screen.findByRole('button', { name: /1 writing suggestion/i })).toBeInTheDocument();
    expect(checkedTexts()).toEqual([{ text: first, ephemeral: true }]);

    act(() => fieldListenerOf()?.({ payload: { ...FIELD, text: second } }));
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    expect(checkedTexts()).toEqual([
      { text: first, ephemeral: true },
      { text: PARA_2_EDITED, ephemeral: true },
    ]);

    // Offsets of the merged check point into the full field text.
    const lastMarks = () => argsOf('set_grammar_marks').slice(-1)[0];
    const secondDont = second.lastIndexOf('dont');
    await waitFor(() =>
      expect(lastMarks()).toMatchObject({
        input: {
          fieldId: 7,
          text: second,
          marks: [
            { id: 1, start: 4, end: 8, original: 'dont' },
            { id: 2, start: secondDont, end: secondDont + 4, original: 'dont' },
          ],
        },
      }),
    );
  });

  it('does not re-send the same text focused in another field', async () => {
    renderWithQueryClient(<GrammarApp />);
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    act(() => fieldListenerOf()?.({ payload: { ...FIELD, fieldId: 8 } }));
    const lastMarks = () => argsOf('set_grammar_marks').slice(-1)[0];
    await waitFor(() => expect(lastMarks()).toMatchObject({ input: { fieldId: 8, text: TEXT } }));
    expect(screen.getByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    expect(argsOf('check_writing')).toHaveLength(1);
  });

  it('re-uses the check when the same text comes back after pending', async () => {
    renderWithQueryClient(<GrammarApp />);
    await screen.findByRole('button', { name: /2 writing suggestions/i });
    const marksOf = () => argsOf('set_grammar_marks');
    await waitFor(() => expect(marksOf().slice(-1)[0]).toMatchObject({ input: { fieldId: 7, text: TEXT } }));
    const marks = marksOf().slice(-1)[0];

    act(() => fieldListenerOf()?.({ payload: { kind: 'pending', fieldId: 7 } }));
    await waitFor(() => expect(marksOf().slice(-1)[0]).toEqual({ input: null }));
    const sentBefore = marksOf().length;

    act(() => fieldListenerOf()?.({ payload: FIELD }));
    expect(await screen.findByRole('button', { name: /2 writing suggestions/i })).toBeInTheDocument();
    await waitFor(() => expect(marksOf().length).toBeGreaterThan(sentBefore));
    expect(marksOf().slice(-1)[0]).toEqual(marks);
    expect(argsOf('check_writing')).toHaveLength(1);
  });

  it('keeps checked paragraphs in the query cache for a few minutes only', async () => {
    useIncrementalBackend();
    field = { ...FIELD, text: `${PARA_1}\n${PARA_2}` };
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <GrammarApp />
      </QueryClientProvider>,
    );
    await screen.findByRole('button', { name: /1 writing suggestion/i });
    for (const paragraph of [PARA_1, PARA_2]) {
      const query = queryClient
        .getQueryCache()
        .find({ queryKey: [QUERY_KEYS.GRAMMAR_CHECK_PARAGRAPH, paragraph], exact: true });
      expect(query?.gcTime).toBe(300_000);
    }
    expect(
      queryClient.getQueryData([QUERY_KEYS.GRAMMAR_CHECK_PARAGRAPH, PARA_1]),
    ).toEqual([issue(1, 'dont', "doesn't", 4)]);
    expect(queryClient.getQueryData([QUERY_KEYS.GRAMMAR_CHECK_PARAGRAPH, PARA_2])).toEqual([]);
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
