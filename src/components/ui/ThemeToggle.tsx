'use client';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className="press w-8 h-8 flex items-center justify-center rounded-full transition-colors"
      style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
