import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Image Overlay Viewer
// Renders the original image with translated text bounding boxes
// directly on top of the original text blocks (preserving form).
// ============================================================

import { useState } from 'react';
import type { ImageTranslationResult, ImageTextBlock } from '../../../lib/types';
import { Button, IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
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

  const modes: ReadonlyArray<{ value: ViewMode; label: string }> = [
    { value: 'overlay', label: tUi("In-Place Overlay") },
    { value: 'side-by-side', label: tUi("Side-by-Side") },
    { value: 'text-only', label: tUi("Extracted Text") },
  ];

  return (
    <div className="image-overlay-viewer animate-fade-in">
      {/* Top Toolbar */}
      <div className="image-overlay-toolbar">
        <div className="seg" role="group" aria-label={tUi("Image view mode")}>
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`seg__item${mode === m.value ? ' is-active' : ''}`}
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <span className="spacer" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyAll}
          aria-label={tUi("Copy full translated text")}
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={17} />
          <span>{copied ? tUi("Copied") : tUi("Copy Translation")}</span>
        </Button>
      </div>

      {/* Main View Area */}
      <div className={`image-overlay-canvas is-${mode}`}>
        {mode !== 'text-only' && (
          <div className="image-overlay-image-container">
            <img src={imageUrl} alt={tUi("Uploaded document")} className="image-overlay-base-img" />

            {/* Bounding box overlays (positions come from OCR data) */}
            {mode === 'overlay' &&
              result.blocks.map((block, idx) => {
                if (!block.boundingBox) return null;
                const { x, y, width, height } = block.boundingBox;
                const isSelected = selectedBlock === block;

                return (
                  <button
                    type="button"
                    key={idx}
                    className={`image-bbox-chip${isSelected ? ' is-selected' : ''}`}
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
            <section className="image-overlay-full">
              <h4 className="section-label">{tUi("Full Translation")}</h4>
              <p className="image-overlay-full__text" dir="auto">{result.fullTranslatedText}</p>
            </section>

            <section className="image-overlay-blocks">
              <h4 className="section-label">{tUi("Detected Text Blocks (")}{result.blocks.length})
              </h4>
              <div className="image-blocks-list">
                {result.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`image-block-card is-hoverable${selectedBlock === block ? ' is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="image-block-select"
                      aria-pressed={selectedBlock === block}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <span className="image-block-orig" dir="auto">{block.originalText}</span>
                      <span className="image-block-trans" dir="auto">{block.translatedText}</span>
                    </button>
                    {onAddToVocabulary && (
                      <IconButton
                        icon={<Icon name="bookmark_add" size={17} />}
                        size="sm"
                        onClick={() => onAddToVocabulary(block.originalText, block.translatedText)}
                        aria-label={tUi("Save {value1} to vocabulary", { value1: block.originalText })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Selected Block Quick Action Bar */}
      {selectedBlock && mode === 'overlay' && (
        <div className="image-overlay-detail animate-slide-up">
          <div className="image-overlay-detail__pair">
            <span className="section-label">{tUi("Original:")}</span>
            <span className="image-overlay-detail__orig" dir="auto">{selectedBlock.originalText}</span>
          </div>
          <div className="image-overlay-detail__pair">
            <span className="section-label">{tUi("Translated:")}</span>
            <span className="image-overlay-detail__trans" dir="auto">{selectedBlock.translatedText}</span>
          </div>
          <span className="spacer" />
          {onAddToVocabulary && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                onAddToVocabulary(selectedBlock.originalText, selectedBlock.translatedText)
              }
            >
              <Icon name="bookmark_add" size={17} />
              <span>{tUi("Add to Vocabulary")}</span>
            </Button>
          )}
          <IconButton
            icon={<Icon name="close" size={17} />}
            size="sm"
            onClick={() => setSelectedBlock(null)}
            aria-label={tUi("Close")}
          />
        </div>
      )}
    </div>
  );
}
