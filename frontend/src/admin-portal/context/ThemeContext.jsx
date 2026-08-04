// src/admin-portal/context/ThemeContext.jsx
// Theme preference: "light" | "dark" | "system" (default). Persisted so a
// reload doesn't flash the wrong theme. The resolved theme is applied as
// `data-theme` on the `.admin-portal` root element by AppShell - never on
// <html> - so it can never affect the Tailwind-based student portal sharing
// this document. See tokens.css's header comment for the full reasoning.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'alms-admin-theme';
const ThemeContext = createContext(null);

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return window.localStorage.getItem(STORAGE_KEY) || 'system';
  });
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
