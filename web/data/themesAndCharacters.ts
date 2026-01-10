/**
 * Consolidated Theme & Character Configuration
 * Merged from config/themes.ts and data/characters.ts
 * All theme, character, and wallpaper data in one place
 */

export type ThemeName = 'default' | 'leblanc' | 'luffy';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  sidebar: string;
  text: string;
  border: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  colors: ThemeColors;
  wallpaperPath: string;
}

export interface CharacterTheme {
  id: string;
  name: string;
  source: string;
  description: string;
  archetype: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  wallpapers: Record<ThemeName, string>; // Wallpaper paths per theme
  tags: string[];
}

/**
 * Global Themes - Available for the website
 */
export const THEMES: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    label: 'Default',
    description: 'Clean and modern default theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#f3f4f6',
      sidebar: '#1f2937',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    wallpaperPath: '/wallpapers/default',
  },
  leblanc: {
    name: 'leblanc',
    label: 'Le Blanc',
    description: 'Elegant purple and dark theme',
    colors: {
      primary: '#9333ea',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#1e1b4b',
      sidebar: '#312e81',
      text: '#f3e8ff',
      border: '#6d28d9',
    },
    wallpaperPath: '/wallpapers/leblanc',
  },
  luffy: {
    name: 'luffy',
    label: 'Luffy',
    description: 'Vibrant red and adventure theme',
    colors: {
      primary: '#dc2626',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: '#7f1d1d',
      sidebar: '#991b1b',
      text: '#fef2f2',
      border: '#b91c1c',
    },
    wallpaperPath: '/wallpapers/luffy',
  },
};

/**
 * Character Database with Theme Wallpapers
 * Characters can have different wallpapers per theme
 */
export const characters: CharacterTheme[] = [
  // Example character with theme-specific wallpapers
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    source: 'One Piece',
    description: 'The main protagonist who dreams of becoming the Pirate King',
    archetype: 'Hero/Captain',
    colors: {
      primary: '#dc2626',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: '#1f2937',
      text: '#fef2f2',
    },
    wallpapers: {
      default: '/wallpapers/default/luffy.jpg',
      leblanc: '/wallpapers/leblanc/luffy.jpg',
      luffy: '/wallpapers/luffy/luffy.jpg',
    },
    tags: ['anime', 'one-piece', 'hero', 'captain'],
  },
  // Add more characters as needed
];

/**
 * Get wallpaper for character in specific theme
 */
export const getWallpaperPath = (
  characterId: string,
  theme: ThemeName = 'default'
): string => {
  const character = characters.find((c) => c.id === characterId);
  if (!character) {
    return THEMES[theme].wallpaperPath + '/placeholder.jpg';
  }
  return character.wallpapers[theme] || character.wallpapers.default || '/wallpapers/default/placeholder.jpg';
};

/**
 * Get theme by name
 */
export const getTheme = (themeName: ThemeName): Theme => {
  return THEMES[themeName] || THEMES.default;
};

/**
 * Get all available themes
 */
export const getAllThemes = (): Theme[] => {
  return Object.values(THEMES);
};

/**
 * Get all characters
 */
export const getCharacterById = (id: string): CharacterTheme | undefined => {
  return characters.find((c) => c.id === id);
};

export const searchCharacters = (query: string): CharacterTheme[] => {
  const lower = query.toLowerCase();
  return characters.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.source.toLowerCase().includes(lower) ||
      c.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
};

export const getCharactersBySource = (source: string): CharacterTheme[] => {
  return characters.filter((c) => c.source.toLowerCase() === source.toLowerCase());
};

export const getCharactersByArchetype = (archetype: string): CharacterTheme[] => {
  return characters.filter((c) => c.archetype.toLowerCase() === archetype.toLowerCase());
};

export default {
  THEMES,
  characters,
  getTheme,
  getWallpaperPath,
  getAllThemes,
  getCharacterById,
  searchCharacters,
  getCharactersBySource,
  getCharactersByArchetype,
};
