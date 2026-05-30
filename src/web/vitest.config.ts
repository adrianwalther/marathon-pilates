import { defineConfig } from 'vitest/config'
import path from 'path'

// Unit tests for pure logic (no React/DOM). Mirrors the app's `@/` path alias
// so test imports match source imports.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
