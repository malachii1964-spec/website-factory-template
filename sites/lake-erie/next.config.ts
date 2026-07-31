import path from "node:path";
import type { NextConfig } from "next";

/**
 * Standalone from the FutureDeskAI app at the repo root: different brand, own
 * deploy. Dependencies still resolve from the repo-level node_modules, so
 * Turbopack needs the workspace root named explicitly.
 */
const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname, "..", "..") },
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

export default nextConfig;
