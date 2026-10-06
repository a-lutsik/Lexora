import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEXT_COMPOSE_DEBOUNCE_MS } from '../lib/inlineAssistant';
import { InlineAssistantWidget } from './InlineAssistantWidget';
import { invokeMock } from '../test/mocks';
import { renderWithQueryClient } from '../test/render';
import type { TranslationResult, WritingCheckDto } from '../lib/types';

const SOURCE =
  'During the daylight saving time transition the event occurs twice with different UTC offsets.';

const translationResult: TranslationResult = {
  text: SOURCE,
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  mainTranslation: 'Техническая заметка про переход на летнее время.',
  alternatives: [],
  sourceSynonyms: [],
  partOfSpeech: null,
  phonetic: null,
  usageNote: null,
  exampleSentence: null,
  exampleSentence2: null,
  frequencyHint: null,
  fromCache: false,
  isOfflineFallback: false,
  lexemeId: 1,
  imagePath: null,
};

const rewriteResult: WritingCheckDto = {
  id: 2,
  originalText: SOURCE,
  correctedText: 'The DST transition produces two events with different UTC offsets.',
  language: 'en',
  issueCount: 0,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 100,
  summary: 'Made clearer.',
  rewriteMode: 'clearer',
  createdAt: 1,
  issues: [],
};

const FIX_SOURCE = 'She go to school yesterday and buyed a apple.';

function issue(
  id: number,
  originalFragment: string,
  suggestedFix: string,
  explanation: string,
  category = 'grammar',
): WritingCheckDto['issues'][number] {
  const offsetStart = FIX_SOURCE.indexOf(originalFragment);
  return {
    id,
    writingCheckId: 9,
    category,
    severity: 'major',
    originalFragment,
    suggestedFix,
    explanation,
    ruleHint: null,
    offsetStart,
    offsetEnd: offsetStart + originalFragment.length,
    status: 'pending',
  };
}

const fixCheck: WritingCheckDto = {
  id: 9,
  originalText: FIX_SOURCE,
  correctedText: 'She went to school yesterday and bought an apple.',
  language: 'en',
  issueCount: 3,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 62,
  summary: null,
  rewriteMode: null,
  createdAt: 1,
  issues: [
    issue(1, 'go', 'went', 'Past time («yesterday») needs the past tense.'),
    issue(2, 'buyed', 'bought', '«Buy» is irregular: buy – bought – bought.', 'spelling'),
    issue(3, 'a apple', 'an apple', 'Use «an» before a vowel sound.'),
  ],
};

