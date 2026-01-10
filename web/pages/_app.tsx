import '@/styles/globals.css';
import '@/styles/theme.css';
import '@/styles/animations.css';
import type { AppProps } from 'next/app';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';

// SECURITY: Ensure no character data is imported at app level
// Character data is admin-only and should never be loaded for watchers

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <a href="#__next" className="skip-link">Skip to content</a>
        <ToastContainer />
        <Component {...pageProps} />
      </ThemeProvider>
    </ToastProvider>
  );
}

export default MyApp;