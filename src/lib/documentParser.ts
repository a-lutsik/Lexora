// ============================================================
// LEXORA — Document Parser & Chunker
// Extracts text from TXT, Markdown, SRT/VTT, DOCX, and PDF,
// splits into structure-aware segments, and reconstructs
// translated files (timecodes, headings, lists, tables).
// ============================================================

export type DocumentBlockKind =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'subtitle'
  | 'code'
  | 'meta';

export type DocumentFileType = 'txt' | 'md' | 'srt' | 'vtt' | 'docx' | 'pdf' | 'other';

export type DocumentChunk = {
  id: number;
  originalText: string;
  translatedText?: string;
  isSubtitle?: boolean;
  timestampHeader?: string;
  blockKind: DocumentBlockKind;
  /** Skip LLM — keep original (WEBVTT header, NOTE, code fences). */
  skipTranslate?: boolean;
};

export type ParsedDocument = {
  fileName: string;
  fileType: DocumentFileType;
  chunks: DocumentChunk[];
  totalCharacters: number;
};

import { extractPdfPageText } from './pdfExtract';
import {
  cleanPdfExtractedText,
  isJunkPdfSegment,
  isUsablePdfText,
  letterCount,
  PDF_UNREADABLE_ERROR,
} from './pdfTextQuality';

