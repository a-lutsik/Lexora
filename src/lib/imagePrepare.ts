// ============================================================
// LEXORA — Prepare photos for vision models
// Big camera photos (12 MP, HEIC) are decoded by WebKit, scaled
// to ≤ 2048 px and re-encoded as JPEG so OCR requests stay well
// under the 20 MB inline limit. Small PNG/JPEG/WebP pass as-is.
// ============================================================

import { normalizeImageMime } from './imageOverlay';

export const VISION_MAX_SIDE = 2048;
/** Below this size a supported image is sent untouched. */
export const VISION_PASSTHROUGH_BYTES = 4 * 1024 * 1024;
/** Inline image budget, leaving room for the prompt in a 20 MB request. */
export const VISION_MAX_BYTES = 18 * 1024 * 1024;
const JPEG_QUALITY = 0.88;
const PASSTHROUGH_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

export const UNREADABLE_IMAGE_MESSAGE =
  'Lexora cannot read this image format here. Save it as JPEG or PNG and try again.';

export type PreparedImage = {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  reencoded: boolean;
};

/** Scale (width, height) down so the longer side is at most `maxSide`. */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest === 0) {
    return { width, height, scaled: false };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  };
}

/** HEIC/TIFF/BMP, heavy files and oversized photos are re-encoded. */
export function needsReencode(type: string, bytes: number, width: number, height: number): boolean {
  const mime = type.split(';')[0]?.trim().toLowerCase() ?? '';
  return (
    !PASSTHROUGH_TYPES.has(mime) ||
    bytes > VISION_PASSTHROUGH_BYTES ||
    Math.max(width, height) > VISION_MAX_SIDE
  );
}

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Some WebKit builds decode HEIC only through <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(UNREADABLE_IMAGE_MESSAGE);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(UNREADABLE_IMAGE_MESSAGE))),
      type,
      quality,
    );
  });
}

export async function prepareImageForVision(file: Blob): Promise<PreparedImage> {
  const image = await decodeImage(file);
  try {
    if (!needsReencode(file.type, file.size, image.width, image.height)) {
      return {
        blob: file,
        mimeType: normalizeImageMime(file.type),
        width: image.width,
        height: image.height,
        reencoded: false,
      };
    }
    const target = fitWithin(image.width, image.height, VISION_MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(UNREADABLE_IMAGE_MESSAGE);
    // JPEG has no alpha: transparent screenshots get a white page, not black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, target.width, target.height);
    ctx.drawImage(image.source, 0, 0, target.width, target.height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (blob.size > VISION_MAX_BYTES) {
      throw new Error('The image is too large even after resizing. Crop it and try again.');
    }
    return {
      blob,
      mimeType: 'image/jpeg',
      width: target.width,
      height: target.height,
      reencoded: true,
    };
  } finally {
    image.release();
  }
}
