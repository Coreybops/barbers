module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Backend-specific rules
    'no-console': 'off', // Allow console.log in backend
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', 'prisma/migrations'],
};