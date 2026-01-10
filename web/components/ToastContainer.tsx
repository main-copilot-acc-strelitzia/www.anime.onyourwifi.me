import React from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const TOAST_COLORS = {
  success: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  error: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  info: { bg: '#dbeafe', text: '#0c4a6e', border: '#7dd3fc' },
  warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { currentTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const colors = TOAST_COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto slide-in-up"
            style={{
              backgroundColor: colors.bg,
              borderLeft: `4px solid ${colors.border}`,
            }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: colors.text }}
            >
              {TOAST_ICONS[toast.type]}
            </span>
            <span style={{ color: colors.text }} className="text-sm">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 font-bold hover:opacity-70"
              style={{ color: colors.text }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
