import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WritingPage from './WritingPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import { AUTO_CHECK_DEBOUNCE_MS, MAX_WRITING_CHARS, saveWritingDraft } from '../../lib/writingText';
import type {
  WritingCheckDto,
  WritingErrorPatternDto,
  WritingExerciseDto,
  WritingIssueDto,
} from '../../lib/types';

const baseIssue: WritingIssueDto = {
  id: 10,
  writingCheckId: 1,
  category: 'grammar',
  severity: 'error',
  originalFragment: 'go',
  suggestedFix: 'goes',
  explanation: 'Subject-verb agreement.',
  ruleHint: 'He/she/it takes -s',
  offsetStart: 3,
  offsetEnd: 5,
  status: 'pending',
};

const checkResult: WritingCheckDto = {
  id: 1,
  originalText: 'he go home',
  correctedText: null,
  language: 'en',
  issueCount: 1,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 72,
  summary: 'One grammar error.',
  rewriteMode: null,
  createdAt: 10,
  issues: [baseIssue],
};

const acceptedCheckResult: WritingCheckDto = {
  ...checkResult,
  acceptedCount: 1,
  correctedText: 'he goes home',
  issues: [{ ...baseIssue, status: 'accepted' }],
};

const rejectedCheckResult: WritingCheckDto = {
  ...checkResult,
  rejectedCount: 1,
  issues: [{ ...baseIssue, status: 'rejected' }],
};

const privacyCheckResult: WritingCheckDto = {
  ...checkResult,
  id: 0,
  issues: [{ ...baseIssue, id: 1, writingCheckId: 0 }],
};

const patternsResult: WritingErrorPatternDto[] = [
  {
    id: 5,
    category: 'grammar',
    language: 'en',
    occurrenceCount: 3,
    lastSeenAt: 100,
    sampleOriginal: 'he go',
    sampleFix: 'he goes',
  },
];

const exercisesResult: WritingExerciseDto[] = [
  {
    category: 'grammar',
    exerciseType: 'fill_the_gap',
    prompt: 'He ___ to school every day.',
    correctAnswer: 'goes',
    explanation: 'Third person singular takes -s.',
  },
];

function mockBase() {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'check_writing') return Promise.resolve(checkResult);
    if (cmd === 'get_settings') {
      return Promise.resolve({
        primaryLanguage: 'en',
        writingAutoCheck: false,
        offlineMode: false,
      });
    }
    return Promise.resolve(null);
  });
}

async function runCheck(user: ReturnType<typeof userEvent.setup>) {
  renderWithQueryClient(<WritingPage />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
    target: { value: 'he go home' },
  });
  await user.click(screen.getByRole('button', { name: 'Check writing' }));
  await screen.findByText('One grammar error.');
}

