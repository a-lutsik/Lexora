// ============================================================
// LEXORA — Writing issue panel (Apply / Ignore / + Card)
// Shared by the Grammarly-style popover and the issues list.
// ============================================================

import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAddToVocabulary } from '../../hooks/useVocabulary';
import type { WritingIssueDto } from '../../lib/types';

type WritingIssuePanelProps = {
  issue: WritingIssueDto;
  language: string;
  onAccept: () => void;
  onReject: () => void;
};

function formatCategory(category: string): string {
  const spaced = category.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function severityVariant(severity: string): 'danger' | 'warn' | 'accent' {
  if (severity === 'error') return 'danger';
  if (severity === 'warning') return 'warn';
  return 'accent';
}

export function WritingIssuePanel({
  issue,
  language,
  onAccept,
  onReject,
}: WritingIssuePanelProps) {
  const [savedCard, setSavedCard] = useState(false);
  const addMutation = useAddToVocabulary();
  const isPending = issue.status === 'pending';

  const handleSaveCard = () => {
    addMutation.mutate(
      {
        lexemeId: null,
        text: issue.suggestedFix || issue.originalFragment,
        sourceLanguage: language,
        notes: `Correction: ${issue.originalFragment} → ${issue.suggestedFix} (${issue.category})\n${issue.explanation}${issue.ruleHint ? `\nRule: ${issue.ruleHint}` : ''}`,
        source: 'writing_coach',
      },
      {
        onSuccess: () => {
          setSavedCard(true);
          window.setTimeout(() => setSavedCard(false), 2000);
        },
      }
    );
  };

  return (
    <>
      <div className="writing-issue-meta">
        <Badge variant={severityVariant(issue.severity)}>{formatCategory(issue.category)}</Badge>
        <Badge variant="neutral">{issue.severity}</Badge>
        {!isPending && (
          <span className="text-muted text-xs">{issue.status}</span>
        )}
      </div>
      <p className="writing-issue-swap">
        <span className="writing-issue-original">{issue.originalFragment}</span>
        <span className="writing-issue-arrow" aria-hidden="true">→</span>
        <span className="writing-issue-fix">{issue.suggestedFix}</span>
      </p>
      <p className="writing-issue-explanation">{issue.explanation}</p>
      {issue.ruleHint && <p className="writing-issue-rule">{issue.ruleHint}</p>}
      <div className="writing-issue-actions">
        {isPending && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              aria-label={`Apply fix for ${issue.originalFragment}`}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              aria-label={`Ignore issue ${issue.originalFragment}`}
            >
              Ignore
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveCard}
          disabled={addMutation.isPending || savedCard}
          aria-label={`Save ${issue.originalFragment} as flashcard`}
        >
          {savedCard ? '✓ Saved' : '+ Card'}
        </Button>
      </div>
    </>
  );
}
