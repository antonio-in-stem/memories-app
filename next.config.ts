import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
  ],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
