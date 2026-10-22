import { writingLabel } from '../../lib/interfaceText';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Writing issue card (issues panel, right column)
// Collapsed: severity dot + category · rule, original → suggestion.
// Expanded (opened from the card or from the underline in the
// text): explanation and Apply / Ignore / + Card.
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useAddToVocabulary } from '../../hooks/useVocabulary';
import type { WritingIssueDto } from '../../lib/types';

type WritingIssuePanelProps = {
  issue: WritingIssueDto;
  language: string;
  isOpen: boolean;
  /** id of the expanded body (the underline in the text points at it). */
  bodyId: string;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
};

function severityTone(severity: string): 'live' | 'warn' | 'accent' {
  if (severity === 'error') return 'live';
  if (severity === 'warning') return 'warn';
  return 'accent';
}

export function WritingIssuePanel({
  issue,
  language,
  isOpen,
  bodyId,
  onToggle,
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
      <button
        type="button"
        className="writing-issue__head"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="writing-issue-meta">
          <span
            className={`writing-issue-dot writing-issue-dot--${severityTone(issue.severity)}`}
            aria-hidden="true"
          />
          <span className="sr-only">{writingLabel(issue.severity)}</span>
          <span className="writing-issue-kind">
            <span>{writingLabel(issue.category)}</span>
            {issue.ruleHint && (
              <>
                {' · '}
                <span className="writing-issue-rule">{issue.ruleHint}</span>
              </>
            )}
          </span>
          {!isPending && (
            <span className="writing-issue-status">{writingLabel(issue.status)}</span>
          )}
        </span>
        <span className="writing-issue-swap" dir="auto">
          <s className="writing-issue-original">{issue.originalFragment}</s>
          <Icon name="arrow_forward" size={14} className="writing-issue-arrow" />
          <span className="writing-issue-fix">{issue.suggestedFix}</span>
        </span>
      </button>
      {isOpen && (
        <div
          id={bodyId}
          className="writing-issue__body"
          role="group"
          aria-label={tUi("Fix for {value1}", { value1: issue.originalFragment })}
        >
          <p className="writing-issue-explanation">{issue.explanation}</p>
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
                  variant="secondary"
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
        </div>
      )}
    </>
  );
}
