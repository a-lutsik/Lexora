import { describe, expect, it } from 'vitest';
import {
  applyVisibleFixes,
  originalSegments,
  overlayIssueStatuses,
  usableIssues,
} from './writingDiff';
import type { WritingIssueDto } from './types';

function issue(partial: Partial<WritingIssueDto> & Pick<WritingIssueDto, 'id' | 'offsetStart' | 'offsetEnd' | 'suggestedFix'>): WritingIssueDto {
  return {
    writingCheckId: 1,
    category: 'grammar',
    severity: 'error',
    originalFragment: '',
    explanation: '',
    ruleHint: null,
    status: 'pending',
    ...partial,
  };
}

describe('writingDiff', () => {
  const text = 'he go home';

  it('builds original segments around issue ranges', () => {
    const issues = [
      issue({ id: 1, offsetStart: 0, offsetEnd: 2, suggestedFix: 'He', originalFragment: 'he' }),
      issue({ id: 2, offsetStart: 3, offsetEnd: 5, suggestedFix: 'goes', originalFragment: 'go' }),
    ];
    const segs = originalSegments(text, issues);
    expect(segs).toEqual([
      { kind: 'issue', text: 'he', issue: issues[0] },
      { kind: 'plain', text: ' ' },
      { kind: 'issue', text: 'go', issue: issues[1] },
      { kind: 'plain', text: ' home' },
    ]);
  });

  it('skips overlapping and rejected issues', () => {
    const issues = [
      issue({ id: 1, offsetStart: 0, offsetEnd: 5, suggestedFix: 'He goes' }),
      issue({ id: 2, offsetStart: 3, offsetEnd: 5, suggestedFix: 'goes' }),
      issue({ id: 3, offsetStart: 6, offsetEnd: 10, suggestedFix: 'house', status: 'rejected' }),
    ];
    expect(usableIssues(text, issues).map((i) => i.id)).toEqual([1]);
  });

  it('applies pending fixes from the end', () => {
    const issues = [
      issue({ id: 1, offsetStart: 0, offsetEnd: 2, suggestedFix: 'He' }),
      issue({ id: 2, offsetStart: 3, offsetEnd: 5, suggestedFix: 'goes' }),
    ];
    expect(applyVisibleFixes(text, issues)).toBe('He goes home');
  });

  it('overlayIssueStatuses replaces matching ids', () => {
    const issues = [issue({ id: 1, offsetStart: 0, offsetEnd: 2, suggestedFix: 'He' })];
    const overlaid = overlayIssueStatuses(issues, { 1: 'accepted' });
    expect(overlaid[0]?.status).toBe('accepted');
    expect(issues[0]?.status).toBe('pending');
  });

  it('treats inclusive offset_end as exclusive so suggested text is not garbled', () => {
    const letter = "Hi Andrew I would say I can't do it but I had to fix that bug";
    const andrew = 'Hi Andrew I';
    const but = 'it but';
    const bug = 'bug';
    const issues = [
      issue({
        id: 1,
        originalFragment: andrew,
        suggestedFix: 'Hi Andrew, I',
        offsetStart: 0,
        offsetEnd: andrew.length - 1,
      }),
      issue({
        id: 2,
        originalFragment: but,
        suggestedFix: 'it, but',
        offsetStart: letter.indexOf(but),
        offsetEnd: letter.indexOf(but) + but.length - 1,
      }),
      issue({
        id: 3,
        originalFragment: bug,
        suggestedFix: 'bug.',
        offsetStart: letter.indexOf(bug),
        offsetEnd: letter.indexOf(bug) + bug.length - 1,
      }),
    ];

    expect(applyVisibleFixes(letter, issues)).toBe(
      "Hi Andrew, I would say I can't do it, but I had to fix that bug."
    );

    const marks = originalSegments(letter, issues)
      .filter((seg) => seg.kind === 'issue')
      .map((seg) => seg.text);
    expect(marks).toEqual([andrew, but, bug]);
  });
});
