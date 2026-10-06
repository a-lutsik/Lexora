import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { WordDetail } from './WordDetail';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { VocabularyEntryDto } from '../../lib/types';

const entry: VocabularyEntryDto = {
  id: 7,
  userId: 1,
  lexemeId: 42,
  addedAt: 1,
  isFavorite: false,
  notes: null,
  source: 'manual',
  lexeme: {
    id: 42,
    languageId: 1,
    text: 'apple',
    normalizedText: 'apple',
    partOfSpeech: 'noun',
    phonetic: null,
    frequencyRank: 120,
    createdAt: 1,
  },
  translations: [
    {
      id: 1,
      lexemeId: 42,
      targetLanguageId: 2,
      translatedText: 'яблоко',
      sense: null,
      confidence: 1,
    },
  ],
  examples: [],
  reviewState: {
    id: 1,
    userVocabularyId: 7,
    status: 'new',
    ease: 2.5,
    interval: 0,
    dueAt: 1,
    lapses: 0,
    repetitions: 0,
  },
};

describe('WordDetail', () => {
  it('renders the saved associated photograph for the vocabulary entry', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_vocabulary_entry') return Promise.resolve(entry);
      if (cmd === 'get_image_path') return Promise.resolve('/tmp/apple.jpg');
      return Promise.resolve(null);
    });

    renderWithQueryClient(
      <MemoryRouter>
        <WordDetail id={7} onClose={() => undefined} />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'apple' })).toBeInTheDocument();
    const img = await screen.findByRole('img', { name: 'Photo of apple' });
    expect(img).toHaveAttribute('src', 'asset://localhost//tmp/apple.jpg');
  });
});
