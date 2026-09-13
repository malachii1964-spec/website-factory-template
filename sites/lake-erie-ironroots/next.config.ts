import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives beside others in the factory repo, so Turbopack must be
  // told where its own root is rather than inferring from the outer lockfile.
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
