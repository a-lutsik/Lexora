// ============================================================
// LEXORA — Language catalog (ISO 639-1)
// Shared list for Source / Target selectors and normalization.
// ============================================================

export type WritingSystem = 'latin' | 'cyrillic' | 'cjk' | 'arabic' | 'other';

export type LanguageCatalogEntry = {
  code: string;
  name: string;
  nativeName: string;
  writingSystem: WritingSystem;
  hasTts: boolean;
  hasAsr: boolean;
};

/** Region / script aliases → base ISO 639-1. */
const CODE_ALIASES: Record<string, string> = {
  'pt-br': 'pt',
  'pt-pt': 'pt',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'zh-hans': 'zh',
  'zh-hant': 'zh',
  'en-us': 'en',
  'en-gb': 'en',
  'nb': 'no',
  'nn': 'no',
  'iw': 'he',
  'in': 'id',
  'fil': 'tl',
};

/**
 * Languages Lexora supports for Source and Target.
 * Prefer codes that LLMs and TTS handle well.
 */
export const LANGUAGE_CATALOG: readonly LanguageCatalogEntry[] = [
  { code: 'en', name: 'English', nativeName: 'English', writingSystem: 'latin', hasTts: true, hasAsr: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'fr', name: 'French', nativeName: 'Français', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', writingSystem: 'arabic', hasTts: true, hasAsr: false },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', writingSystem: 'arabic', hasTts: true, hasAsr: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', writingSystem: 'arabic', hasTts: true, hasAsr: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', writingSystem: 'cjk', hasTts: true, hasAsr: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', writingSystem: 'cjk', hasTts: true, hasAsr: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', writingSystem: 'cjk', hasTts: true, hasAsr: false },
  { code: 'yue', name: 'Cantonese', nativeName: '粵語', writingSystem: 'cjk', hasTts: true, hasAsr: false },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', writingSystem: 'other', hasTts: true, hasAsr: false },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', writingSystem: 'cyrillic', hasTts: true, hasAsr: false },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', writingSystem: 'latin', hasTts: true, hasAsr: false },
  { code: 'la', name: 'Latin', nativeName: 'Latina', writingSystem: 'latin', hasTts: true, hasAsr: false },
] as const;

const BY_CODE = new Map(LANGUAGE_CATALOG.map((l) => [l.code, l]));

/** Normalize region/script tags to a base catalog code. */
export function normalizeLangCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!trimmed || trimmed === 'auto') return null;
  if (CODE_ALIASES[trimmed]) return CODE_ALIASES[trimmed] ?? null;
  const base = trimmed.split('-')[0];
  if (!base) return null;
  if (CODE_ALIASES[base]) return CODE_ALIASES[base] ?? null;
  return base;
}

export function getLanguageEntry(code: string | null | undefined): LanguageCatalogEntry | undefined {
  const normalized = normalizeLangCode(code);
  if (!normalized) return undefined;
  return BY_CODE.get(normalized);
}

export function languageLabel(code: string | null | undefined, preferNative = false, locale = 'en'): string {
  const entry = getLanguageEntry(code);
  if (!entry) {
    const fallback = normalizeLangCode(code) ?? code ?? 'Unknown';
    return fallback.toUpperCase();
  }
  let name = entry.name;
  if (locale !== 'en' && typeof Intl.DisplayNames === 'function') {
    try {
      name = new Intl.DisplayNames([locale], { type: 'language' }).of(entry.code) ?? name;
    } catch {
      // Preserve catalog names on platforms without this language code.
    }
  }
  if (preferNative && entry.nativeName.toLowerCase() !== name.toLowerCase()) {
    return `${name} (${entry.nativeName})`;
  }
  return name;
}

export function languageSelectLabel(code: string, locale = 'en'): string {
  return languageLabel(code, true, locale);
}

/** Expected sizes shown on Load buttons. */
export const PACK_EXPECTED_COUNTS: Record<string, number> = {
  top_5000: 5000,
  phrasal_verbs: 142,
  irregular_verbs: 114,
  business: 118,
  academic: 90,
  travel: 72,
};

export const SYSTEM_PACK_KEYS = [
  'top_5000',
  'phrasal_verbs',
  'irregular_verbs',
  'business',
  'academic',
  'travel',
] as const;

export type SystemPackKey = (typeof SYSTEM_PACK_KEYS)[number];
