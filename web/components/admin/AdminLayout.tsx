import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Uploads', href: '/admin/uploads', icon: '📤' },
    { label: 'Transcodes', href: '/admin/transcodes', icon: '⚙️' },
    { label: 'Audit', href: '/admin/audit', icon: '📋' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: currentTheme.colors.background }}>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          backgroundColor: currentTheme.colors.primary,
          color: currentTheme.colors.sidebar,
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 text-white p-4 shadow-xl transition-all duration-300 ${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block fixed lg:relative h-screen lg:h-auto overflow-y-auto z-30`}
        style={{ backgroundColor: currentTheme.colors.sidebar }}
      >
        <h2 className="text-2xl font-bold mb-1">⚙️ Admin</h2>
        <p className="text-sm mb-4 opacity-75">Panel Management</p>
        <ThemeSwitcher />
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block py-3 px-4 rounded-lg transition-all hover:translate-x-1 card-hover"
              style={{
                color: currentTheme.colors.primary,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div
          className="mt-auto pt-6 border-t"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <p className="text-xs opacity-50">v1.0.0 • Admin Panel</p>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 p-6 lg:p-8"
        style={{
          backgroundColor: currentTheme.colors.background,
          color: currentTheme.colors.text,
        }}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}