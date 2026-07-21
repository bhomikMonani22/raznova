import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: experimental.inlineCss was measured and rejected — Next duplicates
  // the stylesheet into the flight data, so gzipped HTML went 34KB -> 62KB
  // and FCP regressed 1.0s -> 1.2s. The separate 9KB stylesheet wins.
  images: {
    // AVIF first (≈30% smaller than WebP for the warehouse photography),
    // WebP fallback. Qualities list is required for non-default q values.
    formats: ["image/avif", "image/webp"],
    qualities: [65, 68, 75],
  },
};

export default nextConfig;
