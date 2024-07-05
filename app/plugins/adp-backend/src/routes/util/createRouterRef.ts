import {
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Router } from 'express';
import { routerFactoryRef } from './routerFactoryRef';
import { type RouterResults, routerResultsRef } from './routerResultsRef';
import type { ServiceRefsToInstances } from './ServiceRefsToInstances';
import { groupRefs } from './groupRefs';

interface RouterFactoryOptions<
  Dependencies extends Record<string, ServiceRef<unknown, 'plugin' | 'root'>>,
> {
  name: string;
  deps: Dependencies;
  factory(options: {
    router: Router;
    deps: ServiceRefsToInstances<Dependencies>;
    responses: RouterResults;
  }): void | Promise<void>;
}

/**
 * @example
 * export default createRouterRef({
 *   name: 'myRouter',
 *   deps: {
 *     getFoo: getFooEndpointRef
 *   },
 *   factory({ router, deps }) {
 *     router.get('/foo', deps.getFoo);
 *   }
 * })
 * @param options The options to pass to the default router factory
 * @returns a service reference for a router
 */
export function createRouterRef<
  Dependencies extends Record<string, ServiceRef<unknown, 'plugin' | 'root'>>,
>(options: RouterFactoryOptions<Dependencies>) {
  return createServiceRef<Router>({
    id: `adp.router.${options.name}`,
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(createRouterFactory(service, options));
    },
  });
}

function createRouterFactory<
  Dependencies extends Record<string, ServiceRef<unknown, 'plugin' | 'root'>>,
>(
  service: ServiceRef<Router, 'plugin'>,
  options: RouterFactoryOptions<Dependencies>,
) {
  const xdeps = groupRefs({
    factory: options.deps,
    extra: {
      routerFactory: routerFactoryRef,
      responses: routerResultsRef,
    },
  });
  return createServiceFactory({
    service,
    deps: xdeps.refs,
    async factory(services) {
      const deps = xdeps.read(services);
      const router = deps.extra.routerFactory();
      await options.factory({
        router,
        deps: deps.factory,
        responses: deps.extra.responses,
      });
      return router;
    },
  });
}
