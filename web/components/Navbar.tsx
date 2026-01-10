import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from './Modal';

interface NavbarProps {
  userRole?: string | null;
}

export default function Navbar({ userRole }: NavbarProps) {
  const { currentTheme } = useTheme();
  const { addToast } = useToast();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  // Determine if user is admin (has access to admin panel)
  const isAdmin = userRole === 'admin' || userRole === 'main_admin';

  const handleLogout = async () => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        credentials: 'include',
      });

      if (response.ok) {
        addToast('Logged out successfully', 'success');
        window.location.href = '/login';
      } else {
        addToast('Logout failed', 'error');
      }
    } catch (error) {
      addToast('Logout failed', 'error');
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(64, 64, 64, 0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/">
                <span
                  className="font-bold text-2xl cursor-pointer hover:opacity-80 transition duration-300"
                  style={{ color: '#e50914' }}
                >
                  🎬 AnimeStream
                </span>
              </Link>
              {/* Nav Links */}
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/">
                  <span className="hover:opacity-80 transition cursor-pointer text-sm font-medium" style={{ color: '#b3b3b3' }}>
                    Home
                  </span>
                </Link>
                <Link href="/?sort=newest">
                  <span className="hover:opacity-80 transition cursor-pointer text-sm font-medium" style={{ color: '#b3b3b3' }}>
                    New & Popular
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/account">
                <span
                  className="hover:opacity-80 transition cursor-pointer text-sm font-medium"
                  style={{ color: '#b3b3b3' }}
                >
                  Account
                </span>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <span
                    className="hover:opacity-80 transition cursor-pointer text-sm font-semibold px-3 py-1 rounded"
                    style={{
                      color: '#000',
                      backgroundColor: '#e50914',
                    }}
                  >
                    ⚙️ Admin
                  </span>
                </Link>
              )}
              {userRole && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(245, 117, 33, 0.2)',
                    color: '#f47521',
                  }}
                >
                  {userRole === 'main_admin' ? '👑' : userRole === 'admin' ? '🔐' : '👁️'} {userRole}
                </span>
              )}
              <button
                onClick={() => setLogoutModal(true)}
                className="px-4 py-2 rounded font-semibold transition hover:opacity-80"
                style={{
                  backgroundColor: '#e50914',
                  color: '#fff',
                }}
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ color: '#e50914' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-gray-700">
              <Link href="/">
                <div className="block py-2 text-sm font-medium" style={{ color: '#b3b3b3' }}>
                  Home
                </div>
              </Link>
              <Link href="/account">
                <div className="block py-2 text-sm font-medium" style={{ color: '#b3b3b3' }}>
                  Account
                </div>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <div
                    className="block py-2 px-3 rounded text-sm font-semibold"
                    style={{
                      color: '#000',
                      backgroundColor: '#e50914',
                    }}
                  >
                    ⚙️ Admin
                  </div>
                </Link>
              )}
              {userRole && (
                <div
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(245, 117, 33, 0.2)',
                    color: '#f47521',
                  }}
                >
                  {userRole === 'main_admin' ? '👑' : userRole === 'admin' ? '🔐' : '👁️'} {userRole}
                </div>
              )}
              <button
                onClick={() => setLogoutModal(true)}
                className="w-full px-4 py-2 rounded font-semibold transition"
                style={{
                  backgroundColor: '#e50914',
                  color: '#fff',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      <Modal
        isOpen={logoutModal}
        title="Logout Confirmation"
        message="Are you sure you want to logout? Your session will be terminated."
        onConfirm={handleLogout}
        onCancel={() => setLogoutModal(false)}
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}
