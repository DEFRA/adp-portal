import {
  type PluginServiceFactoryConfig,
  type RootServiceFactoryConfig,
  createServiceFactory,
  createServiceRef,
  type ServiceRef,
} from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from '../types';

export type CreateFetchApiMiddlewarePluginRefConfig<
  TContext,
  TDeps extends Deps,
> = {
  id: string;
  scope: 'plugin';
} & Omit<
  PluginServiceFactoryConfig<
    FetchApiMiddleware,
    TContext,
    FetchApiMiddleware,
    TDeps
  >,
  'service'
>;

export type CreateFetchApiMiddlewareRootRefConfig<TDeps extends Deps<'root'>> =
  {
    id: string;
    scope: 'root';
  } & Omit<
    RootServiceFactoryConfig<FetchApiMiddleware, FetchApiMiddleware, TDeps>,
    'service'
  >;

type Deps<Scope extends 'root' | 'plugin' = 'root' | 'plugin'> = {
  [name in string]: ServiceRef<unknown, Scope>;
};
export function createFetchApiMiddleware<TDeps extends Deps, TContext>(
  config: CreateFetchApiMiddlewarePluginRefConfig<TContext, TDeps>,
): ServiceRef<FetchApiMiddleware, 'plugin'>;
export function createFetchApiMiddleware<TDeps extends Deps<'root'>>(
  config: CreateFetchApiMiddlewareRootRefConfig<TDeps>,
): ServiceRef<FetchApiMiddleware, 'root'>;
export function createFetchApiMiddleware<TDeps extends Deps<any>, TContext>(
  config:
    | CreateFetchApiMiddlewarePluginRefConfig<TContext, TDeps>
    | CreateFetchApiMiddlewareRootRefConfig<TDeps>,
): ServiceRef<FetchApiMiddleware, 'plugin' | 'root'> {
  const { id, scope, ...factoryArgs } = config;
  return createServiceRef<FetchApiMiddleware>({
    id: `fetch-api.middleware.${id}`,
    scope: scope as 'plugin',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        ...(factoryArgs as any),
      }),
  });
}
