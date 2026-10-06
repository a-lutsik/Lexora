// ============================================================
// LEXORA — Image & Clipboard OCR Overlay Helper
// Handles image-to-base64 conversion, clipboard image paste,
// and bounding box geometry scaling for OCR in-place overlays.
// ============================================================

import type { BoundingBox } from './types';

const SUPPORTED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

/** Normalize clipboard/file MIME for vision APIs (empty type → PNG). */
export function normalizeImageMime(mime: string | undefined | null, fallback = 'image/png'): string {
  const raw = (mime ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (raw === 'image/jpg') return 'image/jpeg';
  if (SUPPORTED_IMAGE_MIME.has(raw)) return raw;
  return fallback;
}

export async function fileToBase64(
  file: File | Blob
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      if (!base64 || !header) {
        reject(new Error('Invalid base64 conversion'));
        return;
      }
      const mimeMatch = header.match(/:(.*?);/);
      const fromHeader = mimeMatch?.[1] ?? '';
      const fromBlob = 'type' in file ? file.type : '';
      const mimeType = normalizeImageMime(fromHeader || fromBlob);
      resolve({ base64, mimeType });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts an image file from clipboard items if present (e.g. on Cmd+V paste).
 * Screenshot paste often arrives as image/png with a generic name like image.png.
 */
export function getClipboardImage(dataTransfer: DataTransfer): File | null {
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      return ensureNamedImageFile(file, item.type);
    }
  }
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (file && (file.type.startsWith('image/') || looksLikeImageName(file.name))) {
      return ensureNamedImageFile(file, file.type);
    }
  }
  return null;
}

function looksLikeImageName(name: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

function ensureNamedImageFile(file: File, declaredType: string): File {
  const mimeType = normalizeImageMime(declaredType || file.type);
  if (file.type === mimeType && file.name) {
    return file;
  }
  return new File([file], file.name || 'image.png', { type: mimeType, lastModified: file.lastModified });
}

/**
 * Computes pixel bounding coordinates relative to the rendered image container
 */
export function calculateScaledBBox(
  box: BoundingBox,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number; width: number; height: number } {
  // Coordinates in box are normalized percentages 0..100
  const left = Math.max(0, (box.x / 100) * containerWidth);
  const top = Math.max(0, (box.y / 100) * containerHeight);
  const width = Math.min(containerWidth - left, Math.max(10, (box.width / 100) * containerWidth));
  const height = Math.min(containerHeight - top, Math.max(10, (box.height / 100) * containerHeight));

  return { left, top, width, height };
}
