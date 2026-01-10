import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  count?: number;
  height?: number;
  width?: string;
  borderRadius?: number;
  className?: string;
}

export default function Skeleton({
  count = 1,
  height = 16,
  width = '100%',
  borderRadius = 8,
  className = '',
}: SkeletonProps) {
  const { currentTheme } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`mb-4 pulse-animation ${className}`}
          style={{
            height: `${height}px`,
            width,
            borderRadius: `${borderRadius}px`,
            backgroundColor: currentTheme.colors.border,
            opacity: 0.6,
          }}
        ></div>
      ))}
    </>
  );
}

export function SkeletonTable() {
  const { currentTheme } = useTheme();
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 rounded pulse-animation"
          style={{
            backgroundColor: currentTheme.colors.border,
            opacity: 0.6,
          }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  const { currentTheme } = useTheme();
  return (
    <div
      className="rounded-lg p-6 space-y-4"
      style={{ backgroundColor: currentTheme.colors.sidebar }}
    >
      <div
        className="h-8 rounded pulse-animation"
        style={{
          backgroundColor: currentTheme.colors.border,
          opacity: 0.6,
        }}
      ></div>
      <div
        className="h-4 rounded pulse-animation"
        style={{
          backgroundColor: currentTheme.colors.border,
          opacity: 0.6,
        }}
      ></div>
      <div
        className="h-4 rounded pulse-animation w-5/6"
        style={{
          backgroundColor: currentTheme.colors.border,
          opacity: 0.6,
        }}
      ></div>
    </div>
  );
}
