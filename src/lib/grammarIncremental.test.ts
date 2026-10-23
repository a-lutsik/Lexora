import { describe, expect, it } from 'vitest';
import {
  BATCH_SEPARATOR,
  buildBatch,
  mergeCheck,
  planCheck,
  splitBatchIssues,
  splitParagraphs,
} from './grammarIncremental';

/** Backend limit of `check_writing` (MAX_WRITING_CHARS in commands/writing.rs). */
const MAX_CHECK_CHARS = 8_000;
import type { WritingCheckDto, WritingIssueDto } from './types';

function issue(originalFragment: string, offsetStart: number, id = 1, offsetEnd?: number): WritingIssueDto {
  return {
    id,
    writingCheckId: 0,
    category: 'grammar',
    severity: 'error',
    originalFragment,
    suggestedFix: `${originalFragment}!`,
    explanation: 'fix it',
    ruleHint: null,
    offsetStart,
    offsetEnd: offsetEnd ?? offsetStart + originalFragment.length,
    status: 'pending',
  };
}

const BASE: WritingCheckDto = {
  id: 0,
  originalText: 'batch',
  correctedText: 'batch corrected',
  language: 'en',
  issueCount: 9,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 70,
  summary: 'Two slips.',
  rewriteMode: null,
  issues: [],
  createdAt: 1_700_000_000,
};

describe('splitParagraphs', () => {
  it('splits on newlines with exact start offsets and round-trips', () => {
    const text = 'First line.\n\nSecond line.\nThird.';
    const paragraphs = splitParagraphs(text);
    expect(paragraphs).toEqual([
      { text: 'First line.', start: 0 },
      { text: '', start: 12 },
      { text: 'Second line.', start: 13 },
      { text: 'Third.', start: 26 },
    ]);
    expect(paragraphs.map((p) => p.text).join('\n')).toBe(text);
    for (const p of paragraphs) expect(text.slice(p.start, p.start + p.text.length)).toBe(p.text);
  });

  it('keeps leading/trailing empty lines and a single-line text', () => {
    expect(splitParagraphs('\nA\n')).toEqual([
      { text: '', start: 0 },
      { text: 'A', start: 1 },
      { text: '', start: 3 },
    ]);
    expect(splitParagraphs('One line only.')).toEqual([{ text: 'One line only.', start: 0 }]);
    expect(splitParagraphs('')).toEqual([{ text: '', start: 0 }]);
  });

  it('uses JS string indices with emoji and multi-byte characters', () => {
    const text = 'Привет 😀 мир.\nI has 🎉 fun.';
    const paragraphs = splitParagraphs(text);
    // '😀' is two UTF-16 code units, Cyrillic letters are one.
    expect(paragraphs[1]).toEqual({ text: 'I has 🎉 fun.', start: 'Привет 😀 мир.'.length + 1 });
    expect(paragraphs[1]?.start).toBe(15);
    expect(paragraphs.map((p) => p.text).join('\n')).toBe(text);
  });
});

describe('planCheck', () => {
  it('sends only paragraphs that are not cached, never empty or blank lines', () => {
    const cache = new Map<string, WritingIssueDto[]>([['Old line.', []]]);
    const plan = planCheck('Old line.\n\n   \nNew line here.', (p) => cache.get(p));
    expect(plan.missing).toEqual(['New line here.']);
    expect([...plan.hits.keys()]).toEqual(['Old line.']);
    expect(plan.paragraphs).toHaveLength(4);
  });

  it('a cached empty issue list is a hit, undefined is a miss', () => {
    const plan = planCheck('A b c.\nD e f.', (p) => (p === 'A b c.' ? [] : undefined));
    expect(plan.hits.get('A b c.')).toEqual([]);
    expect(plan.missing).toEqual(['D e f.']);
  });

  it('asks the cache with the exact (untrimmed) paragraph text and sends a repeated line once', () => {
    const asked: string[] = [];
    const plan = planCheck('  Indented go.\nSame.\nSame.', (p) => {
      asked.push(p);
      return undefined;
    });
    expect(asked).toEqual(['  Indented go.', 'Same.']);
    expect(plan.missing).toEqual(['  Indented go.', 'Same.']);
  });

  it('short changed paragraphs are still sent', () => {
    expect(planCheck('Hi.', () => undefined).missing).toEqual(['Hi.']);
  });
});

