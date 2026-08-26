import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Only this tree's own tests. `.claude/worktrees/` holds git worktrees on
    // other branches, each with its own node_modules, and vitest was loading
    // their suites into this run: 40 failures from code that is not checked
    // out here, which buried the failures that belong to this branch.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.claude/**', '.next/**', 'prototypes/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/lib/types.ts',
        'src/test/**',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 100,
        functions: 98,
        branches: 90,
        statements: 98,
      },
    },
  },
})
