import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Lexical domain select (subject lexicon)
// ============================================================

import { Select } from '../ui/Select';
import {
  LEXICAL_DOMAIN_OPTIONS,
  lexicalDomainLabel,
  normalizeLexicalDomain,
  type LexicalDomain,
} from '../../lib/translationDomain';
import './TranslationDomainSelect.css';

type TranslationDomainSelectProps = {
  value: LexicalDomain;
  onChange: (value: LexicalDomain) => void;
  detectedDomain?: string | null;
  compact?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export function TranslationDomainSelect({
  value,
  onChange,
  detectedDomain,
  compact = false,
  id,
  disabled = false,
  className = '',
}: TranslationDomainSelectProps) {
  const { t: tUi } = useI18n();
  const normalized = normalizeLexicalDomain(value);
  const detected =
    detectedDomain && detectedDomain !== 'auto'
      ? normalizeLexicalDomain(detectedDomain)
      : null;
  // Keep selection as Auto, but show the resolved domain on the closed trigger.
  const showDetectedAsValue = normalized === 'auto' && detected !== null && detected !== 'auto';
  const displayLabel = showDetectedAsValue ? tUi(lexicalDomainLabel(detected)) : undefined;
  const ariaLabel = showDetectedAsValue
    ? tUi("Lexical domain, Auto-detect ({value1})", { value1: tUi(lexicalDomainLabel(detected)) })
    : tUi("Lexical domain");

  return (
    <div
      className={`translation-domain-select${compact ? ' is-compact' : ''}${
        showDetectedAsValue ? ' has-detected' : ''
      } ${className}`.trim()}
    >
      <Select
        id={id}
        value={normalized}
        displayLabel={displayLabel}
        options={LEXICAL_DOMAIN_OPTIONS.map((o) => ({
          value: o.value,
          label: tUi(compact ? o.shortLabel : o.label),
          badge: o.value === 'auto' ? tUi("Smart") : undefined,
        }))}
        onChange={(next) => onChange(normalizeLexicalDomain(next))}
        ariaLabel={ariaLabel}
        disabled={disabled}
        className="translation-domain-select__control"
      />
    </div>
  );
}
