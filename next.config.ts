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
  // /basketball: the owner's private NBA research board, plain static files in public/basketball. Serve its index
  // file at the folder URL, never cache its data, and keep every page of it out of search engines.
  async rewrites() {
    return [{ source: "/basketball", destination: "/basketball/index.html" }];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/basketball", headers: noindex },
      { source: "/basketball/:path*", headers: noindex },
      { source: "/basketball/data/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
};

export default nextConfig;
