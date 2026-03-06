import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['unzipper'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    // Prevent Next.js from spawning too many worker threads
    // which causes massive 1-2GB RAM spikes on the NAS and OOM crashes
    cpus: 1,
    workerThreads: false,
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
