// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  // 1. Global ignores (Added section)
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      // Add any other build output or ignored folders here
    ],
  },

  // 2. Base config for all JS/TS files (Restructured)
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], // Applied more broadly
    languageOptions: {
      globals: {
        // Added standard globals
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...eslint.configs.recommended.rules, // Moved base ESLint rules here
      // Add any general JS/TS rules here, non-type-specific
    },
  },

  // 3. TypeScript specific config (non-type-checked) for general TS files (Added section)
  {
    files: ['**/*.{ts,mts,cts}'],
    // Using tseslint.configs.recommended (non-type-checked) here
    // instead of applying recommendedTypeChecked globally
    extends: tseslint.configs.recommended,
    rules: {
      // Override or add TS rules if needed for non-project files
    },
  },

  // 4. Type-aware config specifically for SRC files (Using tsconfig.eslint.json)
  // Section 4 removed again for debugging

  // 5. Test file configuration (Vitest + Non-Type-Aware TS) (Restructured)
  {
    // Apply vitest rules *and* type-checking rules only to TS test files
    files: ['**/*.{test,spec,benchmark}.ts'], // Added benchmark, Specific to TS test files
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // Add/override test-specific rules
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  // 6. Config file specific configuration (JS/TS, non-type-aware) (Added section)
  {
    files: ['*.config.{js,ts}', 'eslint.config.js', 'update-tests.js'], // Target config files, scripts etc
    // No 'extends' for type-aware rules here
    plugins: {
      // Add the typescript-eslint plugin definition here
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Relax rules if necessary for config files
      // e.g. '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ], // Allow unused vars starting with _
    },
    languageOptions: {
      // Don't include parserOptions.project here
    },
  },

  // Prettier integration (Needs to be LAST)
  prettierRecommended
);
