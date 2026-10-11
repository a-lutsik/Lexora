// ============================================================
// LEXORA — Writing-check panel
// Suggestion cards for the text in another app's field. «Apply»
// writes the fix straight into that field.
// ============================================================

import { useEffect } from 'react';
import { issueContext } from '../lib/grammarFix';
import type { WritingIssueDto } from '../lib/types';

export type PanelStatus = 'checking' | 'error' | 'ready';

type GrammarPanelProps = {
  status: PanelStatus;
  appName: string | null;
  canExcludeApp: boolean;
  /** Check failure (AI provider not set up, offline, …). */
  checkError: string | null;
  /** Writing the fix into the field failed. */
  applyError: string | null;
  isApplying: boolean;
  text: string;
  /** Open suggestions only (dismissed ones filtered out). */
  issues: WritingIssueDto[];
  onApply: (issueId: number) => void;
  onDismiss: (issueId: number) => void;
  onApplyAll: () => void;
  onIgnore: () => void;
  onExcludeApp: () => void;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function panelTitle(status: PanelStatus, count: number): string {
  if (status === 'checking') return 'Checking…';
  if (status === 'error') return 'Writing check';
  if (count === 0) return 'Looks good';
  return `${count} ${count === 1 ? 'suggestion' : 'suggestions'}`;
}

export function GrammarPanel({
  status,
  appName,
  canExcludeApp,
  checkError,
  applyError,
  isApplying,
  text,
  issues,
  onApply,
  onDismiss,
  onApplyAll,
  onIgnore,
  onExcludeApp,
  onClose,
}: GrammarPanelProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const count = issues.length;

  return (
    <section className="grammar-panel" aria-labelledby="grammar-panel-title">
      <header className="grammar-panel-header">
        <h1 className="grammar-panel-title" id="grammar-panel-title">
          {panelTitle(status, count)}
          {appName && <span className="grammar-panel-app"> · {appName}</span>}
        </h1>
        <button type="button" className="grammar-icon-btn" onClick={onClose} aria-label="Close suggestions">
          <CloseIcon />
        </button>
      </header>

      <div className="grammar-panel-body" aria-live="polite" aria-busy={status === 'checking'}>
        {applyError && (
          <p className="grammar-alert" role="alert">
            {applyError}
          </p>
        )}
        {status === 'checking' && <p className="grammar-panel-note">Checking your text…</p>}
        {status === 'error' && (
          <p className="grammar-alert" role="alert">
            {checkError ?? 'Could not check the text.'}
          </p>
        )}
        {status === 'ready' && count === 0 && (
          <p className="grammar-panel-note is-clean">✓ No mistakes found — the text reads well.</p>
        )}
        {status === 'ready' && count > 0 && (
          <ul className="grammar-list" aria-label="Suggestions">
            {issues.map((issue) => {
              const context = issueContext(text, issue);
              const change = `${issue.originalFragment || '…'} → ${issue.suggestedFix || 'remove'}`;
              return (
                <li key={issue.id} className="grammar-card">
                  <span className="grammar-card-category">{issue.category}</span>
                  <p className="grammar-card-context">
                    {context.before}
                    <del>{context.fragment}</del>
                    <ins>{issue.suggestedFix || '∅'}</ins>
                    {context.after}
                  </p>
                  {issue.explanation && <p className="grammar-card-why">{issue.explanation}</p>}
                  <div className="grammar-card-actions">
                    <button
                      type="button"
                      className="grammar-btn is-primary"
                      onClick={() => onApply(issue.id)}
                      disabled={isApplying}
                      aria-label={`Apply fix: ${change}`}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className="grammar-btn"
                      onClick={() => onDismiss(issue.id)}
                      disabled={isApplying}
                      aria-label={`Dismiss fix: ${change}`}
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="grammar-panel-footer">
        {count > 1 && status === 'ready' && (
          <button type="button" className="grammar-btn is-primary" onClick={onApplyAll} disabled={isApplying}>
            Apply all ({count})
          </button>
        )}
        <div className="grammar-footer-spacer" />
        <button type="button" className="grammar-link-btn" onClick={onIgnore}>
          Hide for this text
        </button>
        {canExcludeApp && (
          <button type="button" className="grammar-link-btn" onClick={onExcludeApp}>
            {appName ? `Don't check in ${appName}` : "Don't check in this app"}
          </button>
        )}
      </footer>
    </section>
  );
}
