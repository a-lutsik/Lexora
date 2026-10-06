import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DocumentTranslateTab } from './DocumentTranslateTab';
import { invokeMock } from '../../../test/mocks';
import { renderWithQueryClient } from '../../../test/render';
import { saveDocumentSession } from '../../../lib/documentSession';

describe('DocumentTranslateTab', () => {
  it('opens a dual-pane studio, applies glossary, and downloads after chunk translation', async () => {
    const user = userEvent.setup();
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'translate_document_chunk_hub') {
        return Promise.resolve({
          sourceLanguage: 'en',
          targetLanguage: 'ru',
          translatedContent: 'Переведенный фрагмент документа.',
        });
      }
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <DocumentTranslateTab sourceLang="en" targetLang="ru" lexicalDomain="auto" />
    );

    const file = new File(
      ['# Hello\n\nWelcome to Lexora.'],
      'notes.md',
      { type: 'text/markdown' }
    );
    await user.upload(
      screen.getByLabelText('Upload document file for translation'),
      file
    );

    expect(await screen.findByText('notes.md')).toBeInTheDocument();
    expect(screen.getByLabelText('Source document')).toBeInTheDocument();
    expect(screen.getByLabelText('Translated document')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Formal' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Glossary' }));
    await user.type(screen.getByLabelText('Source term'), 'Lexora');
    await user.type(screen.getByLabelText('Target term'), 'Лексора');
    await user.click(screen.getByRole('button', { name: 'Add term' }));
    expect(screen.getByText('Лексора')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Translation' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        'translate_document_chunk_hub',
        expect.objectContaining({
          req: expect.objectContaining({
            docName: 'notes.md',
            targetLanguage: 'ru',
            glossary: 'Lexora => Лексора',
            lexicalDomain: 'auto',
          }),
        })
      );
    });

    expect(
      await screen.findAllByDisplayValue('Переведенный фрагмент документа.')
    ).not.toHaveLength(0);
    expect(
      screen.getByRole('button', { name: 'Download translated document' })
    ).toBeEnabled();
  });

  it('restores a previously saved document translation', async () => {
    saveDocumentSession({
      tone: 'formal',
      doc: {
        fileName: '5F_G1VDYL_TBSRMO_DENY_Adult1_.pdf',
        fileType: 'pdf',
        totalCharacters: 14,
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

    renderWithQueryClient(
      <DocumentTranslateTab sourceLang="auto" targetLang="ru" lexicalDomain="auto" />
    );

    expect(
      await screen.findByText('5F_G1VDYL_TBSRMO_DENY_Adult1_.pdf')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Посадочный талон')).toBeInTheDocument();
    expect(
      screen.getByText(/Previous document translation restored/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Formal' })).toHaveClass('is-active');
    expect(
      screen.getByRole('button', { name: 'Download translated document' })
    ).toBeEnabled();
  });
});
