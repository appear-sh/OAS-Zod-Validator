import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      '**/__tests__/**/*.test.[jt]s?(x)',
      '**/?(*.)+(spec|test).[jt]s?(x)',
    ],
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
        '**/*.d.ts',
        // Benchmarks are run manually, not as tests - exclude from coverage
        '**/*-benchmark.ts',
        '**/tests/*-benchmark.ts',
      ],
      thresholds: {
        // Set thresholds ~3% below current coverage to catch significant regressions
        // while allowing minor fluctuations. Current: ~81% stmts, 82% branches, 92% funcs
        statements: 78,
        branches: 78,
        functions: 88,
        lines: 78,
      },
    },
    // Support ESM modules correctly
    alias: {
      // Map imports with .js extension to their TypeScript source files
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
});
