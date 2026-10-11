import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js/Turbopack never misdetects a parent
  // directory's package.json as the workspace root.
  turbopack: {
    root: __dirname,
  },
};

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(withNextIntl(nextConfig));
