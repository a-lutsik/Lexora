// ============================================================
// LEXORA — useLanguages
// Server language list via TanStack Query + catalog helpers.
// ============================================================

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import {
  LANGUAGE_CATALOG,
  languageSelectLabel,
  normalizeLangCode,
} from '../lib/languages';
import type { LanguageDto } from '../lib/types';
import type { SelectOption } from '../components/ui/Select';

export function useLanguages() {
  return useQuery({
    queryKey: [QUERY_KEYS.LANGUAGES],
    queryFn: () => ipc.languages.list(),
    staleTime: STALE_TIME.LONG,
  });
}

/** Prefer DB list; fall back to static catalog so Settings works offline. */
export function useLanguageOptions(pinCodes: string[] = []): SelectOption[] {
  const { data } = useLanguages();
  const pinKey = pinCodes.join(',');

  return useMemo(() => {
    const fromDb = data ?? [];
    const byCode = new Map<string, LanguageDto | { code: string; name: string; nativeName: string }>();

    for (const entry of LANGUAGE_CATALOG) {
      byCode.set(entry.code, {
        code: entry.code,
        name: entry.name,
        nativeName: entry.nativeName,
      });
    }
    for (const lang of fromDb) {
      byCode.set(lang.code, lang);
    }

    const pinned = new Set(
      pinKey
        .split(',')
        .map((c) => normalizeLangCode(c))
        .filter((c): c is string => Boolean(c)),
    );

    const all = Array.from(byCode.values()).sort((a, b) => {
      const aPinned = pinned.has(a.code) ? 0 : 1;
      const bPinned = pinned.has(b.code) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return a.name.localeCompare(b.name);
    });

    return all.map((lang) => ({
      value: lang.code,
      label: languageSelectLabel(lang.code),
    }));
  }, [data, pinKey]);
}

export function resolveLanguageId(
  languages: LanguageDto[] | undefined,
  code: string | null | undefined,
): number | null {
  const normalized = normalizeLangCode(code);
  if (!normalized || !languages) return null;
  return languages.find((l) => l.code === normalized)?.id ?? null;
}
