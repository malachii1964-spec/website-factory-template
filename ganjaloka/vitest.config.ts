import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests: pure logic, no network.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
