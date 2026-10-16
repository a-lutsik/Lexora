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
    expect(screen.getByRole('heading', { name: 'Writing Assistant' })).toBeInTheDocument();
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

  it('checks writing and renders a highlighted diff', async () => {
    const user = userEvent.setup();
    mockBase();
    await runCheck(user);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('check_writing', {
        input: { text: 'he go home', language: 'en' },
      });
    });

    expect(screen.getByText('72')).toBeInTheDocument();
    expect(document.querySelector('.writing-mark')).toHaveTextContent('go');
    expect(screen.getByLabelText('Writing diff')).toBeInTheDocument();
    expect(screen.getByLabelText('Suggested text')).toHaveTextContent('he goes home');
    expect(screen.getByRole('button', { name: /Issue in/ })).toHaveTextContent('go');
    expect(screen.getByText(/Click a highlighted word for a fix/)).toBeInTheDocument();
  });

  it('hides stale highlights when the editor text changes', async () => {
    const user = userEvent.setup();
    mockBase();
    await runCheck(user);
    expect(document.querySelector('.writing-mark')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Text to check' }), {
      target: { value: 'he go home now' },
    });

    expect(document.querySelector('.writing-mark')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Writing diff')).not.toBeInTheDocument();
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
    expect(screen.getByLabelText('Suggested text')).toHaveTextContent('he goes home');

    await user.click(screen.getByRole('button', { name: /Issue in/ }));
    await user.click(screen.getByRole('button', { name: 'Ignore issue go' }));
    // Overlay applies instantly.
    expect(screen.getByLabelText('Suggested text')).toHaveTextContent('he go home');

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('update_writing_issue_status', {
        issueId: 10,
        status: 'rejected',
      });
    });
    // Refreshed DTO replaces the displayed check; overlay entry is dropped.
    await waitFor(() => {
      expect(screen.getByLabelText('Suggested text')).toHaveTextContent('he go home');
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
    expect(screen.getByLabelText('Suggested text')).toHaveTextContent('he go home');
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
      await screen.findByRole('heading', { name: 'Your Error Patterns' })
    ).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
    expect(screen.getByText('he go')).toBeInTheDocument();
    expect(screen.getByText('he goes')).toBeInTheDocument();

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
      screen.queryByRole('heading', { name: 'Your Error Patterns' })
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
