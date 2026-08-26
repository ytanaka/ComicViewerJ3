import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

import { TooltipProvider } from './components/ui/tooltip';

import App from './App';
import { TabStateInitializer } from './components/util/TabStateInitializer';
import { RustLibInitializer } from './components/util/RustLibInitializer';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class">
          <RustLibInitializer>
            <TabStateInitializer>
              <App />
            </TabStateInitializer>
          </RustLibInitializer>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
