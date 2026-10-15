import './i18n';
// ============================================================
// LEXORA — Desktop Sticker Window Entry Point
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StickerApp } from './stickers/StickerApp';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StickerApp />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
