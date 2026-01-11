import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import {
  getAllCharacters,
  searchAllCharacters,
  getAllSourcesGlobal,
  filterBySourceGlobal,
  getCharactersPerSource,
  getSimilarCharacters,
  getTotalCharacterCount,
} from '@/utils/characterUtils';
import type { CharacterTheme } from '@/data/themesAndCharacters';

export default function CharacterBrowser() {
  const { currentTheme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterTheme | null>(null);
  const [showSimilar, setShowSimilar] = useState(false);

  // Get all characters and sources
  const allCharacters = useMemo(() => getAllCharacters(), []);
  const totalCount = getTotalCharacterCount();
  
  const allSources = useMemo(() => {
    const sources = getAllSourcesGlobal();
    return sources;
  }, []);

  const sourceStats = useMemo(() => getCharactersPerSource(), []);

  // Filter characters based on search and source
  const filteredCharacters = useMemo(() => {
    if (searchTerm.trim()) {
      let results = searchAllCharacters(searchTerm);
      if (selectedSource) {
        results = results.filter((c) => c.source === selectedSource);
      }
      return results;
    }

    if (selectedSource) {
      return filterBySourceGlobal(selectedSource);
    }

    return allCharacters;
  }, [searchTerm, selectedSource, allCharacters]);

  const similarCharacters = useMemo(() => {
    if (selectedCharacter && showSimilar) {
      return getSimilarCharacters(selectedCharacter.id, 5);
    }
    return [];
  }, [selectedCharacter, showSimilar]);

  const handleCharacterSelect = useCallback((character: CharacterTheme) => {
    setSelectedCharacter(character);
    setShowSimilar(false);
    addToast(`Selected ${character.name}!`, 'success');
  }, [addToast]);

  const handleApplyCharacterTheme = useCallback((character: CharacterTheme) => {
    addToast(`Theme applied: ${character.name}`, 'success');
  }, [addToast]);

  return (
    <div style={{ backgroundColor: currentTheme.colors.background, minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="py-8 px-4"
        style={{ backgroundColor: currentTheme.colors.sidebar }}
      >
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: currentTheme.colors.primary }}
          >
            🎨 Character Theme Browser
          </h1>
          <p style={{ color: currentTheme.colors.text }} className="mb-2">
            Explore {totalCount} anime characters and League of Legends champions
          </p>
          <div style={{ color: currentTheme.colors.secondary }} className="text-sm">
            {allSources.length} different sources • Find your favorite characters
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Search */}
          <div>
            <label style={{ color: currentTheme.colors.text }} className="text-sm block mb-2">
              Search Characters
            </label>
            <input
              type="text"
              placeholder="Search by name, anime, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
              }}
            />
          </div>

          {/* Source Filter */}
          <div>
            <label style={{ color: currentTheme.colors.text }} className="text-sm block mb-2">
              Filter by Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
              }}
            >
              <option value="">All Sources ({totalCount})</option>
              {allSources.map((source) => {
                const count = sourceStats[source] || 0;
                return (
                  <option key={source} value={source}>
                    {source} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <div style={{ color: currentTheme.colors.text }}>
            <p className="text-sm">
              Showing <span className="font-bold text-base">{filteredCharacters.length}</span> of{' '}
              <span className="font-bold text-base">{totalCount}</span> characters
            </p>
          </div>
          {selectedCharacter && (
            <button
              onClick={() => setShowSimilar(!showSimilar)}
              className="text-sm px-3 py-1 rounded"
              style={{
                backgroundColor: currentTheme.colors.primary,
                color: currentTheme.colors.background,
              }}
            >
              {showSimilar ? 'Hide Similar' : 'Show Similar'} ({similarCharacters.length})
            </button>
          )}
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredCharacters.map((char) => (
            <div
              key={char.id}
              className="rounded-lg p-4 shadow-md cursor-pointer transition hover:shadow-lg card-hover"
              style={{
                backgroundColor: currentTheme.colors.sidebar,
                borderLeft: `4px solid ${char.colors.primary}`,
              }}
              onClick={() => handleCharacterSelect(char)}
            >
              {/* Character Wallpaper Preview */}
              {char.wallpapers[0] && (
                <div
                  className="w-full h-40 rounded mb-3 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${char.wallpapers[0]})`,
                    opacity: 0.8,
                  }}
                ></div>
              )}

              <h3
                className="text-lg font-bold mb-1"
                style={{ color: char.colors.primary }}
              >
                {char.name}
              </h3>
              <p
                className="text-xs mb-2 opacity-75"
                style={{ color: currentTheme.colors.text }}
              >
                {char.source}
              </p>
              <p
                className="text-sm mb-3 line-clamp-2"
                style={{ color: currentTheme.colors.text }}
              >
                {char.description}
              </p>

              {/* Color Palette Preview */}
              <div className="flex gap-1 mb-3">
                {[
                  char.colors.primary,
                  char.colors.secondary,
                  char.colors.accent,
                ].map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-6 rounded"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {char.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: char.colors.primary,
                      color: char.colors.sidebar,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyCharacterTheme(char);
                }}
                className="w-full px-3 py-2 rounded font-semibold text-sm transition hover:opacity-90"
                style={{
                  backgroundColor: char.colors.primary,
                  color: char.colors.sidebar,
                }}
              >
                Apply Theme
              </button>
            </div>
          ))}
        </div>

        {filteredCharacters.length === 0 && (
          <div
            className="text-center py-12"
            style={{ color: currentTheme.colors.text }}
          >
            <p className="text-lg">No characters found matching your search</p>
            <p className="text-sm opacity-75 mt-2">Try different keywords or filters</p>
          </div>
        )}

        {/* Selected Character Detail */}
        {selectedCharacter && (
          <div
            className="rounded-lg p-6 mb-8"
            style={{ backgroundColor: currentTheme.colors.sidebar }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Preview */}
              <div>
                {selectedCharacter.wallpapers[0] && (
                  <img
                    src={selectedCharacter.wallpapers[0]}
                    alt={selectedCharacter.name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}
              </div>

              {/* Details */}
              <div className="md:col-span-2">
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedCharacter.colors.primary }}
                >
                  {selectedCharacter.name}
                </h2>
                <p
                  className="text-lg mb-4"
                  style={{ color: currentTheme.colors.text }}
                >
                  {selectedCharacter.source}
                </p>
                <p
                  className="text-base mb-6 leading-relaxed"
                  style={{ color: currentTheme.colors.text }}
                >
                  {selectedCharacter.description}
                </p>

                <div className="space-y-4">
                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Archetype
                    </p>
                    <p
                      className="text-base"
                      style={{ color: selectedCharacter.colors.primary }}
                    >
                      {selectedCharacter.archetype}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: selectedCharacter.colors.primary,
                            color: selectedCharacter.colors.text,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Color Palette
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(selectedCharacter.colors).map(
                        ([key, color]) => (
                          <div key={key} className="text-center">
                            <div
                              className="h-12 rounded-lg mb-2"
                              style={{ backgroundColor: color }}
                            ></div>
                            <p
                              className="text-xs capitalize"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {key}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyCharacterTheme(selectedCharacter)}
                    className="w-full px-4 py-2 rounded-lg font-semibold transition hover:opacity-90"
                    style={{
                      backgroundColor: selectedCharacter.colors.primary,
                      color: selectedCharacter.colors.sidebar,
                    }}
                  >
                    Apply Theme
                  </button>
                </div>
              </div>
            </div>

            {/* Similar Characters */}
            {showSimilar && similarCharacters.length > 0 && (
              <div className="mt-8 pt-8 border-t" style={{ borderColor: currentTheme.colors.border }}>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: currentTheme.colors.primary }}
                >
                  Similar Characters
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {similarCharacters.map((char) => (
                    <div
                      key={char.id}
                      className="rounded-lg p-3 cursor-pointer transition hover:shadow-lg"
                      style={{
                        backgroundColor: currentTheme.colors.background,
                        border: `2px solid ${char.colors.primary}`,
                      }}
                      onClick={() => handleCharacterSelect(char)}
                    >
                      <p
                        className="font-semibold text-sm mb-1 truncate"
                        style={{ color: char.colors.primary }}
                      >
                        {char.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {char.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
