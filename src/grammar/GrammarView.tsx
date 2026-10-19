// ============================================================
// LEXORA — Writing-check page router
// One page (grammar.html), three windows: the fragment picks
// the badge/panel, the underlines over the field or the hover card.
// ============================================================

import { GrammarApp } from './GrammarApp';
import { GrammarCard } from './GrammarCard';
import { GrammarMarks } from './GrammarMarks';

export function GrammarView() {
  switch (window.location.hash) {
    case '#marks':
      return <GrammarMarks />;
    case '#card':
      return <GrammarCard />;
    default:
      return <GrammarApp />;
  }
}
