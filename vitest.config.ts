import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/cli.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts'
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 57,
        lines: 61
      }
    },
    // Support ESM modules correctly
    alias: {
      // Map imports with .js extension to their TypeScript source files
      '^(\\.{1,2}/.*)\\.js$': '$1'
    }
  }
}); 