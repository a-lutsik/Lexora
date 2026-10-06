// ============================================================
// LEXORA — PDF extraction quality gates
// Rejects Info-dictionary / operator dumps (wkhtmltopdf metadata,
// DeviceRGB, object ids) so the bilingual editor never shows
// PDF internals instead of page text.
// ============================================================

import { collapseSpacedGlyphs } from './pdfTextLayout';

export const PDF_UNREADABLE_ERROR =
  'This PDF appears to be a scanned document or contains no extractable text layer. Please use the "Image & Photo" tab for OCR translation.';

const PDF_INTERNAL_TOKEN =
  /\b(DeviceRGB|DeviceCMYK|DeviceGray|endstream|endobj|startxref|wkhtmltopdf|CreationDate|\/Pattern|\/Type\s*\/(?:Catalog|Page|Pages|Font|XObject)|\/Filter\s*\/FlateDecode)\b/i;

export function letterCount(text: string): number {
  return (text.match(/[A-Za-z\u0400-\u04FF]/g) ?? []).length;
}

export function isJunkPdfSegment(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return true;
  if (/^[\d.\s,/[\]]+$/.test(t)) return true;
  if (t.length < 3 && letterCount(t) === 0) return true;
  if (PDF_INTERNAL_TOKEN.test(t) && letterCount(t) < 24) return true;
  // UTF-16BE BOM leaked as latin1 (þÿ) — typical PDF Info dictionary
  if (/^[þÿ\u00FE\u00FF]/.test(t) && letterCount(t) < 40) return true;
  return false;
}

export function isUsablePdfText(text: string): boolean {
  const letters = letterCount(text);
  if (letters < 8) return false;
  const junkHits =
    text.match(
      /DeviceRGB|DeviceCMYK|endstream|endobj|wkhtmltopdf|startxref|\/Pattern|CreationDate/gi
    )?.length ?? 0;
  if (junkHits === 0) return true;
  const contentLetters = letterCount(text.replace(PDF_INTERNAL_TOKEN, ' '));
  return contentLetters >= Math.max(24, junkHits * 30);
}

export function cleanPdfExtractedText(text: string): string {
  return collapseSpacedGlyphs(
    text
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => !isJunkPdfSegment(line))
      .join('\n')
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
