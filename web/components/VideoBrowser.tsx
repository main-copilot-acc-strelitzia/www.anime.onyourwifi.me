import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import VideoCard from './VideoCard';

interface Episode {
  id: string;
  title: string;
  description?: string;
  episodeNumber: number;
  seriesTitle: string;
  thumbnail?: string;
  duration?: number;
  uploadedAt?: string;
  transcoded?: boolean;
}

interface VideoBrowserProps {
  videos: Episode[];
  userRole?: string | null;
}

export default function VideoBrowser({ videos, userRole }: VideoBrowserProps) {
  const { currentTheme } = useTheme();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Get unique series titles
  const uniqueSeries = useMemo(() => {
    const series = new Set(videos.map(v => v.seriesTitle));
    return Array.from(series).sort();
  }, [videos]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = videos;

    // Filter by search term
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        v =>
          v.title.toLowerCase().includes(lower) ||
          v.seriesTitle.toLowerCase().includes(lower) ||
          v.description?.toLowerCase().includes(lower)
      );
    }

    // Filter by series
    if (selectedSeries) {
      result = result.filter(v => v.seriesTitle === selectedSeries);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const aDate = new Date(a.uploadedAt || 0).getTime();
        const bDate = new Date(b.uploadedAt || 0).getTime();
        return bDate - aDate;
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const aDate = new Date(a.uploadedAt || 0).getTime();
        const bDate = new Date(b.uploadedAt || 0).getTime();
        return aDate - bDate;
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
    }

    return result;
  }, [videos, searchTerm, selectedSeries, sortBy]);

  const handlePlayVideo = (episodeId: string) => {
    addToast('Opening video player...', 'success');
  };

  return (
    <div>
      {/* Search and Filter Header */}
      <div
        className="rounded-lg p-6 mb-8"
        style={{ backgroundColor: currentTheme.colors.sidebar }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label style={{ color: currentTheme.colors.text }} className="text-sm block mb-2">
              🔍 Search Videos
            </label>
            <input
              type="text"
              placeholder="Search by title or series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border transition"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.primary,
              }}
            />
          </div>

          {/* Filter by Series */}
          <div>
            <label style={{ color: currentTheme.colors.text }} className="text-sm block mb-2">
              📺 Filter by Series
            </label>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border transition"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.primary,
              }}
            >
              <option value="">All Series ({videos.length})</option>
              {uniqueSeries.map((series) => (
                <option key={series} value={series}>
                  {series} ({videos.filter(v => v.seriesTitle === series).length})
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ color: currentTheme.colors.text }} className="text-sm block mb-2">
              ↕️ Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
              className="w-full px-4 py-2 rounded-lg border transition"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.primary,
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Series Name</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ color: currentTheme.colors.text }} className="mt-4 text-sm opacity-75">
          Showing {filteredVideos.length} of {videos.length} video{videos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id}>
              <Link href={`/player?episodeId=${video.id}`}>
                <VideoCard video={video} theme={currentTheme} onPlay={() => handlePlayVideo(video.id)} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: currentTheme.colors.sidebar,
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <p style={{ color: currentTheme.colors.text }}>
            {searchTerm || selectedSeries ? 'No videos match your search' : 'No videos available'}
          </p>
        </div>
      )}
    </div>
  );
}
