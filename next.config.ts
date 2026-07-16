import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first (≈30% smaller than WebP for the warehouse photography),
    // WebP fallback. Qualities list is required for non-default q values.
    formats: ["image/avif", "image/webp"],
    qualities: [65, 68, 75],
  },
};

export default nextConfig;
