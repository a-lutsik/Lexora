// ============================================================
// LEXORA — Incremental writing check helpers (pure)
// The badge window re-checks only the paragraphs (lines) that
// changed since the last check: unchanged lines come from a
// per-paragraph cache, the changed ones go to the LLM in one
// batch, and the results are merged back into one check of the
// full field text. Offsets are JS string (UTF-16) indices.
// ============================================================

import { realignIssue } from './writingDiff';
import type { WritingCheckDto, WritingIssueDto } from './types';

/**
 * Joins the changed paragraphs in one request. A single newline keeps
 * hard-wrapped lines looking like the original text, and the batch is never
 * longer than the text (distinct lines + at most as many newlines), so it
 * stays within the backend's length limit whenever the text does.
 */
export const BATCH_SEPARATOR = '\n';

/** Score of a check in which nothing had to be sent (every paragraph cached). */
const CLEAN_SCORE = 100;

const MS_PER_SECOND = 1000;

export type Paragraph = {
  /** Exact line text (no trimming: offsets refer to it). */
  text: string;
  /** Index of its first character in the containing text. */
  start: number;
};

/** Paragraph text → its issues, offsets relative to the paragraph. */
export type ParagraphIssues = ReadonlyMap<string, readonly WritingIssueDto[]>;

export type CheckPlan = {
  paragraphs: Paragraph[];
  /** Cached paragraphs and their issues. */
  hits: Map<string, readonly WritingIssueDto[]>;
  /** Distinct paragraph texts to send, in text order. */
  missing: string[];
};

export type Batch = {
  /** Request text: the missing paragraphs joined with `BATCH_SEPARATOR`. */
  text: string;
  /** Each paragraph and its start offset inside `text`. */
  parts: Paragraph[];
};

/** A line is a paragraph; `join('\n')` of the texts gives back `text`. */
export function splitParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let start = 0;
  for (const line of text.split('\n')) {
    paragraphs.push({ text: line, start });
    start += line.length + 1;
  }
  return paragraphs;
}

/** Empty and whitespace-only lines have nothing to check (the backend rejects blank text). */
function isCheckable(paragraph: string): boolean {
  return paragraph.trim().length > 0;
}

export function planCheck(
  text: string,
  cached: (paragraph: string) => readonly WritingIssueDto[] | undefined,
): CheckPlan {
  const paragraphs = splitParagraphs(text);
  const hits = new Map<string, readonly WritingIssueDto[]>();
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const { text: paragraph } of paragraphs) {
    if (!isCheckable(paragraph) || seen.has(paragraph)) continue;
    seen.add(paragraph);
    const issues = cached(paragraph);
    if (issues) hits.set(paragraph, issues);
    else missing.push(paragraph);
  }
  return { paragraphs, hits, missing };
}

export function buildBatch(missing: readonly string[]): Batch {
  const parts: Paragraph[] = [];
  let start = 0;
  for (const paragraph of missing) {
    parts.push({ text: paragraph, start });
    start += paragraph.length + BATCH_SEPARATOR.length;
  }
  return { text: missing.join(BATCH_SEPARATOR), parts };
}

/**
 * The backend trims the request text and reports offsets into the trimmed
 * text (`checkedText`, its `originalText`): shift them back into the batch.
 */
function leadingShift(batchText: string, checkedText: string | undefined): number {
  if (checkedText === undefined || checkedText.length === 0) return 0;
  const index = batchText.indexOf(checkedText);
  return index > 0 ? index : 0;
}

/**
 * Issues of a batch → issues per paragraph, offsets relative to it. An issue
 * is kept only when its fragment is found at (or near) its offsets and lies
 * inside one paragraph.
 */
export function splitBatchIssues(
  batch: Batch,
  issues: readonly WritingIssueDto[],
  checkedText?: string,
): Map<string, WritingIssueDto[]> {
  const shift = leadingShift(batch.text, checkedText);
  const result = new Map<string, WritingIssueDto[]>(batch.parts.map((part) => [part.text, []]));
  for (const raw of issues) {
    const shifted =
      shift === 0
        ? raw
        : { ...raw, offsetStart: raw.offsetStart + shift, offsetEnd: raw.offsetEnd + shift };
    const issue = realignIssue(batch.text, shifted);
    if (!issue) continue;
    if (batch.text.slice(issue.offsetStart, issue.offsetEnd) !== issue.originalFragment) continue;
    const part = batch.parts.find(
      (candidate) =>
        candidate.start <= issue.offsetStart &&
        issue.offsetEnd <= candidate.start + candidate.text.length,
    );
    if (!part) continue;
    result.get(part.text)?.push({
      ...issue,
      offsetStart: issue.offsetStart - part.start,
      offsetEnd: issue.offsetEnd - part.start,
    });
  }
  return result;
}

/** Fields of the batch response carried into the merged check. */
export type CheckBase = Omit<WritingCheckDto, 'issues' | 'issueCount'>;

/**
 * One check of the full `text`: issues at absolute offsets, numbered 1..n in
 * text order. `base` is the batch response, `null` when nothing was sent.
 */
export function mergeCheck(
  text: string,
  paragraphs: readonly Paragraph[],
  issuesPerParagraph: ParagraphIssues,
  base: CheckBase | null,
  now: number = Date.now(),
): WritingCheckDto {
  const issues = paragraphs
    .flatMap((paragraph) =>
      (issuesPerParagraph.get(paragraph.text) ?? []).map((issue) => ({
        ...issue,
        offsetStart: issue.offsetStart + paragraph.start,
        offsetEnd: issue.offsetEnd + paragraph.start,
      })),
    )
    .sort((a, b) => a.offsetStart - b.offsetStart || a.offsetEnd - b.offsetEnd)
    .map((issue, index) => ({ ...issue, id: index + 1 }));

  return {
    id: base?.id ?? 0,
    originalText: text,
    // A correction of the batch is not a correction of the full text.
    correctedText: base && base.originalText === text ? base.correctedText : null,
    language: base?.language ?? '',
    issueCount: issues.length,
    acceptedCount: base?.acceptedCount ?? 0,
    rejectedCount: base?.rejectedCount ?? 0,
    overallScore: base?.overallScore ?? CLEAN_SCORE,
    summary: base?.summary ?? null,
    rewriteMode: base?.rewriteMode ?? null,
    issues,
    createdAt: base?.createdAt ?? Math.floor(now / MS_PER_SECOND),
  };
}
