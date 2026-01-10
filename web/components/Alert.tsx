import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const { currentTheme } = useTheme();

  const colors = {
    error: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    success: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    info: { bg: '#dbeafe', text: '#0c4a6e', border: '#7dd3fc' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  };

  const color = colors[type];

  return (
    <div
      className="rounded-lg p-4 mb-4 flex justify-between items-center"
      style={{ backgroundColor: color.bg, borderLeft: `4px solid ${color.border}` }}
    >
      <span style={{ color: color.text }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ color: color.text }}
          className="ml-4 font-bold hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}
