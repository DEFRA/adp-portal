const path = require('path');
const tsExtensions = ['ts', 'tsx', 'cts', 'ctsx', 'mts', 'mtsx'];

/** @type {import('eslint').Linter.Config} */
module.exports = require('@backstage/cli/config/eslint-factory').createConfig(
  __dirname,
  {
    root: true,
    ignorePatterns: ['**/seedData/', '**/migrations/'],
    overrides: [
      {
        files: tsExtensions.map(x => `*.${x}`),
        parserOptions: {
          project: path.resolve(__filename, '../tsconfig.json'),
        },
        rules: {
          '@typescript-eslint/consistent-type-imports': 'error',
          '@typescript-eslint/no-floating-promises': 'error',
        },
      },
    ],
  },
);
