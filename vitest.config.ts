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
