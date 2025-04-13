// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript specific configurations
  // Includes recommended rules and sets up the TS parser
  ...tseslint.configs.recommendedTypeChecked, // Or recommended for less strictness

  // Vitest specific configurations
  {
    // Apply vitest rules only to test files (adjust glob pattern if needed)
    files: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      }
    }
  },

  // Prettier integration (Needs to be LAST)
  // Disables conflicting ESLint rules and integrates Prettier checks
  prettierRecommended,

  // Optional: Further customizations
  {
    languageOptions: {
      // If using type-aware linting (recommendedTypeChecked)
      parserOptions: {
        project: true, // Assumes tsconfig.json is in the root
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Add any project-specific rule overrides here
      // e.g., '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
); 