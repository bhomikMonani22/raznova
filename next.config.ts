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
  // /basketball: the owner's private NBA research board, plain static files in public/basketball. /fantasy: his
  // friends' NBA + IPL league, a static page in public/fantasy talking to /api/fantasy. Serve each index file at
  // the folder URL, never cache their data, and keep every page of them out of search engines.
  async rewrites() {
    return [
      { source: "/basketball", destination: "/basketball/index.html" },
      { source: "/fantasy", destination: "/fantasy/index.html" },
    ];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/basketball", headers: noindex },
      { source: "/basketball/:path*", headers: noindex },
      { source: "/basketball/data/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/fantasy", headers: noindex },
      { source: "/fantasy/:path*", headers: noindex },
      { source: "/fantasy/data/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
};

export default nextConfig;
