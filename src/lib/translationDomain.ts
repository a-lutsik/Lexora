// ============================================================
// LEXORA — Lexical domain (subject lexicon) for translation
// Auto-detect for phrases; single words default to General.
// ============================================================

export const LEXICAL_DOMAINS = [
  'auto',
  'general',
  'it',
  'medicine',
  'legal',
  'finance',
  'business',
] as const;

export type LexicalDomain = (typeof LEXICAL_DOMAINS)[number];

/** Domains that can be stored / returned by the model (excludes auto). */
export type ResolvedLexicalDomain = Exclude<LexicalDomain, 'auto'>;

export type LexicalDomainOption = {
  value: LexicalDomain;
  label: string;
  shortLabel: string;
};

export const LEXICAL_DOMAIN_OPTIONS: LexicalDomainOption[] = [
  { value: 'auto', label: 'Auto-detect', shortLabel: 'Auto' },
  { value: 'general', label: 'General', shortLabel: 'General' },
  { value: 'it', label: 'IT / Tech', shortLabel: 'IT' },
  { value: 'medicine', label: 'Medicine', shortLabel: 'Med' },
  { value: 'legal', label: 'Legal', shortLabel: 'Legal' },
  { value: 'finance', label: 'Finance', shortLabel: 'Finance' },
  { value: 'business', label: 'Business', shortLabel: 'Biz' },
];

const DOMAIN_SET = new Set<string>(LEXICAL_DOMAINS);
const RESOLVED_SET = new Set<string>(
  LEXICAL_DOMAINS.filter((d): d is ResolvedLexicalDomain => d !== 'auto'),
);

export function isLexicalDomain(value: unknown): value is LexicalDomain {
  return typeof value === 'string' && DOMAIN_SET.has(value);
}

export function isResolvedLexicalDomain(value: unknown): value is ResolvedLexicalDomain {
  return typeof value === 'string' && RESOLVED_SET.has(value);
}

export function normalizeLexicalDomain(value: unknown): LexicalDomain {
  return isLexicalDomain(value) ? value : 'auto';
}

export function lexicalDomainLabel(domain: LexicalDomain | string | null | undefined): string {
  const normalized = normalizeLexicalDomain(domain ?? 'auto');
  return LEXICAL_DOMAIN_OPTIONS.find((o) => o.value === normalized)?.label ?? 'Auto-detect';
}

/**
 * Single token without surrounding context cannot reliably signal IT vs
 * medicine; force General when Auto is selected.
 */
export function isSingleWordWithoutContext(
  text: string,
  contextSentence?: string | null,
): boolean {
  if (contextSentence?.trim()) return false;
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Letters/digits/hyphen/apostrophe only, no whitespace → single word
  return !/\s/u.test(trimmed);
}

/**
 * Domain to send to the AI / use for cache lookup before the model replies.
 * Returns null when Auto should ask the model to detect (phrases / context).
 */
export function resolveLexicalDomainForRequest(
  selected: LexicalDomain,
  text: string,
  contextSentence?: string | null,
): ResolvedLexicalDomain | null {
  if (selected !== 'auto') {
    return selected;
  }
  if (isSingleWordWithoutContext(text, contextSentence)) {
    return 'general';
  }
  return null;
}
