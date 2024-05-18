import type { Config } from '@backstage/config';
import { createFetchApi, type CreateFetchApiOptions } from './createFetchApi';
import {
  type HeaderValue,
  createHeaderFetchMiddleware,
} from './createHeaderFetchMiddleware';
import { createUrlFetchMiddlewareFilter } from './createUrlFetchMiddlewareFilter';
import type { Request } from 'express';
import type { CreateUrlFilterOptions } from './createUrlFilter';

export function defaultFetchApi(
  options: CreateFetchApiOptions & {
    authorize?: Omit<CreateUrlFilterOptions, 'configKeys'> & {
      config: Config;
      additionalConfigKeys?: string[];
      getCurrentRequest: () => Request | undefined;
    };
    headers?: Record<string, HeaderValue>;
  },
) {
  const { headers = {}, middleware = [], authorize, ...fetchOptions } = options;

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
    ...fetchOptions,
    middleware: [defaultMiddleware, middleware].flat(),
  });
}
