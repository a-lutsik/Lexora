// ============================================================
// LEXORA — Session lexical domain (ephemeral, starts as Auto)
// ============================================================

import { useCallback, useState } from 'react';
import {
  normalizeLexicalDomain,
  type LexicalDomain,
} from '../lib/translationDomain';

export function useSessionLexicalDomain(initial: LexicalDomain = 'auto') {
  const [lexicalDomain, setLexicalDomainState] = useState<LexicalDomain>(initial);

  const setLexicalDomain = useCallback((next: LexicalDomain | string) => {
    setLexicalDomainState(normalizeLexicalDomain(next));
  }, []);

  return { lexicalDomain, setLexicalDomain };
}
