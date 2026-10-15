// ============================================================
// LEXORA — Writing-check badge
// A small circle in the corner of the text field the user is
// typing in: spinner while checking, number of suggestions,
// ✓ when the text is clean, «!» when the check failed.
// ============================================================

import { t as tUi } from "../i18n";
import { useI18n } from "../hooks/useI18n";

export type BadgeState =
  | { kind: 'checking' }
  | { kind: 'error' }
  | { kind: 'clean' }
  | { kind: 'issues'; count: number };

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

function badgeContent(state: BadgeState): string {
  switch (state.kind) {
    case 'checking':
      return '';
    case 'error':
      return '!';
    case 'clean':
      return '✓';
    case 'issues':
      return state.count > 9 ? '9+' : String(state.count);
  }
}

export function GrammarBadge({ state, onOpen }: GrammarBadgeProps) {
  useI18n();
  return (
    <button type="button" className="grammar-badge" onClick={onOpen} aria-label={badgeLabel(state)}>
      <span className={`grammar-badge-dot is-${state.kind}`} aria-hidden="true">
        {badgeContent(state)}
      </span>
    </button>
  );
}
