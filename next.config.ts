import type { NextConfig } from "next";const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js/Turbopack never misdetects a parent
  // directory's package.json as the workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