const MAX_BLOCK_CHARS = 1200;

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return await file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return await file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function detectBlockKind(text: string): DocumentBlockKind {
  const trimmed = text.trim();
  if (!trimmed) return 'paragraph';
  if (/^```/.test(trimmed)) return 'code';
  if (/^#{1,6}\s+\S/.test(trimmed)) return 'heading';
  if (/^\|.+\|/.test(trimmed)) return 'table';
  if (/^(([-*+])|\d+[.)])\s+\S/m.test(trimmed) && !trimmed.includes('\n\n')) {
    return 'list';
  }
  return 'paragraph';
}

/**
 * Split text into semantic chunks (paragraphs, headings, lists, tables, cues)
 * keeping each visual block aligned for the bilingual editor.
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  let fileType: DocumentFileType = 'txt';

  if (extension === 'md' || extension === 'markdown') fileType = 'md';
  else if (extension === 'srt') fileType = 'srt';
  else if (extension === 'vtt') fileType = 'vtt';
  else if (extension === 'docx') fileType = 'docx';
  else if (extension === 'pdf') fileType = 'pdf';

  let rawText = '';

  if (fileType === 'docx') {
    rawText = await extractDocxText(file);
  } else if (fileType === 'pdf') {
    rawText = await extractPdfText(file);
  } else {
    rawText = await readFileAsText(file);
  }

  let chunks = fileType === 'pdf' ? chunkPdfExtractedText(rawText) : chunkDocumentText(rawText, fileType);
  if (fileType === 'pdf') {
    chunks = chunks
      .filter((c) => !isJunkPdfSegment(c.originalText))
      .map((c, index) => ({ ...c, id: index + 1 }));
    const joined = chunks.map((c) => c.originalText).join('\n');
    if (chunks.length === 0 || !isUsablePdfText(joined)) {
      throw new Error(PDF_UNREADABLE_ERROR);
    }
  }
  const totalCharacters = chunks.reduce((acc, c) => acc + c.originalText.length, 0);

  return {
    fileName: file.name,
    fileType,
    chunks,
    totalCharacters,
  };
}

/**
 * Boarding passes and similar form PDFs are many short label lines.
 * Keep each visual line as its own segment so SOURCE matches the page.
 */
export function chunkPdfExtractedText(text: string): DocumentChunk[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return chunkDocumentText(text, 'txt');
  }

  const shortCount = lines.filter((line) => line.length <= 48).length;
  const looksLikeForm = lines.length >= 4 && shortCount / lines.length >= 0.45;
  if (!looksLikeForm) {
    return chunkDocumentText(text, 'txt');
  }

  return lines.map((line, index) => ({
    id: index + 1,
    originalText: line,
    blockKind: detectBlockKind(line),
  }));
}

export function chunkDocumentText(
  text: string,
  fileType: DocumentFileType
): DocumentChunk[] {
  if (fileType === 'srt' || fileType === 'vtt') {
    return parseSubtitles(text, fileType);
  }

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    if (text.trim().length > 0) {
      return [
        {
          id: 1,
          originalText: text.trim(),
          blockKind: detectBlockKind(text),
        },
      ];
    }
    return [];
  }

  const chunks: DocumentChunk[] = [];
  let chunkId = 1;

  for (const para of paragraphs) {
    const kind = detectBlockKind(para);
    if (para.length <= MAX_BLOCK_CHARS) {
      chunks.push({
        id: chunkId++,
        originalText: para,
        blockKind: kind,
        skipTranslate: kind === 'code',
      });
      continue;
    }

    const pieces = splitLongBlock(para);
    for (const piece of pieces) {
      chunks.push({
        id: chunkId++,
        originalText: piece,
        blockKind: kind,
        skipTranslate: kind === 'code',
      });
    }
  }

  return chunks;
}

function splitLongBlock(text: string): string[] {
  const lines = text.split('\n');
  const pieces: string[] = [];
  let current = '';
  for (const line of lines) {
    if (current.length + line.length + 1 > MAX_BLOCK_CHARS && current.length > 0) {
      pieces.push(current);
      current = line;
    } else {
      current = current.length > 0 ? `${current}\n${line}` : line;
    }
  }
  if (current.length > 0) pieces.push(current);
  return pieces;
}

function parseSubtitles(subText: string, fileType: DocumentFileType): DocumentChunk[] {
  const blocks = subText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const chunks: DocumentChunk[] = [];
  let idCounter = 1;

  for (const block of blocks) {
    const upper = block.toUpperCase();
    if (
      (fileType === 'vtt' && (upper === 'WEBVTT' || upper.startsWith('WEBVTT'))) ||
      upper.startsWith('NOTE') ||
      upper.startsWith('STYLE')
    ) {
      chunks.push({
        id: idCounter++,
        originalText: block,
        blockKind: 'meta',
        skipTranslate: true,
      });
      continue;
    }

    const lines = block.split('\n');
    if (lines.length >= 2) {
      const timingIndex = lines.findIndex((l) => l.includes('-->'));
      if (timingIndex !== -1 && timingIndex + 1 < lines.length) {
        const header = lines.slice(0, timingIndex + 1).join('\n');
        const textPayload = lines.slice(timingIndex + 1).join('\n');

        chunks.push({
          id: idCounter++,
          originalText: textPayload,
          isSubtitle: true,
          timestampHeader: header,
          blockKind: 'subtitle',
        });
        continue;
      }
    }

    chunks.push({
      id: idCounter++,
      originalText: block,
      blockKind: 'paragraph',
    });
  }

  return chunks;
}

function sanitizeDocumentText(text: string): string {
  // Remove non-printable control characters (except newline and tab)
  const cleaned = text
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '')
    // Remove PDF internal dictionary & stream markers that might leak
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\b\d+\s+\d+\s+obj\b/gi, ' ')
    .replace(/\bendobj\b/gi, ' ')
    .replace(/\bstream[\s\S]*?endstream\b/gi, ' ')
    .replace(/\b(xref|trailer|startxref)\b[\s\S]*/gi, '')
    .replace(/%PDF-\d+\.\d+/gi, '');

  return cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function decodePdfUnicodeString(str: string): string {
  if (str.length >= 2 && str.charCodeAt(0) === 0xfe && str.charCodeAt(1) === 0xff) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    try {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    } catch {
      return str.slice(2);
    }
  }
  return str;
}

function decodePdfLiteralString(str: string): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      if (next === 'n') {
        result += '\n';
        i += 2;
      } else if (next === 'r') {
        result += '\r';
        i += 2;
      } else if (next === 't') {
        result += '\t';
        i += 2;
      } else if (next === 'b') {
        result += '\b';
        i += 2;
      } else if (next === 'f') {
        result += '\f';
        i += 2;
      } else if (next === '(' || next === ')' || next === '\\') {
        result += next;
        i += 2;
      } else if (/[0-7]/.test(next ?? '')) {
        // Octal escape \ooo
        let octal = '';
        let j = i + 1;
        while (j < str.length && j < i + 4 && /[0-7]/.test(str[j] ?? '')) {
          octal += str[j];
          j++;
        }
        result += String.fromCharCode(parseInt(octal, 8));
        i = j;
      } else {
        result += next;
        i += 2;
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return decodePdfUnicodeString(result);
}

function decodePdfHexString(hex: string): string {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    try {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    } catch {
      // fall through to latin1
    }
  }
  const zeroCount = bytes.reduce((n, b) => n + (b === 0 ? 1 : 0), 0);
  if (bytes.length >= 4 && zeroCount >= bytes.length / 4) {
    try {
      const utf16 = new TextDecoder('utf-16be').decode(bytes);
      if (letterCount(utf16) > letterCount(new TextDecoder('latin1').decode(bytes))) {
        return utf16;
      }
    } catch {
      // fall through to latin1
    }
  }
  return new TextDecoder('latin1').decode(bytes);
}

function extractTextFromPdfContent(content: string): string {
  const extractedLines: string[] = [];

  // Match TJ arrays: [(Hello) 20 (World)] TJ
  const tjArrayMatches = content.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
  for (const match of tjArrayMatches) {
    const inner = match[1] || '';
    let combined = '';
    const itemMatches = inner.matchAll(/(?:\(([\s\S]*?)(?<!\\)\)|<([0-9a-fA-F\s]+)>)/g);
    for (const item of itemMatches) {
      if (item[1] !== undefined) {
        combined += decodePdfLiteralString(item[1]);
      } else if (item[2] !== undefined) {
        combined += decodePdfHexString(item[2]);
      }
    }
    if (combined.trim()) {
      extractedLines.push(combined.trim());
    }
  }

  // Match show-text operators only (not Info-dict strings or color arrays)
  const singleTjMatches = content.matchAll(/(?:\(([\s\S]*?)(?<!\\)\)|<([0-9a-fA-F\s]+)>)\s*Tj/g);
  for (const match of singleTjMatches) {
    if (match[1] !== undefined) {
      const decoded = decodePdfLiteralString(match[1]).trim();
      if (decoded) extractedLines.push(decoded);
    } else if (match[2] !== undefined) {
      const decoded = decodePdfHexString(match[2]).trim();
      if (decoded) extractedLines.push(decoded);
    }
  }

  return extractedLines.join(' ');
}

async function decompressDeflateStream(bytes: Uint8Array): Promise<string | null> {
  try {
    if (typeof DecompressionStream !== 'undefined') {
      let ds: DecompressionStream;
      try {
        ds = new DecompressionStream('deflate');
      } catch {
        ds = new DecompressionStream('deflate-raw');
      }
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
      const decompressedStream = stream.pipeThrough(ds);
      const response = new Response(decompressedStream);
      const buffer = await response.arrayBuffer();
      return new TextDecoder('latin1').decode(buffer);
    }
  } catch {
    // decompression not supported or stream corrupt
  }
  return null;
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const decoder = new TextDecoder('utf-8');
    const bytes = new Uint8Array(buffer);
    const content = decoder.decode(bytes);

    // Extract paragraphs <w:p>
    const pMatches = content.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);
    if (pMatches && pMatches.length > 0) {
      const paras = pMatches
        .map((p) => {
          const tMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (!tMatches) return '';
          return tMatches
            .map((t) => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
            .join('');
        })
        .filter((p) => p.trim().length > 0);

      if (paras.length > 0) {
        return sanitizeDocumentText(paras.join('\n\n'));
      }
    }

    const textMatches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches && textMatches.length > 0) {
      const texts = textMatches
        .map((m) => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
        .filter((t) => t.trim().length > 0);
      return sanitizeDocumentText(texts.join(' '));
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('DOCX extraction error', err);
    }
  }

  throw new Error(
    'Could not extract readable text from this DOCX file. Please export the document as Markdown (.md) or Text (.txt).'
  );
}

type PdfStreamSlice = {
  bytes: Uint8Array;
  isFlate: boolean;
};

/**
 * Slice content streams using /Length from the preceding dictionary.
 * Never scan the whole PDF for Tj — that picks up Info dict / color spaces.
 */
function slicePdfStreams(uint8: Uint8Array, raw: string): PdfStreamSlice[] {
  const streams: PdfStreamSlice[] = [];
  const headerRe = /<<([\s\S]*?)>>\s*stream(\r\n|\n|\r)/g;
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(raw)) !== null) {
    const dict = match[1] ?? '';
    const dataStart = match.index + match[0].length;
    const lengthMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
    if (!lengthMatch) continue;
    const length = Number(lengthMatch[1]);
    if (!Number.isFinite(length) || length <= 0 || dataStart + length > uint8.length) {
      continue;
    }
    streams.push({
      bytes: uint8.slice(dataStart, dataStart + length),
      isFlate: /\/Filter\s*\/FlateDecode/.test(dict),
    });
  }
  return streams;
}

async function extractPdfTextLegacy(uint8: Uint8Array): Promise<string> {
  const rawLatin1 = new TextDecoder('latin1').decode(uint8);
  const collected: string[] = [];

  for (const stream of slicePdfStreams(uint8, rawLatin1)) {
    let content: string | null = null;
    if (stream.isFlate) {
      content = await decompressDeflateStream(stream.bytes);
    } else {
      content = new TextDecoder('latin1').decode(stream.bytes);
    }
    if (!content) continue;
    const streamText = extractTextFromPdfContent(content);
    if (streamText.trim()) collected.push(streamText);
  }

  return cleanPdfExtractedText(sanitizeDocumentText(collected.join('\n\n')));
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await readFileAsArrayBuffer(file);
  const uint8 = new Uint8Array(buffer);

  try {
    const fromPdfJs = cleanPdfExtractedText(await extractPdfPageText(uint8));
    if (isUsablePdfText(fromPdfJs)) {
      return fromPdfJs;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('pdf.js extraction failed, trying stream fallback', err);
    }
  }

  try {
    const legacy = await extractPdfTextLegacy(uint8);
    if (isUsablePdfText(legacy)) {
      return legacy;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('PDF stream extraction error', err);
    }
  }

  throw new Error(PDF_UNREADABLE_ERROR);
}

export function reconstructDocument(
  chunks: DocumentChunk[],
  fileType: DocumentFileType
): string {
  if (fileType === 'srt' || fileType === 'vtt') {
    return chunks
      .map((c) => {
        if (c.skipTranslate || c.blockKind === 'meta') {
          return c.originalText;
        }
        const text = c.translatedText ?? c.originalText;
        if (c.timestampHeader) {
          return `${c.timestampHeader}\n${text}`;
        }
        return text;
      })
      .join('\n\n');
  }

  const parts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const text = chunk.translatedText ?? chunk.originalText;
    const prev = chunks[i - 1];
    if (i > 0 && prev && prev.blockKind === 'table' && chunk.blockKind === 'table') {
      parts[parts.length - 1] = `${parts[parts.length - 1]}\n${text}`;
    } else {
      parts.push(text);
    }
  }
  return parts.join('\n\n');
}

export type ExportFormat = 'original' | 'md' | 'txt';

function mimeForExport(format: DocumentFileType): string {
  if (format === 'md') return 'text/markdown;charset=utf-8';
  if (format === 'srt') return 'application/x-subrip;charset=utf-8';
  if (format === 'vtt') return 'text/vtt;charset=utf-8';
  return 'text/plain;charset=utf-8';
}

export function exportExtension(
  originalType: DocumentFileType,
  format: ExportFormat
): string {
  if (format === 'md') return 'md';
  if (format === 'txt') return 'txt';
  if (originalType === 'pdf' || originalType === 'docx' || originalType === 'other') {
    return 'md';
  }
  return originalType;
}

/**
 * Triggers browser download for translated document.
 */
export function downloadDocument(
  content: string,
  originalFileName: string,
  targetLang: string,
  originalType: DocumentFileType = 'txt',
  format: ExportFormat = 'original'
): void {
  const parts = originalFileName.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  const baseName = parts.join('.') || 'document';
  const ext = exportExtension(originalType, format);
  const newFileName = `${baseName}_${targetLang}.${ext}`;

  const blob = new Blob([content], { type: mimeForExport(ext as DocumentFileType) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = newFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