describe('WritingPage', () => {
  it('renders editor and disables check when empty', () => {
    invokeMock.mockResolvedValue({ primaryLanguage: 'en' });
    renderWithQueryClient(<WritingPage />);
    expect(screen.getByRole('heading', { name: 'Writing' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check writing' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Auto-check writing' })).toBeInTheDocument();
  });

  it('pre-fills text from a writing draft', () => {
    invokeMock.mockResolvedValue({ primaryLanguage: 'en' });
    saveWritingDraft('Draft from popup.');
    renderWithQueryClient(<WritingPage />);
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toHaveValue(
      'Draft from popup.'
    );
  });

  it('checks writing and shows underlines in the text, in place of the editor', async () => {
    const user = userEvent.setup();
    mockBase();
    await runCheck(user);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('check_writing', {
        input: { text: 'he go home', language: 'en' },
      });
    });

    expect(screen.getByText('72')).toBeInTheDocument();
    // One surface: the checked text replaces the editor, underlines inside it.
    const annotated = screen.getByLabelText('Original text with issues highlighted');
    expect(annotated).toHaveTextContent('he go home');
    expect(annotated.querySelector('.writing-mark')).toHaveTextContent('go');
    expect(screen.getByRole('button', { name: /Issue in/ })).toHaveTextContent('go');
    expect(screen.queryByRole('textbox', { name: 'Text to check' })).not.toBeInTheDocument();
    // No separate Original / Suggested panes any more.
    expect(screen.queryByLabelText('Writing diff')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Original' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Suggested' })).not.toBeInTheDocument();
    // The corrected text stays reachable from the bottom bar.
    expect(screen.getByRole('button', { name: 'Copy suggested text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use suggested text as input' })).toBeInTheDocument();
    // Issue card: category · rule, no "All issues (N)" label.
    expect(screen.queryByText(/All issues/)).not.toBeInTheDocument();
    expect(document.querySelector('.writing-issue-meta')).toHaveTextContent('Grammar');
    expect(document.querySelector('.writing-issue-meta')).toHaveTextContent('He/she/it takes -s');
  });

  it('marks the page header as a window drag region', () => {
    invokeMock.mockResolvedValue({ primaryLanguage: 'en' });
    renderWithQueryClient(<WritingPage />);
    expect(document.querySelector('header.page-header')).toHaveAttribute('data-tauri-drag-region');
  });

  it('returns to editing at the clicked position in the checked text', async () => {
    const user = userEvent.setup();
    mockBase();
    await runCheck(user);

    const annotated = screen.getByLabelText('Original text with issues highlighted');
    // "he go home": the trailing plain segment " home" starts at offset 5.
    const tail = Array.from(annotated.querySelectorAll('[data-offset]')).find(
      (el) => el.textContent === ' home'
    );
    expect(tail).toBeDefined();
    const textNode = tail?.firstChild;
    if (!textNode) throw new Error('missing text node');
    const range = document.createRange();
    range.setStart(textNode, 3);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    fireEvent.click(tail as Element);

    const input = screen.getByRole('textbox', { name: 'Text to check' });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('he go home');
    expect((input as HTMLTextAreaElement).selectionStart).toBe(8);
    expect(screen.queryByLabelText('Original text with issues highlighted')).not.toBeInTheDocument();
  });

  it('returns to editing on Enter or a printable key, keeping the caret', async () => {
    const user = userEvent.setup();
    mockBase();
    renderWithQueryClient(<WritingPage />);
    const input = screen.getByRole('textbox', { name: 'Text to check' });
    fireEvent.change(input, { target: { value: 'he go home' } });
    (input as HTMLTextAreaElement).setSelectionRange(2, 2);
    await user.click(screen.getByRole('button', { name: 'Check writing' }));
    await screen.findByText('One grammar error.');

    const annotated = screen.getByLabelText('Original text with issues highlighted');
    fireEvent.keyDown(annotated, { key: 'Enter' });
    const editor = screen.getByRole('textbox', { name: 'Text to check' });
    expect(editor).toHaveFocus();
    expect((editor as HTMLTextAreaElement).selectionStart).toBe(2);
    expect(editor).toHaveValue('he go home');

    // Check again, then a printable key also returns to the editor.
    await user.click(screen.getByRole('button', { name: 'Check writing' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Original text with issues highlighted')).toBeInTheDocument();
    });
    fireEvent.keyDown(screen.getByLabelText('Original text with issues highlighted'), { key: 'x' });
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toHaveFocus();
  });

  it('hides stale highlights when the editor text changes', async () => {
    const user = userEvent.setup();
    mockBase();
    await runCheck(user);
    expect(document.querySelector('.writing-mark')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText('Original text with issues highlighted'), { key: 'Enter' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
      target: { value: 'he go home now' },
    });

    expect(document.querySelector('.writing-mark')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Original text with issues highlighted')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy suggested text' })).not.toBeInTheDocument();
  });

  it('ignores a fix, persists the status and restores the fragment', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'check_writing') return Promise.resolve(checkResult);
      if (cmd === 'update_writing_issue_status') return Promise.resolve(rejectedCheckResult);
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    await runCheck(user);
    expect(screen.getByRole('button', { name: 'Use suggested text as input' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Issue in/ }));
    await user.click(screen.getByRole('button', { name: 'Ignore issue go' }));
    // Overlay applies instantly: the fragment is plain text again, nothing to correct.
    expect(screen.getByLabelText('Original text with issues highlighted')).toHaveTextContent('he go home');
    expect(document.querySelector('.writing-mark')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use suggested text as input' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('update_writing_issue_status', {
        issueId: 10,
        status: 'rejected',
      });
    });
    // Refreshed DTO replaces the displayed check; overlay entry is dropped.
    await waitFor(() => {
      expect(screen.getByLabelText('Original text with issues highlighted')).toHaveTextContent('he go home');
    });
    expect(screen.queryByRole('button', { name: /Issue in/ })).not.toBeInTheDocument();
  });

  it('applies a fix and persists the accepted status', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'check_writing') return Promise.resolve(checkResult);
      if (cmd === 'update_writing_issue_status') return Promise.resolve(acceptedCheckResult);
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    await runCheck(user);

    await user.click(screen.getByRole('button', { name: /Issue in/ }));
    await user.click(screen.getByRole('button', { name: 'Apply fix for go' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('update_writing_issue_status', {
        issueId: 10,
        status: 'accepted',
      });
    });
    expect(await screen.findByText('accepted')).toBeInTheDocument();
    // Accept all disappears once nothing is pending.
    expect(screen.queryByRole('button', { name: 'Accept all issues' })).not.toBeInTheDocument();
    // The applied fix replaces the fragment in the checked text…
    expect(screen.getByRole('button', { name: /Issue in/ })).toHaveTextContent('goes');
    expect(screen.getByLabelText('Original text with issues highlighted')).toHaveTextContent('he goes home');
    // …and "Use as input" moves the corrected text into the editor.
    await user.click(screen.getByRole('button', { name: 'Use suggested text as input' }));
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toHaveValue('he goes home');
  });

  it('shows the rewritten text in the side panel', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'rewrite_text') {
        return Promise.resolve({
          ...checkResult,
          id: 2,
          correctedText: 'He goes home.',
          rewriteMode: 'clearer',
          summary: 'Rewritten for clarity.',
          issues: [],
          issueCount: 0,
          createdAt: 20,
        });
      }
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<WritingPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
      target: { value: 'he go home' },
    });
    await user.click(screen.getByRole('button', { name: 'Rewrite text' }));

    expect(await screen.findByText('Rewritten for clarity.')).toBeInTheDocument();
    expect(screen.getByLabelText('Suggested text')).toHaveTextContent('He goes home.');
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toHaveValue('he go home');
    await user.click(screen.getByRole('button', { name: 'Use suggested text as input' }));
    expect(screen.getByRole('textbox', { name: 'Text to check' })).toHaveValue('He goes home.');
  });

  it('accepts all issues via accept_all_issues and refreshes the check', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'check_writing') return Promise.resolve(checkResult);
      if (cmd === 'accept_all_issues') return Promise.resolve(acceptedCheckResult);
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    await runCheck(user);

    await user.click(screen.getByRole('button', { name: 'Accept all issues' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('accept_all_issues', { checkId: 1 });
    });
    await user.click(screen.getByRole('button', { name: /Issue in/ }));
    expect(await screen.findByText('accepted')).toBeInTheDocument();
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept all issues' })).not.toBeInTheDocument();
  });

  it('shows a privacy banner and skips persistence IPC for ephemeral checks', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'check_writing') return Promise.resolve(privacyCheckResult);
      if (cmd === 'get_settings') {
        return Promise.resolve({
          primaryLanguage: 'en',
          writingPrivacyMode: true,
          writingAutoCheck: false,
        });
      }
      return Promise.resolve(null);
    });
    await runCheck(user);

    expect(screen.getByText('Privacy mode: checked text is not stored')).toBeInTheDocument();
    // Accept all is never offered for ephemeral checks (id === 0).
    expect(screen.queryByRole('button', { name: 'Accept all issues' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Issue in/ }));
    await user.click(screen.getByRole('button', { name: 'Ignore issue go' }));
    // Overlay still works locally without any IPC.
    expect(screen.getByLabelText('Original text with issues highlighted')).toHaveTextContent('he go home');
    expect(document.querySelector('.writing-mark')).not.toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalledWith(
      'update_writing_issue_status',
      expect.anything()
    );
    expect(invokeMock).not.toHaveBeenCalledWith('accept_all_issues', expect.anything());
  });

  it('renders error patterns and generates exercises with a revealable answer', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_writing_error_patterns') return Promise.resolve(patternsResult);
      if (cmd === 'generate_writing_exercises') return Promise.resolve(exercisesResult);
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<WritingPage />);

    expect(
      await screen.findByRole('heading', { name: 'Your error patterns' })
    ).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    // Share of all recorded mistakes, mono percent.
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Grammar').closest('li')).toHaveAttribute('title', 'he go → he goes');
    expect(
      screen.getByRole('button', { name: 'Generate exercises from error patterns' })
    ).toHaveTextContent('Exercises');

    await user.click(screen.getByRole('button', { name: 'Generate exercises from error patterns' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('generate_writing_exercises', { language: 'en' });
    });

    expect(await screen.findByText('He ___ to school every day.')).toBeInTheDocument();

    const summary = screen.getByText('Show answer');
    await user.click(summary);
    expect(summary.closest('details')).toHaveAttribute('open');
    expect(screen.getByText('goes')).toBeInTheDocument();
    expect(screen.getByText('Third person singular takes -s.')).toBeInTheDocument();
  });

  it('hides the patterns section when there are no patterns', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_writing_error_patterns') return Promise.resolve([]);
      if (cmd === 'get_settings') {
        return Promise.resolve({ primaryLanguage: 'en', writingAutoCheck: false });
      }
      return Promise.resolve(null);
    });
    renderWithQueryClient(<WritingPage />);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('get_writing_error_patterns', { language: 'en' });
    });
    expect(
      screen.queryByRole('heading', { name: 'Your error patterns' })
    ).not.toBeInTheDocument();
  });

  describe('auto-check', () => {
    const autoText = 'bless god';
    const autoCheckResult: WritingCheckDto = {
      ...checkResult,
      originalText: autoText,
      issues: [
        {
          ...baseIssue,
          originalFragment: 'god',
          suggestedFix: 'God',
          offsetStart: 6,
          offsetEnd: 9,
        },
      ],
    };

    it('runs check_writing after the debounce when auto-check is enabled', async () => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'check_writing') return Promise.resolve(autoCheckResult);
        if (cmd === 'get_settings') {
          return Promise.resolve({
            primaryLanguage: 'en',
            writingAutoCheck: true,
            offlineMode: false,
          });
        }
        if (cmd === 'get_writing_error_patterns') return Promise.resolve([]);
        return Promise.resolve(null);
      });

      renderWithQueryClient(<WritingPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Auto-check writing' })).toHaveAttribute(
          'aria-checked',
          'true'
        );
      });

      vi.useFakeTimers();
      try {
        fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
          target: { value: autoText },
        });

        expect(invokeMock).not.toHaveBeenCalledWith('check_writing', expect.anything());

        await act(async () => {
          await vi.advanceTimersByTimeAsync(AUTO_CHECK_DEBOUNCE_MS);
        });
      } finally {
        vi.useRealTimers();
      }

      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith('check_writing', {
          input: { text: autoText, language: 'en' },
        });
      });

      expect(await screen.findByText('One grammar error.')).toBeInTheDocument();
      expect(document.querySelector('.writing-mark')).toHaveTextContent('god');
    });

    it('does not auto-check when the setting is off', async () => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'check_writing') return Promise.resolve(autoCheckResult);
        if (cmd === 'get_settings') {
          return Promise.resolve({
            primaryLanguage: 'en',
            writingAutoCheck: false,
            offlineMode: false,
          });
        }
        if (cmd === 'get_writing_error_patterns') return Promise.resolve([]);
        return Promise.resolve(null);
      });

      renderWithQueryClient(<WritingPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Auto-check writing' })).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });

      vi.useFakeTimers();
      try {
        fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
          target: { value: autoText },
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(AUTO_CHECK_DEBOUNCE_MS + 500);
        });
      } finally {
        vi.useRealTimers();
      }

      expect(invokeMock).not.toHaveBeenCalledWith('check_writing', expect.anything());
    });

    it('warns when auto-check is on and the text exceeds the character limit', async () => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'get_settings') {
          return Promise.resolve({
            primaryLanguage: 'en',
            writingAutoCheck: true,
            offlineMode: false,
          });
        }
        if (cmd === 'get_writing_error_patterns') return Promise.resolve([]);
        return Promise.resolve(null);
      });

      renderWithQueryClient(<WritingPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Auto-check writing' })).toHaveAttribute(
          'aria-checked',
          'true'
        );
      });

      const input = screen.getByRole('textbox', { name: 'Text to check' });
      fireEvent.change(input, { target: { value: 'a'.repeat(MAX_WRITING_CHARS) } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'a'.repeat(MAX_WRITING_CHARS + 1) } });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(`You exceeded ${MAX_WRITING_CHARS} characters.`);
      expect(alert).toHaveTextContent('Auto-check will not run.');
      expect(alert).toHaveTextContent('Shorten the text, then press Check writing.');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'a'.repeat(MAX_WRITING_CHARS + 2) } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'short' } });
      fireEvent.change(input, { target: { value: 'a'.repeat(MAX_WRITING_CHARS + 1) } });
      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });

    it('does not warn about the character limit when auto-check is off', async () => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'get_settings') {
          return Promise.resolve({
            primaryLanguage: 'en',
            writingAutoCheck: false,
            offlineMode: false,
          });
        }
        if (cmd === 'get_writing_error_patterns') return Promise.resolve([]);
        return Promise.resolve(null);
      });

      renderWithQueryClient(<WritingPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Auto-check writing' })).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });

      fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
        target: { value: 'a'.repeat(MAX_WRITING_CHARS + 1) },
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
