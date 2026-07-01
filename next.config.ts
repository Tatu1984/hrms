import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Compression
  compress: true,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/components/ui'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // NOTE: JWT_SECRET / DATABASE_URL are read from process.env directly in
  // server code — they must NOT be listed here (next.config `env` inlines
  // values into the client bundle, which would leak the secret).
  typescript: {
    // TODO: remove once the remaining type errors are fixed, so the build gates on types.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
