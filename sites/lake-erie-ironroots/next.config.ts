import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives beside others in the factory repo, so Turbopack must be
  // told where its own root is rather than inferring from the outer lockfile.
  turbopack: { root: path.resolve(import.meta.dirname) },

  // The OG image reads two TTFs off disk. That is not statically analysable,
  // so it is pinned into the trace explicitly — otherwise it becomes a runtime
  // ENOENT the moment anything makes that route dynamic.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
