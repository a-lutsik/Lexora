// ============================================================
// LEXORA — PDF page-text extraction (pdf.js)
// Uses the real PDF parser (ToUnicode, FlateDecode, encodings)
// instead of scanning the raw file for Tj operators.
// ============================================================

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { reconstructPdfLines, type PdfGlyph } from './pdfTextLayout';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

function glyphFromTextItem(item: TextItem): PdfGlyph {
  const scaleX = item.transform[0] ?? 0;
  const skewY = item.transform[1] ?? 0;
  const scaleY = item.transform[3] ?? 0;
  const x = item.transform[4] ?? 0;
  const y = item.transform[5] ?? 0;
  const fontSize = Math.hypot(scaleX, skewY) || Math.abs(scaleY) || item.height || 12;
  return {
    str: item.str,
    x,
    y,
    width: item.width,
    height: item.height || fontSize,
    hasEOL: item.hasEOL,
  };
}

function itemsToPlainText(items: Array<TextItem | TextMarkedContent>): string {
  const glyphs = items.filter(isTextItem).map(glyphFromTextItem);
  return reconstructPdfLines(glyphs);
}

/**
 * Extract reading-order text from every page. Returns empty string on failure
 * so the caller can try a simpler fallback or reject the file.
 */
export async function extractPdfPageText(data: Uint8Array): Promise<string> {
  const pdf = await getDocument({
    data: data.slice(),
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  }).promise;

  try {
    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = itemsToPlainText(content.items);
      if (text.trim()) pages.push(text);
    }
    return pages.join('\n\n');
  } finally {
    await pdf.destroy();
  }
}
