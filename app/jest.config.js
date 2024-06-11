process.env.TZ = 'UTC';

module.exports = (async () => {
  /** @type {import('jest').Config} */
  return {
    ...(await require('@backstage/cli/config/jest.js')),
    testPathIgnorePatterns: [
      '/packages/backend/src/index.ts',
      '/packages/app/src/apis.ts',
      '/plugins/**/dev/index.ts',
    ],
    coveragePathIgnorePatterns: [
      '/packages/backend/src/index.ts',
      '/packages/app/src/apis.ts',
      '/plugins/**/dev/index.ts',
    ],
  };
})();
