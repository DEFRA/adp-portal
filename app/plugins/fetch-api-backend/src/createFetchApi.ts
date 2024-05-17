import type { FetchApi } from './FetchApi';

export type FetchMiddleware = (next: typeof fetch) => typeof fetch;
export function createFetchApi(options: {
  baseImplementation?: typeof fetch;
  middleware?: FetchMiddleware | FetchMiddleware[];
}): FetchApi {
  const middleware = [options.middleware ?? []].flat();
  return {
    fetch: middleware.reduceRight(
      (next, m) => m(next),
      options.baseImplementation ?? fetch,
    ),
  };
}
