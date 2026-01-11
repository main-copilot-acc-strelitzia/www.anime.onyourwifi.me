import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import PasswordStrength from './PasswordStrength';

interface PasswordChangeModalProps {
  isOpen: boolean;
  passwordForm: {
    current: string;
    new: string;
    confirm: string;
  };
  onPasswordFormChange: (form: { current: string; new: string; confirm: string }) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PasswordChangeModal({
  isOpen,
  passwordForm,
  onPasswordFormChange,
  onConfirm,
  onCancel,
}: PasswordChangeModalProps) {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 fade-in">
      <div
        className="rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 fade-in"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.colors.text }}
        >
          Change Password
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: currentTheme.colors.text }}
        >
          Enter your current password and your new password.
        </p>

        <div className="space-y-3 mb-6">
          <input
            type="password"
            placeholder="Current Password"
            value={passwordForm.current}
            onChange={(e) =>
              onPasswordFormChange({ ...passwordForm, current: e.target.value })
            }
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwordForm.new}
            onChange={(e) =>
              onPasswordFormChange({ ...passwordForm, new: e.target.value })
            }
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
          <PasswordStrength password={passwordForm.new} />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwordForm.confirm}
            onChange={(e) =>
              onPasswordFormChange({ ...passwordForm, confirm: e.target.value })
            }
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded font-semibold transition"
            style={{
              backgroundColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: currentTheme.colors.primary }}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
