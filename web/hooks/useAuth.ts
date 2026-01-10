import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../contexts/ToastContext';

export const useAuth = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const logout = async () => {
    try {
      // Get CSRF token from meta tag or cookie
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        credentials: 'include',
      });

      setIsAuthenticated(false);
      setUser(null);
      addToast('Logged out successfully', 'success');
      router.push('/login');
    } catch (error) {
      addToast('Logout failed', 'error');
    }
  };

  return { isAuthenticated, loading, user, logout };
};

// These HOCs should be in a .tsx file for JSX support
// For now, export types and utilities that can be used in .tsx files

import type { ComponentType } from 'react';

export type AuthComponent<P = {}> = ComponentType<P>;

/**
 * Higher Order Component for authentication protection
 * Usage in a .tsx file:
 * 
 * export const withAuth = (Component: AuthComponent) => {
 *   return (props: any) => {
 *     const { isAuthenticated, loading } = useAuth();
 *     const router = useRouter();
 *     if (loading) return <div>Loading...</div>;
 *     if (!isAuthenticated) { router.push('/login'); return null; }
 *     return <Component {...props} />;
 *   };
 * };
 */

// Alternative: Function-based approach without JSX
export const checkAuth = (): { isAuth: boolean; loading: boolean } => {
  // Hook usage in actual component
  // This is for type reference only
  return { isAuth: false, loading: false };
};

export const checkAdminAuth = (): { isAuth: boolean; loading: boolean; isAdmin: boolean } => {
  // Hook usage in actual component
  return { isAuth: false, loading: false, isAdmin: false };
};
