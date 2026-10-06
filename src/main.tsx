// ============================================================
// LEXORA — Main Entry Point
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/global.css';

function bindViewportBox(): void {
  const sync = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    const width = window.visualViewport?.width ?? window.innerWidth;
    document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
    document.documentElement.style.setProperty('--app-width', `${Math.round(width)}px`);
  };
  sync();
  window.addEventListener('resize', sync);
  window.visualViewport?.addEventListener('resize', sync);
}

bindViewportBox();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false, // Desktop app — no browser focus events
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
