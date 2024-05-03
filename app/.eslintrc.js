/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['plugin:@backstage/recommended'],
  parserOptions: {
    ecmaVersion: 6,
  },
};
