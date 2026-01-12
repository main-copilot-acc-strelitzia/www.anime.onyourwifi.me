/** @type {import('next').NextConfig} */

// Offline-safe Content Security Policy - no external CDNs
const ContentSecurityPolicy = `
  default-src 'self';
  img-src 'self' data:;
  media-src 'self' data:;
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Cache-Control',
    value: 'public, max-age=3600',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // On-demand entries for dynamic pages
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  
  // Cross-platform compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },

  // Disable image optimization for offline/LAN mode
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Redirect rules
  async redirects() {
    return [];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_OFFLINE_MODE: 'true',
    NEXT_PUBLIC_NO_EXTERNAL_RESOURCES: 'true',
  },

  // Support for various Node versions
  target: 'server',
};

module.exports = nextConfig;