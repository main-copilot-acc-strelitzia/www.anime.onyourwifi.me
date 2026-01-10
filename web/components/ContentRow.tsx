import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

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

interface ContentRowProps {
  title: string;
  items: Episode[];
  onItemClick?: (id: string) => void;
}

export default function ContentRow({ title, items, onItemClick }: ContentRowProps) {
  const { currentTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(items.length > 5);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-12">
      {/* Section Title */}
      <h2 className="text-2xl md:text-3xl font-bold mb-6 px-4 md:px-0" style={{ color: currentTheme.colors.text }}>
        {title}
      </h2>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <span className="text-white text-xl">‹</span>
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-scroll scroll-smooth gap-4 pb-4 px-4 md:px-0"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {items.map((item) => (
            <Link key={item.id} href={`/player?id=${item.id}`}>
              <div
                className="flex-shrink-0 w-44 md:w-48 cursor-pointer group/card overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105"
                onClick={() => onItemClick?.(item.id)}
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full pb-[150%] bg-gray-800 overflow-hidden"
                  style={{
                    backgroundImage: item.thumbnail
                      ? `url('${item.thumbnail}')`
                      : 'linear-gradient(135deg, #333, #1a1a1a)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Overlay on Hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <span className="text-white text-4xl">▶</span>
                  </div>

                  {/* Episode Badge */}
                  <div
                    className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                    }}
                  >
                    EP {item.episodeNumber}
                  </div>

                  {/* Transcoding Status */}
                  {item.transcoded === false && (
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: 'rgba(255, 152, 0, 0.9)',
                        color: '#fff',
                      }}
                    >
                      Processing
                    </div>
                  )}
                </div>

                {/* Info */}
                <div
                  className="p-3"
                  style={{ backgroundColor: currentTheme.colors.sidebar }}
                >
                  <p className="text-xs opacity-70 mb-1" style={{ color: currentTheme.colors.text }}>
                    {item.seriesTitle}
                  </p>
                  <h3
                    className="font-semibold text-sm line-clamp-2"
                    style={{ color: currentTheme.colors.text }}
                  >
                    {item.title}
                  </h3>
                  {item.duration && (
                    <p className="text-xs mt-2 opacity-60" style={{ color: currentTheme.colors.text }}>
                      {Math.floor(item.duration / 60)}m {item.duration % 60}s
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <span className="text-white text-xl">›</span>
          </button>
        )}
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
