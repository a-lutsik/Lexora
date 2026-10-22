import './i18n';
// ============================================================
// LEXORA — Writing-check window entry point («Grammarly mode»)
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrammarView } from './grammar/GrammarView';
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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- #root is in grammar.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GrammarView />
    </QueryClientProvider>
  </React.StrictMode>
);
