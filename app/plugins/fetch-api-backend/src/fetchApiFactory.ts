import {
  type ServiceRef,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { fetchApiRef } from './fetchApiRef';
import { type Fetch } from './Fetch';
import type { FetchApiMiddleware } from './FetchApiMiddleware';
import { FetchApi } from './FetchApi';

export interface FetchApiOptions {
  root?: Fetch;
  middleware?: ServiceRef<FetchApiMiddleware>[];
}

export const fetchApiFactory = createServiceFactory(
  (options?: FetchApiOptions) => {
    const { root = fetch, middleware = [] } = options ?? {};
    const middlewareArr = [...middleware];
    const middlewareMap = Object.fromEntries(middlewareArr.entries());
    const middlewareOrder = [...middlewareArr.keys()];

    return {
      service: fetchApiRef,
      deps: middlewareMap,
      factory: deps =>
        new FetchApi({
          root,
          middleware: middlewareOrder.map(key => deps[key]),
        }),
    };
  },
);
