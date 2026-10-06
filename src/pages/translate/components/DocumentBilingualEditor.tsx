// ============================================================
// LEXORA — Dual-pane bilingual document editor
// Side-by-side source / target with structure, sync highlight,
// clickable tokens, and CAT-style segment gutters.
// ============================================================

import { useMemo, useRef, useState } from 'react';
import type { DocumentChunk, ParsedDocument } from '../../../lib/documentParser';
import { tokenizeDocumentText, isGlossaryTerm } from '../../../lib/documentTokens';
import { DocumentWordInspector } from './DocumentWordInspector';
import { cx } from '../../../lib/utils';

type DocumentBilingualEditorProps = {
  doc: ParsedDocument;
  sourceLang: string;
  targetLang: string;
  isTranslating: boolean;
  activeChunkId: number | null;
  glossarySources: readonly string[];
  onUpdateChunkTranslation: (chunkId: number, newTranslation: string) => void;
};

function kindLabel(kind: DocumentChunk['blockKind']): string {
  if (kind === 'heading') return 'H';
  if (kind === 'list') return '•';
  if (kind === 'table') return '⊞';
  if (kind === 'subtitle') return 'CC';
  if (kind === 'code') return '</>';
  if (kind === 'meta') return 'META';
  return '¶';
}

export function DocumentBilingualEditor({
  doc,
  sourceLang,
  targetLang,
  isTranslating,
  activeChunkId,
  glossarySources,
  onUpdateChunkTranslation,
}: DocumentBilingualEditorProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const highlightId = focusedId ?? activeChunkId;

  const syncScroll = (from: 'left' | 'right') => {
    if (syncingRef.current) return;
    const sourceEl = from === 'left' ? leftRef.current : rightRef.current;
    const targetEl = from === 'left' ? rightRef.current : leftRef.current;
    if (!sourceEl || !targetEl) return;
    const max = sourceEl.scrollHeight - sourceEl.clientHeight;
    const ratio = max <= 0 ? 0 : sourceEl.scrollTop / max;
    syncingRef.current = true;
    const targetMax = targetEl.scrollHeight - targetEl.clientHeight;
    targetEl.scrollTop = ratio * Math.max(0, targetMax);
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  const scrollPairIntoView = (chunkId: number) => {
    const selector = `[data-doc-seg="${chunkId}"]`;
    leftRef.current?.querySelector(selector)?.scrollIntoView({ block: 'nearest' });
    rightRef.current?.querySelector(selector)?.scrollIntoView({ block: 'nearest' });
  };

  const translatedCount = doc.chunks.filter((c) => c.translatedText !== undefined).length;

  return (
    <div className={cx('doc-bilingual', Boolean(selectedWord) && 'doc-bilingual--has-inspector')}>
      <div className="doc-bilingual-panes">
        <section className="doc-pane" aria-label="Source document">
          <header className="doc-pane-header">
            <div className="doc-pane-header-left">
              <span className="doc-pane-kicker">SOURCE</span>
              <span className="doc-pane-lang-pill">{sourceLang === 'auto' ? 'Auto' : sourceLang.toUpperCase()}</span>
            </div>
            <span className="text-muted text-xs font-mono">{doc.chunks.length} segments</span>
          </header>
          <div
            ref={leftRef}
            className="doc-pane-scroll"
            onScroll={() => syncScroll('left')}
          >
            {doc.chunks.map((chunk) => (
              <SourceSegment
                key={chunk.id}
                chunk={chunk}
                isActive={highlightId === chunk.id}
                glossarySources={glossarySources}
                onFocus={() => {
                  setFocusedId(chunk.id);
                  scrollPairIntoView(chunk.id);
                }}
                onSelectWord={setSelectedWord}
              />
            ))}
          </div>
        </section>

        <section className="doc-pane doc-pane--target" aria-label="Translated document">
          <header className="doc-pane-header">
            <div className="doc-pane-header-left">
              <span className="doc-pane-kicker">TARGET</span>
              <span className="doc-pane-lang-pill doc-pane-lang-pill--target">{targetLang.toUpperCase()}</span>
            </div>
            <span className="text-muted text-xs font-mono">
              {translatedCount} / {doc.chunks.length} translated
            </span>
          </header>
          <div
            ref={rightRef}
            className="doc-pane-scroll"
            onScroll={() => syncScroll('right')}
          >
            {doc.chunks.map((chunk) => (
              <TargetSegment
                key={chunk.id}
                chunk={chunk}
                isActive={highlightId === chunk.id}
                isTranslating={isTranslating}
                onFocus={() => {
                  setFocusedId(chunk.id);
                  scrollPairIntoView(chunk.id);
                }}
                onChange={(value) => onUpdateChunkTranslation(chunk.id, value)}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedWord && (
        <DocumentWordInspector
          word={selectedWord}
          sourceLanguage={sourceLang}
          targetLanguage={targetLang}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}

type SourceSegmentProps = {
  chunk: DocumentChunk;
  isActive: boolean;
  glossarySources: readonly string[];
  onFocus: () => void;
  onSelectWord: (word: string) => void;
};

function SourceSegment({
  chunk,
  isActive,
  glossarySources,
  onFocus,
  onSelectWord,
}: SourceSegmentProps) {
  const tokens = useMemo(() => tokenizeDocumentText(chunk.originalText), [chunk.originalText]);

  return (
    <article
      data-doc-seg={chunk.id}
      className={cx(
        'doc-seg',
        `doc-seg--${chunk.blockKind}`,
        isActive && 'is-active'
      )}
    >
      <span className="doc-seg-gutter" aria-hidden="true">
        <span className="doc-seg-index">{String(chunk.id).padStart(2, '0')}</span>
        <span className="doc-seg-kind">{kindLabel(chunk.blockKind)}</span>
      </span>
      <div className="doc-seg-body">
        {chunk.timestampHeader && (
          <div className="doc-seg-cue">{chunk.timestampHeader}</div>
        )}
        <p className="doc-seg-text">
          {tokens.map((token, i) => {
            if (token.kind !== 'word') {
              return <span key={`${chunk.id}-s-${i}`}>{token.value}</span>;
            }
            const glossary = isGlossaryTerm(token.value, glossarySources);
            return (
              <button
                key={`${chunk.id}-s-${i}`}
                type="button"
                className={cx('doc-token', glossary && 'doc-token--glossary')}
                onClick={() => {
                  onFocus();
                  onSelectWord(token.value);
                }}
                onFocus={onFocus}
              >
                {token.value}
              </button>
            );
          })}
        </p>
      </div>
    </article>
  );
}

type TargetSegmentProps = {
  chunk: DocumentChunk;
  isActive: boolean;
  isTranslating: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
};

function TargetSegment({
  chunk,
  isActive,
  isTranslating,
  onFocus,
  onChange,
}: TargetSegmentProps) {
  const translated = chunk.translatedText;

  if (translated === undefined) {
    return (
      <article
        data-doc-seg={chunk.id}
        className={cx('doc-seg', 'doc-seg--pending', `doc-seg--${chunk.blockKind}`, isActive && 'is-active')}
      >
        <span className="doc-seg-gutter" aria-hidden="true">
          <span className="doc-seg-index">{String(chunk.id).padStart(2, '0')}</span>
          <span className="doc-seg-kind">{kindLabel(chunk.blockKind)}</span>
        </span>
        <div className="doc-seg-body">
          <div className="doc-seg-placeholder-wrap">
            <span className={cx('doc-seg-placeholder', isTranslating && isActive && 'is-shimmer')}>
              {chunk.skipTranslate
                ? 'Kept as original (code/meta)'
                : isTranslating && isActive
                  ? '✨ Translating this segment…'
                  : isTranslating
                    ? 'In queue…'
                    : 'Awaiting translation…'}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      data-doc-seg={chunk.id}
      className={cx('doc-seg', `doc-seg--${chunk.blockKind}`, isActive && 'is-active')}
    >
      <span className="doc-seg-gutter" aria-hidden="true">
        <span className="doc-seg-index">{String(chunk.id).padStart(2, '0')}</span>
        <span className="doc-seg-kind">{kindLabel(chunk.blockKind)}</span>
      </span>
      <div className="doc-seg-body">
        {chunk.timestampHeader && (
          <div className="doc-seg-cue">{chunk.timestampHeader}</div>
        )}
        <label className="sr-only" htmlFor={`doc-seg-edit-${chunk.id}`}>
          Edit translated segment {chunk.id}
        </label>
        <textarea
          id={`doc-seg-edit-${chunk.id}`}
          className="doc-seg-textarea"
          value={translated}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          rows={Math.max(1, Math.min(10, translated.split('\n').length))}
          readOnly={Boolean(chunk.skipTranslate)}
          placeholder="Translated content..."
        />
      </div>
    </article>
  );
}
