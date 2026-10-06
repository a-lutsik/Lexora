// ============================================================
// LEXORA — Session language pair
// Defaults from settings; local overrides never persist.
// ============================================================

import { useEffect, useState } from 'react';
import { useSettings } from './useSettings';
import { normalizeLangCode } from '../lib/languages';

type SessionLanguagePair = {
  sourceLang: string;
  targetLang: string;
  setSourceLang: (code: string) => void;
  setTargetLang: (code: string) => void;
  swap: (detectedSource?: string) => void;
  settingsReady: boolean;
};

/**
 * Session Source/Target pair initialized from global settings.
 * Changing values does NOT call update_settings.
 */
export function useSessionLanguagePair(options?: {
  defaultSource?: string;
  allowAutoSource?: boolean;
}): SessionLanguagePair {
  const { data: settings, isSuccess } = useSettings();
  const allowAuto = options?.allowAutoSource ?? false;
  const settingsSource =
    normalizeLangCode(settings?.primaryLanguage) ?? options?.defaultSource ?? 'en';
  const settingsTarget =
    normalizeLangCode(settings?.interfaceLanguage) ?? 'ru';

  const [sourceLang, setSourceLang] = useState(
    allowAuto ? 'auto' : settingsSource,
  );
  const [targetLang, setTargetLang] = useState(settingsTarget);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isSuccess || hydrated) return;
    if (!allowAuto) {
      setSourceLang(settingsSource);
    }
    setTargetLang(
      settingsTarget === settingsSource && !allowAuto
        ? settingsSource === 'en'
          ? 'ru'
          : 'en'
        : settingsTarget,
    );
    setHydrated(true);
  }, [allowAuto, hydrated, isSuccess, settingsSource, settingsTarget]);

  const swap = (detectedSource?: string) => {
    if (sourceLang === 'auto') {
      const nextTarget =
        detectedSource && detectedSource !== targetLang ? detectedSource : 'en';
      setSourceLang(targetLang);
      setTargetLang(nextTarget);
      return;
    }
    const prev = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prev);
  };

  return {
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang,
    swap,
    settingsReady: isSuccess,
  };
}
