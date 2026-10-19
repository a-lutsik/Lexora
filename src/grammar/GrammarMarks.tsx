// ============================================================
// LEXORA — Underlines over the watched field («Grammarly mode»)
// A transparent, click-through window the size of the text field.
// The backend measures where each flagged word is drawn in the
// other app and sends rectangles; this window only paints them:
// red under a mistake, yellow under a phrase that reads better
// another way. Hovering is detected by the backend (the window
// never receives the mouse).
// ============================================================

import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { APP_EVENTS } from '../lib/constants';
import { ipc } from '../lib/ipc';
import type { GrammarMarksPayload } from '../lib/types';
import './grammar.css';

/** Underline thickness in CSS pixels. */
const MARK_THICKNESS = 2;

function isMarksPayload(value: unknown): value is GrammarMarksPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'regions' in value &&
    Array.isArray((value as { regions: unknown }).regions)
  );
}

export function GrammarMarks() {
  const [regions, setRegions] = useState<GrammarMarksPayload['regions']>([]);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const receive = (payload: unknown) => {
      if (!disposed && isMarksPayload(payload)) setRegions(payload.regions);
    };
    // The window may mount after the first event — read the last one.
    void ipc.grammar
      .getMarks()
      .then(receive)
      .catch(() => undefined);
    void listen<unknown>(APP_EVENTS.GRAMMAR_MARKS, (event) => receive(event.payload)).then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return (
    <svg className="grammar-marks" aria-hidden="true">
      {regions.flatMap((region) =>
        region.rects.map((rect, index) => (
          <rect
            key={`${region.id}:${index}`}
            className={`grammar-mark-line is-${region.kind}`}
            x={rect.x}
            y={rect.y + rect.height - MARK_THICKNESS}
            width={rect.width}
            height={MARK_THICKNESS}
          />
        )),
      )}
    </svg>
  );
}
