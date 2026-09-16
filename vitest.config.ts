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
        // Thresholds recalibrated after moving to @vitest/coverage-v8 v4, whose
        // instrumentation now counts branches inside arrow-function callbacks
        // (e.g. Zod .refine() bodies) that v1 did not. Measured with v4:
        // ~80% stmts, ~70.85% branches, ~91% funcs, ~82% lines. Thresholds sit
        // just below measured values so genuine regressions still fail the gate.
        statements: 78,
        branches: 70,
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
