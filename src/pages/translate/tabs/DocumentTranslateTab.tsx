// ============================================================
// LEXORA — Document & PDF Translation studio
// Dual-pane formatted translation (DeepL Pro / Smartcat).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import type { ExportFormat, ParsedDocument, DocumentChunk } from '../../../lib/documentParser';
import { downloadDocument, parseDocument, reconstructDocument } from '../../../lib/documentParser';
import {
  formatGlossaryForPrompt,
  loadGlossary,
  saveGlossary,
  type GlossaryTerm,
} from '../../../lib/documentGlossary';
import {
  clearDocumentSession,
  loadDocumentSession,
  saveDocumentSession,
  type DocumentSessionTone,
} from '../../../lib/documentSession';
import { useTranslateDocChunkHub } from '../../../hooks/useTranslationHub';
import { DocumentBilingualEditor } from '../components/DocumentBilingualEditor';
import { DocumentGlossaryPanel } from '../components/DocumentGlossaryPanel';
import { Button } from '../../../components/ui/Button';
import { copyToClipboard, formatIpcError } from '../../../lib/utils';
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconFile,
  IconSparkles,
} from '../../../components/ui/LuminousIcons';
import type { TranslateDocChunkInput } from '../../../lib/types';
import type { LexicalDomain } from '../../../lib/translationDomain';

type DocumentTranslateTabProps = {
  sourceLang: string;
  targetLang: string;
  lexicalDomain: LexicalDomain;
  onDetectedDomain?: (domain: string | null) => void;
};

type ToneOption = DocumentSessionTone;

const TONE_LABELS: Record<ToneOption, string> = {
  default: 'Standard',
  formal: 'Formal',
  casual: 'Casual',
  academic: 'Academic',
};

