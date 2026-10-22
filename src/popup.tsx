import './i18n';
// ============================================================
// LEXORA — Popup Window Entry Point
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PopupApp } from './popup/PopupApp';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/global.css';
import { startThemeSync } from './lib/themeSync';

// Тема (light/dark/system) из общего localStorage — до первого рендера, чтобы не мигало;
// дальше окно следует за сменой темы в главном окне (событие Tauri).
startThemeSync();

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
        <PopupApp />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
