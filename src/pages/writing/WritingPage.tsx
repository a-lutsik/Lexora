import { writingLabel } from '../../lib/interfaceText';
import { useI18n } from "../../hooks/useI18n";
import { t as tUi } from "../../i18n";
// ============================================================
// LEXORA — Writing Assistant Page
// Paste text, check issues, rewrite, review a side-by-side diff.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
import { WritingIssueMark } from './WritingIssueMark';
import { WritingIssuePanel } from './WritingIssuePanel';
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



function scoreTone(score: number): 'success' | 'warn' | 'danger' {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warn';
  return 'danger';
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

export default function WritingPage() {
  const { t: tUi } = useI18n();
  const [text, setText] = useState('');
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>('clearer');
  const [statusOverlay, setStatusOverlay] = useState<Record<number, WritingIssueStatus>>({});
  const [latestCheck, setLatestCheck] = useState<WritingCheckDto | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [openIssueId, setOpenIssueId] = useState<number | null>(null);
  const [issuesListOpen, setIssuesListOpen] = useState(false);
  const [autoCheckScheduled, setAutoCheckScheduled] = useState(false);

  const autoCheckTimerRef = useRef<number | null>(null);
  const checkGenerationRef = useRef(0);

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
      setIssuesListOpen(false);
      resetRewrite();
      checkWriting(
        { text: trimmed, language },
        {
          onSuccess: (data) => {
            if (generation !== checkGenerationRef.current) return;
            setLatestCheck(data);
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

  const autoStatusLabel = checkPending
    ? tUi("Checking…")
    : autoCheckScheduled
      ? tUi("Waiting to check")
      : null;

  const closeIssue = useCallback(() => setOpenIssueId(null), []);

  const handleCheck = () => {
    if (!canSubmit) return;
    runCheck(text);
  };

  const handleRewrite = () => {
    if (!canSubmit) return;
    clearAutoCheckTimer();
    setCopied(false);
    setOpenIssueId(null);
    setIssuesListOpen(false);
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
  };

  return (
    <div className="writing-page animate-fade-in">
      <header className="writing-header">
        <div>
          <h1 className="writing-title">{tUi("Writing Assistant")}</h1>
          <p className="text-secondary text-sm">{tUi("Check grammar, spelling, and style — or rewrite the text in a different tone")}</p>
        </div>
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
      </header>

      {privacyMode && (
        <div className="writing-privacy-banner" role="status">{tUi("Privacy mode: checked text is not stored")}</div>
      )}

      <section className="writing-editor" aria-label={tUi("Text to check")}>
        <label className="sr-only" htmlFor="writing-input">{tUi("Text to check")}</label>
        <textarea dir="auto"
          id="writing-input"
          className="writing-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tUi("Paste or type a sentence, email, or paragraph…")}
          spellCheck={false}
          aria-describedby={
            autoStatusLabel ? 'writing-char-count writing-auto-status' : 'writing-char-count'
          }
        />
        <div className="writing-editor-bar">
          <div className="writing-editor-meta">
            <span
              id="writing-char-count"
              className={`writing-char-count${overLimit ? ' writing-char-count--over' : ''}`}
            >
              {charCount} / {MAX_WRITING_CHARS}
            </span>
            {autoStatusLabel && (
              <span id="writing-auto-status" className="writing-auto-status" aria-live="polite">
                {autoStatusLabel}
              </span>
            )}
          </div>
          <div className="writing-actions">
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
            >{tUi("Rewrite")}</Button>
            <Button
              variant="primary"
              onClick={handleCheck}
              disabled={!canSubmit}
              isLoading={checkPending}
              aria-label={tUi("Check writing")}
            >{tUi("Check writing")}</Button>
          </div>
        </div>
      </section>

      {(checkError ||
        rewriteError ||
        updateStatusMutation.isError ||
        acceptAllMutation.isError ||
        generateExercisesMutation.isError) && (
        <div className="writing-error" role="alert">
          {mutationErrorMessage(
            checkErrorValue ??
              rewriteErrorValue ??
              updateStatusMutation.error ??
              acceptAllMutation.error ??
              generateExercisesMutation.error
          )}
        </div>
      )}

      {visibleCheck && !showRewrite && (
        <div className="writing-summary" aria-live="polite">
          <span className={`writing-score writing-score--${scoreTone(visibleCheck.overallScore)}`}>
            {visibleCheck.overallScore}
          </span>
          <div className="writing-summary-copy">
            <p className="writing-summary-text">{visibleCheck.summary ?? tUi("Analysis complete.")}</p>
            <p className="text-muted text-xs">
              {visibleCheck.issueCount} {visibleCheck.issueCount === 1 ? tUi("issue") : tUi("issues")}
              {pendingCount > 0 ? tUi(" · {pendingCount} pending", { pendingCount: pendingCount }) : ''}
              {tUi(" · Click a highlighted word for a fix")}
            </p>
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
        <div className="writing-summary" aria-live="polite">
          <Badge variant="accent">{latestRewrite.rewriteMode ?? rewriteMode}</Badge>
          <p className="writing-summary-text">
            {latestRewrite.summary ?? tUi("Text rewritten.")}
          </p>
        </div>
      )}

      {(visibleCheck || showRewrite) && (
        <section className="writing-diff" aria-label={tUi("Writing diff")}>
          <div className="writing-diff-pane">
            <h2 className="writing-diff-label">{tUi("Original")}</h2>
            <div className="writing-diff-body" aria-label={tUi("Original text with issues highlighted")}>
              {visibleCheck && !showRewrite
                ? segments.map((segment, index) =>
                    segment.kind === 'plain' ? (
                      <span key={index}>{segment.text}</span>
                    ) : (
                      <WritingIssueMark
                        key={segment.issue.id}
                        issue={segment.issue}
                        text={segment.text}
                        language={language}
                        isOpen={openIssueId === segment.issue.id}
                        onToggle={() =>
                          setOpenIssueId((current) =>
                            current === segment.issue.id ? null : segment.issue.id
                          )
                        }
                        onClose={closeIssue}
                        onAccept={() => setIssueStatus(segment.issue.id, 'accepted')}
                        onReject={() => setIssueStatus(segment.issue.id, 'rejected')}
                      />
                    )
                  )
                : originalText}
            </div>
          </div>
          <div className="writing-diff-pane">
            <div className="writing-diff-label-row">
              <h2 className="writing-diff-label">{tUi("Suggested")}</h2>
              <div className="writing-diff-tools">
                <Button variant="ghost" size="sm" onClick={handleCopySuggested} aria-label={tUi("Copy suggested text")}>
                  {copied ? tUi("Copied") : tUi("Copy")}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleUseSuggested} aria-label={tUi("Use suggested text as input")}>{tUi("Use as input")}</Button>
              </div>
            </div>
            <div className="writing-diff-body writing-diff-body--suggested" aria-label={tUi("Suggested text")}>
              {suggestedText}
            </div>
          </div>
        </section>
      )}

      {visibleCheck && !showRewrite && issues.length > 0 && (
        <details
          className="writing-issues"
          open={issuesListOpen}
          onToggle={(event) => setIssuesListOpen(event.currentTarget.open)}
        >
          <summary className="writing-issues-summary">{tUi("All issues (")}{issues.length})
          </summary>
          {issuesListOpen && (
            <ul className="writing-issue-list">
              {issues.map((issue) => (
                <li key={issue.id} className={`writing-issue writing-issue--${issue.status}`}>
                  <WritingIssuePanel
                    issue={issue}
                    language={language}
                    onAccept={() => setIssueStatus(issue.id, 'accepted')}
                    onReject={() => setIssueStatus(issue.id, 'rejected')}
                  />
                </li>
              ))}
            </ul>
          )}
        </details>
      )}

      {errorPatterns && errorPatterns.length > 0 && (
        <section className="writing-patterns" aria-label={tUi("Your error patterns")}>
          <div className="writing-issues-header">
            <h2 className="writing-issues-title">{tUi("Your Error Patterns")}</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateExercises}
              isLoading={generateExercisesMutation.isPending}
              aria-label={tUi("Generate exercises from error patterns")}
            >{tUi("Generate Exercises")}</Button>
          </div>
          <ul className="writing-pattern-list">
            {errorPatterns.map((pattern) => (
              <li key={pattern.id} className="writing-pattern">
                <div className="writing-issue-meta">
                  <Badge variant="accent">{writingLabel(pattern.category)}</Badge>
                  <span className="text-muted text-xs">×{pattern.occurrenceCount}</span>
                </div>
                {pattern.sampleOriginal !== null && pattern.sampleFix !== null && (
                  <p className="writing-issue-swap">
                    <span className="writing-issue-original">{pattern.sampleOriginal}</span>
                    <span className="writing-issue-arrow" aria-hidden="true">→</span>
                    <span className="writing-issue-fix">{pattern.sampleFix}</span>
                  </p>
                )}
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
        <Badge variant="neutral">{writingLabel(exercise.exerciseType)}</Badge>
        <Badge variant="accent">{writingLabel(exercise.category)}</Badge>
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
