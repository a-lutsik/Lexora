// ============================================================
// LEXORA — Writing-check badge
// A small circle in the corner of the text field the user is
// typing in: spinner while checking, number of suggestions,
// the Lexora «L» when the text is clean, «!» when the check failed.
// ============================================================

import type { ReactNode } from 'react';
import { t as tUi } from "../i18n";
import { useI18n } from "../hooks/useI18n";

export type BadgeState =
  | { kind: 'checking' }
  | { kind: 'error' }
  | { kind: 'clean' }
  /** `hasErrors`: at least one mistake (red); otherwise only improvements (yellow). */
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

/** The Lexora «L» (same glyph as the app icon). */
function LexoraMark() {
  return (
    <svg className="grammar-badge-logo" viewBox="96 112 320 300" aria-hidden="true">
      <path
        fill="currentColor"
        d="M168 128c18 0 36 12 44 36 14 42 18 78 18 118 0 28-2 54-8 78h92c28 0 48 12 56 36 4 12 2 26-8 36-10 10-24 16-40 16H156c-28 0-48-22-48-50V176c0-28 22-48 48-48h12z"
      />
    </svg>
  );
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
