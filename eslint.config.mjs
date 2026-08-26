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
    "coverage/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // `.claude/worktrees/` holds git worktrees on other branches, each with
    // its own node_modules. Linting them reported 190 errors from code that is
    // not checked out here and buried the four that were.
    ".claude/**",
    // Standalone HTML/JS sketches, not part of the app build.
    "prototypes/**",
  ]),
]);

export default eslintConfig;
