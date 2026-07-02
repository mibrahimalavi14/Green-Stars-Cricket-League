import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: process.env.NODE_ENV === "development" ? {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  } : undefined,
};

export default nextConfig;
