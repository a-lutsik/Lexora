import { writingLabel } from '../../lib/interfaceText';
import { useI18n } from "../../hooks/useI18n";
import { t as tUi } from "../../i18n";
// ============================================================
// LEXORA — Writing Assistant Page
// Paste text, check it (underlines appear in the text itself),
// review issue cards on the right, rewrite in another tone.
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Select } from '../../components/ui/Select';
import {
  useAcceptAllIssues,
  useCheckWriting,
  useGenerateExercises,
  useRewriteText,
  useUpdateIssueStatus,
  useWritingErrorPatterns,
} from '../../hooks/useWriting';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import {
  applyVisibleFixes,
  originalSegments,
  overlayIssueStatuses,
} from '../../lib/writingDiff';
import {
  AUTO_CHECK_DEBOUNCE_MS,
  consumeWritingDraft,
  countWritingChars,
  MAX_WRITING_CHARS,
  OPEN_WRITING_EVENT,
  shouldAutoCheckWriting,
} from '../../lib/writingText';
import { copyToClipboard, formatIpcError } from '../../lib/utils';
import type {
  RewriteMode,
  WritingCheckDto,
  WritingExerciseDto,
  WritingIssueStatus,
} from '../../lib/types';
import { listen } from '@tauri-apps/api/event';
import { WritingAnnotatedText } from './WritingAnnotatedText';
import { WritingIssuePanel } from './WritingIssuePanel';
import { WritingPatternBar } from './WritingPatternBar';
import { WritingScoreRing } from './WritingScoreRing';
import './writing.css';

const REWRITE_OPTIONS: { value: RewriteMode; label: string }[] = [
  { value: 'clearer', label: 'Clearer' },
  { value: 'shorter', label: 'Shorter' },
  { value: 'formal', label: 'More formal' },
  { value: 'friendly', label: 'Friendlier' },
  { value: 'professional', label: 'Professional' },
  { value: 'simpler', label: 'Simpler' },
];

function isRewriteMode(value: string): value is RewriteMode {
  return REWRITE_OPTIONS.some((opt) => opt.value === value);
}

/** id of the expanded issue row; the underline in the text points at it. */
function issueBodyId(issueId: number): string {
  return `writing-issue-${issueId}`;
}

function mutationErrorMessage(error: unknown): string {
  return formatIpcError(
    error,
    tUi("Could not check writing. Open Settings, choose a provider, and add an API key."),
  );
}

function textMatchesChecked(editorText: string, originalText: string): boolean {
  return editorText.trim() === originalText.trim();
}

type CaretRange = { start: number; end: number };

function clampCaret(value: number, length: number): number {
  return Math.max(0, Math.min(length, value));
}

