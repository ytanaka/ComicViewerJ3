import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

import { TooltipProvider } from './components/ui/tooltip';

import App from './App';
import { RustLibInitializer } from './components/util/RustLibInitializer';

export const myQueryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={myQueryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class">
          <RustLibInitializer>
            <App />
          </RustLibInitializer>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
