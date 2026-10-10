import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Force light mode: ensure dark class is removed from HTML root
    const root = document.documentElement;
    root.classList.remove('dark');
    try {
      localStorage.setItem('railpeek-theme', 'light');
    } catch {
      // Ignore
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
