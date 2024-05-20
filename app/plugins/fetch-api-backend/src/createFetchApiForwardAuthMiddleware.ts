import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import type { FetchApiMiddleware } from './FetchApiMiddleware';
import { createFetchApiHeadersMiddleware } from './createFetchApiHeadersMiddleware';
import type { Config } from '@backstage/config';
import { forwardHeader } from './forwardHeader';

export type ForwardAuthHeaderMiddlewareOptions = {
  readonly requestContext: RequestContextProvider;
  readonly filter: ((url: string) => boolean) | Config;
};

export function createFetchApiForwardAuthMiddleware(
  options: ForwardAuthHeaderMiddlewareOptions,
): FetchApiMiddleware {
  return createFetchApiHeadersMiddleware({
    Authorization: forwardHeader({
      requestContext: options.requestContext,
      header: 'authorization',
      filter:
        typeof options.filter === 'function'
          ? options.filter
          : {
              config: options.filter,
              allowUrlsKey: 'backend.fetchApi.forwardAuth',
            },
    }),
  });
}
