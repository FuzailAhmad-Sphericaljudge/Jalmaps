import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import localRules from "./eslint-rules/no-raw-jsx-text.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      jalmaps: localRules,
    },
    rules: {
      "jalmaps/no-raw-jsx-text": "error",
    },
  },
  {
    // Test files deliberately use literal sample copy; the rule targets
    // production components where copy must be translatable.
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "jalmaps/no-raw-jsx-text": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
