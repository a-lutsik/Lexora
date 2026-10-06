// ============================================================
// LEXORA — Paste safety for AI output
// Model output can carry injected content from the selected text
// (web page, email, PDF). Before it replaces the source selection:
// strip invisible characters and flag content the source did not have.
// ============================================================

/** Zero-width, bidi controls, BOM and Unicode tag characters (U+E0000–U+E007F). */
const INVISIBLE_CHARS =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\u061C\uFEFF\u{E0000}-\u{E007F}]/gu;

const LINK_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

export type PasteRisk = 'new-link' | 'new-line';

export function stripInvisibleChars(text: string): string {
  return text.replace(INVISIBLE_CHARS, '');
}

function links(text: string): string[] {
  return (text.match(LINK_PATTERN) ?? []).map((link) => link.toLowerCase());
}

function lineBreaks(text: string): number {
  return (text.match(/\n/g) ?? []).length;
}

/** Content in the output that the source text did not contain. */
export function findPasteRisks(source: string, output: string): PasteRisk[] {
  const risks: PasteRisk[] = [];
  const sourceLinks = new Set(links(source));
  if (links(output).some((link) => !sourceLinks.has(link))) risks.push('new-link');
  if (lineBreaks(output) > lineBreaks(source)) risks.push('new-line');
  return risks;
}
