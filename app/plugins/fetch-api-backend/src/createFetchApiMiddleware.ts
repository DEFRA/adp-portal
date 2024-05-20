import {
  type PluginServiceFactoryConfig,
  type RootServiceFactoryConfig,
  createServiceFactory,
  createServiceRef,
  type ServiceRef,
} from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from './FetchApiMiddleware';

export type CreateFetchApiMiddlewarePluginRefConfig<
  TContext,
  TDeps extends {
    [name in string]: ServiceRef<unknown, 'root' | 'plugin'>;
  },
> = {
  id: string;
  scope: 'plugin';
} & Pick<
  PluginServiceFactoryConfig<
    FetchApiMiddleware,
    TContext,
    FetchApiMiddleware,
    TDeps
  >,
  'createRootContext' | 'factory' | 'deps'
>;

export type CreateFetchApiMiddlewareRootRefConfig<
  TDeps extends {
    [name in string]: ServiceRef<unknown, 'root'>;
  },
> = {
  id: string;
  scope: 'root';
} & Pick<
  RootServiceFactoryConfig<FetchApiMiddleware, FetchApiMiddleware, TDeps>,
  'factory' | 'deps'
>;

type Deps = {
  [name in string]: ServiceRef<unknown, any>;
};
export function createFetchApiMiddleware<TDeps extends Deps, TContext>(
  config: CreateFetchApiMiddlewarePluginRefConfig<TContext, TDeps>,
): ServiceRef<FetchApiMiddleware, 'plugin'>;
export function createFetchApiMiddleware<TDeps extends Deps>(
  config: CreateFetchApiMiddlewareRootRefConfig<TDeps>,
): ServiceRef<FetchApiMiddleware, 'root'>;
export function createFetchApiMiddleware<
  TDeps extends {
    [name in string]: ServiceRef<unknown, any>;
  },
  TContext,
>(
  config:
    | CreateFetchApiMiddlewarePluginRefConfig<TContext, TDeps>
    | CreateFetchApiMiddlewareRootRefConfig<TDeps>,
): ServiceRef<FetchApiMiddleware, 'plugin' | 'root'>;
export function createFetchApiMiddleware<
  TDeps extends {
    [name in string]: ServiceRef<unknown, any>;
  },
  TContext,
>(
  config:
    | CreateFetchApiMiddlewarePluginRefConfig<TContext, TDeps>
    | CreateFetchApiMiddlewareRootRefConfig<TDeps>,
): ServiceRef<FetchApiMiddleware, 'plugin' | 'root'> {
  switch (config.scope) {
    case 'plugin':
      return createServiceRef<FetchApiMiddleware>({
        id: `fetch-api.middleware.${config.id}`,
        scope: 'plugin',
        defaultFactory: async service =>
          createServiceFactory({
            service,
            deps: config.deps,
            createRootContext: config.createRootContext,
            factory: config.factory,
          }),
      });
    case 'root':
      return createServiceRef<FetchApiMiddleware>({
        id: `fetch-api.middleware.${config.id}`,
        scope: 'root',
        defaultFactory: async service =>
          createServiceFactory({
            service,
            deps: config.deps,
            factory: config.factory,
          }),
      });

    default:
      throw new Error('Unsupported scope');
  }
}