describe('InlineAssistantWidget', () => {
  const onSwitchToDictionary = vi.fn();

  beforeEach(() => {
    onSwitchToDictionary.mockReset();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') return Promise.resolve(translationResult);
      if (cmd === 'rewrite_text') return Promise.resolve(rewriteResult);
      return Promise.resolve(null);
    });
  });

  it('renders mode tabs, a Text tab, and a close control', async () => {
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );

    expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Translate (1)',
      'Fix (8)',
      'Text (2)',
      'Improve (3)',
      'Rephrase (4)',
      'Shorten (5)',
      'Friendly (6)',
      'Formal (7)',
    ]);
    expect(screen.getByRole('button', { name: 'Close window' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter your own...')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Translate to Russian \(RU\)/i })).toBeInTheDocument();
    expect(await screen.findByText(translationResult.mainTranslation)).toBeInTheDocument();
  });

  it('calls translate_text for the default Translate mode', async () => {
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('translate_text', {
        input: {
          text: SOURCE,
          sourceLanguage: null,
          targetLanguage: 'ru',
          contextSentence: null,
          lexicalDomain: 'auto',
        },
      });
    });
  });

  it('shows a friendly rate-limit message and cools down after 429', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_text') {
        return Promise.reject(new Error('OpenAI: Too many requests (429). Wait…'));
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many requests/i);

    // Cooldown fuse: further attempts should not call IPC again immediately
    invokeMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Wait \d+s/i);
    });
    expect(invokeMock).not.toHaveBeenCalledWith('translate_text', expect.anything());
  });

  it('switches to Improve and calls rewrite_text with clearer', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('tab', { name: 'Improve (3)' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('rewrite_text', {
        input: {
          text: SOURCE,
          language: 'en',
          mode: 'clearer',
        },
      });
    });
    expect(await screen.findByText(rewriteResult.correctedText as string)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Improvement Suggestions' })).toBeInTheDocument();
  });

  it('translates composed Text-tab input into English with a register', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('tab', { name: 'Text (2)' }));

    const composer = screen.getByRole('textbox', { name: 'Text to translate' });
    expect(composer).toHaveValue(SOURCE);
    expect(screen.getByRole('radio', { name: 'General' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('heading', { name: /Translate to English \(EN\) · General/i })).toBeInTheDocument();

    await user.clear(composer);
    await user.type(composer, 'Прошу согласовать встречу');
    await user.click(screen.getByRole('radio', { name: 'Official' }));

    await waitFor(
      () => {
        expect(invokeMock).toHaveBeenCalledWith('rewrite_text', {
          input: {
            text: 'Прошу согласовать встречу',
            mode: 'custom',
            customPrompt: expect.stringContaining('official register'),
          },
        });
      },
      { timeout: TEXT_COMPOSE_DEBOUNCE_MS + 1500 }
    );
    expect(screen.getByRole('heading', { name: /Translate to English \(EN\) · Official/i })).toBeInTheDocument();
  });

  it('clears the Text-tab compose field and translation output', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('tab', { name: 'Text (2)' }));
    const composer = screen.getByRole('textbox', { name: 'Text to translate' });
    expect(composer).toHaveValue(SOURCE);
    expect(screen.getByRole('button', { name: 'Clear text' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear text' }));

    expect(composer).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear text' })).not.toBeInTheDocument();
    expect(screen.getByText('Type a message to get an English translation.')).toBeInTheDocument();
  });

  it('calls accept_and_replace when Accept is pressed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', {
        text: translationResult.mainTranslation,
      });
    });
    expect(screen.getByRole('button', { name: 'Applied' })).toBeInTheDocument();
  });

  describe('hostile model output', () => {
    function mockTranslation(mainTranslation: string) {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'translate_text') return Promise.resolve({ ...translationResult, mainTranslation });
        return Promise.resolve(null);
      });
    }

    it('strips invisible characters before display and paste', async () => {
      const user = userEvent.setup();
      mockTranslation('Безопасный\u200B текст\u202E');
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await screen.findByText('Безопасный текст');

      await user.click(screen.getByRole('button', { name: 'Accept' }));

      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', { text: 'Безопасный текст' });
      });
    });

    it('does not paste on Enter when the result adds a link, and warns', async () => {
      mockTranslation('Оплатите счёт: https://pay.example.invalid/x');
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await screen.findByText(/pay\.example\.invalid/);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Enter', metaKey: true });

      expect(screen.getByRole('alert')).toHaveTextContent(/link/i);
      expect(invokeMock).not.toHaveBeenCalledWith('accept_and_replace', expect.anything());
    });

    it('still pastes a risky result after an explicit Accept click', async () => {
      const user = userEvent.setup();
      mockTranslation('Строка один\nrm -rf ~');
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await screen.findByRole('alert');

      await user.click(screen.getByRole('button', { name: 'Accept' }));

      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', { text: 'Строка один\nrm -rf ~' });
      });
    });

    it('keeps Enter as a shortcut for a safe result', async () => {
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await screen.findByText(translationResult.mainTranslation);

      fireEvent.keyDown(window, { key: 'Enter' });

      await waitFor(() => {
        expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', {
          text: translationResult.mainTranslation,
        });
      });
    });
  });

  it('copies the result and shows Copied status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('switches modes with digit shortcuts', async () => {
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    fireEvent.keyDown(window, { key: '2' });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Text (2)' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });

  it('closes the popup on Escape', async () => {
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(invokeMock).toHaveBeenCalledWith('close_popup_window');
  });

  it('opens the dictionary card from the more menu', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InlineAssistantWidget
        sourceText={SOURCE}
        onSwitchToDictionary={onSwitchToDictionary}
      />
    );
    await screen.findByText(translationResult.mainTranslation);

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Dictionary card' }));
    expect(onSwitchToDictionary).toHaveBeenCalled();
  });

  describe('Fix mode (Grammarly-style)', () => {
    beforeEach(() => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'translate_text') return Promise.resolve(translationResult);
        if (cmd === 'check_writing') return Promise.resolve(fixCheck);
        return Promise.resolve(null);
      });
    });

    it('highlights mistakes with the fix and the reason for each', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={FIX_SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await user.click(screen.getByRole('tab', { name: 'Fix (8)' }));

      expect(await screen.findByRole('heading', { name: 'Grammar & Spelling' })).toBeInTheDocument();
      expect(invokeMock).toHaveBeenCalledWith('check_writing', { input: { text: FIX_SOURCE } });
      const list = await screen.findByRole('list', { name: 'Suggestions' });
      expect(list.querySelectorAll('li')).toHaveLength(3);
      expect(screen.getByText('Past time («yesterday») needs the past tense.')).toBeInTheDocument();
      expect(document.querySelectorAll('mark.inline-fix-mark')).toHaveLength(3);
      expect(screen.getByRole('button', { name: 'Accept 3 fixes' })).toBeEnabled();
    });

    it('replaces the selection with every fix that was not dismissed', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={FIX_SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      fireEvent.keyDown(window, { key: '8' });
      await screen.findByRole('list', { name: 'Suggestions' });

      await user.click(screen.getByRole('button', { name: 'Dismiss fix: a apple → an apple' }));
      expect(invokeMock).toHaveBeenCalledWith('update_writing_issue_status', {
        issueId: 3,
        status: 'rejected',
      });
      expect(document.querySelectorAll('mark.inline-fix-mark')).toHaveLength(2);

      await user.click(screen.getByRole('button', { name: 'Accept 2 fixes' }));
      expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', {
        text: 'She went to school yesterday and bought a apple.',
      });
      expect(invokeMock).toHaveBeenCalledWith('accept_all_issues', { checkId: 9 });
      expect(await screen.findByRole('button', { name: 'Applied' })).toBeInTheDocument();
    });

    it('restores a dismissed fix', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={FIX_SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await user.click(screen.getByRole('tab', { name: 'Fix (8)' }));
      await screen.findByRole('list', { name: 'Suggestions' });

      await user.click(screen.getByRole('button', { name: 'Dismiss fix: go → went' }));
      await user.click(screen.getByRole('button', { name: 'Restore fix: go → went' }));
      expect(screen.getByRole('button', { name: 'Accept 3 fixes' })).toBeEnabled();
    });

    it('says when there is nothing to fix', async () => {
      invokeMock.mockImplementation((cmd: string) => {
        if (cmd === 'translate_text') return Promise.resolve(translationResult);
        if (cmd === 'check_writing') {
          return Promise.resolve({ ...fixCheck, issues: [], issueCount: 0, overallScore: 100 });
        }
        return Promise.resolve(null);
      });
      const user = userEvent.setup();
      renderWithQueryClient(
        <InlineAssistantWidget sourceText={FIX_SOURCE} onSwitchToDictionary={onSwitchToDictionary} />,
      );
      await user.click(screen.getByRole('tab', { name: 'Fix (8)' }));
      expect(await screen.findByText(/No mistakes found/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    });
  });
});
