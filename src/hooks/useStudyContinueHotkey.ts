// ============================================================
// LEXORA — Space continues a study card after feedback.
// Does not steal Space while the learner is typing an answer.
// Blurs focused buttons so Space keyup cannot synthesize a click.
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

export function useStudyContinueHotkey(enabled: boolean, onContinue: () => void): void {
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space') return;
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEnabledTextField(event.target)) return;

      event.preventDefault();
      blurFocusedButton();
      onContinueRef.current();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [enabled]);
}
