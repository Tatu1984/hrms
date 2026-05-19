import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['date-fns', 'lucide-react'],
  },
};

export default nextConfig;
