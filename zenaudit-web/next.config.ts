import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is used for the Docker self-hosted build.
  // Vercel sets VERCEL=1, so we fall back to the default Next.js output there.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
