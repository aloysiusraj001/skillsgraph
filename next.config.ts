import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: isDev ? undefined : "standalone",
    distDir: isDev ? ".next-dev" : ".next",
    experimental: {
      devtoolSegmentExplorer: false,
    },
  };
}
