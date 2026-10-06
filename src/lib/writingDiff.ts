// ============================================================
// LEXORA — Writing diff helpers (pure)
// Highlights original fragments and applies accepted/pending fixes.
// ============================================================

import type { WritingIssueDto, WritingIssueStatus } from './types';

export type OriginalSegment =
  | { kind: 'plain'; text: string }
  | { kind: 'issue'; text: string; issue: WritingIssueDto };

export function overlayIssueStatuses(
  issues: WritingIssueDto[],
  overlay: Record<number, WritingIssueStatus>
): WritingIssueDto[] {
  return issues.map((issue) => {
    const status = overlay[issue.id];
    return status === undefined ? issue : { ...issue, status };
  });
}

function isUsableIssue(text: string, issue: WritingIssueDto): boolean {
  const start = issue.offsetStart;
  const end = issue.offsetEnd;
  if (start < 0 || end < start || end > text.length) return false;
  return true;
}

/**
 * LLMs often return offset_end as the last included character (inclusive).
 * The UI applies ranges with String.slice, which is exclusive. Realign using
 * original_fragment so we never duplicate the leftover last character
 * ("I"+"I" → "II", "but"+"t" → "butt", "bug."+"g" → "bug.g").
 */
export function realignIssue(text: string, issue: WritingIssueDto): WritingIssueDto | null {
  const fragment = issue.originalFragment;
  const start = issue.offsetStart;
  const end = issue.offsetEnd;

  if (fragment.length === 0) {
    if (start < 0 || start > text.length || end < start || end > text.length) return null;
    return issue;
  }

  if (start >= 0 && text.slice(start, end) === fragment) {
    return issue;
  }

  if (start >= 0 && end + 1 <= text.length && text.slice(start, end + 1) === fragment) {
    return { ...issue, offsetEnd: end + 1 };
  }

  const nearest = nearestIndexOf(text, fragment, start);
  if (nearest === -1) return null;
  return { ...issue, offsetStart: nearest, offsetEnd: nearest + fragment.length };
}

function nearestIndexOf(text: string, fragment: string, hint: number): number {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  let from = 0;
  while (from <= text.length - fragment.length) {
    const idx = text.indexOf(fragment, from);
    if (idx === -1) break;
    const dist = Math.abs(idx - hint);
    if (dist < bestDist) {
      best = idx;
      bestDist = dist;
    }
    from = idx + 1;
  }
  return best;
}

/** Non-overlapping issues ordered by offset, skipping rejected and invalid ranges. */
export function usableIssues(text: string, issues: WritingIssueDto[]): WritingIssueDto[] {
  const sorted = issues
    .filter((issue) => issue.status !== 'rejected')
    .map((issue) => realignIssue(text, issue))
    .filter((issue): issue is WritingIssueDto => issue !== null)
    .filter((issue) => isUsableIssue(text, issue))
    .slice()
    .sort((a, b) => a.offsetStart - b.offsetStart);

  const result: WritingIssueDto[] = [];
  let cursor = 0;
  for (const issue of sorted) {
    if (issue.offsetStart < cursor) continue;
    result.push(issue);
    cursor = issue.offsetEnd;
  }
  return result;
}

export function originalSegments(text: string, issues: WritingIssueDto[]): OriginalSegment[] {
  const active = usableIssues(text, issues);
  const segments: OriginalSegment[] = [];
  let cursor = 0;

  for (const issue of active) {
    if (issue.offsetStart > cursor) {
      segments.push({ kind: 'plain', text: text.slice(cursor, issue.offsetStart) });
    }
    segments.push({
      kind: 'issue',
      text: text.slice(issue.offsetStart, issue.offsetEnd),
      issue,
    });
    cursor = issue.offsetEnd;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'plain', text: text.slice(cursor) });
  }

  return segments;
}

/** Apply pending + accepted fixes from the end so earlier offsets stay valid. */
export function applyVisibleFixes(text: string, issues: WritingIssueDto[]): string {
  const active = usableIssues(text, issues)
    .slice()
    .sort((a, b) => b.offsetStart - a.offsetStart);

  let result = text;
  for (const issue of active) {
    result = result.slice(0, issue.offsetStart) + issue.suggestedFix + result.slice(issue.offsetEnd);
  }
  return result;
}
