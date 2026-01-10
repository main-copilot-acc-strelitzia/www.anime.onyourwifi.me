/**
 * Character Wallpaper Local Path Mapping
 * Maps character IDs to local wallpaper paths
 */

/**
 * Convert character to use local wallpapers
 * Returns local wallpaper path for a character
 */
export const getCharacterWallpapers = (characterId: string): string[] => {
  // All wallpapers use local paths in /public/wallpapers/
  const defaultWallpaper = `/wallpapers/default/${characterId.toLowerCase()}.jpg`;
  
  // Return array with wallpaper
  return [defaultWallpaper];
};

/**
 * Quick reference for common character wallpaper IDs
 * Used in character data files
 */
export const characterWallpaperMap: Record<string, string> = {
  // One Piece
  luffy: '/wallpapers/default/luffy.jpg',
  zoro: '/wallpapers/default/zoro.jpg',
  nami: '/wallpapers/default/nami.jpg',
  usopp: '/wallpapers/default/usopp.jpg',
  sanji: '/wallpapers/default/sanji.jpg',
  
  // Naruto
  naruto: '/wallpapers/default/naruto.jpg',
  sasuke: '/wallpapers/default/sasuke.jpg',
  kakashi: '/wallpapers/default/kakashi.jpg',
  sakura: '/wallpapers/default/sakura.jpg',
  
  // Bleach
  ichigo: '/wallpapers/default/ichigo.jpg',
  rukia: '/wallpapers/default/rukia.jpg',
  aizen: '/wallpapers/default/aizen.jpg',
  
  // Death Note
  light: '/wallpapers/default/light.jpg',
  l: '/wallpapers/default/l.jpg',
  
  // Demon Slayer
  tanjiro: '/wallpapers/default/tanjiro.jpg',
  
  // Attack on Titan
  eren: '/wallpapers/default/eren.jpg',
  
  // Jujutsu Kaisen
  gojo: '/wallpapers/default/gojo.jpg',
  sukuna: '/wallpapers/default/sukuna.jpg',
  
  // Default fallback
  placeholder: '/wallpapers/default/placeholder.jpg',
};

/**
 * Get wallpaper path for a character in a specific theme
 */
export const getWallpaperPath = (
  characterId: string,
  theme: 'default' | 'leblanc' | 'luffy' = 'default'
): string => {
  const safeId = characterId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `/wallpapers/${theme}/${safeId}.jpg`;
};

/**
 * Get all local wallpaper paths for a character across themes
 */
export const getAllCharacterWallpapers = (characterId: string) => {
  const themes = ['default', 'leblanc', 'luffy'] as const;
  
  return {
    default: getWallpaperPath(characterId, 'default'),
    leblanc: getWallpaperPath(characterId, 'leblanc'),
    luffy: getWallpaperPath(characterId, 'luffy'),
  };
};

/**
 * Fallback function - if specific character wallpaper not found,
 * return placeholder
 */
export const getFallbackWallpaper = (theme: 'default' | 'leblanc' | 'luffy' = 'default'): string => {
  return `/wallpapers/${theme}/placeholder.jpg`;
};
