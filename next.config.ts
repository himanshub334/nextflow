// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.transloadit.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

export default nextConfig;
