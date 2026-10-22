import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Clickable underlined fragment in the checked text.
// Opening it expands the matching row in the issues panel
// (right column), where the fix can be applied or ignored.
// ============================================================

import type { WritingIssueDto } from '../../lib/types';

type WritingIssueMarkProps = {
  issue: WritingIssueDto;
  text: string;
  isOpen: boolean;
  /** id of the expanded issue row this mark opens. */
  controlsId: string;
  onToggle: () => void;
};

function severityTone(severity: string): 'danger' | 'warn' | 'accent' {
  if (severity === 'error') return 'danger';
  if (severity === 'warning') return 'warn';
  return 'accent';
}

export function WritingIssueMark({
  issue,
  text,
  isOpen,
  controlsId,
  onToggle,
}: WritingIssueMarkProps) {
  const { t: tUi } = useI18n();
  const statusClass =
    issue.status === 'accepted'
      ? ' writing-mark--accepted'
      : issue.status === 'rejected'
        ? ' writing-mark--rejected'
        : '';

  return (
    <button
      type="button"
      className={`writing-mark writing-mark--${severityTone(issue.severity)}${isOpen ? ' is-open' : ''}${statusClass}`}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      aria-label={tUi("Issue in “{value1}”. Suggested: {value2}", { value1: issue.originalFragment, value2: issue.suggestedFix })}
      onClick={onToggle}
    >
      {text}
    </button>
  );
}
