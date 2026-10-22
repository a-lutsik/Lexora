// ============================================================
// LEXORA — Writing-check badge
// A small circle in the corner of the text field the user is
// typing in: spinner while checking, number of suggestions,
// the Lexora «L» when the text is clean, «!» when the check failed.
// Monochrome: accent fill for mistakes, accent tint for
// improvements only; red is kept for the failed check.
// ============================================================

import type { ReactNode } from 'react';
import { t as tUi } from "../i18n";
import { useI18n } from "../hooks/useI18n";

export type BadgeState =
  | { kind: 'checking' }
  | { kind: 'error' }
  | { kind: 'clean' }
  /** `hasErrors`: at least one mistake (accent fill); otherwise only improvements (accent tint). */
  | { kind: 'issues'; count: number; hasErrors: boolean };

type GrammarBadgeProps = {
  state: BadgeState;
  onOpen: () => void;
};

function badgeLabel(state: BadgeState): string {
  switch (state.kind) {
    case 'checking':
      return tUi("Lexora is checking your text");
    case 'error':
      return tUi("Writing check failed — open details");
    case 'clean':
      return tUi("No mistakes found — open writing check");
    case 'issues':
      return state.count === 1
        ? tUi("{count} writing suggestion — open", { count: state.count })
        : tUi("{count} writing suggestions — open", { count: state.count });
  }
}

/** Monochrome Lexora «L» (Literata, accent colour) — the clean-text mark.
 *  The letter is drawn by CSS (`.grammar-badge-mark::before`): it is branding, not copy. */
function LexoraMark() {
  return <span className="grammar-badge-mark" />;
}

function badgeContent(state: BadgeState): ReactNode {
  switch (state.kind) {
    case 'checking':
      return null;
    case 'error':
      return '!';
    case 'clean':
      return <LexoraMark />;
    case 'issues':
      return state.count > 9 ? '9+' : String(state.count);
  }
}

function badgeTone(state: BadgeState): string {
  return state.kind === 'issues' && !state.hasErrors ? 'is-improvements' : `is-${state.kind}`;
}

export function GrammarBadge({ state, onOpen }: GrammarBadgeProps) {
  useI18n();
  return (
    <button type="button" className="grammar-badge" onClick={onOpen} aria-label={badgeLabel(state)}>
      <span className={`grammar-badge-dot ${badgeTone(state)}`} aria-hidden="true">
        {badgeContent(state)}
      </span>
    </button>
  );
}
