import type { FetchApi } from './FetchApi';

export type FetchMiddleware = (next: typeof fetch) => typeof fetch;
export type FetchMiddlewareCondition = (
  ...args: Parameters<typeof fetch>
) => boolean;

export type CreateFetchApiOptions = {
  baseImplementation?: typeof fetch;
  middleware?: FetchMiddleware | FetchMiddleware[];
};

export function createFetchApi(options: CreateFetchApiOptions): FetchApi {
  const middleware = [options.middleware ?? []].flat();
  return {
    fetch: middleware.reduceRight(
      (next, m) => m(next),
      options.baseImplementation ?? fetch,
    ),
  };
}
