// ============================================================
// LEXORA — Reconstruct readable PDF text from positioned glyphs
// Boarding-pass / wkhtmltopdf files emit one TextItem per letter.
// Joining every item with a space produces "П р и б ы т и е".
// ============================================================

export type PdfGlyph = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL?: boolean;
};

const LINE_Y_RATIO = 0.5;
const SPACE_GAP_RATIO = 0.28;
const COLUMN_GAP_RATIO = 1.35;

function isLetterOrDigit(char: string): boolean {
  return /\p{L}|\p{N}/u.test(char);
}

/**
 * Join per-glyph items using x/y/width so letters stay in words
 * and only real gaps become spaces / new lines.
 */
export function reconstructPdfLines(items: readonly PdfGlyph[]): string {
  const glyphs = items
    .filter((item) => item.str.length > 0)
    .map((item) => {
      const height = item.height > 0 ? item.height : 12;
      const width =
        item.width > 0 ? item.width : height * 0.5 * Math.max(1, [...item.str].length);
      return { ...item, width, height };
    });

  if (glyphs.length === 0) return '';

  const ordered = [...glyphs].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfGlyph[][] = [];

  for (const glyph of ordered) {
    const current = lines[lines.length - 1];
    if (current && current[0]) {
      const ref = current[0];
      const tol = Math.max(3, ref.height * LINE_Y_RATIO);
      if (Math.abs(glyph.y - ref.y) <= tol) {
        current.push(glyph);
        continue;
      }
    }
    lines.push([glyph]);
  }

  const textLines = lines.map((line) => {
    const sorted = [...line].sort((a, b) => a.x - b.x);
    let out = '';
    for (let i = 0; i < sorted.length; i++) {
      const glyph = sorted[i];
      if (!glyph) continue;
      if (i > 0) {
        const prev = sorted[i - 1];
        if (prev && !prev.str.endsWith(' ') && !glyph.str.startsWith(' ')) {
          const gap = glyph.x - (prev.x + prev.width);
          const em = Math.max(prev.height, glyph.height, 8);
          if (gap > em * SPACE_GAP_RATIO) {
            out += gap > em * COLUMN_GAP_RATIO ? '  ' : ' ';
          }
        }
      }
      out += glyph.str;
      if (glyph.hasEOL && i === sorted.length - 1) {
        out = out.trimEnd();
      }
    }
    return out.replace(/[ \t]+$/g, '').trim();
  });

  return textLines.filter((line) => line.length > 0).join('\n');
}

/**
 * Safety net when geometry is missing: "П р и б ы т и е" → "Прибытие".
 * Only collapses a line when most tokens are single letters.
 * Two-or-more spaces stay as a word / column break.
 */
export function collapseSpacedGlyphs(text: string): string {
  return text
    .split('\n')
    .map((line) => collapseSpacedGlyphsInLine(line))
    .join('\n');
}

export function collapseSpacedGlyphsInLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';

  const tokens = trimmed.split(/(\s+)/);
  const words = tokens.filter((t, i) => i % 2 === 0 && t.length > 0);
  if (words.length < 3) return trimmed;

  const singles = words.filter((w) => [...w].length === 1 && isLetterOrDigit(w));
  if (singles.length < 3 || singles.length / words.length < 0.55) {
    return trimmed;
  }

  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;
    if (/^\s+$/.test(token)) {
      const prev = tokens[i - 1] ?? '';
      const next = tokens[i + 1] ?? '';
      const bothSingle =
        [...prev].length === 1 &&
        isLetterOrDigit(prev) &&
        [...next].length === 1 &&
        isLetterOrDigit(next);
      if (bothSingle && token.length === 1) {
        continue;
      }
      out += ' ';
      continue;
    }
    out += token;
  }
  return out.replace(/ {2,}/g, ' ').trim();
}
