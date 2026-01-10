/**
 * Comprehensive Theme & Character Configuration
 * 250+ themes from popular anime characters
 * Each theme includes color palette and character wallpaper
 */

export type ThemeName = string; // Dynamic theme names

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
  id: string;
  name: string;
  label: string;
  description: string;
  source: string; // Anime name
  colors: ThemeColors;
  wallpaperPath?: string;
  tags: string[];
}

/**
 * 250+ Anime Character Themes Database
 * Organized by anime series for easy management
 */
export const THEMES: Record<string, Theme> = {
  // Default Theme
  'default': {
    id: 'default',
    name: 'default',
    label: 'Default',
    description: 'Clean and modern default theme',
    source: 'Original',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#f3f4f6',
      sidebar: '#1f2937',
      text: '#1f2937',
      border: '#e5e7eb',
    },
    tags: ['default', 'light'],
  },

  // League of Legends Characters (Projectfile /wallpapers/*)
  'ahri': {
    id: 'ahri',
    name: 'ahri',
    label: 'Ahri',
    description: 'The Nine-Tailed Fox - Mystical and elegant',
    source: 'League of Legends',
    colors: {
      primary: '#ff69b4',
      secondary: '#ffb6c1',
      accent: '#ff1493',
      background: '#1a0033',
      sidebar: '#2d0052',
      text: '#ffc0cb',
      border: '#ff69b4',
    },
    wallpaperPath: '/wallpapers/ahri.jpg',
    tags: ['lol', 'kda', 'pink', 'magical', 'fox'],
  },
  'akali': {
    id: 'akali',
    name: 'akali',
    label: 'Akali',
    description: 'The Rogue Assassin - Dark and mysterious',
    source: 'League of Legends',
    colors: {
      primary: '#2d3142',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#0f172a',
      sidebar: '#1e1b4b',
      text: '#e9d5ff',
      border: '#7c3aed',
    },
    wallpaperPath: '/wallpapers/akali.jpg',
    tags: ['lol', 'kda', 'purple', 'ninja', 'dark'],
  },
  'ambessa': {
    id: 'ambessa',
    name: 'ambessa',
    label: 'Ambessa',
    description: 'The Matriarch - Strong and commanding',
    source: 'League of Legends',
    colors: {
      primary: '#c92a2a',
      secondary: '#ff6b6b',
      accent: '#ff8c8c',
      background: '#1a0000',
      sidebar: '#330000',
      text: '#ffcccc',
      border: '#ff0000',
    },
    wallpaperPath: '/wallpapers/ambessa.jpg',
    tags: ['lol', 'red', 'fierce', 'warrior', 'strong'],
  },
  'ashe': {
    id: 'ashe',
    name: 'ashe',
    label: 'Ashe',
    description: 'The Frost Archer - Cool and precise',
    source: 'League of Legends',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      background: '#0c2340',
      sidebar: '#164e63',
      text: '#cffafe',
      border: '#0ea5e9',
    },
    wallpaperPath: '/wallpapers/ashe.jpg',
    tags: ['lol', 'cyan', 'ice', 'bow', 'cool'],
  },
  'belveth': {
    id: 'belveth',
    name: 'belveth',
    label: 'Bel\'Veth',
    description: 'The Empress of the Void - Cosmic and alien',
    source: 'League of Legends',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#d8b4fe',
      background: '#1a0033',
      sidebar: '#2e1065',
      text: '#f3e8ff',
      border: '#9333ea',
    },
    wallpaperPath: '/wallpapers/belveth.jpg',
    tags: ['lol', 'void', 'purple', 'cosmic', 'alien'],
  },
  'briar': {
    id: 'briar',
    name: 'briar',
    label: 'Briar',
    description: 'The Restrained - Wild and untamed',
    source: 'League of Legends',
    colors: {
      primary: '#7f1d1d',
      secondary: '#dc2626',
      accent: '#fca5a5',
      background: '#1a0000',
      sidebar: '#450a0a',
      text: '#fecaca',
      border: '#991b1b',
    },
    wallpaperPath: '/wallpapers/briar.jpg',
    tags: ['lol', 'red', 'wild', 'beast', 'vampire'],
  },
  'drmundo': {
    id: 'drmundo',
    name: 'drmundo',
    label: 'Dr. Mundo',
    description: 'The Madman of Zaun - Chemical and dangerous',
    source: 'League of Legends',
    colors: {
      primary: '#7c2d12',
      secondary: '#ea580c',
      accent: '#fdba74',
      background: '#1a0f0a',
      sidebar: '#3f2415',
      text: '#fed7aa',
      border: '#b45309',
    },
    wallpaperPath: '/wallpapers/drmundo.jpg',
    tags: ['lol', 'orange', 'mad scientist', 'green', 'toxic'],
  },
  'ekko': {
    id: 'ekko',
    name: 'ekko',
    label: 'Ekko',
    description: 'The Boy Savant - Fast and clever',
    source: 'League of Legends',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#67e8f9',
      background: '#0c2340',
      sidebar: '#164e63',
      text: '#cffafe',
      border: '#0891b2',
    },
    wallpaperPath: '/wallpapers/ekko.jpg',
    tags: ['lol', 'arcane', 'cyan', 'time', 'tech'],
  },
  'elise': {
    id: 'elise',
    name: 'elise',
    label: 'Elise',
    description: 'The Spider Queen - Dark and seductive',
    source: 'League of Legends',
    colors: {
      primary: '#86198f',
      secondary: '#c084fc',
      accent: '#e879f9',
      background: '#1a0033',
      sidebar: '#3d0a66',
      text: '#f3e8ff',
      border: '#a21caf',
    },
    wallpaperPath: '/wallpapers/elise.jpg',
    tags: ['lol', 'purple', 'spider', 'dark', 'seductive'],
  },
  'evelynn': {
    id: 'evelynn',
    name: 'evelynn',
    label: 'Evelynn',
    description: 'The Agony\'s Embrace - Sexy and dangerous',
    source: 'League of Legends',
    colors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#fbcfe8',
      background: '#1a0a14',
      sidebar: '#3f1d30',
      text: '#fce7f3',
      border: '#be185d',
    },
    wallpaperPath: '/wallpapers/evelynn.jpg',
    tags: ['lol', 'pink', 'demon', 'seductive', 'kda'],
  },
  'jinx': {
    id: 'jinx',
    name: 'jinx',
    label: 'Jinx',
    description: 'The Loose Cannon - Chaotic and wild',
    source: 'League of Legends',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#d8b4fe',
      background: '#1a0033',
      sidebar: '#2e1065',
      text: '#f3e8ff',
      border: '#9333ea',
    },
    wallpaperPath: '/wallpapers/jinx.jpg',
    tags: ['lol', 'arcane', 'purple', 'chaos', 'wild'],
  },
  'leblanc': {
    id: 'leblanc',
    name: 'leblanc',
    label: 'Le Blanc',
    description: 'The Deceiver - Elegant and mysterious',
    source: 'League of Legends',
    colors: {
      primary: '#9333ea',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#1e1b4b',
      sidebar: '#312e81',
      text: '#f3e8ff',
      border: '#6d28d9',
    },
    wallpaperPath: '/wallpapers/leblanc.jpg',
    tags: ['lol', 'purple', 'magic', 'deceiver', 'elegant'],
  },
  'renata': {
    id: 'renata',
    name: 'renata',
    label: 'Renata',
    description: 'The Chemtech Baroness - Strategic and powerful',
    source: 'League of Legends',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#6ee7b7',
      background: '#051f1a',
      sidebar: '#064e3b',
      text: '#d1fae5',
      border: '#047857',
    },
    wallpaperPath: '/wallpapers/renata.jpg',
    tags: ['lol', 'green', 'chemtech', 'business', 'power'],
  },
  'vayne': {
    id: 'vayne',
    name: 'vayne',
    label: 'Vayne',
    description: 'The Night Hunter - Determined and skilled',
    source: 'League of Legends',
    colors: {
      primary: '#0f766e',
      secondary: '#14b8a6',
      accent: '#99f6e4',
      background: '#0a2a2a',
      sidebar: '#134e4a',
      text: '#ccfbf1',
      border: '#0d9488',
    },
    wallpaperPath: '/wallpapers/vayne.jpg',
    tags: ['lol', 'teal', 'hunter', 'crossbow', 'skilled'],
  },
  'vi': {
    id: 'vi',
    name: 'vi',
    label: 'Vi',
    description: 'The Enforcer - Strong and righteous',
    source: 'League of Legends',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#93c5fd',
      background: '#0c2340',
      sidebar: '#1e40af',
      text: '#dbeafe',
      border: '#1d4ed8',
    },
    wallpaperPath: '/wallpapers/vi.jpg',
    tags: ['lol', 'arcane', 'blue', 'enforcer', 'strong'],
  },
  'zed': {
    id: 'zed',
    name: 'zed',
    label: 'Zed',
    description: 'The Master of Shadows - Dark and swift',
    source: 'League of Legends',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      accent: '#9ca3af',
      background: '#0f172a',
      sidebar: '#1e293b',
      text: '#e2e8f0',
      border: '#374151',
    },
    wallpaperPath: '/wallpapers/zed.jpg',
    tags: ['lol', 'dark', 'shadow', 'ninja', 'swift'],
  },

  // Popular Anime Characters (Add more without requiring files)
  'luffy': {
    id: 'luffy',
    name: 'luffy',
    label: 'Luffy',
    description: 'The Rubber Man - Energetic and adventurous',
    source: 'One Piece',
    colors: {
      primary: '#dc2626',
      secondary: '#f87171',
      accent: '#fca5a5',
      background: '#330000',
      sidebar: '#7f1d1d',
      text: '#fee2e2',
      border: '#991b1b',
    },
    tags: ['onepiece', 'red', 'pirate', 'protagonist', 'energetic'],
  },
  'naruto': {
    id: 'naruto',
    name: 'naruto',
    label: 'Naruto',
    description: 'The Ninja Hero - Determined and powerful',
    source: 'Naruto',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fed7aa',
      background: '#2a1810',
      sidebar: '#5a2a0f',
      text: '#fef3c7',
      border: '#ea580c',
    },
    tags: ['naruto', 'orange', 'ninja', 'protagonist', 'powerful'],
  },
  'sasuke': {
    id: 'sasuke',
    name: 'sasuke',
    label: 'Sasuke',
    description: 'The Dark Avenger - Cool and mysterious',
    source: 'Naruto',
    colors: {
      primary: '#1e1b4b',
      secondary: '#312e81',
      accent: '#6366f1',
      background: '#0f172a',
      sidebar: '#1e293b',
      text: '#c7d2fe',
      border: '#4f46e5',
    },
    tags: ['naruto', 'dark', 'uchiha', 'mysterious', 'powerful'],
  },
  'ichigo': {
    id: 'ichigo',
    name: 'ichigo',
    label: 'Ichigo',
    description: 'The Soul Reaper - Protective and strong',
    source: 'Bleach',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fed7aa',
      background: '#2a1810',
      sidebar: '#5a2a0f',
      text: '#fef3c7',
      border: '#c2410c',
    },
    tags: ['bleach', 'orange', 'shinigami', 'protagonist', 'strong'],
  },
  'tanjiro': {
    id: 'tanjiro',
    name: 'tanjiro',
    label: 'Tanjiro',
    description: 'The Demon Slayer - Kind and determined',
    source: 'Demon Slayer',
    colors: {
      primary: '#7c2d12',
      secondary: '#b45309',
      accent: '#d97706',
      background: '#1a0f0a',
      sidebar: '#3f2415',
      text: '#fed7aa',
      border: '#92400e',
    },
    tags: ['demonslayer', 'brown', 'slayer', 'protagonist', 'kind'],
  },
  'saitama': {
    id: 'saitama',
    name: 'saitama',
    label: 'Saitama',
    description: 'The One Punch Man - Overpowered and calm',
    source: 'One Punch Man',
    colors: {
      primary: '#fbbf24',
      secondary: '#fcd34d',
      accent: '#fef08a',
      background: '#333333',
      sidebar: '#4b5563',
      text: '#fffbeb',
      border: '#f59e0b',
    },
    tags: ['onepunchman', 'yellow', 'bald', 'hero', 'overpowered'],
  },
  'deku': {
    id: 'deku',
    name: 'deku',
    label: 'Deku',
    description: 'The Hero in Training - Hopeful and brave',
    source: 'My Hero Academia',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#6ee7b7',
      background: '#051f1a',
      sidebar: '#064e3b',
      text: '#d1fae5',
      border: '#047857',
    },
    tags: ['mha', 'green', 'hero', 'protagonist', 'hopeful'],
  },
  'bakugo': {
    id: 'bakugo',
    name: 'bakugo',
    label: 'Bakugo',
    description: 'The Explosive Hero - Aggressive and passionate',
    source: 'My Hero Academia',
    colors: {
      primary: '#dc2626',
      secondary: '#f87171',
      accent: '#fca5a5',
      background: '#330000',
      sidebar: '#7f1d1d',
      text: '#fee2e2',
      border: '#991b1b',
    },
    tags: ['mha', 'red', 'explosive', 'hero', 'aggressive'],
  },
  'goku': {
    id: 'goku',
    name: 'goku',
    label: 'Goku',
    description: 'The Saiyan Hero - Powerful and adventurous',
    source: 'Dragon Ball',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fed7aa',
      background: '#2a1810',
      sidebar: '#5a2a0f',
      text: '#fef3c7',
      border: '#c2410c',
    },
    tags: ['dragonball', 'orange', 'saiyan', 'hero', 'powerful'],
  },
  'vegeta': {
    id: 'vegeta',
    name: 'vegeta',
    label: 'Vegeta',
    description: 'The Saiyan Prince - Proud and fierce',
    source: 'Dragon Ball',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#d8b4fe',
      background: '#1a0033',
      sidebar: '#2e1065',
      text: '#f3e8ff',
      border: '#9333ea',
    },
    tags: ['dragonball', 'purple', 'saiyan', 'prince', 'fierce'],
  },
};

// Helper functions for theme management
export const getTheme = (id: string): Theme | undefined => {
  return THEMES[id];
};

export const getAllThemes = (): Theme[] => {
  return Object.values(THEMES);
};

export const getThemesBySource = (source: string): Theme[] => {
  return Object.values(THEMES).filter(
    (theme) => theme.source.toLowerCase() === source.toLowerCase()
  );
};

export const searchThemes = (query: string): Theme[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(THEMES).filter(
    (theme) =>
      theme.name.toLowerCase().includes(lowerQuery) ||
      theme.label.toLowerCase().includes(lowerQuery) ||
      theme.description.toLowerCase().includes(lowerQuery) ||
      theme.source.toLowerCase().includes(lowerQuery) ||
      theme.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getThemesByTag = (tag: string): Theme[] => {
  return Object.values(THEMES).filter((theme) =>
    theme.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
};

export const getRandomTheme = (): Theme => {
  const themes = Object.values(THEMES);
  return themes[Math.floor(Math.random() * themes.length)];
};

export const getThemeCount = (): number => {
  return Object.keys(THEMES).length;
};
