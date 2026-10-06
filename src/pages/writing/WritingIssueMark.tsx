// ============================================================
// LEXORA — Clickable highlighted fragment + issue popover
// ============================================================

import { useEffect, useId, useRef } from 'react';
import { WritingIssuePanel } from './WritingIssuePanel';
import type { WritingIssueDto } from '../../lib/types';

type WritingIssueMarkProps = {
  issue: WritingIssueDto;
  text: string;
  language: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
};

function severityVariant(severity: string): 'danger' | 'warn' | 'accent' {
  if (severity === 'error') return 'danger';
  if (severity === 'warning') return 'warn';
  return 'accent';
}

export function WritingIssueMark({
  issue,
  text,
  language,
  isOpen,
  onToggle,
  onClose,
  onAccept,
  onReject,
}: WritingIssueMarkProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const popoverId = useId();
  const tone = severityVariant(issue.severity);
  const statusClass =
    issue.status === 'accepted'
      ? ' writing-mark--accepted'
      : issue.status === 'rejected'
        ? ' writing-mark--rejected'
        : '';

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  return (
    <span ref={wrapRef} className="writing-mark-wrap">
      <button
        type="button"
        className={`writing-mark writing-mark--${tone}${isOpen ? ' is-open' : ''}${statusClass}`}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={`Issue in “${issue.originalFragment}”. Suggested: ${issue.suggestedFix}`}
        onClick={onToggle}
      >
        {text}
      </button>
      {isOpen && (
        <div
          id={popoverId}
          className="writing-issue-popover"
          role="dialog"
          aria-label={`Fix for ${issue.originalFragment}`}
        >
          <WritingIssuePanel
            issue={issue}
            language={language}
            onAccept={onAccept}
            onReject={onReject}
          />
        </div>
      )}
    </span>
  );
}
