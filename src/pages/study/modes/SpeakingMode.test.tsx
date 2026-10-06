import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpeakingMode } from './SpeakingMode';
import { invokeMock } from '../../../test/mocks';
import { renderWithQueryClient } from '../../../test/render';
import type { VocabularyEntryDto } from '../../../lib/types';

function makeEntry(): VocabularyEntryDto {
  return {
    id: 1,
    userId: 1,
    lexemeId: 10,
    addedAt: 1700000000,
    isFavorite: false,
    notes: null,
    source: null,
    lexeme: {
      id: 10,
      languageId: 1,
      text: 'think',
      normalizedText: 'think',
      partOfSpeech: 'verb',
      frequencyRank: 80,
      phonetic: '/θɪŋk/',
      createdAt: 1700000000,
    },
    translations: [
      {
        id: 100,
        lexemeId: 10,
        targetLanguageId: 2,
        translatedText: 'думать',
        sense: null,
        confidence: 0.9,
      },
    ],
    examples: [],
    synonyms: [],
    reviewState: {
      id: 5,
      userVocabularyId: 1,
      status: 'review',
      ease: 2.5,
      interval: 7,
      dueAt: 1700000000,
      lapses: 0,
      repetitions: 3,
    },
  };
}

describe('SpeakingMode', () => {
  it('shows the target word, IPA, and a record control', () => {
    invokeMock.mockResolvedValue(null);
    renderWithQueryClient(
      <SpeakingMode entry={makeEntry()} onComplete={vi.fn()} />
    );

    expect(screen.getByText('Say this word aloud:')).toBeInTheDocument();
    expect(screen.getByText('think')).toBeInTheDocument();
    expect(screen.getByText('/θɪŋk/')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record pronunciation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play model pronunciation' })).toBeInTheDocument();
  });
});
