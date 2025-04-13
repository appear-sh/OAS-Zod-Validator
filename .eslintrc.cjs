module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'vitest'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vitest/recommended',
    'plugin:prettier/recommended',
  ],
};
