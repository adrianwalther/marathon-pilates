import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk', 'stripe'],
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;
