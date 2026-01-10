/**
 * Authentication HOCs (Higher Order Components)
 * Provides authentication wrappers for pages and components
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';

/**
 * Wraps a component with authentication protection
 * Redirects to login if not authenticated
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      router.push('/');
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

/**
 * Wraps a component with admin-only protection
 * Redirects to home if not authenticated or not admin
 */
export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAdminAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

export default withAuth;
