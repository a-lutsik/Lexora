// ============================================================
// LEXORA — Space press-and-hold to record (Minimal Pairs / Practice)
// Does not steal Space while typing in an enabled text field.
// Blurs focused buttons so keyup cannot synthesize a click/stop.
// ============================================================

import { useEffect, useRef } from 'react';

function isEnabledTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return false;
  }
  return !target.disabled && !target.readOnly;
}

function blurFocusedButton(): void {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  if (active.tagName === 'BUTTON' || active.getAttribute('role') === 'button') {
    active.blur();
  }
}

type UsePairsSpaceHoldOptions = {
  enabled: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
};

export function usePairsSpaceHold({ enabled, onStart, onStop }: UsePairsSpaceHoldOptions): void {
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  const holdingRef = useRef(false);
  const startPendingRef = useRef(false);
  onStartRef.current = onStart;
  onStopRef.current = onStop;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEnabledTextField(event.target)) return;
      event.preventDefault();
      if (holdingRef.current) return;
      holdingRef.current = true;
      blurFocusedButton();
      startPendingRef.current = true;
      void Promise.resolve(onStartRef.current()).finally(() => {
        startPendingRef.current = false;
        // Released before the recorder finished starting — stop right away.
        if (!holdingRef.current) {
          void onStopRef.current();
        }
      });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      if (!holdingRef.current) return;
      holdingRef.current = false;
      event.preventDefault();
      if (startPendingRef.current) return;
      void onStopRef.current();
    };

    const onBlur = () => {
      if (!holdingRef.current) return;
      holdingRef.current = false;
      if (startPendingRef.current) return;
      void onStopRef.current();
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      if (holdingRef.current) {
        holdingRef.current = false;
        void onStopRef.current();
      }
    };
  }, [enabled]);
}
