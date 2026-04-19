import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep file tracing anchored to the invoked workspace path on Windows junctions.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
