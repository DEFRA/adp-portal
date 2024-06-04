import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import type { FetchApiMiddleware } from '../types';
import { createFetchApiHeadersMiddleware } from './createFetchApiHeadersMiddleware';
import type { Config } from '@backstage/config';
import { forwardHeader } from './forwardHeader';
import { createAllowedUrlFilter } from './createAllowedUrlFilter';

export type ForwardAuthHeaderMiddlewareOptions = {
  readonly requestContext: RequestContextProvider;
  readonly filter: ((url: string) => boolean) | Config;
  readonly sourceHeader?: string;
};

export function createFetchApiForwardAuthMiddleware(
  options: ForwardAuthHeaderMiddlewareOptions,
): FetchApiMiddleware {
  return createFetchApiHeadersMiddleware({
    Authorization: forwardHeader({
      requestContext: options.requestContext,
      header: options.sourceHeader ?? 'authorization',
      filter:
        typeof options.filter === 'function'
          ? options.filter
          : createAllowedUrlFilter(
              options.filter,
              'backend.fetchApi.forwardAuth',
            ),
    }),
  });
}
