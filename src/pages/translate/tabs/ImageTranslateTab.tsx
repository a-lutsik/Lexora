import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Image & OCR Translate Tab
// Supports file upload, Drag-and-Drop, and direct Clipboard
// Paste (Cmd+V / Ctrl+V), with in-place layout bounding box overlays.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useTranslateImageHub } from '../../../hooks/useTranslationHub';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import { fileToBase64, getClipboardImage } from '../../../lib/imageOverlay';
import {
  prepareImageForVision,
  UNREADABLE_IMAGE_MESSAGE,
  type PreparedImage,
} from '../../../lib/imagePrepare';
import { formatIpcError } from '../../../lib/utils';
import { ImageOverlayViewer } from '../components/ImageOverlayViewer';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import type { LexicalDomain } from '../../../lib/translationDomain';

type ImageTranslateTabProps = {
  sourceLang: string;
  targetLang: string;
  lexicalDomain: LexicalDomain;
  onDetectedDomain?: (domain: string | null) => void;
};

export function ImageTranslateTab({
  sourceLang,
  targetLang,
  lexicalDomain,
  onDetectedDomain,
}: ImageTranslateTabProps) {
  const { t: tUi } = useI18n();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [vocabNotice, setVocabNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const translateMutation = useTranslateImageHub();
  const addToVocabMutation = useAddToVocabulary();

  // Clean up object URL when image changes or unmounts
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Global paste handler on window while tab is mounted
  // Paste always uses the latest handler (current languages and state)
  // without re-subscribing on every render.
  const processImageFileRef = useRef<(file: File) => Promise<void>>(async () => undefined);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const file = getClipboardImage(e.clipboardData);
      if (file) {
        e.preventDefault();
        void processImageFileRef.current(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImageFile = async (file: File) => {
    setUploadError(null);
    // Camera photos / HEIC → JPEG ≤ 2048 px, so OCR stays under request limits.
    let prepared: PreparedImage;
    try {
      prepared = await prepareImageForVision(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : UNREADABLE_IMAGE_MESSAGE);
      return;
    }
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const url = URL.createObjectURL(prepared.blob);
    setImageFile(file);
    setImagePreviewUrl(url);

    try {
      const { base64 } = await fileToBase64(prepared.blob);
      translateMutation.mutate({
        req: {
          imageBase64: base64,
          mimeType: prepared.mimeType,
          ...(sourceLang === 'auto' ? {} : { sourceLanguage: sourceLang }),
          targetLanguage: targetLang,
          lexicalDomain,
        },
      }, {
        onSuccess: (data) => {
          onDetectedDomain?.(data.result.detectedLexicalDomain ?? null);
        },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to encode image', err);
      }
      setUploadError('Could not read the image. Try another file or paste a screenshot.');
    }
  };
  processImageFileRef.current = processImageFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleSaveToVocab = (text: string, translation: string) => {
    addToVocabMutation.mutate(
      {
        lexemeId: null,
        text,
        sourceLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
        notes: translation,
        source: 'image-hub',
      },
      {
        onSuccess: () => {
          setVocabNotice(`Saved "${text}" to Vocabulary`);
          window.setTimeout(() => setVocabNotice(null), 2500);
        },
        onError: (err) => {
          setUploadError(formatIpcError(err, tUi("Could not save the vocabulary card.")));
        },
      },
    );
  };

  return (
    <div className="image-translate-tab animate-fade-in">
      {/* Hidden file input */}
      <input dir="auto"
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
        className="sr-only"
        onChange={handleFileChange}
        aria-label={tUi("Upload image or photo for translation")}
      />

      {/* If no image selected, show drag-and-drop dropzone with clipboard paste hint */}
      {!imagePreviewUrl && (
        <div
          className={`translate-drop${isDragOver ? ' is-drag-over' : ''}`}
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
          aria-label={tUi("Upload or paste image")}
        >
          <Icon name="image" size={28} className="translate-drop__icon" />
          <h3 className="translate-drop__title">{tUi("Upload Image or Paste Screenshot")}</h3>
          <p className="translate-drop__desc">{tUi("Drag & drop an image here, click to browse (PNG, JPG, WebP),")}</p>
          <p className="hint translate-drop__hint">
            <Icon name="content_paste" size={16} />{tUi("Press ")}<kbd className="kbd">{tUi("Cmd+V")}</kbd>{tUi(" or ")}<kbd className="kbd">{tUi("Ctrl+V")}</kbd>{tUi(" to paste from clipboard")}</p>
        </div>
      )}

      {uploadError && (
        <p className="inline-error translate-error" role="alert">
          {uploadError}
        </p>
      )}

      {/* If image is selected */}
      {imagePreviewUrl && (
        <div className="image-translate-content">
          {/* Action bar to clear or replace */}
          <div className="translate-file-bar">
            <Icon name="image" size={18} className="translate-file-bar__icon" />
            <span className="translate-file-bar__name">{imageFile?.name ?? tUi("Pasted Screenshot")}</span>
            {imageFile && (
              <span className="translate-file-bar__meta">{(imageFile.size / 1024).toFixed(1)}{tUi(" KB")}</span>
            )}
            <span className="spacer" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="upload_file" size={17} />
              <span>{tUi("Choose Another Image")}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImageFile(null);
                setImagePreviewUrl(null);
                translateMutation.reset();
              }}
            >{tUi("✕ Clear")}</Button>
          </div>

          {/* Loading spinner */}
          {translateMutation.isPending && (
            <div className="translate-status" role="status">
              <span className="translate-spinner" aria-hidden="true" />
              <span>{tUi("Scanning image and translating text with AI Vision...")}</span>
            </div>
          )}

          {/* Error notice */}
          {translateMutation.isError && (
            <p className="inline-error translate-error" role="alert">
              {formatIpcError(
                translateMutation.error,
                tUi("Could not translate this image. Check the AI provider in Settings."),
              )}
            </p>
          )}

          {/* Vocab addition notice */}
          {vocabNotice && (
            <p className="translate-notice animate-slide-up" role="status">
              <Icon name="bookmark_added" size={17} />
              <span>{vocabNotice}</span>
            </p>
          )}

          {/* Result Viewer */}
          {translateMutation.data && (
            <ImageOverlayViewer
              imageUrl={imagePreviewUrl}
              result={translateMutation.data.result}
              onAddToVocabulary={handleSaveToVocab}
            />
          )}
        </div>
      )}
    </div>
  );
}
