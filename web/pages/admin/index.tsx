export const dynamic = 'force-dynamic';

import AdminLayout from '@/components/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';

interface MetricCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function AdminIndex() {
  const { currentTheme } = useTheme();
  const [metrics, setMetrics] = React.useState<MetricCard[]>([]);

  React.useEffect(() => {
    // Simulate fetching metrics
    setMetrics([
      {
        title: 'Concurrent Viewers',
        value: Math.floor(Math.random() * 1000),
        icon: '👥',
        color: currentTheme.colors.primary,
      },
      {
        title: 'Upload Queue Length',
        value: Math.floor(Math.random() * 50),
        icon: '📤',
        color: currentTheme.colors.secondary,
      },
      {
        title: 'Active Transcodes',
        value: Math.floor(Math.random() * 20),
        icon: '⚙️',
        color: currentTheme.colors.accent,
      },
      {
        title: 'System Health',
        value: '99.8%',
        icon: '✅',
        color: currentTheme.colors.secondary,
      },
    ]);
  }, [currentTheme]);

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: currentTheme.colors.text }}>
            Admin Dashboard
          </h1>
          <p style={{ color: currentTheme.colors.text }} className="opacity-75">
            Welcome back! Here's your system overview.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="rounded-lg p-6 shadow-md hover:shadow-lg transition"
              style={{
                backgroundColor: currentTheme.colors.sidebar,
                borderLeft: `4px solid ${metric.color}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{metric.icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: metric.color,
                    color: currentTheme.colors.sidebar,
                  }}
                >
                  Live
                </span>
              </div>
              <p style={{ color: currentTheme.colors.text }} className="text-sm opacity-75">
                {metric.title}
              </p>
              <p
                className="text-2xl font-bold mt-2"
                style={{ color: metric.color }}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-lg p-6 shadow-md"
          style={{
            backgroundColor: currentTheme.colors.sidebar,
          }}
        >
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: currentTheme.colors.primary }}
          >
            📊 System Activity
          </h2>
          <div className="space-y-3">
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: currentTheme.colors.background,
              }}
            >
              <p style={{ color: currentTheme.colors.text }} className="text-sm">
                <span className="font-semibold">2 minutes ago</span> - New user registration
              </p>
            </div>
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: currentTheme.colors.background,
              }}
            >
              <p style={{ color: currentTheme.colors.text }} className="text-sm">
                <span className="font-semibold">5 minutes ago</span> - Video upload completed
              </p>
            </div>
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: currentTheme.colors.background,
              }}
            >
              <p style={{ color: currentTheme.colors.text }} className="text-sm">
                <span className="font-semibold">12 minutes ago</span> - Transcoding job finished
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: currentTheme.colors.sidebar,
            }}
          >
            View Logs
          </button>
          <button
            className="px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: currentTheme.colors.secondary,
              color: currentTheme.colors.sidebar,
            }}
          >
            System Settings
          </button>
          <button
            className="px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: currentTheme.colors.accent,
              color: currentTheme.colors.sidebar,
            }}
          >
            Export Report
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}