// ============================================================
// LEXORA — Document glossary (local-first termbase)
// Mandatory source → target pairs injected into chunk prompts.
// ============================================================

export type GlossaryTerm = {
  id: string;
  source: string;
  target: string;
};

const STORAGE_KEY = 'lexora.doc-glossary';

export function loadGlossary(): GlossaryTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isGlossaryTerm);
  } catch {
    return [];
  }
}

export function saveGlossary(terms: GlossaryTerm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
}

function isGlossaryTerm(value: unknown): value is GlossaryTerm {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    typeof rec.source === 'string' &&
    typeof rec.target === 'string'
  );
}

export function formatGlossaryForPrompt(terms: GlossaryTerm[]): string {
  const rows = terms
    .map((t) => `${t.source.trim()} => ${t.target.trim()}`)
    .filter((row) => !row.startsWith(' =>') && !row.endsWith('=> '));
  if (rows.length === 0) return '';
  return rows.join('\n');
}

export function createGlossaryTerm(source: string, target: string): GlossaryTerm | null {
  const src = source.trim();
  const tgt = target.trim();
  if (!src || !tgt) return null;
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `g-${Date.now()}-${src}`;
  return { id, source: src, target: tgt };
}
