import { beforeEach, describe, expect, it } from 'vitest';
import { useVocabularyStore } from './vocabularyStore';
import { DEFAULT_VOCABULARY_FILTERS } from '../lib/constants';

const initialState = useVocabularyStore.getState();

beforeEach(() => {
  useVocabularyStore.setState(initialState, true);
});

describe('vocabularyStore', () => {
  it('starts with default filters', () => {
    expect(useVocabularyStore.getState().filters).toEqual(
      DEFAULT_VOCABULARY_FILTERS
    );
  });

  it('setSearch updates search and resets page to 1', () => {
    useVocabularyStore.getState().setFilters({ page: 5 });
    useVocabularyStore.getState().setSearch('apple');

    const { filters } = useVocabularyStore.getState();
    expect(filters.search).toBe('apple');
    expect(filters.page).toBe(1);
  });

  it('setStatus updates status and resets page to 1', () => {
    useVocabularyStore.getState().setFilters({ page: 3 });
    useVocabularyStore.getState().setStatus('mature');

    const { filters } = useVocabularyStore.getState();
    expect(filters.status).toBe('mature');
    expect(filters.page).toBe(1);
  });

  it('setFilters applies a partial patch without touching other fields', () => {
    useVocabularyStore.getState().setSearch('cat');
    useVocabularyStore.getState().setFilters({ page: 7, sortDir: 'asc' });

    const { filters } = useVocabularyStore.getState();
    expect(filters.page).toBe(7);
    expect(filters.sortDir).toBe('asc');
    expect(filters.search).toBe('cat');
  });

  it('resetFilters restores defaults with the given languageId', () => {
    useVocabularyStore.getState().setSearch('dog');
    useVocabularyStore.getState().setStatus('learning');
    useVocabularyStore.getState().resetFilters(2);

    const { filters } = useVocabularyStore.getState();
    expect(filters).toEqual({ ...DEFAULT_VOCABULARY_FILTERS, languageId: 2 });
  });
});
