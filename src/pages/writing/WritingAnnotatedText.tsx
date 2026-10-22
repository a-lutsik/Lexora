import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Checked text with underlines, shown in place of the
// editor (same font and padding, one surface). Clicking an
// underline opens its card in the issues panel; clicking the
// plain text or typing returns to the textarea.
// ============================================================

import { forwardRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { OriginalSegment } from '../../lib/writingDiff';
import { WritingIssueMark } from './WritingIssueMark';

type WritingAnnotatedTextProps = {
  segments: OriginalSegment[];
  openIssueId: number | null;
  /** id of the issue card an underline opens. */
  issueBodyId: (issueId: number) => string;
  onToggleIssue: (issueId: number) => void;
  /**
   * Return to editing. `caret` is an offset in the checked text, or null to
   * keep the caret the editor had before the check.
   */
  onEdit: (caret: number | null) => void;
  describedBy?: string;
};

function isInsideButton(target: EventTarget, container: Element): boolean {
  if (!(target instanceof Element) || target === container) return false;
  return target.closest('button') !== null;
}

/** Offset in the checked text of a collapsed selection made by the click. */
function caretFromSelection(container: Element, textLength: number): number | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const node = selection.anchorNode;
  if (!node) return null;

  if (node === container) {
    if (selection.anchorOffset === 0) return 0;
    return selection.anchorOffset >= container.childNodes.length ? textLength : null;
  }

  const holder = node instanceof Element ? node : node.parentElement;
  const segment = holder?.closest('[data-offset]');
  if (!segment || !container.contains(segment)) return null;
  const start = Number(segment.getAttribute('data-offset'));
  if (!Number.isFinite(start)) return null;
  return node.nodeType === Node.TEXT_NODE ? start + selection.anchorOffset : start;
}

export const WritingAnnotatedText = forwardRef<HTMLDivElement, WritingAnnotatedTextProps>(
  function WritingAnnotatedText(
    { segments, openIssueId, issueBodyId, onToggleIssue, onEdit, describedBy },
    ref,
  ) {
    const { t: tUi } = useI18n();
    const textLength = segments.reduce((sum, segment) => sum + segment.text.length, 0);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      if (isInsideButton(event.target, event.currentTarget)) return;
      // A drag-selection is for copying, not for editing.
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      onEdit(caretFromSelection(event.currentTarget, textLength));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) return;
      const fromButton = isInsideButton(event.target, event.currentTarget);
      if (event.key === 'Enter') {
        if (fromButton) return;
        event.preventDefault();
        onEdit(null);
        return;
      }
      if (event.key.length === 1) {
        if (fromButton && event.key === ' ') return;
        // Focus moves to the textarea now, so the browser types the key there.
        onEdit(null);
      }
    };

    let offset = 0;
    const parts = segments.map((segment) => {
      const start = offset;
      offset += segment.text.length;
      if (segment.kind === 'plain') {
        return (
          <span key={`plain-${start}`} data-offset={start}>
            {segment.text}
          </span>
        );
      }
      const { issue } = segment;
      return (
        <WritingIssueMark
          key={issue.id}
          issue={issue}
          text={issue.status === 'accepted' && issue.suggestedFix !== '' ? issue.suggestedFix : segment.text}
          controlsId={issueBodyId(issue.id)}
          isOpen={openIssueId === issue.id}
          onToggle={() => onToggleIssue(issue.id)}
        />
      );
    });

    return (
      // Read mode of the editor: the underlines inside are the interactive
      // parts; a click on the plain text or a typed key returns to the textarea.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div
        ref={ref}
        role="group"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="writing-annotated"
        dir="auto"
        aria-label={tUi("Original text with issues highlighted")}
        aria-describedby={describedBy}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {parts}
      </div>
    );
  },
);