export function DocumentTranslateTab({
  sourceLang,
  targetLang,
  lexicalDomain,
  onDetectedDomain,
}: DocumentTranslateTabProps) {
  const [doc, setDoc] = useState<ParsedDocument | null>(
    () => loadDocumentSession()?.doc ?? null
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(() => {
    const restored = loadDocumentSession()?.doc;
    if (!restored) return { current: 0, total: 0 };
    const done = restored.chunks.filter((c) => c.translatedText !== undefined).length;
    return { current: done, total: restored.chunks.length };
  });
  const [activeChunkId, setActiveChunkId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tone, setTone] = useState<ToneOption>(() => loadDocumentSession()?.tone ?? 'default');
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(() => loadGlossary());
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(() => loadDocumentSession() !== null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);
  const translateChunkMutation = useTranslateDocChunkHub();

  useEffect(() => {
    saveGlossary(glossary);
  }, [glossary]);

  useEffect(() => {
    if (!doc) return;
    saveDocumentSession({ doc, tone });
  }, [doc, tone]);

  const handleFile = async (file: File) => {
    setParseError(null);
    setRestoredNotice(false);
    try {
      const parsed = await parseDocument(file);
      setDoc(parsed);
      setProgress({ current: 0, total: parsed.chunks.length });
      setActiveChunkId(null);
    } catch (err) {
        setParseError(
          formatIpcError(
            err,
            'Could not read this file. Try Markdown, TXT, SRT/VTT, DOCX, or PDF.',
          ),
        );
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse document', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const startTranslation = async () => {
    if (!doc || doc.chunks.length === 0) return;

    cancelledRef.current = false;
    setIsTranslating(true);
    const updatedChunks: DocumentChunk[] = doc.chunks.map((c) => ({ ...c }));
    const glossaryPrompt = formatGlossaryForPrompt(glossary);
    let done = 0;

    for (let i = 0; i < updatedChunks.length; i++) {
      if (cancelledRef.current) break;
      const chunk = updatedChunks[i];
      if (!chunk) continue;
      setActiveChunkId(chunk.id);

      if (chunk.skipTranslate) {
        chunk.translatedText = chunk.originalText;
        done += 1;
        setDoc((prev) => (prev ? { ...prev, chunks: [...updatedChunks] } : null));
        setProgress({ current: done, total: updatedChunks.length });
        continue;
      }

      const req: TranslateDocChunkInput = {
        docName: doc.fileName,
        targetLanguage: targetLang,
        content: chunk.originalText,
        lexicalDomain,
      };
      if (sourceLang !== 'auto') {
        req.sourceLanguage = sourceLang;
      }
      if (tone !== 'default') {
        req.tone = tone;
      }
      if (glossaryPrompt) {
        req.glossary = glossaryPrompt;
      }

      try {
        const res = await translateChunkMutation.mutateAsync(req);
        chunk.translatedText = res.translatedContent;
        if (res.detectedLexicalDomain) {
          onDetectedDomain?.(res.detectedLexicalDomain);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error(`Failed to translate chunk ${chunk.id}`, err);
        }
        setParseError(
          formatIpcError(
            err,
            `Could not translate segment ${i + 1}. Check the AI provider in Settings, then retry.`,
          ),
        );
        break;
      }

      done += 1;
      setDoc((prev) => (prev ? { ...prev, chunks: [...updatedChunks] } : null));
      setProgress({ current: done, total: updatedChunks.length });
    }

    setIsTranslating(false);
    setActiveChunkId(null);
  };

  const handleUpdateChunk = (chunkId: number, newTranslation: string) => {
    if (!doc) return;
    setDoc({
      ...doc,
      chunks: doc.chunks.map((c) =>
        c.id === chunkId ? { ...c, translatedText: newTranslation } : c
      ),
    });
  };

  const closeFile = () => {
    cancelledRef.current = true;
    clearDocumentSession();
    setDoc(null);
    setProgress({ current: 0, total: 0 });
    setActiveChunkId(null);
    setIsTranslating(false);
    setParseError(null);
    setRestoredNotice(false);
  };

  const translatedCount = doc?.chunks.filter((c) => c.translatedText !== undefined).length ?? 0;
  const canExport = Boolean(doc && translatedCount > 0);
  const percent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const handleDownload = (format: ExportFormat) => {
    if (!doc) return;
    const content = reconstructDocument(doc.chunks, doc.fileType);
    downloadDocument(content, doc.fileName, targetLang, doc.fileType, format);
  };

  const handleCopyAll = async () => {
    if (!doc) return;
    try {
      const copiedOk = await copyToClipboard(reconstructDocument(doc.chunks, doc.fileType));
      if (!copiedOk) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="document-studio animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.srt,.vtt,.docx,.pdf"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload document file for translation"
      />

      {!doc && (
        <div
          className={`image-dropzone ${isDragOver ? 'is-drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload document file"
        >
          <div className="image-dropzone-icon" aria-hidden="true">
            <IconFile size={40} />
          </div>
          <h3 className="image-dropzone-title">Document &amp; PDF Translation</h3>
          <p className="image-dropzone-desc text-secondary text-sm">
            Dual-pane editor with structure, glossary, and tone. Drop{' '}
            <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.md</strong>,{' '}
            <strong>.txt</strong>, <strong>.srt</strong>, or <strong>.vtt</strong>
          </p>
        </div>
      )}

      {parseError && (
        <div className="doc-studio-alert animate-fade-in" role="alert">
          <span className="doc-studio-alert-icon" aria-hidden="true">⚠️</span>
          <p className="doc-studio-alert-msg text-sm">{parseError}</p>
        </div>
      )}

      {restoredNotice && doc && (
        <div
          className="doc-studio-alert is-info animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <span className="doc-studio-alert-icon" aria-hidden="true">💾</span>
          <p className="doc-studio-alert-msg text-sm">
            Previous document translation restored. Close the file to discard it.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRestoredNotice(false)}
            aria-label="Dismiss restored session notice"
          >
            Dismiss
          </Button>
        </div>
      )}

      {doc && (
        <div className="document-translate-content">
          <header className="doc-studio-header">
            <div className="doc-studio-top-bar">
              <div className="doc-studio-file-info">
                <div className="doc-studio-file-icon-box" aria-hidden="true">
                  <IconFile size={22} />
                </div>
                <div className="doc-studio-file-meta">
                  <div className="doc-studio-file-title-row">
                    <h2 className="doc-studio-filename" title={doc.fileName}>
                      {doc.fileName}
                    </h2>
                    <span className="doc-diff-badge">{doc.fileType.toUpperCase()}</span>
                  </div>
                  <span className="doc-studio-stats text-xs text-secondary">
                    {doc.chunks.length} segments · {doc.totalCharacters.toLocaleString()} characters
                  </span>
                </div>
              </div>

              <div className="doc-studio-primary-actions">
                <Button
                  type="button"
                  variant={glossaryOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setGlossaryOpen((open) => !open)}
                  aria-expanded={glossaryOpen}
                >
                  <span>Glossary</span>
                  {glossary.length > 0 && (
                    <span className="doc-glossary-badge">{glossary.length}</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void startTranslation()}
                  isLoading={isTranslating}
                  disabled={isTranslating}
                  aria-label={translatedCount > 0 ? 'Re-translate document' : 'Start Translation'}
                >
                  <IconSparkles size={14} />
                  <span>{translatedCount > 0 ? 'Re-translate' : 'Start Translation'}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeFile}
                  aria-label="Close file"
                >
                  Close file
                </Button>
              </div>
            </div>

            <div className="doc-studio-sub-bar">
              <div className="doc-studio-tone-section">
                <span className="doc-studio-sub-label text-xs text-muted">Tone:</span>
                <div className="tone-segmented-control" role="group" aria-label="Translation tone">
                  {(Object.keys(TONE_LABELS) as ToneOption[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn-tone-segment${tone === t ? ' is-active' : ''}`}
                      onClick={() => setTone(t)}
                      disabled={isTranslating}
                    >
                      {TONE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="doc-studio-export-section">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCopyAll()}
                  disabled={!canExport}
                  aria-label="Copy all translated text"
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy all'}</span>
                </Button>

                <div className="doc-studio-download-group" role="group" aria-label="Download translated document">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload('original')}
                    disabled={!canExport}
                    aria-label="Download translated document"
                  >
                    <IconDownload size={14} />
                    <span>Download translated document</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload('md')}
                    disabled={!canExport}
                    aria-label="Download as Markdown"
                  >
                    .md
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload('txt')}
                    disabled={!canExport}
                    aria-label="Download as Text"
                  >
                    .txt
                  </Button>
                </div>
              </div>
            </div>

            {(isTranslating || progress.current > 0) && (
              <div
                className="doc-studio-progress-container"
                role="status"
                aria-live="polite"
                aria-label={`Translation progress ${percent} percent`}
              >
                <div className="doc-studio-progress-label text-xs text-secondary">
                  <span>
                    {isTranslating
                      ? `Chunking & translating segment ${progress.current} of ${progress.total}…`
                      : `Translated ${translatedCount} of ${doc.chunks.length} segments`}
                  </span>
                  <span className="doc-studio-progress-percent">{percent}%</span>
                </div>
                <div className="doc-studio-progress-bar-wrap">
                  <div
                    className="doc-studio-progress-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </header>

          {glossaryOpen && (
            <DocumentGlossaryPanel terms={glossary} onChange={setGlossary} />
          )}

          <DocumentBilingualEditor
            doc={doc}
            sourceLang={sourceLang}
            targetLang={targetLang}
            isTranslating={isTranslating}
            activeChunkId={activeChunkId}
            glossarySources={glossary.map((t) => t.source)}
            onUpdateChunkTranslation={handleUpdateChunk}
          />
        </div>
      )}
    </div>
  );
}
