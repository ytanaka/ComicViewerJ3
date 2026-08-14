import React, { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark: boolean) => {
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
    };

    applyTheme(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
