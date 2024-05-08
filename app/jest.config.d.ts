declare module '@backstage/cli/config/jest.js' {
  import type { Config } from 'jest';

  const module: Promise<Config>;

  export = module;
}
