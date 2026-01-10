import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface HeroBannerProps {
  featured?: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    seriesTitle: string;
    episodeNumber: number;
  };
}

export default function HeroBanner({ featured }: HeroBannerProps) {
  const { currentTheme } = useTheme();

  if (!featured) {
    return null;
  }

  return (
    <div
      className="relative w-full h-96 md:h-[500px] bg-cover bg-center overflow-hidden group"
      style={{
        backgroundImage: featured.thumbnail
          ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${featured.thumbnail}')`
          : `linear-gradient(135deg, ${currentTheme.colors.sidebar}, ${currentTheme.colors.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 lg:px-20 max-w-4xl">
        {/* Series Badge */}
        <div className="mb-4">
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: 'rgba(229, 9, 20, 0.9)',
              color: '#fff',
            }}
          >
            Featured
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
          style={{ color: '#fff' }}
        >
          {featured.seriesTitle}
        </h1>

        {/* Episode Info */}
        <p
          className="text-base md:text-lg mb-6 max-w-2xl opacity-90"
          style={{ color: '#ccc' }}
        >
          Episode {featured.episodeNumber}
          {featured.title && ` • ${featured.title}`}
        </p>

        {/* Description */}
        {featured.description && (
          <p
            className="text-sm md:text-base mb-8 max-w-2xl line-clamp-3 md:line-clamp-4"
            style={{ color: '#aaa' }}
          >
            {featured.description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href={`/player?id=${featured.id}`}>
            <button
              className="px-8 py-3 rounded-lg font-semibold text-base transition-all hover:opacity-80 flex items-center gap-2"
              style={{
                backgroundColor: '#fff',
                color: '#000',
              }}
            >
              ▶ Play
            </button>
          </Link>
          <button
            className="px-8 py-3 rounded-lg font-semibold text-base transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            ℹ More Info
          </button>
        </div>
      </div>
    </div>
  );
}
