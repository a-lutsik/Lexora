// ============================================================
// LEXORA — useSessionLanguagePair
// ============================================================

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSessionLanguagePair } from './useSessionLanguagePair';

vi.mock('./useSettings', () => ({
  useSettings: () => ({
    data: { primaryLanguage: 'it', interfaceLanguage: 'ru' },
    isSuccess: true,
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useSessionLanguagePair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates from settings without calling update_settings', async () => {
    const { result } = renderHook(() => useSessionLanguagePair(), { wrapper });
    await waitFor(() => {
      expect(result.current.settingsReady).toBe(true);
      expect(result.current.sourceLang).toBe('it');
      expect(result.current.targetLang).toBe('ru');
    });
  });

  it('changing target only updates local state', async () => {
    const { result } = renderHook(() => useSessionLanguagePair(), { wrapper });
    await waitFor(() => expect(result.current.settingsReady).toBe(true));

    act(() => {
      result.current.setTargetLang('en');
    });
    expect(result.current.targetLang).toBe('en');
    expect(result.current.sourceLang).toBe('it');
  });
});
