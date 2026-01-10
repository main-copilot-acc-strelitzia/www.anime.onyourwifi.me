import React from 'react';
import { useTheme, ThemeName } from '../../contexts/ThemeContext';

const THEME_LABELS: Record<ThemeName, string> = {
  default: 'Default',
  leblanc: "Le Blanc (League of Legends)",
  luffy: 'Luffy (One Piece)',
};

export default function ThemeSwitcher() {
  const { themeName, setTheme, availableThemes } = useTheme();

  return (
    <div className="theme-switcher p-4 border-b border-theme-border">
      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Theme
      </label>
      <select
        value={themeName}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        className="w-full px-3 py-2 rounded border"
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
          borderColor: 'var(--color-border)',
        }}
      >
        {availableThemes.map((theme) => (
          <option key={theme} value={theme}>
            {THEME_LABELS[theme]}
          </option>
        ))}
      </select>
    </div>
  );
}
