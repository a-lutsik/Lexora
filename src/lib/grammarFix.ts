// ============================================================
// LEXORA — System-wide writing check helpers (pure)
// One fix at a time is written into the user's field; the other
// suggestions are shifted so they still point at the right words.
// ============================================================

import { applyVisibleFixes, realignIssue, usableIssues } from './writingDiff';
import type { GrammarMark, GrammarMarkKind, WritingIssueDto } from './types';

export type FixResult = {
  /** Field text after the fix. */
  correctedText: string;
  /** Other issues, re-pointed at `correctedText` (overlapping ones dropped). */
  remaining: WritingIssueDto[];
};

/** Suggestions to show: valid, non-overlapping, not dismissed. */
export function openIssues(text: string, issues: WritingIssueDto[]): WritingIssueDto[] {
  return usableIssues(text, issues);
}

export function applyOneFix(
  text: string,
  issues: WritingIssueDto[],
  issueId: number,
): FixResult | null {
  const target = usableIssues(text, issues).find((issue) => issue.id === issueId);
  if (!target) return null;

  const correctedText =
    text.slice(0, target.offsetStart) + target.suggestedFix + text.slice(target.offsetEnd);
  const delta = target.suggestedFix.length - (target.offsetEnd - target.offsetStart);

  const remaining = issues
    .filter((issue) => issue.id !== issueId)
    .map((issue) => realignIssue(text, issue))
    .filter((issue): issue is WritingIssueDto => issue !== null)
    .filter(
      (issue) => issue.offsetEnd <= target.offsetStart || issue.offsetStart >= target.offsetEnd,
    )
    .map((issue) =>
      issue.offsetStart >= target.offsetEnd && issue.offsetEnd > target.offsetStart
        ? { ...issue, offsetStart: issue.offsetStart + delta, offsetEnd: issue.offsetEnd + delta }
        : issue,
    );

  return { correctedText, remaining };
}

/** Every suggestion that was not dismissed. */
export function applyAllFixes(text: string, issues: WritingIssueDto[]): FixResult {
  return {
    correctedText: applyVisibleFixes(text, issues),
    remaining: issues.filter((issue) => issue.status === 'rejected'),
  };
}

export type IssueContext = {
  before: string;
  fragment: string;
  after: string;
};

const CONTEXT_CHARS = 28;

/** A few words around the mistake for the suggestion card. */
export function issueContext(
  text: string,
  issue: WritingIssueDto,
  radius: number = CONTEXT_CHARS,
): IssueContext {
  const start = Math.max(0, issue.offsetStart - radius);
  const end = Math.min(text.length, issue.offsetEnd + radius);
  // Cut at word boundaries so the snippet does not start mid-word.
  let before = text.slice(start, issue.offsetStart);
  if (start > 0) {
    const space = before.indexOf(' ');
    before = `…${space === -1 ? before : before.slice(space + 1)}`;
  }
  let after = text.slice(issue.offsetEnd, end);
  if (end < text.length) {
    const space = after.lastIndexOf(' ');
    after = `${space <= 0 ? after : after.slice(0, space)}…`;
  }
  return {
    before,
    fragment: text.slice(issue.offsetStart, issue.offsetEnd),
    after,
  };
}

/** Categories that polish a correct text instead of fixing a mistake. */
const IMPROVEMENT_CATEGORIES: ReadonlySet<string> = new Set(['clarity', 'style', 'tone', 'unnatural']);

/** Red underline for a mistake, yellow for a better way to say it. */
export function issueKind(issue: WritingIssueDto): GrammarMarkKind {
  return issue.severity === 'suggestion' || IMPROVEMENT_CATEGORIES.has(issue.category)
    ? 'improvement'
    : 'error';
}

/** Underlines for the open suggestions; `titleOf` gives the card heading. */
export function buildMarks(
  issues: WritingIssueDto[],
  titleOf: (issue: WritingIssueDto) => string,
): GrammarMark[] {
  return issues.map((issue) => ({
    id: issue.id,
    start: issue.offsetStart,
    end: issue.offsetEnd,
    kind: issueKind(issue),
    title: titleOf(issue),
    original: issue.originalFragment,
    suggestion: issue.suggestedFix,
    explanation: issue.explanation,
  }));
}
