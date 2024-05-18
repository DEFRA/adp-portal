import type { Config } from '@backstage/config';
import { type FetchMiddleware, createFetchApi } from './createFetchApi';
import {
  type HeaderValue,
  createHeaderFetchMiddleware,
} from './createHeaderFetchMiddleware';
import { createUrlFetchMiddlewareFilter } from './createUrlFetchMiddlewareFilter';
import type { Request } from 'express';
import type { CreateUrlFilterOptions } from './createUrlFilter';

export function defaultFetchApi(options: {
  authorize?: Omit<CreateUrlFilterOptions, 'configKeys'> & {
    config: Config;
    additionalConfigKeys?: string[];
    getCurrentRequest: () => Request | undefined;
  };
  headers?: Record<string, HeaderValue>;
  middleware?: FetchMiddleware | FetchMiddleware[];
}) {
  const { headers = {}, middleware = [], authorize } = options;

  const defaultMiddleware = [
    createHeaderFetchMiddleware(...Object.entries(headers)),
  ];

  if (authorize) {
    const {
      getCurrentRequest,
      additionalConfigKeys = [],
      ...filterOptions
    } = authorize;
    const urlFilter = createUrlFetchMiddlewareFilter({
      ...filterOptions,
      configKeys: ['backend.baseUrl', ...additionalConfigKeys],
    });
    defaultMiddleware.push(
      createHeaderFetchMiddleware('Authorization', (...args) =>
        urlFilter(...args)
          ? getCurrentRequest()?.header('authorization')
          : undefined,
      ),
    );
  }

  return createFetchApi({
    middleware: [defaultMiddleware, middleware].flat(),
  });
}
