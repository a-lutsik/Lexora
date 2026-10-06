// ============================================================
// LEXORA — prefers-reduced-motion hook
// Для JS-эффектов, которые нельзя отключить только CSS.
// ============================================================

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function matchesReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(matchesReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
