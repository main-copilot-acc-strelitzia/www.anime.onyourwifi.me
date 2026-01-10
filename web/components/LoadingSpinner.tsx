import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoadingSpinner() {
  const { currentTheme } = useTheme();

  return (
    <div className="flex justify-center items-center py-8">
      <div
        className="animate-spin rounded-full h-10 w-10 border-b-2"
        style={{ borderColor: currentTheme.colors.primary }}
      ></div>
    </div>
  );
}
