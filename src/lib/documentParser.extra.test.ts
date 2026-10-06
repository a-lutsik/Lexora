import { describe, expect, it } from 'vitest';
import { tokenizeDocumentText, isGlossaryTerm } from './documentTokens';
import { createGlossaryTerm, formatGlossaryForPrompt } from './documentGlossary';
import { exportExtension, parseDocument, reconstructDocument } from './documentParser';
import type { DocumentChunk } from './documentParser';
import {
  clearDocumentSession,
  loadDocumentSession,
  saveDocumentSession,
} from './documentSession';
import {
  isJunkPdfSegment,
  isUsablePdfText,
  PDF_UNREADABLE_ERROR,
} from './pdfTextQuality';

describe('documentTokens', () => {
  it('splits words from punctuation so they can be clicked', () => {
    const tokens = tokenizeDocumentText("Hello, world's end.");
    const words = tokens.filter((t) => t.kind === 'word').map((t) => t.value);
    expect(words).toEqual(['Hello', "world's", 'end']);
  });

  it('matches glossary terms case-insensitively', () => {
    expect(isGlossaryTerm('Lexora', ['lexora', 'SRS'])).toBe(true);
    expect(isGlossaryTerm('apple', ['lexora'])).toBe(false);
  });
});

describe('documentGlossary', () => {
  it('formats locked term pairs for the translation prompt', () => {
    const a = createGlossaryTerm('API', 'API');
    const b = createGlossaryTerm('card', 'карточка');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    if (a && b) {
      expect(formatGlossaryForPrompt([a, b])).toBe('API => API\ncard => карточка');
    }
  });
});

describe('document export', () => {
  it('reconstructs markdown tables with single newlines between rows', () => {
    const chunks: DocumentChunk[] = [
      { id: 1, originalText: '| A | B |', translatedText: '| А | Б |', blockKind: 'table' },
      { id: 2, originalText: '| 1 | 2 |', translatedText: '| 1 | 2 |', blockKind: 'table' },
    ];
    const out = reconstructDocument(chunks, 'md');
    expect(out).toBe('| А | Б |\n| 1 | 2 |');
  });

  it('exports PDF/DOCX as markdown rather than a fake binary', () => {
    expect(exportExtension('pdf', 'original')).toBe('md');
    expect(exportExtension('docx', 'original')).toBe('md');
    expect(exportExtension('srt', 'original')).toBe('srt');
    expect(exportExtension('vtt', 'txt')).toBe('txt');
  });
});

describe('pdf text quality', () => {
  it('rejects wkhtmltopdf metadata and color-space dumps', () => {
    expect(isJunkPdfSegment('þÿBoarding Pass')).toBe(true);
    expect(isJunkPdfSegment('[/ Pattern / DeviceRGB ]')).toBe(true);
    expect(isJunkPdfSegment('201')).toBe(true);
    expect(isJunkPdfSegment('1551')).toBe(true);
    expect(
      isUsablePdfText(
        'þÿBoarding Pass\nCreator ( þÿwkhtmltopdf 0.12.4)\n[/ Pattern / DeviceRGB ]\n201\n1551'
      )
    ).toBe(false);
    expect(
      isUsablePdfText('FLYONE\nBoarding Pass\nYevhen Denysenko\nTbilisi — Chisinau')
    ).toBe(true);
  });
});

function makeSimplePdf(visibleText: string): File {
  const stream = `BT /F1 12 Tf 10 100 Td (${visibleText}) Tj ET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefStart = body.length;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new File([body + xref + trailer], 'boarding-pass.pdf', {
    type: 'application/pdf',
  });
}

describe('PDF extraction', () => {
  it('extracts page text from an uncompressed content stream', async () => {
    const parsed = await parseDocument(makeSimplePdf('Hello World'));
    expect(parsed.fileType).toBe('pdf');
    expect(parsed.chunks.map((c) => c.originalText).join(' ')).toContain('Hello World');
  });

  it('does not treat PDF internals as the document content', async () => {
    const junk = `%PDF-1.4
1 0 obj
<< /Title (\xFE\xFFBoarding Pass) /Creator (\xFE\xFFwkhtmltopdf 0.12.4) /Producer (\xFE\xFFQt 4.8.7) /CreationDate (D:20180728021500) >>
endobj
2 0 obj
[/Pattern /DeviceRGB]
endobj
3 0 obj
<< /Length 11 >>
stream
201 1551 406
endstream
endobj
xref
0 4
0000000000 65535 f 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF
`;
    const file = new File([junk], '5F_G1VDYL_TBSRMO_DENY_Adult1_.pdf', {
      type: 'application/pdf',
    });
    await expect(parseDocument(file)).rejects.toThrow(PDF_UNREADABLE_ERROR);
  });
});

describe('document translation session', () => {
  it('round-trips a translated document and clears on demand', () => {
    saveDocumentSession({
      tone: 'formal',
      doc: {
        fileName: 'pass.pdf',
        fileType: 'pdf',
        totalCharacters: 12,
        chunks: [
          {
            id: 1,
            originalText: 'Boarding Pass',
            translatedText: 'Посадочный талон',
            blockKind: 'paragraph',
          },
        ],
      },
    });
    const loaded = loadDocumentSession();
    expect(loaded?.tone).toBe('formal');
    expect(loaded?.doc.chunks[0]?.translatedText).toBe('Посадочный талон');
    clearDocumentSession();
    expect(loadDocumentSession()).toBeNull();
  });
});
