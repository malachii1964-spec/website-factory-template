import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Database tests: run against local Supabase (`pnpm db:start`).
// They exercise RLS, triggers and RPCs as real members. Keys come from .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to the shell environment.
}
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
