// ============================================================
// LEXORA — Stage 4 Unit Tests (Multimodal Translation Hub)
// Tests document parser, subtitle timing preservation,
// and image bounding box coordinate calculators.
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseDocument, reconstructDocument } from '../lib/documentParser';
import { calculateScaledBBox } from '../lib/imageOverlay';

describe('documentParser', () => {
    it('parses plain text into paragraphs', async () => {
    const content = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
    const file = new File([content], 'sample.txt', { type: 'text/plain' });

    const parsed = await parseDocument(file);
    expect(parsed.fileName).toBe('sample.txt');
    expect(parsed.fileType).toBe('txt');
    expect(parsed.chunks.length).toBe(3);
    expect(parsed.chunks[0]?.originalText).toBe('Paragraph 1');
    expect(parsed.chunks[0]?.blockKind).toBe('paragraph');
  });

  it('keeps markdown headings, lists, and tables as aligned segments', async () => {
    const content = `# Title

Intro paragraph.

- First item
- Second item

| Name | Qty |
| ---- | --- |
| Apple | 2 |`;
    const file = new File([content], 'spec.md', { type: 'text/markdown' });
    const parsed = await parseDocument(file);

    const kinds = parsed.chunks.map((c) => c.blockKind);
    expect(kinds).toContain('heading');
    expect(kinds).toContain('list');
    expect(kinds).toContain('table');
    expect(parsed.chunks[0]?.originalText).toBe('# Title');
  });

  it('parses and preserves SubRip (.srt) timestamp headers', async () => {
    const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello and welcome to Lexora.

2
00:00:05,000 --> 00:00:08,000
This is multimodal AI translation.`;

    const file = new File([srtContent], 'subtitles.srt', { type: 'text/plain' });
    const parsed = await parseDocument(file);

    expect(parsed.fileType).toBe('srt');
    expect(parsed.chunks.length).toBe(2);
    expect(parsed.chunks[0]?.isSubtitle).toBe(true);
    expect(parsed.chunks[0]?.timestampHeader).toContain('00:00:01,000 --> 00:00:04,000');
    expect(parsed.chunks[0]?.originalText).toBe('Hello and welcome to Lexora.');

    // Reconstruct with translations
    const chunk0 = parsed.chunks[0];
    const chunk1 = parsed.chunks[1];
    if (chunk0) chunk0.translatedText = 'Здравствуйте и добро пожаловать в Lexora.';
    if (chunk1) chunk1.translatedText = 'Это мультимодальный AI-перевод.';

    const reconstructed = reconstructDocument(parsed.chunks, 'srt');
    expect(reconstructed).toContain('00:00:01,000 --> 00:00:04,000\nЗдравствуйте и добро пожаловать в Lexora.');
    expect(reconstructed).toContain('00:00:05,000 --> 00:00:08,000\nЭто мультимодальный AI-перевод.');
  });
});

describe('imageOverlay', () => {
  it('calculates scaled bounding box coordinates accurately', () => {
    const bbox = { x: 10, y: 20, width: 50, height: 30 };
    const scaled = calculateScaledBBox(bbox, 800, 600);

    expect(scaled.left).toBe(80);
    expect(scaled.top).toBe(120);
    expect(scaled.width).toBe(400);
    expect(scaled.height).toBe(180);
  });

  it('clamps coordinates within image bounds', () => {
    const bbox = { x: 90, y: 90, width: 40, height: 40 };
    const scaled = calculateScaledBBox(bbox, 500, 500);

    expect(scaled.left).toBe(450);
    expect(scaled.top).toBe(450);
    expect(scaled.width).toBe(50); // Clamped so left + width <= 500
    expect(scaled.height).toBe(50);
  });
});
