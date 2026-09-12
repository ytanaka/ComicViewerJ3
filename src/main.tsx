import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { enableMapSet } from 'immer';
import { ErrorBoundary } from 'react-error-boundary';

import { TooltipProvider } from './components/ui/tooltip';

import App from './App';
import { RustLibInitializer } from './components/util/RustLibInitializer';
import { myQueryClient } from './lib/query-client';
import { ErrorFallback } from './components/util/ErrorFallback';

// immer で Set, Map を扱うときはこれを呼ぶこと
enableMapSet();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={myQueryClient}>
        <TooltipProvider>
          <ThemeProvider attribute="class">
            <RustLibInitializer>
              <App />
            </RustLibInitializer>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
