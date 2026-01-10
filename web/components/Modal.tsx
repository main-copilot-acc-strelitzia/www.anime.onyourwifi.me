import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

const TYPE_COLORS = {
  info: { icon: 'ℹ', color: '#3b82f6' },
  warning: { icon: '⚠', color: '#f59e0b' },
  danger: { icon: '!', color: '#ef4444' },
};

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
}: ModalProps) {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  const { icon, color } = TYPE_COLORS[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 fade-in">
      <div
        className="rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 fade-in"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className="text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: color, color: 'white' }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h2
              className="text-lg font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              {title}
            </h2>
          </div>
        </div>

        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: currentTheme.colors.text }}
        >
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded font-semibold transition hover:opacity-90 btn-hover-lift"
            style={{
              backgroundColor: color,
              color: 'white',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