describe('buildBatch', () => {
  it('joins missing paragraphs with a single newline and records their batch offsets', () => {
    const batch = buildBatch(['First go.', 'Second 😀 go.']);
    expect(BATCH_SEPARATOR).toBe('\n');
    expect(batch.text).toBe('First go.\nSecond 😀 go.');
    expect(batch.parts).toEqual([
      { text: 'First go.', start: 0 },
      { text: 'Second 😀 go.', start: 10 },
    ]);
    for (const part of batch.parts) {
      expect(batch.text.slice(part.start, part.start + part.text.length)).toBe(part.text);
    }
  });

  it('a single paragraph is sent as is', () => {
    expect(buildBatch(['Only one.']).text).toBe('Only one.');
  });

  it('a text of 100 lines × 79 chars (7 999 chars) is sent within the 8 000-char limit', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `${String(i).padStart(3, '0')} ${'x'.repeat(75)}`);
    const text = lines.join('\n');
    expect(lines.every((line) => line.length === 79)).toBe(true);
    expect(text.length).toBe(7_999);
    const batch = buildBatch(planCheck(text, () => undefined).missing);
    expect(batch.text).toBe(text);
    expect(batch.text.length).toBeLessThanOrEqual(MAX_CHECK_CHARS);
  });

  it('the batch is never longer than the text, whatever is cached', () => {
    const texts = [
      'a\nb\nc',
      'Line one.\n\n\nLine two.\n   \nLine one.',
      `${'w '.repeat(3_000)}\n${'v'.repeat(4_000)}\n\n${'u'.repeat(999)}`,
      '\n\nOnly 😀 here.\n\n',
    ];
    for (const text of texts) {
      const lines = text.split('\n');
      // Every subset of cached lines (the first k lines cached).
      for (let k = 0; k <= lines.length; k += 1) {
        const cached = new Set(lines.slice(0, k));
        const batch = buildBatch(planCheck(text, (p) => (cached.has(p) ? [] : undefined)).missing);
        expect(batch.text.length).toBeLessThanOrEqual(text.length);
      }
    }
  });
});

describe('splitBatchIssues', () => {
  const batch = buildBatch(['She go home.', 'He 😀 dont care.']);

  it('maps issues back to paragraph-relative offsets', () => {
    const second = batch.parts[1]?.start ?? -1;
    const result = splitBatchIssues(batch, [
      issue('go', 4, 1),
      issue('dont', second + 6, 2),
    ]);
    expect(result.get('She go home.')).toEqual([issue('go', 4, 1)]);
    expect(result.get('He 😀 dont care.')).toEqual([issue('dont', 6, 2)]);
  });

  it('gives every sent paragraph an entry, even without issues', () => {
    const result = splitBatchIssues(batch, []);
    expect(result.get('She go home.')).toEqual([]);
    expect(result.get('He 😀 dont care.')).toEqual([]);
  });

  it('drops an issue that crosses a paragraph boundary', () => {
    const crossing = 'home.\nHe';
    const start = batch.text.indexOf(crossing);
    const result = splitBatchIssues(batch, [issue(crossing, start)]);
    expect([...result.values()].flat()).toEqual([]);
  });

  it('drops an issue that includes the separating newline', () => {
    const withNewline = 'home.\n';
    const start = batch.text.indexOf(withNewline);
    const result = splitBatchIssues(batch, [issue(withNewline, start), issue('\nHe', start + 5)]);
    expect([...result.values()].flat()).toEqual([]);
  });

  it('drops an issue whose fragment is not in the batch text', () => {
    const result = splitBatchIssues(batch, [issue('nowhere', 3)]);
    expect([...result.values()].flat()).toEqual([]);
  });

  it('realigns an inclusive end and a slightly wrong start (e.g. code-point offsets)', () => {
    const second = batch.parts[1]?.start ?? -1;
    // Inclusive end: 'go' reported as 4..5.
    // Code-point start: the emoji counts as 1 instead of 2 UTF-16 units.
    const result = splitBatchIssues(batch, [
      issue('go', 4, 1, 5),
      issue('dont', second + 5, 2),
    ]);
    expect(result.get('She go home.')).toEqual([issue('go', 4, 1)]);
    expect(result.get('He 😀 dont care.')).toEqual([issue('dont', 6, 2)]);
  });

  it('accounts for the leading whitespace the backend trims off', () => {
    const indented = buildBatch(['  She go home.']);
    // The backend checked 'She go home.' and reports offsets into it.
    const result = splitBatchIssues(indented, [issue('go', 4)], 'She go home.');
    expect(result.get('  She go home.')).toEqual([issue('go', 6)]);
  });
});

