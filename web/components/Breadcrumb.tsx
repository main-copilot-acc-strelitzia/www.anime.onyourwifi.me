import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { currentTheme } = useTheme();

  return (
    <nav className="flex items-center space-x-2 mb-6 text-sm">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span style={{ color: currentTheme.colors.border }}>/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="hover:underline transition"
              style={{ color: currentTheme.colors.primary }}
            >
              {item.label}
            </a>
          ) : (
            <span style={{ color: currentTheme.colors.text }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
