import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { currentTheme } = useTheme();

  const getStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#16a34a'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-2 rounded-full transition"
            style={{
              backgroundColor: idx < strength ? strengthColors[strength - 1] : currentTheme.colors.border,
            }}
          ></div>
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: strengthColors[strength - 1] || currentTheme.colors.text }}>
        {strengthLabels[strength - 1] || 'Password Strength'}
      </p>
    </div>
  );
}
