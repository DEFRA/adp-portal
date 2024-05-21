import {
  type ServiceRef,
  createServiceFactory,
  type PluginServiceFactoryConfig,
  type ServiceFactory,
} from '@backstage/backend-plugin-api';
import { FetchApi } from '../impl';
import type { Fetch, FetchApiMiddleware } from '../types';

export interface CoreFetchApiOptions<Scope extends 'root' | 'plugin'> {
  root?: Fetch;
  middleware?: ServiceRef<
    FetchApiMiddleware,
    Scope extends 'root' ? 'root' : 'root' | 'plugin'
  >[];
}

export function createFetchApiFactory<
  Options extends CoreFetchApiOptions<Scope>,
  Scope extends 'root' | 'plugin',
>(service: ServiceRef<FetchApi, Scope>) {
  return createServiceFactory((options?: Options) => {
    const { root = fetch, middleware = [] } = options ?? {};
    const middlewareArr = [...middleware];
    const middlewareMap = Object.fromEntries(middlewareArr.entries());
    const middlewareOrder = [...middlewareArr.keys()];

    return {
      service: service,
      deps: middlewareMap,
      factory: deps =>
        new FetchApi({
          root,
          middleware: middlewareOrder.map(key => deps[key]),
        }),
    } as PluginServiceFactoryConfig<FetchApi, undefined, FetchApi, any>;
  }) as (options?: Options) => ServiceFactory<FetchApi, Scope>;
}
