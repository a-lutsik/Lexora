import { useI18n } from "../hooks/useI18n";
// ============================================================
// LEXORA — Fix mode of the inline assistant (Grammarly-style)
// Mistakes are highlighted in the selected text; each card shows
// the fix and why. Dismissed fixes are left out of «Accept».
// ============================================================

import { originalSegments, usableIssues } from '../lib/writingDiff';
import type { WritingCheckDto, WritingIssueDto, WritingIssueStatus } from '../lib/types';

type InlineFixSuggestionsProps = {
  check: WritingCheckDto;
  /** Issues with the local accept/dismiss state applied. */
  issues: WritingIssueDto[];
  onSetStatus: (issue: WritingIssueDto, status: WritingIssueStatus) => void;
};

export function InlineFixSuggestions({ check, issues, onSetStatus }: InlineFixSuggestionsProps) {
  const { t: tUi } = useI18n();
  // Only fixes that can be applied to this text (valid, non-overlapping
  // ranges) are listed; dismissed ones stay listed so they can be restored.
  const applicable = new Set(
    usableIssues(
      check.originalText,
      issues.map((issue) => ({ ...issue, status: 'pending' as const })),
    ).map((issue) => issue.id),
  );
  const listed = issues.filter((issue) => applicable.has(issue.id));

  if (listed.length === 0) {
    return <p className="inline-fix-clean">{tUi("✓ No mistakes found — the text reads well.")}</p>;
  }

  // Dismissed fixes stay in the list but are no longer highlighted.
  const segments = originalSegments(check.originalText, issues);

  return (
    <div className="inline-fix">
      <p className="inline-fix-text" aria-label={tUi("Your text with mistakes highlighted")}>
        {segments.map((segment, index) =>
          segment.kind === 'plain' ? (
            <span key={index}>{segment.text}</span>
          ) : (
            <mark
              key={index}
              className="inline-fix-mark"
              title={`${segment.issue.suggestedFix} — ${segment.issue.explanation}`}
            >
              {segment.text}
            </mark>
          ),
        )}
      </p>

      <ul className="inline-fix-list" aria-label={tUi("Suggestions")}>
        {listed.map((issue) => {
          const dismissed = issue.status === 'rejected';
          const change = `${issue.originalFragment} → ${issue.suggestedFix || 'remove'}`;
          return (
            <li key={issue.id} className={`inline-fix-item${dismissed ? ' is-dismissed' : ''}`}>
              <div className="inline-fix-head">
                <span className="inline-fix-category">{issue.category}</span>
                <span className="inline-fix-change">
                  <del>{issue.originalFragment}</del>
                  <span aria-hidden="true">→</span>
                  <ins>{issue.suggestedFix || '∅'}</ins>
                </span>
                <button
                  type="button"
                  className="inline-fix-toggle"
                  onClick={() => onSetStatus(issue, dismissed ? 'pending' : 'rejected')}
                  aria-label={dismissed
                    ? tUi("Restore fix: {change}", { change })
                    : tUi("Dismiss fix: {change}", { change })}
                >
                  {dismissed ? tUi("Restore") : tUi("Dismiss")}
                </button>
              </div>
              {issue.explanation && <p className="inline-fix-why">{issue.explanation}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
