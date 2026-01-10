/**
 * Character Utility Functions
 * DEPRECATED: These utilities are for admin-only character management
 * Watchers should NEVER access character data - use video data instead
 * 
 * For public-facing content, use video streaming functionality
 */

// Import types only - NEVER expose character data to frontend consumers
import { characters, getCharacterById, searchCharacters, filterBySource, filterByArchetype, filterByTag, getAllSources, getAllArchetypes, getAllTags, getRandomCharacter, getCharacterCount } from '@/data/characters';
import { additionalCharacters } from '@/data/charactersExtended';
import { massiveCharacterDatabase } from '@/data/charactersMassive';
import type { CharacterTheme } from '@/data/characters';

// WARNING: These functions are ADMIN-ONLY and should never be called from watcher-facing code

/**
 * ADMIN ONLY: Combined character database
 * WARNING: Do not expose to watchers
 */
export const getAllCharacters = (): CharacterTheme[] => {
  console.warn('[ADMIN ONLY] getAllCharacters() - This data should not be accessible to watchers');
  return [...characters, ...additionalCharacters, ...massiveCharacterDatabase];
};

/**
 * ADMIN ONLY: Get total character count across all databases
 * WARNING: Do not expose to watchers
 */
export const getTotalCharacterCount = (): number => {
  return getAllCharacters().length;
};

/**
 * ADMIN ONLY: Get character by ID across all databases
 * WARNING: Do not expose to watchers
 */
export const getCharacterByIdGlobal = (id: string): CharacterTheme | undefined => {
  const allChars = getAllCharacters();
  return allChars.find((c) => c.id === id);
};

/**
 * ADMIN ONLY: Search characters across all databases
 * WARNING: Do not expose to watchers
 */
export const searchAllCharacters = (query: string): CharacterTheme[] => {
  const allChars = getAllCharacters();
  const lower = query.toLowerCase();
  return allChars.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.source.toLowerCase().includes(lower) ||
      c.tags.some((t) => t.toLowerCase().includes(lower)) ||
      c.description.toLowerCase().includes(lower) ||
      c.archetype.toLowerCase().includes(lower)
  );
};

/**
 * ADMIN ONLY: Get all unique sources across all databases
 * WARNING: Do not expose to watchers
 */
export const getAllSourcesGlobal = (): string[] => {
  const allChars = getAllCharacters();
  const sources = new Set<string>();
  allChars.forEach((c) => sources.add(c.source));
  return Array.from(sources).sort();
};

/**
 * ADMIN ONLY: Filter by source across all databases
 * WARNING: Do not expose to watchers
 */
export const filterBySourceGlobal = (source: string): CharacterTheme[] => {
  return getAllCharacters().filter((c) => c.source === source);
};

/**
 * ADMIN ONLY: Get character count per source
 * WARNING: Do not expose to watchers
 */
export const getCharactersPerSource = (): Record<string, number> => {
  const allChars = getAllCharacters();
  const counts: Record<string, number> = {};
  allChars.forEach((c) => {
    counts[c.source] = (counts[c.source] || 0) + 1;
  });
  return counts;
};

/**
 * ADMIN ONLY: Get similar characters
 * WARNING: Do not expose to watchers
 */
export const getSimilarCharacters = (characterId: string, limit = 5): CharacterTheme[] => {
  const character = getCharacterByIdGlobal(characterId);
  if (!character) return [];

  const allChars = getAllCharacters().filter((c) => c.id !== characterId);
  const scoreMap = allChars.map((c) => ({
    character: c,
    score: calculateSimilarity(character, c),
  }));

  return scoreMap
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.character);
};

/**
 * ADMIN ONLY: Calculate similarity score between characters
 * WARNING: Do not expose to watchers
 */
const calculateSimilarity = (char1: CharacterTheme, char2: CharacterTheme): number => {
  let score = 0;

  if (char1.source === char2.source) score += 50;
  if (char1.archetype === char2.archetype) score += 30;

  const commonTags = char1.tags.filter((t) => char2.tags.includes(t)).length;
  score += commonTags * 5;

  return score;
};

/**
 * ============================================================
 * PUBLIC WATCHER FUNCTIONS
 * ============================================================
 * These functions are stubs that explicitly prevent access
 */

/**
 * SECURITY: Prevent watchers from accessing character database
 */
export const getWatcherCharacterAccess = (): never => {
  throw new Error(
    'Access Denied: Watcher accounts cannot access character data. Use video streaming instead.'
  );
};

