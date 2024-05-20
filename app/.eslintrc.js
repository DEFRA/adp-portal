const path = require('path');
/** @type {import('eslint').Linter.Config} */
module.exports = require('@backstage/cli/config/eslint-factory').createConfig(
  __dirname,
  {
    parserOptions: {
      project: path.resolve(__filename, '../tsconfig.json'),
    },
    root: true,
    ignorePatterns: ['**/seedData/', '**/migrations/', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
);
