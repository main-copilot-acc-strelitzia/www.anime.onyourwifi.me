import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'default' | 'leblanc' | 'luffy';

export interface Theme {
  name: ThemeName;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    sidebar: string;
    text: string;
    border: string;
  };
}

const THEMES: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#f3f4f6',
      sidebar: '#1f2937',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  },
  leblanc: {
    name: 'leblanc',
    colors: {
      primary: '#e0d5f5',
      secondary: '#b59bd6',
      accent: '#8b7ba8',
      background: '#2a2640',
      sidebar: '#1a1428',
      text: '#e0d5f5',
      border: '#4a4270',
    },
  },
  luffy: {
    name: 'luffy',
    colors: {
      primary: '#ff4444',
      secondary: '#ffaa00',
      accent: '#ffdd00',
      background: '#fff8dc',
      sidebar: '#1a1a1a',
      text: '#1a1a1a',
      border: '#ffcc00',
    },
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeName | null;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeName(savedTheme);
    }
    setMounted(true);
  }, []);

  const handleSetTheme = (theme: ThemeName) => {
    setThemeName(theme);
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

  useEffect(() => {
    if (mounted) {
      applyTheme(themeName);
    }
  }, [themeName, mounted]);

  const applyTheme = (theme: ThemeName) => {
    const colors = THEMES[theme].colors;
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: THEMES[themeName],
        themeName,
        setTheme: handleSetTheme,
        availableThemes: Object.keys(THEMES) as ThemeName[],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
