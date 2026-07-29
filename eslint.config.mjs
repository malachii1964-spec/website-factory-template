import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The intelligence kernel is a separate Node package with its own
    // tsconfig, module resolution, and gates. Linting it with the Next
    // config reports errors that are correct for the browser and wrong here.
    "malachii/**",
  ]),
]);

export default eslintConfig;
