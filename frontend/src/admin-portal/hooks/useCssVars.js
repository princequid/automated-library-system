// src/admin-portal/hooks/useCssVars.js
// Recharts writes colours as SVG presentation attributes (fill="...",
// stroke="..."), where CSS var() is not reliably honoured across browsers -
// unlike a `style` property, a presentation attribute's value is taken
// literally. This resolves a list of token names to their computed hex/rgb
// values, and re-reads whenever the theme changes, so a chart repaints with
// real colours instead of a computed-value fallback.
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * @param {string[]} tokenNames e.g. ['--color-primary', '--color-danger-text']
 * @returns {Record<string,string>} token name -> resolved colour value
 */
export function useCssVars(tokenNames) {
  const { theme } = useTheme();
  const rootRef = useRef(null);
  const [values, setValues] = useState({});
  const key = tokenNames.join(',');

  useEffect(() => {
    const root = document.querySelector('.admin-portal') || document.documentElement;
    rootRef.current = root;
    const computed = getComputedStyle(root);
    const next = {};
    for (const name of tokenNames) {
      next[name] = computed.getPropertyValue(name).trim();
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, theme]);

  return values;
}