describe('mergeCheck', () => {
  it('builds a check of the full text with absolute offsets renumbered in text order', () => {
    const text = 'Second dont.\n\nFirst go.\nSecond dont.';
    const paragraphs = splitParagraphs(text);
    const perParagraph = new Map<string, WritingIssueDto[]>([
      ['Second dont.', [issue('dont', 7, 5)]],
      ['First go.', [issue('go', 6, 1)]],
    ]);
    const merged = mergeCheck(text, paragraphs, perParagraph, BASE);
    expect(merged.originalText).toBe(text);
    expect(merged.issueCount).toBe(3);
    expect(merged.issues.map((i) => [i.id, i.originalFragment, i.offsetStart, i.offsetEnd])).toEqual([
      [1, 'dont', 7, 11],
      [2, 'go', 20, 22],
      [3, 'dont', 31, 35],
    ]);
    for (const i of merged.issues) expect(text.slice(i.offsetStart, i.offsetEnd)).toBe(i.originalFragment);
    expect(merged).toMatchObject({
      id: 0,
      language: 'en',
      overallScore: 70,
      summary: 'Two slips.',
      createdAt: 1_700_000_000,
      // The batch's corrected text is not a correction of the full text.
      correctedText: null,
    });
  });

  it('keeps the corrected text when the batch was the whole text', () => {
    const merged = mergeCheck('batch', splitParagraphs('batch'), new Map(), BASE);
    expect(merged.correctedText).toBe('batch corrected');
  });

  it('uses defaults when nothing was sent', () => {
    const merged = mergeCheck('All good.', splitParagraphs('All good.'), new Map([['All good.', []]]), null, 1_700_000_123_456);
    expect(merged).toEqual({
      id: 0,
      originalText: 'All good.',
      correctedText: null,
      language: '',
      issueCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      overallScore: 100,
      summary: null,
      rewriteMode: null,
      issues: [],
      createdAt: 1_700_000_123,
    });
  });

  it('round-trips a batch: plan → batch → split → merge gives offsets into the full text', () => {
    const text = 'Cached line.\nI has 😀 a cat.\n\nShe go.';
    const cache = new Map<string, WritingIssueDto[]>([['Cached line.', []]]);
    const plan = planCheck(text, (p) => cache.get(p));
    const batch = buildBatch(plan.missing);
    expect(batch.text).toBe('I has 😀 a cat.\nShe go.');
    const fresh = splitBatchIssues(batch, [issue('has', 2, 1), issue('go', batch.text.indexOf('go'), 2)]);
    const merged = mergeCheck(text, plan.paragraphs, new Map([...plan.hits, ...fresh]), { ...BASE, originalText: batch.text });
    expect(merged.issues.map((i) => text.slice(i.offsetStart, i.offsetEnd))).toEqual(['has', 'go']);
    expect(merged.issues.map((i) => i.id)).toEqual([1, 2]);
  });
});
