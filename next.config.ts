import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('https://kindred-heron-780.convex.cloud/**')],
  },
};

export default nextConfig;
