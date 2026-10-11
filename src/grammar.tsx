// ============================================================
// LEXORA — Writing-check window entry point («Grammarly mode»)
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrammarApp } from './grammar/GrammarApp';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- #root is in grammar.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GrammarApp />
    </QueryClientProvider>
  </React.StrictMode>
);
