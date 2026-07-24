// FILE: src/components/ui/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark is the default, matching the blocking script in layout.tsx.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // Sync state to whatever the blocking script already applied on load,
    // without re-touching the DOM class (avoids a flash/mismatch on mount).
    setTheme(saved ?? preferred);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    // CSS is built around :root (dark default) + a .light override class.
    // This MUST match the blocking script in layout.tsx and globals.css.
    document.documentElement.classList.toggle('light', t === 'light');
    localStorage.setItem('theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
