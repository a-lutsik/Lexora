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
        <div className="image-overlay-modes" role="group" aria-label="Image view mode">
          <button
            type="button"
            className={`btn-toggle ${mode === 'overlay' ? 'is-active' : ''}`}
            onClick={() => setMode('overlay')}
          >
            In-Place Overlay
          </button>
          <button
            type="button"
            className={`btn-toggle ${mode === 'side-by-side' ? 'is-active' : ''}`}
            onClick={() => setMode('side-by-side')}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            className={`btn-toggle ${mode === 'text-only' ? 'is-active' : ''}`}
            onClick={() => setMode('text-only')}
          >
            Extracted Text
          </button>
        </div>

        <div className="image-overlay-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            aria-label="Copy full translated text"
          >
            {copied ? '✓ Copied' : 'Copy Translation'}
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      <div className={`image-overlay-canvas-wrapper is-${mode}`}>
        {mode !== 'text-only' && (
          <div className="image-overlay-image-container">
            <img src={imageUrl} alt="Uploaded document or photo" className="image-overlay-base-img" />

            {/* Bounding box overlays */}
            {mode === 'overlay' &&
              result.blocks.map((block, idx) => {
                if (!block.boundingBox) return null;
                const { x, y, width, height } = block.boundingBox;
                const isSelected = selectedBlock === block;

                return (
                  <div
                    key={idx}
                    className={`image-bbox-chip ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      minHeight: `${Math.max(4, height)}%`,
                    }}
                    onClick={() => setSelectedBlock(block)}
                    title={`Original: ${block.originalText}\nTranslated: ${block.translatedText}`}
                  >
                    <span className="image-bbox-text">
                      <span className="image-bbox-original">{block.originalText}</span>
                      <span className="image-bbox-translated">{block.translatedText}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {(mode === 'side-by-side' || mode === 'text-only') && (
          <div className="image-overlay-text-panel">
            <div className="image-overlay-full-translation">
              <h4 className="text-secondary text-xs uppercase tracking-wide">Full Translation</h4>
              <p className="image-overlay-full-text">{result.fullTranslatedText}</p>
            </div>

            <div className="image-overlay-blocks-list">
              <h4 className="text-secondary text-xs uppercase tracking-wide">
                Detected Text Blocks ({result.blocks.length})
              </h4>
              <div className="image-blocks-grid">
                {result.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`image-block-card ${selectedBlock === block ? 'is-selected' : ''}`}
                    onClick={() => setSelectedBlock(block)}
                  >
                    <div className="image-block-orig text-secondary text-sm">
                      {block.originalText}
                    </div>
                    <div className="image-block-trans text-primary text-sm font-medium">
                      {block.translatedText}
                    </div>
                    {onAddToVocabulary && (
                      <button
                        type="button"
                        className="btn-card-add text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToVocabulary(block.originalText, block.translatedText);
                        }}
                        aria-label={`Save ${block.originalText} to vocabulary`}
                      >
                        + Add to Vocab
                      </button>
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
            <span className="text-secondary text-xs">Original:</span>
            <strong className="text-sm">{selectedBlock.originalText}</strong>
            <span className="text-secondary text-xs">Translated:</span>
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
              >
                + Save as Card
              </Button>
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
