import { describe, expect, it } from 'vitest';
import { applyAllFixes, applyOneFix, issueContext, openIssues } from './grammarFix';
import type { WritingIssueDto } from './types';

function issue(
  id: number,
  originalFragment: string,
  suggestedFix: string,
  offsetStart: number,
  overrides: Partial<WritingIssueDto> = {},
): WritingIssueDto {
  return {
    id,
    writingCheckId: 0,
    category: 'grammar',
    severity: 'error',
    originalFragment,
    suggestedFix,
    explanation: '',
    ruleHint: null,
    offsetStart,
    offsetEnd: offsetStart + originalFragment.length,
    status: 'pending',
    ...overrides,
  };
}

const TEXT = 'She dont like apples and she go home.';
//            0123456789...
const DONT = issue(1, 'dont', "doesn't", 4);
const GO = issue(2, 'go', 'goes', 29);

describe('applyOneFix', () => {
  it('fixes one issue and shifts the ones after it', () => {
    const result = applyOneFix(TEXT, [DONT, GO], 1);
    expect(result?.correctedText).toBe("She doesn't like apples and she go home.");
    const [go] = result?.remaining ?? [];
    expect(go?.offsetStart).toBe(32);
    expect(result?.correctedText.slice(go?.offsetStart, go?.offsetEnd)).toBe('go');
  });

  it('keeps issues before the fix in place', () => {
    const result = applyOneFix(TEXT, [DONT, GO], 2);
    expect(result?.correctedText).toBe('She dont like apples and she goes home.');
    expect(result?.remaining).toEqual([DONT]);
  });

  it('applies fixes one after another', () => {
    const first = applyOneFix(TEXT, [DONT, GO], 1);
    const second = first && applyOneFix(first.correctedText, first.remaining, 2);
    expect(second?.correctedText).toBe("She doesn't like apples and she goes home.");
    expect(second?.remaining).toEqual([]);
  });

  it('drops issues overlapping the applied one', () => {
    const overlapping = issue(3, 'dont like', 'do not like', 4);
    const result = applyOneFix(TEXT, [DONT, overlapping, GO], 1);
    expect(result?.remaining.map((i) => i.id)).toEqual([2]);
  });

  it('realigns inclusive offsets from the model', () => {
    const inclusive = issue(1, 'dont', "doesn't", 4, { offsetEnd: 7 });
    const result = applyOneFix(TEXT, [inclusive], 1);
    expect(result?.correctedText).toBe("She doesn't like apples and she go home.");
  });

  it('returns null for unknown or dismissed issues', () => {
    expect(applyOneFix(TEXT, [DONT], 99)).toBeNull();
    expect(applyOneFix(TEXT, [{ ...DONT, status: 'rejected' }], 1)).toBeNull();
  });

  it('handles a pure deletion', () => {
    const text = 'I like the the cats.';
    const extra = issue(1, 'the ', '', 7);
    expect(applyOneFix(text, [extra], 1)?.correctedText).toBe('I like the cats.');
  });
});

describe('applyAllFixes', () => {
  it('applies everything that was not dismissed', () => {
    const dismissed = { ...GO, status: 'rejected' as const };
    const result = applyAllFixes(TEXT, [DONT, dismissed]);
    expect(result.correctedText).toBe("She doesn't like apples and she go home.");
    expect(result.remaining).toEqual([dismissed]);
  });
});

describe('openIssues', () => {
  it('hides dismissed and invalid issues', () => {
    const broken = issue(5, 'zzz', 'x', 0);
    const dismissed = { ...GO, status: 'rejected' as const };
    expect(openIssues(TEXT, [DONT, dismissed, broken]).map((i) => i.id)).toEqual([1]);
  });
});

describe('issueContext', () => {
  it('shows words around the mistake', () => {
    expect(issueContext(TEXT, DONT)).toEqual({
      before: 'She ',
      fragment: 'dont',
      after: ' like apples and she go…',
    });
  });

  it('cuts long context at word boundaries', () => {
    const ctx = issueContext(TEXT, GO, 10);
    expect(ctx.before.startsWith('…')).toBe(true);
    expect(ctx.fragment).toBe('go');
    expect(ctx.after).toBe(' home.');
  });
});
