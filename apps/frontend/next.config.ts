import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory so Turbopack doesn't get confused
  // by the lockfile at the repo root (apps/backend/ and apps/frontend/ each
  // have their own package.json).
  turbopack: {
    root: path.resolve('.'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  experimental: {
    optimizePackageImports: ['@/components/ui', 'date-fns', 'lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
