import { useCallback, useSyncExternalStore } from 'react';
import { getLocale, setLocale, subscribeLocale, translate } from '../i18n';

/** Shared by all entry points, including popup, stickers and grammar windows. */
export function useI18n() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => 'en');
  const t = useCallback(
    (source: string, values?: Record<string, string | number>) => translate(locale, source, values),
    [locale],
  );
  return { locale, setLocale, t };
}
