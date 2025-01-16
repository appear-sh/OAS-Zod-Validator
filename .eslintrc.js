module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Customize rules as needed
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    // ...
  }
};
