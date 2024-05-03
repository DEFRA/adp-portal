/** @type {import('eslint').Linter.Config} */
module.exports = require('@backstage/cli/config/eslint-factory').createConfig(
  __dirname,
  {
    root: true,
    ignorePatterns: ['**/seedData/', '**/migrations/'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