export default function WritingPage() {
  const { t: tUi, locale } = useI18n();
  const [text, setText] = useState('');
  /** false = the checked text with underlines replaces the textarea. */
  const [editing, setEditing] = useState(true);
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>('clearer');
  const [statusOverlay, setStatusOverlay] = useState<Record<number, WritingIssueStatus>>({});
  const [latestCheck, setLatestCheck] = useState<WritingCheckDto | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [openIssueId, setOpenIssueId] = useState<number | null>(null);
  const [autoCheckScheduled, setAutoCheckScheduled] = useState(false);
  const [limitNoticeOpen, setLimitNoticeOpen] = useState(false);

  const autoCheckTimerRef = useRef<number | null>(null);
  const checkGenerationRef = useRef(0);
  const autoCheckBlockedByLimitRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const annotatedRef = useRef<HTMLDivElement | null>(null);
  /** Caret of the editor when it gave way to the checked text. */
  const lastCaretRef = useRef<CaretRange | null>(null);
  /** The editor had focus when the check landed: hand focus to the checked text. */
  const focusAnnotatedRef = useRef(false);

  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const {
    mutate: checkWriting,
    isPending: checkPending,
    isError: checkError,
    error: checkErrorValue,
  } = useCheckWriting();
  const {
    mutate: rewriteText,
    reset: resetRewrite,
    data: latestRewrite,
    isPending: rewritePending,
    isError: rewriteError,
    error: rewriteErrorValue,
  } = useRewriteText();
  const updateStatusMutation = useUpdateIssueStatus();
  const acceptAllMutation = useAcceptAllIssues();
  const generateExercisesMutation = useGenerateExercises();

  const language = settings?.primaryLanguage ?? 'en';
  const privacyMode = settings?.writingPrivacyMode ?? false;
  const autoCheckEnabled = settings?.writingAutoCheck ?? false;
  const offlineMode = settings?.offlineMode ?? false;
  const charCount = countWritingChars(text);
  const overLimit = charCount > MAX_WRITING_CHARS;
  const canSubmit = text.trim().length > 0 && !overLimit;
  const autoCheckBlockedByLimit = autoCheckEnabled && overLimit;

  const { data: errorPatterns } = useWritingErrorPatterns(language);

  const clearAutoCheckTimer = useCallback(() => {
    if (autoCheckTimerRef.current !== null) {
      window.clearTimeout(autoCheckTimerRef.current);
      autoCheckTimerRef.current = null;
    }
    setAutoCheckScheduled(false);
  }, []);

  const runCheck = useCallback(
    (sourceText: string) => {
      clearAutoCheckTimer();
      const trimmed = sourceText.trim();
      if (!trimmed || countWritingChars(trimmed) > MAX_WRITING_CHARS) return;

      const generation = ++checkGenerationRef.current;
      setStatusOverlay({});
      setCopied(false);
      setOpenIssueId(null);
      resetRewrite();
      checkWriting(
        { text: trimmed, language },
        {
          onSuccess: (data) => {
            if (generation !== checkGenerationRef.current) return;
            setLatestCheck(data);
            const editor = textareaRef.current;
            // Typed on while the check ran: the result is stale, keep editing.
            if (editor && !textMatchesChecked(editor.value, data.originalText)) return;
            if (editor && !editor.hidden) {
              lastCaretRef.current = { start: editor.selectionStart, end: editor.selectionEnd };
              focusAnnotatedRef.current = document.activeElement === editor;
            }
            setEditing(false);
          },
        }
      );
    },
    [clearAutoCheckTimer, checkWriting, language, resetRewrite]
  );

  useEffect(() => {
    const draft = consumeWritingDraft();
    if (draft) setText(draft);

    const unlistenPromise = listen<string>(OPEN_WRITING_EVENT, (event) => {
      if (typeof event.payload === 'string' && event.payload.trim()) {
        setText(event.payload.trim());
      } else {
        const next = consumeWritingDraft();
        if (next) setText(next);
      }
    });

    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (autoCheckBlockedByLimit && !autoCheckBlockedByLimitRef.current) {
      setLimitNoticeOpen(true);
    } else if (!autoCheckBlockedByLimit) {
      setLimitNoticeOpen(false);
    }
    autoCheckBlockedByLimitRef.current = autoCheckBlockedByLimit;
  }, [autoCheckBlockedByLimit]);

  const lastCheckedText = latestCheck?.originalText ?? null;

  useEffect(() => {
    clearAutoCheckTimer();

    if (!autoCheckEnabled || offlineMode) return;
    if (checkPending) return;
    if (!shouldAutoCheckWriting(text, lastCheckedText)) return;

    setAutoCheckScheduled(true);
    autoCheckTimerRef.current = window.setTimeout(() => {
      autoCheckTimerRef.current = null;
      setAutoCheckScheduled(false);
      runCheck(text);
    }, AUTO_CHECK_DEBOUNCE_MS);

    return () => {
      clearAutoCheckTimer();
    };
  }, [
    text,
    autoCheckEnabled,
    offlineMode,
    lastCheckedText,
    checkPending,
    runCheck,
    clearAutoCheckTimer,
  ]);

  const checkMatchesText =
    latestCheck !== undefined && textMatchesChecked(text, latestCheck.originalText);
  const rewriteMatchesText =
    latestRewrite !== undefined && textMatchesChecked(text, latestRewrite.originalText);
  const visibleCheck = checkMatchesText ? latestCheck : undefined;

  const showRewrite = Boolean(
    rewriteMatchesText &&
      latestRewrite &&
      (!visibleCheck || latestRewrite.createdAt >= visibleCheck.createdAt)
  );

  const issues = useMemo(() => {
    if (!visibleCheck) return [];
    return overlayIssueStatuses(visibleCheck.issues, statusOverlay);
  }, [visibleCheck, statusOverlay]);

  const originalText = showRewrite
    ? (latestRewrite?.originalText ?? text)
    : (visibleCheck?.originalText ?? text);
  const suggestedFromIssues = visibleCheck
    ? applyVisibleFixes(visibleCheck.originalText, issues)
    : text;
  const suggestedText = showRewrite
    ? (latestRewrite?.correctedText ?? suggestedFromIssues)
    : suggestedFromIssues;

  const segments = visibleCheck ? originalSegments(originalText, issues) : [];
  const pendingCount = issues.filter((issue) => issue.status === 'pending').length;
  const showAnnotated = Boolean(visibleCheck) && !showRewrite && !editing;
  const hasCorrection = (showRewrite || Boolean(visibleCheck)) && suggestedText !== originalText;
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useLayoutEffect(() => {
    if (!showAnnotated || !focusAnnotatedRef.current) return;
    focusAnnotatedRef.current = false;
    annotatedRef.current?.focus();
  }, [showAnnotated]);

  /** Back to the textarea; `caret` is an offset in the checked text or null (keep the old caret). */
  const enterEditing = (caret: number | null) => {
    // Synchronous so the textarea is visible and focused before the browser
    // handles the key that triggered this (it is then typed into the editor).
    flushSync(() => setEditing(true));
    const editor = textareaRef.current;
    if (!editor) return;
    const length = editor.value.length;
    const leading = length - editor.value.trimStart().length;
    const range: CaretRange =
      caret === null
        ? (lastCaretRef.current ?? { start: length, end: length })
        : { start: leading + caret, end: leading + caret };
    editor.focus();
    editor.setSelectionRange(clampCaret(range.start, length), clampCaret(range.end, length));
  };

  /** Opening a card from the panel shows its underline in the text. */
  const showAnnotations = () => {
    if (!visibleCheck || showRewrite || !editing) return;
    const editor = textareaRef.current;
    if (editor) lastCaretRef.current = { start: editor.selectionStart, end: editor.selectionEnd };
    setEditing(false);
  };

  const autoStatusLabel = checkPending
    ? tUi("Checking…")
    : autoCheckScheduled
      ? tUi("Waiting to check")
      : null;

  const toggleIssue = (issueId: number) => {
    setOpenIssueId((current) => (current === issueId ? null : issueId));
  };

  const rewriteModeLabel = (mode: string) => {
    const option = REWRITE_OPTIONS.find((opt) => opt.value === mode);
    return option ? tUi(option.label) : mode;
  };

  const maxPatternCount = Math.max(1, ...(errorPatterns ?? []).map((p) => p.occurrenceCount));
  const totalPatternCount = Math.max(
    1,
    (errorPatterns ?? []).reduce((sum, pattern) => sum + pattern.occurrenceCount, 0),
  );

  // Escape collapses the open issue; the opened row is scrolled into view.
  useEffect(() => {
    if (openIssueId === null) return undefined;
    document.getElementById(issueBodyId(openIssueId))?.scrollIntoView?.({ block: 'nearest' });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpenIssueId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIssueId]);

  const handleCheck = () => {
    if (!canSubmit) return;
    runCheck(text);
  };

  const handleRewrite = () => {
    if (!canSubmit) return;
    clearAutoCheckTimer();
    setCopied(false);
    setOpenIssueId(null);
    rewriteText({ text, language, mode: rewriteMode });
  };

  const handleToggleAutoCheck = () => {
    if (!settings) return;
    updateSettings.mutate({
      ...settings,
      writingAutoCheck: !autoCheckEnabled,
    });
  };

  const setIssueStatus = (id: number, status: WritingIssueStatus) => {
    // Instant local overlay for snappy UX.
    setStatusOverlay((prev) => ({ ...prev, [id]: status }));
    // Ephemeral (privacy-mode) checks have id === 0 and must not be persisted.
    if (!visibleCheck || visibleCheck.id === 0) return;
    updateStatusMutation.mutate(
      { issueId: id, status },
      {
        onSuccess: (updated) => {
          setLatestCheck(updated);
          setStatusOverlay((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        },
      }
    );
  };

  const handleAcceptAll = () => {
    if (!visibleCheck || pendingCount === 0) return;
    if (visibleCheck.id === 0) {
      const nextOverlay: Record<number, WritingIssueStatus> = {};
      for (const issue of issues) {
        if (issue.status === 'pending') {
          nextOverlay[issue.id] = 'accepted';
        }
      }
      setStatusOverlay((prev) => ({ ...prev, ...nextOverlay }));
      return;
    }
    acceptAllMutation.mutate(visibleCheck.id, {
      onSuccess: (updated) => {
        setLatestCheck(updated);
        setStatusOverlay({});
      },
    });
  };

  const handleGenerateExercises = () => {
    generateExercisesMutation.mutate(language);
  };

  const handleCopySuggested = () => {
    void copyToClipboard(suggestedText).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleUseSuggested = () => {
    setText(suggestedText);
    setCopied(false);
    setEditing(true);
    lastCaretRef.current = null;
  };

  const showSide = Boolean(
    (visibleCheck && !showRewrite) ||
      (showRewrite && latestRewrite) ||
      (errorPatterns && errorPatterns.length > 0)
  );

  return (
    <div className="page writing-page animate-fade-in">
      <header className="page-header" data-tauri-drag-region>
        <div className="page-header__text">
          <h1 className="page-title">{tUi("Writing")}</h1>
          <p className="page-subtitle">{tUi("Check grammar, spelling, and style — or rewrite the text in a different tone")}</p>
        </div>
        <div className="page-actions writing-header-actions">
          {privacyMode && (
            <span className="tag writing-privacy" role="status">
              <Icon name="lock" size={14} />
              {tUi("Privacy mode: checked text is not stored")}
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={autoCheckEnabled}
            aria-label={tUi("Auto-check writing")}
            className={`writing-auto-toggle${autoCheckEnabled ? ' is-on' : ''}`}
            onClick={handleToggleAutoCheck}
            disabled={!settings || updateSettings.isPending || offlineMode}
            title={
              offlineMode
                ? tUi("Auto-check requires online mode")
                : tUi("Automatically check after you pause typing")
            }
          >
            <span className="writing-auto-toggle-track" aria-hidden="true">
              <span className="writing-auto-toggle-thumb" />
            </span>
            <span className="writing-auto-toggle-label">{tUi("Auto-check")}</span>
          </button>
        </div>
      </header>

      {limitNoticeOpen && (
        <div className="writing-limit-toast animate-slide-up" role="alert">
          <Icon name="warning" size={18} className="writing-limit-toast-icon" />
          <p className="writing-limit-toast-text">
            {tUi(
              "You exceeded {limit} characters. Auto-check will not run. Shorten the text, then press Check writing.",
              { limit: MAX_WRITING_CHARS },
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLimitNoticeOpen(false)}
            aria-label={tUi("Close")}
          >{tUi("Close")}</Button>
        </div>
      )}

      <div className={`writing-layout${showSide ? ' has-side' : ''}`}>
        <section className="writing-main" aria-label={tUi("Text to check")}>
          <div className="writing-surface">
            <label className="sr-only" htmlFor="writing-input">{tUi("Text to check")}</label>
            <textarea dir="auto"
              ref={textareaRef}
              id="writing-input"
              className="writing-textarea"
              hidden={showAnnotated}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tUi("Paste or type a sentence, email, or paragraph…")}
              spellCheck={false}
              aria-describedby={
                autoStatusLabel ? 'writing-char-count writing-auto-status' : 'writing-char-count'
              }
            />
            {showAnnotated && (
              <WritingAnnotatedText
                ref={annotatedRef}
                segments={segments}
                openIssueId={openIssueId}
                issueBodyId={issueBodyId}
                onToggleIssue={toggleIssue}
                onEdit={enterEditing}
                describedBy="writing-char-count"
              />
            )}
          </div>

          {(checkError ||
            rewriteError ||
            updateStatusMutation.isError ||
            acceptAllMutation.isError ||
            generateExercisesMutation.isError) && (
            <div className="writing-error" role="alert">
              <Icon name="error" size={18} />
              <span>
                {mutationErrorMessage(
                  checkErrorValue ??
                    rewriteErrorValue ??
                    updateStatusMutation.error ??
                    acceptAllMutation.error ??
                    generateExercisesMutation.error
                )}
              </span>
            </div>
          )}

          <div className="writing-editor-bar">
            <span
              id="writing-char-count"
              className={`writing-char-count${overLimit ? ' writing-char-count--over' : ''}`}
            >
              {numberFormat.format(charCount)} / {numberFormat.format(MAX_WRITING_CHARS)}
            </span>
            {autoStatusLabel && (
              <span id="writing-auto-status" className="writing-auto-status" aria-live="polite">
                {autoStatusLabel}
              </span>
            )}
            <span className="spacer" />
            {hasCorrection && (
              <>
                <span className="writing-bar-tool" title={copied ? tUi("Copied") : tUi("Copy")}>
                  <IconButton
                    size="sm"
                    icon={<Icon name={copied ? 'check' : 'content_copy'} size={17} />}
                    onClick={handleCopySuggested}
                    aria-label={tUi("Copy suggested text")}
                  />
                </span>
                <span className="writing-bar-tool" title={tUi("Use as input")}>
                  <IconButton
                    size="sm"
                    icon={<Icon name="edit_note" size={17} />}
                    onClick={handleUseSuggested}
                    aria-label={tUi("Use suggested text as input")}
                  />
                </span>
                <span className="sr-only" aria-live="polite">{copied ? tUi("Copied") : ''}</span>
              </>
            )}
            <Select
              ariaLabel={tUi("Rewrite mode")}
              value={rewriteMode}
              options={REWRITE_OPTIONS.map((option) => ({ ...option, label: tUi(option.label) }))}
              onChange={(value) => {
                if (isRewriteMode(value)) setRewriteMode(value);
              }}
              className="writing-mode-select"
            />
            <Button
              variant="secondary"
              onClick={handleRewrite}
              disabled={!canSubmit}
              isLoading={rewritePending}
              aria-label={tUi("Rewrite text")}
            >
              <Icon name="auto_fix" size={17} />
              {tUi("Rewrite")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCheck}
              disabled={!canSubmit}
              isLoading={checkPending}
              aria-label={tUi("Check writing")}
            >
              <Icon name="spellcheck" size={17} />
              {tUi("Check writing")}
            </Button>
          </div>
        </section>

        {showSide && (
          <aside className="writing-side" aria-label={tUi("Writing check")}>
            {visibleCheck && !showRewrite && (
              <div className="writing-summary" aria-live="polite">
                <WritingScoreRing score={visibleCheck.overallScore} />
                <div className="writing-summary-copy">
                  <p className="writing-summary-title">
                    {visibleCheck.issueCount} {visibleCheck.issueCount === 1 ? tUi("issue") : tUi("issues")}
                  </p>
                  <p className="writing-summary-text">{visibleCheck.summary ?? tUi("Analysis complete.")}</p>
                </div>
                {pendingCount > 0 && visibleCheck.id !== 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAcceptAll}
                    isLoading={acceptAllMutation.isPending}
                    aria-label={tUi("Accept all issues")}
                  >{tUi("Accept all")}</Button>
                )}
              </div>
            )}

            {showRewrite && latestRewrite && (
              <div className="writing-summary writing-summary--rewrite" aria-live="polite">
                <span className="tag tag--accent">
                  <Icon name="auto_fix" size={14} />
                  {rewriteModeLabel(latestRewrite.rewriteMode ?? rewriteMode)}
                </span>
                <p className="writing-summary-text">
                  {latestRewrite.summary ?? tUi("Text rewritten.")}
                </p>
                <div
                  className="writing-rewrite-text"
                  role="group"
                  dir="auto"
                  aria-label={tUi("Suggested text")}
                >
                  {suggestedText}
                </div>
              </div>
            )}

            {visibleCheck && !showRewrite && issues.length > 0 && (
              <ul className="writing-issue-list">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className={`writing-issue writing-issue--${issue.status}${openIssueId === issue.id ? ' is-open' : ''}`}
                  >
                    <WritingIssuePanel
                      issue={issue}
                      language={language}
                      isOpen={openIssueId === issue.id}
                      bodyId={issueBodyId(issue.id)}
                      onToggle={() => {
                        showAnnotations();
                        toggleIssue(issue.id);
                      }}
                      onAccept={() => setIssueStatus(issue.id, 'accepted')}
                      onReject={() => setIssueStatus(issue.id, 'rejected')}
                    />
                  </li>
                ))}
              </ul>
            )}

            {errorPatterns && errorPatterns.length > 0 && (
              <section className="writing-patterns" aria-labelledby="writing-patterns-title">
                <div className="writing-patterns-header">
                  <h2 className="writing-patterns-title" id="writing-patterns-title">
                    {tUi("Your error patterns")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateExercises}
                    isLoading={generateExercisesMutation.isPending}
                    aria-label={tUi("Generate exercises from error patterns")}
                  >
                    <Icon name="fitness_center" size={17} />
                    {tUi("Exercises")}
                  </Button>
                </div>
                <ul className="writing-pattern-list">
                  {errorPatterns.map((pattern) => (
                    <li
                      key={pattern.id}
                      className="writing-pattern"
                      title={
                        pattern.sampleOriginal !== null && pattern.sampleFix !== null
                          ? `${pattern.sampleOriginal} → ${pattern.sampleFix}`
                          : undefined
                      }
                    >
                      <span className="writing-pattern-name">{writingLabel(pattern.category)}</span>
                      <WritingPatternBar share={pattern.occurrenceCount / maxPatternCount} />
                      <span className="writing-pattern-count">
                        {Math.round((pattern.occurrenceCount / totalPatternCount) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>

                {generateExercisesMutation.data && generateExercisesMutation.data.length > 0 && (
                  <div className="writing-exercises" aria-live="polite" aria-label={tUi("Generated exercises")}>
                    {generateExercisesMutation.data.map((exercise, index) => (
                      <ExerciseCard key={`${exercise.category}-${index}`} exercise={exercise} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

type ExerciseCardProps = {
  exercise: WritingExerciseDto;
};

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const { t: tUi } = useI18n();
  return (
    <article className="writing-exercise">
      <div className="writing-issue-meta">
        <span className="tag">{writingLabel(exercise.exerciseType)}</span>
        <span className="tag tag--accent">{writingLabel(exercise.category)}</span>
      </div>
      <p className="writing-exercise-prompt">{exercise.prompt}</p>
      <details className="writing-exercise-answer">
        <summary>{tUi("Show answer")}</summary>
        <p className="writing-exercise-correct">{exercise.correctAnswer}</p>
        <p className="writing-issue-explanation">{exercise.explanation}</p>
      </details>
    </article>
  );
}
