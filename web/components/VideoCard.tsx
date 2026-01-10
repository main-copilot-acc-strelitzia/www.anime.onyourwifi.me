import React from 'react';

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

interface VideoCardProps {
  video: Episode;
  theme: any;
  onPlay: () => void;
}

export default function VideoCard({ video, theme, onPlay }: VideoCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onPlay();
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format upload date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
      style={{
        backgroundColor: theme.colors.sidebar,
      }}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full h-32 bg-gradient-to-br flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: theme.colors.background,
          backgroundImage: video.thumbnail
            ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('${video.thumbnail}')`
            : 'linear-gradient(135deg, rgba(100,100,200,0.3) 0%, rgba(200,100,100,0.3) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Play Button */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black opacity-0 hover:opacity-70 transition-opacity duration-200"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <span className="text-2xl ml-1">▶</span>
          </div>
        </div>

        {/* Episode Number Badge */}
        <div
          className="absolute top-2 right-2 text-sm font-bold px-3 py-1 rounded-full"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.sidebar,
          }}
        >
          Ep {video.episodeNumber}
        </div>

        {/* Transcoding Status Badge */}
        {!video.transcoded && (
          <div
            className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded"
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.sidebar,
            }}
          >
            ⏳ Transcoding...
          </div>
        )}

        {/* Duration Badge */}
        {video.duration && (
          <div
            className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded bg-black bg-opacity-75"
            style={{
              color: '#fff',
            }}
          >
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Series Title */}
        <p style={{ color: theme.colors.secondary }} className="text-xs font-semibold uppercase mb-1 opacity-75">
          {video.seriesTitle}
        </p>

        {/* Episode Title */}
        <h3
          className="text-sm font-bold mb-2 line-clamp-2"
          style={{ color: theme.colors.primary }}
          title={video.title}
        >
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p
            className="text-xs mb-3 line-clamp-2"
            style={{ color: theme.colors.text }}
            title={video.description}
          >
            {video.description}
          </p>
        )}

        {/* Upload Date */}
        {video.uploadedAt && (
          <p style={{ color: theme.colors.text }} className="text-xs opacity-60 mb-3">
            📅 {formatDate(video.uploadedAt)}
          </p>
        )}

        {/* Play Button */}
        <button
          onClick={handleClick}
          className="w-full py-2 px-3 rounded font-semibold text-sm transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.sidebar,
          }}
        >
          ▶ Play
        </button>
      </div>
    </div>
  );
}
