import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createTestQueryClient } from '../test/render';
import { invokeMock } from '../test/mocks';
import { QUERY_KEYS } from '../lib/constants';
import { useAddToVocabulary, useAddVocabularyBatch } from './useVocabulary';

function setup() {
  const client = createTestQueryClient();
  const key = [QUERY_KEYS.VOCABULARY_ENTRY, 42];
  client.setQueryData(key, { categoryId: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, key, wrapper };
}

describe('category changes through add', () => {
  it('refreshes a previously cached detail after explicitly re-adding a word', async () => {
    const { client, key, wrapper } = setup();
    invokeMock.mockResolvedValue({ id: 42, categoryId: 2 });
    const { result } = renderHook(() => useAddToVocabulary(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ lexemeId: 1, text: 'passport', sourceLanguage: 'en', categoryId: 2 }); });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it('refreshes cached details when a bulk add moves existing words', async () => {
    const { client, key, wrapper } = setup();
    invokeMock.mockResolvedValue({ added: 0, skipped: 1, items: [], translateQueued: false });
    const { result } = renderHook(() => useAddVocabularyBatch(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ texts: ['passport'], sourceLanguage: 'en', categoryId: 2 }); });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });
});
