import { writingLabel } from '../../lib/interfaceText';
import { useI18n } from "../../hooks/useI18n";
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
  const { t: tUi } = useI18n();
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
        <Badge variant={severityVariant(issue.severity)}>{writingLabel(issue.category)}</Badge>
        <Badge variant="neutral">{writingLabel(issue.severity)}</Badge>
        {!isPending && (
          <span className="text-muted text-xs">{writingLabel(issue.status)}</span>
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
              aria-label={tUi("Apply fix for {value1}", { value1: issue.originalFragment })}
            >{tUi("Apply")}</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              aria-label={tUi("Ignore issue {value1}", { value1: issue.originalFragment })}
            >{tUi("Ignore")}</Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveCard}
          disabled={addMutation.isPending || savedCard}
          aria-label={tUi("Save {value1} as flashcard", { value1: issue.originalFragment })}
        >
          {savedCard ? tUi("✓ Saved") : tUi("+ Card")}
        </Button>
      </div>
    </>
  );
}
