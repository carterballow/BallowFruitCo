import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Skip Next.js image optimization so large local PNGs load reliably
    unoptimized: true,
  },
};

export default nextConfig;
