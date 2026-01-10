import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  const { currentTheme } = useTheme();

  return (
    <div
      className={`rounded-lg shadow p-6 ${className}`}
      style={{
        backgroundColor: currentTheme.colors.background,
        borderLeft: `4px solid ${currentTheme.colors.primary}`,
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: currentTheme.colors.text }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
