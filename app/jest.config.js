process.env.TZ = 'UTC';

/** @type {Promise<import('jest').Config>} */
const baseConfig = require('@backstage/cli/config/jest.js');

module.exports = (async function () {
  /** @type {import('jest').Config} */
  return {
    ...(await baseConfig),
    testPathIgnorePatterns: [
      '/packages/backend/src/plugins/',
      '/packages/backend/src/index.ts',
      '/packages/app/src/apis.ts',
      'module.ts',
      'run.ts',
      'standaloneServer.ts',
    ],
    coveragePathIgnorePatterns: [
      '/packages/backend/src/plugins/',
      '/packages/backend/src/index.ts',
      '/packages/app/src/apis.ts',
      'module.ts',
      'run.ts',
      'standaloneServer.ts',
    ],
  };
})();
