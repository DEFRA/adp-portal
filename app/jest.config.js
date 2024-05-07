process.env.TZ = 'UTC';

module.exports = (async () => {
  /** @type {import('jest').Config} */
  return {
    ...(await require('@backstage/cli/config/jest.js')),
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
