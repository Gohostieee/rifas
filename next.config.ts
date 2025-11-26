import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kindred-heron-780.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: 'loyal-deer-840.convex.cloud',
      }
    ],
  },
};

export default nextConfig;
