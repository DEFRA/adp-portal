import type { Config } from '@backstage/config';
import { type FetchMiddleware, createFetchApi } from './createFetchApi';
import {
  type HeaderValue,
  createHeaderFetchMiddleware,
} from './createHeaderFetchMiddleware';
import { createUrlFetchMiddlewareFilter } from './createUrlFetchMiddlewareFilter';
import type { Request } from 'express';
import type { CreateUrlFilterOptions } from './createUrlFilter';

export function defaultFetchApi(
  options: Omit<CreateUrlFilterOptions, 'configKeys'> & {
    config: Config;
    additionalConfigKeys?: string[];
    getCurrentRequest: () => Request | undefined;
    headers?: Record<string, HeaderValue>;
    middleware?: FetchMiddleware | FetchMiddleware[];
  },
) {
  const {
    getCurrentRequest,
    headers = {},
    middleware = [],
    additionalConfigKeys = [],
    ...filterOptions
  } = options;

  const urlFilter = createUrlFetchMiddlewareFilter({
    ...filterOptions,
    configKeys: ['backend.baseUrl', ...additionalConfigKeys],
  });

  return createFetchApi({
    middleware: [
      createHeaderFetchMiddleware(...Object.entries(headers)),
      createHeaderFetchMiddleware('Authorization', (...args) =>
        urlFilter(...args)
          ? getCurrentRequest()?.header('authorization')
          : undefined,
      ),
      middleware,
    ].flat(),
  });
}
