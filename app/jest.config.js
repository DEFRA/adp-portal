process.env.TZ = 'UTC';

module.exports = (async () => {
  /** @type {import('jest').Config} */
  const config = await require('@backstage/cli/config/jest.js');
  config.testPathIgnorePatterns ??= [];
  config.testPathIgnorePatterns.push(
    '/packages/backend/src/index.ts',
    '/packages/app/src/apis.ts',
    '/plugins/**/dev/index.ts',
  );
  config.coveragePathIgnorePatterns ??= [];
  config.coveragePathIgnorePatterns.push(
    '/packages/backend/src/index.ts',
    '/packages/app/src/apis.ts',
    '/plugins/**/dev/index.ts',
  );
  for (const project of config.projects ?? []) {
    project.setupFilesAfterEnv ??= [];
    project.setupFilesAfterEnv.push(`${__dirname}/setupTests.ts`);
  }

  return config;
})();
