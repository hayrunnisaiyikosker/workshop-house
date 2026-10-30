import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/a11y/**/*', 'node_modules/**/*'],
    testTimeout: 10000,
  },
});
