import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project-wide policy: treat style/type-strictness rules as warnings so
  // CI fails only on real correctness issues (rules-of-hooks, unused vars,
  // etc.). Tightening can be done incrementally later.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/unsupported-syntax": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Tests legitimately cast mocks to `any`.
  {
    files: ["src/tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
