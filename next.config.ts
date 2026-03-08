import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['unzipper'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore - eslint property structure may vary in beta versions
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Reduce memory usage during build
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    // Prevent Next.js from spawning too many worker threads
    // which causes massive RAM spikes on emulated builds
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
