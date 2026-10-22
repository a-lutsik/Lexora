// ============================================================
// LEXORA — Hover card of an underlined suggestion
// Appears under a red (mistake) or accent (improvement) underline in another app, like the
// Grammarly card: what to change, why, and «Apply» / «Dismiss».
// The buttons are relayed through the backend to the
// writing-check window, which owns the check and writes the fix.
// ============================================================

import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useI18n } from '../hooks/useI18n';
import { APP_EVENTS } from '../lib/constants';
import { ipc } from '../lib/ipc';
import { Icon } from '../components/ui/Icon';
import type { GrammarMark, GrammarMarkActionKind } from '../lib/types';
import './grammar.css';

function isMark(value: unknown): value is GrammarMark {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id: unknown }).id === 'number' &&
    typeof (value as { suggestion: unknown }).suggestion === 'string'
  );
}

export function GrammarCard() {
  const { t: tUi } = useI18n();
  const [mark, setMark] = useState<GrammarMark | null>(null);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const receive = (payload: unknown) => {
      if (!disposed) setMark(isMark(payload) ? payload : null);
    };
    void ipc.grammar
      .getCard()
      .then(receive)
      .catch(() => undefined);
    void listen<unknown>(APP_EVENTS.GRAMMAR_CARD, (event) => receive(event.payload)).then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  if (!mark) return null;

  const act = (action: GrammarMarkActionKind) => {
    void ipc.grammar.cardAction(mark.id, action).catch(() => undefined);
  };

  return (
    <section className={`grammar-hover-card is-${mark.kind}`} aria-label={mark.title}>
      <p className="grammar-hover-title">
        <span className={`grammar-hover-dot is-${mark.kind}`} aria-hidden="true" />
        {mark.title}
      </p>
      <p className="grammar-hover-change" dir="auto">
        {mark.original && <del>{mark.original}</del>}
        {mark.original && <Icon name="arrow_forward" size={14} className="grammar-hover-arrow" />}
        <ins>{mark.suggestion || tUi('Remove')}</ins>
      </p>
      {mark.explanation && <p className="grammar-hover-why">{mark.explanation}</p>}
      <div className="grammar-hover-actions">
        <button type="button" className="grammar-btn is-primary" onClick={() => act('apply')}>
          {tUi('Apply')}
        </button>
        <button type="button" className="grammar-btn" onClick={() => act('dismiss')}>
          {tUi('Dismiss')}
        </button>
        <div className="grammar-footer-spacer" />
        <button type="button" className="grammar-link-btn" onClick={() => act('open')}>
          {tUi('See all suggestions')}
        </button>
      </div>
    </section>
  );
}
