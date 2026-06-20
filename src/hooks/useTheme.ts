import { useState, useEffect } from 'react';
import { getTheme, saveTheme } from '@/lib/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = getTheme();
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: 'dark' | 'light') {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  function setTheme(t: 'dark' | 'light') {
    setThemeState(t);
    saveTheme(t);
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
