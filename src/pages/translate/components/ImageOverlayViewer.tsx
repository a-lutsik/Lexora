import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Image Overlay Viewer
// Renders the original image with translated text bounding boxes
// directly on top of the original text blocks (preserving form).
// ============================================================

import { useState } from 'react';
import type { ImageTranslationResult, ImageTextBlock } from '../../../lib/types';
import { Button } from '../../../components/ui/Button';
import { copyToClipboard } from '../../../lib/utils';

type ViewMode = 'overlay' | 'side-by-side' | 'text-only';

type ImageOverlayViewerProps = {
  imageUrl: string;
  result: ImageTranslationResult;
  onAddToVocabulary?: (text: string, translation: string) => void;
};

export function ImageOverlayViewer({
  imageUrl,
  result,
  onAddToVocabulary,
}: ImageOverlayViewerProps) {
  const { t: tUi } = useI18n();
  const [mode, setMode] = useState<ViewMode>('overlay');
  const [copied, setCopied] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ImageTextBlock | null>(null);

  const handleCopyAll = async () => {
    try {
      const copiedOk = await copyToClipboard(result.fullTranslatedText);
      if (!copiedOk) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="image-overlay-viewer animate-fade-in">
      {/* Top Toolbar */}
      <div className="image-overlay-toolbar">
        <div className="image-overlay-modes" role="group" aria-label={tUi("Image view mode")}>
          <button
            type="button"
            className={`btn-toggle ${mode === 'overlay' ? 'is-active' : ''}`}
            onClick={() => setMode('overlay')}
          >{tUi("In-Place Overlay")}</button>
          <button
            type="button"
            className={`btn-toggle ${mode === 'side-by-side' ? 'is-active' : ''}`}
            onClick={() => setMode('side-by-side')}
          >{tUi("Side-by-Side")}</button>
          <button
            type="button"
            className={`btn-toggle ${mode === 'text-only' ? 'is-active' : ''}`}
            onClick={() => setMode('text-only')}
          >{tUi("Extracted Text")}</button>
        </div>

        <div className="image-overlay-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            aria-label={tUi("Copy full translated text")}
          >
            {copied ? tUi("✓ Copied") : tUi("Copy Translation")}
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      <div className={`image-overlay-canvas-wrapper is-${mode}`}>
        {mode !== 'text-only' && (
          <div className="image-overlay-image-container">
            <img src={imageUrl} alt={tUi("Uploaded document")} className="image-overlay-base-img" />

            {/* Bounding box overlays */}
            {mode === 'overlay' &&
              result.blocks.map((block, idx) => {
                if (!block.boundingBox) return null;
                const { x, y, width, height } = block.boundingBox;
                const isSelected = selectedBlock === block;

                return (
                  <button
                    type="button"
                    key={idx}
                    className={`image-bbox-chip ${isSelected ? 'is-selected' : ''}`}
                    aria-pressed={isSelected}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      minHeight: `${Math.max(4, height)}%`,
                    }}
                    onClick={() => setSelectedBlock(block)}
                    title={tUi("Original: {value1}\nTranslated: {value2}", { value1: block.originalText, value2: block.translatedText })}
                  >
                    <span className="image-bbox-text">
                      <span className="image-bbox-original">{block.originalText}</span>
                      <span className="image-bbox-translated">{block.translatedText}</span>
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {(mode === 'side-by-side' || mode === 'text-only') && (
          <div className="image-overlay-text-panel">
            <div className="image-overlay-full-translation">
              <h4 className="text-secondary text-xs uppercase tracking-wide">{tUi("Full Translation")}</h4>
              <p className="image-overlay-full-text">{result.fullTranslatedText}</p>
            </div>

            <div className="image-overlay-blocks-list">
              <h4 className="text-secondary text-xs uppercase tracking-wide">{tUi("Detected Text Blocks (")}{result.blocks.length})
              </h4>
              <div className="image-blocks-grid">
                {result.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`image-block-card ${selectedBlock === block ? 'is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="image-block-select"
                      aria-pressed={selectedBlock === block}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <span className="image-block-orig text-secondary text-sm">
                        {block.originalText}
                      </span>
                      <span className="image-block-trans text-primary text-sm font-medium">
                        {block.translatedText}
                      </span>
                    </button>
                    {onAddToVocabulary && (
                      <button
                        type="button"
                        className="btn-card-add text-xs"
                        onClick={() => onAddToVocabulary(block.originalText, block.translatedText)}
                        aria-label={tUi("Save {value1} to vocabulary", { value1: block.originalText })}
                      >{tUi("+ Add to Vocab")}</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Block Quick Action Bar */}
      {selectedBlock && mode === 'overlay' && (
        <div className="image-overlay-detail-bar animate-slide-up">
          <div className="image-detail-content">
            <span className="text-secondary text-xs">{tUi("Original:")}</span>
            <strong className="text-sm">{selectedBlock.originalText}</strong>
            <span className="text-secondary text-xs">{tUi("Translated:")}</span>
            <strong className="text-sm text-accent">{selectedBlock.translatedText}</strong>
          </div>
          <div className="image-detail-actions">
            {onAddToVocabulary && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onAddToVocabulary(selectedBlock.originalText, selectedBlock.translatedText)
                }
              >{tUi("+ Save as Card")}</Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedBlock(null)}>
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
