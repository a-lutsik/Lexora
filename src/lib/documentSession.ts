// ============================================================
// LEXORA — Document translation session (local-first)
// Persists the bilingual editor so a refresh / tab switch
// does not drop in-progress or finished translations.
// ============================================================

import type { DocumentBlockKind, DocumentChunk, DocumentFileType, ParsedDocument } from './documentParser';

export const DOCUMENT_SESSION_KEY = 'lexora.doc-translate-session';

export type DocumentSessionTone = 'default' | 'formal' | 'casual' | 'academic';

export type DocumentTranslateSession = {
  version: 1;
  savedAt: number;
  tone: DocumentSessionTone;
  doc: ParsedDocument;
};

const FILE_TYPES: readonly DocumentFileType[] = [
  'txt',
  'md',
  'srt',
  'vtt',
  'docx',
  'pdf',
  'other',
];

const BLOCK_KINDS: readonly DocumentBlockKind[] = [
  'heading',
  'paragraph',
  'list',
  'table',
  'subtitle',
  'code',
  'meta',
];

const TONES: readonly DocumentSessionTone[] = ['default', 'formal', 'casual', 'academic'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFileType(value: unknown): value is DocumentFileType {
  return typeof value === 'string' && (FILE_TYPES as readonly string[]).includes(value);
}

function isBlockKind(value: unknown): value is DocumentBlockKind {
  return typeof value === 'string' && (BLOCK_KINDS as readonly string[]).includes(value);
}

function isTone(value: unknown): value is DocumentSessionTone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}

function isChunk(value: unknown): value is DocumentChunk {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'number' || typeof value.originalText !== 'string') return false;
  if (!isBlockKind(value.blockKind)) return false;
  if (value.translatedText !== undefined && typeof value.translatedText !== 'string') return false;
  if (value.isSubtitle !== undefined && typeof value.isSubtitle !== 'boolean') return false;
  if (value.timestampHeader !== undefined && typeof value.timestampHeader !== 'string') {
    return false;
  }
  if (value.skipTranslate !== undefined && typeof value.skipTranslate !== 'boolean') return false;
  return true;
}

function isParsedDocument(value: unknown): value is ParsedDocument {
  if (!isRecord(value)) return false;
  if (typeof value.fileName !== 'string' || typeof value.totalCharacters !== 'number') {
    return false;
  }
  if (!isFileType(value.fileType)) return false;
  if (!Array.isArray(value.chunks) || !value.chunks.every(isChunk)) return false;
  return true;
}

export function saveDocumentSession(
  session: Pick<DocumentTranslateSession, 'tone' | 'doc'>
): void {
  const payload: DocumentTranslateSession = {
    version: 1,
    savedAt: Date.now(),
    tone: session.tone,
    doc: session.doc,
  };
  try {
    localStorage.setItem(DOCUMENT_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — translation still works in-memory.
  }
}

export function loadDocumentSession(): DocumentTranslateSession | null {
  try {
    const raw = localStorage.getItem(DOCUMENT_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return null;
    if (!isTone(parsed.tone) || !isParsedDocument(parsed.doc)) return null;
    if (typeof parsed.savedAt !== 'number') return null;
    return {
      version: 1,
      savedAt: parsed.savedAt,
      tone: parsed.tone,
      doc: parsed.doc,
    };
  } catch {
    return null;
  }
}

export function clearDocumentSession(): void {
  localStorage.removeItem(DOCUMENT_SESSION_KEY);
}
