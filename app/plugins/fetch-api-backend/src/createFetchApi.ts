import type { FetchApi } from './FetchApi';

export type FetchMiddleware = (next: typeof fetch) => typeof fetch;
export type FetchMiddlewareCondition = (
  ...args: Parameters<typeof fetch>
) => boolean;

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
