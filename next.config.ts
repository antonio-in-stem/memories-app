import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
