import { toneLabel } from '../../../lib/interfaceText';
import { getLocale } from '../../../i18n';
import { useI18n } from "../../../hooks/useI18n";
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
const TONE_OPTIONS: ToneOption[] = ['default', 'formal', 'casual', 'academic'];



export function DocumentTranslateTab({
  sourceLang,
  targetLang,
  lexicalDomain,
  onDetectedDomain,
}: DocumentTranslateTabProps) {
  const { t: tUi } = useI18n();
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
            tUi("Could not read this file. Try Markdown, TXT, SRT/VTT, DOCX, or PDF."),
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
            tUi("Could not translate segment {value1}. Check the AI provider in Settings, then retry.", { value1: i + 1 }),
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
      <input dir="auto"
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.srt,.vtt,.docx,.pdf"
        className="sr-only"
        onChange={handleFileChange}
        aria-label={tUi("Upload document file for translation")}
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
          aria-label={tUi("Upload document file")}
        >
          <div className="image-dropzone-icon" aria-hidden="true">
            <IconFile size={40} />
          </div>
          <h3 className="image-dropzone-title">{tUi("Document & PDF Translation")}</h3>
          <p className="image-dropzone-desc text-secondary text-sm">{tUi("Dual-pane editor with structure, glossary, and tone. Drop")}{' '}
            <strong>{tUi(".pdf")}</strong>, <strong>{tUi(".docx")}</strong>, <strong>{tUi(".md")}</strong>,{' '}
            <strong>{tUi(".txt")}</strong>, <strong>{tUi(".srt")}</strong>{tUi(", or ")}<strong>{tUi(".vtt")}</strong>
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
          <p className="doc-studio-alert-msg text-sm">{tUi("Previous document translation restored. Close the file to discard it.")}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRestoredNotice(false)}
            aria-label={tUi("Dismiss restored session notice")}
          >{tUi("Dismiss")}</Button>
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
                    {doc.chunks.length}{tUi(" segments · ")}{doc.totalCharacters.toLocaleString(getLocale())}{tUi(" characters")}</span>
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
                  <span>{tUi("Glossary")}</span>
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
                  aria-label={translatedCount > 0 ? tUi("Re-translate document") : tUi("Start Translation")}
                >
                  <IconSparkles size={14} />
                  <span>{translatedCount > 0 ? tUi("Re-translate") : tUi("Start Translation")}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeFile}
                  aria-label={tUi("Close file")}
                >{tUi("Close file")}</Button>
              </div>
            </div>

            <div className="doc-studio-sub-bar">
              <div className="doc-studio-tone-section">
                <span className="doc-studio-sub-label text-xs text-muted">{tUi("Tone:")}</span>
                <div className="tone-segmented-control" role="group" aria-label={tUi("Translation tone")}>
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn-tone-segment${tone === t ? ' is-active' : ''}`}
                      onClick={() => setTone(t)}
                      disabled={isTranslating}
                    >
                      {toneLabel(t)}
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
                  aria-label={tUi("Copy all translated text")}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  <span>{copied ? tUi("Copied") : tUi("Copy all")}</span>
                </Button>

                <div className="doc-studio-download-group" role="group" aria-label={tUi("Download translated document")}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload('original')}
                    disabled={!canExport}
                    aria-label={tUi("Download translated document")}
                  >
                    <IconDownload size={14} />
                    <span>{tUi("Download translated document")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload('md')}
                    disabled={!canExport}
                    aria-label={tUi("Download as Markdown")}
                  >{tUi(".md")}</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload('txt')}
                    disabled={!canExport}
                    aria-label={tUi("Download as Text")}
                  >{tUi(".txt")}</Button>
                </div>
              </div>
            </div>

            {(isTranslating || progress.current > 0) && (
              <div
                className="doc-studio-progress-container"
                role="status"
                aria-live="polite"
                aria-label={tUi("Translation progress {percent} percent", { percent: percent })}
              >
                <div className="doc-studio-progress-label text-xs text-secondary">
                  <span>
                    {isTranslating
                      ? tUi("Chunking & translating segment {value1} of {value2}…", { value1: progress.current, value2: progress.total })
                      : tUi("Translated {translatedCount} of {value2} segments", { translatedCount: translatedCount, value2: doc.chunks.length })}
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