/**
 * NOTE FOR DEVELOPERS:
 * 
 * The frontend should use the video API endpoints instead:
 * - GET /api/videos - List all available videos
 * - GET /api/videos/:id - Get specific video details
 * - GET /api/videos/:id/stream - Stream video (HLS .m3u8)
 * 
 * Character data is for ADMIN USE ONLY and should never be exposed to watchers.
 */

 */
export const getAllSourcesGlobal = (): string[] => {
  const allChars = getAllCharacters();
  const sources = new Set(allChars.map((c) => c.source));
  return Array.from(sources).sort();
};

/**
 * Get all unique archetypes across all databases
 */
export const getAllArchetypesGlobal = (): string[] => {
  const allChars = getAllCharacters();
  const archetypes = new Set(allChars.map((c) => c.archetype));
  return Array.from(archetypes).sort();
};

/**
 * Get all unique tags across all databases
 */
export const getAllTagsGlobal = (): string[] => {
  const allChars = getAllCharacters();
  const allTags = new Set<string>();
  allChars.forEach((c) => {
    c.tags.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
};

/**
 * Filter characters by source across all databases
 */
export const filterBySourceGlobal = (source: string): CharacterTheme[] => {
  const allChars = getAllCharacters();
  return allChars.filter((c) => c.source === source);
};

/**
 * Filter characters by archetype across all databases
 */
export const filterByArchetypeGlobal = (archetype: string): CharacterTheme[] => {
  const allChars = getAllCharacters();
  return allChars.filter((c) => c.archetype === archetype);
};

/**
 * Filter characters by tag across all databases
 */
export const filterByTagGlobal = (tag: string): CharacterTheme[] => {
  const allChars = getAllCharacters();
  return allChars.filter((c) => c.tags.includes(tag));
};

/**
 * Get characters count per source
 */
export const getCharactersPerSource = (): Record<string, number> => {
  const allChars = getAllCharacters();
  const counts: Record<string, number> = {};
  
  allChars.forEach((c) => {
    counts[c.source] = (counts[c.source] || 0) + 1;
  });
  
  return counts;
};

/**
 * Get characters count per archetype
 */
export const getCharactersPerArchetype = (): Record<string, number> => {
  const allChars = getAllCharacters();
  const counts: Record<string, number> = {};
  
  allChars.forEach((c) => {
    counts[c.archetype] = (counts[c.archetype] || 0) + 1;
  });
  
  return counts;
};

/**
 * Get random characters
 */
export const getRandomCharacters = (count: number = 5): CharacterTheme[] => {
  const allChars = getAllCharacters();
  const shuffled = [...allChars].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allChars.length));
};

/**
 * Get similar characters based on tags
 */
export const getSimilarCharacters = (characterId: string, limit: number = 5): CharacterTheme[] => {
  const character = getCharacterByIdGlobal(characterId);
  if (!character) return [];

  const allChars = getAllCharacters();
  const similar = allChars
    .filter((c) => c.id !== characterId)
    .map((c) => {
      const commonTags = c.tags.filter((t) => character.tags.includes(t)).length;
      const commonSource = c.source === character.source ? 2 : 0;
      const commonArchetype = c.archetype === character.archetype ? 1 : 0;
      const similarity = commonTags + commonSource + commonArchetype;
      return { character: c, similarity };
    })
    .filter((item) => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.character);

  return similar;
};

/**
 * Get characters statistics
 */
export interface CharacterStatistics {
  totalCharacters: number;
  totalSources: number;
  totalArchetypes: number;
  totalTags: number;
  charactersPerSource: Record<string, number>;
  charactersPerArchetype: Record<string, number>;
}

export const getCharacterStatistics = (): CharacterStatistics => {
  const allChars = getAllCharacters();
  const sources = getAllSourcesGlobal();
  const archetypes = getAllArchetypesGlobal();
  const tags = getAllTagsGlobal();

  return {
    totalCharacters: allChars.length,
    totalSources: sources.length,
    totalArchetypes: archetypes.length,
    totalTags: tags.length,
    charactersPerSource: getCharactersPerSource(),
    charactersPerArchetype: getCharactersPerArchetype(),
  };
};

/**
 * Export key functions from individual databases
 */
export { getCharacterById, searchCharacters, filterBySource, filterByArchetype, filterByTag, getAllSources, getAllArchetypes, getAllTags, getRandomCharacter, getCharacterCount } from '../data/characters';
