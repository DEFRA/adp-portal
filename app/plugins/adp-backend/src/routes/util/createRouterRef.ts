import {
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { routerFactoryRef } from './routerFactoryRef';
import { type RouterResults, routerResultsRef } from './routerResultsRef';
import type { ServiceRefsToInstances } from './ServiceRefsToInstances';

interface RouterFactoryOptions<
  Dependencies extends Record<string, ServiceRef<unknown, 'plugin' | 'root'>>,
> {
  deps: Dependencies;
  factory(options: {
    router: Router;
    deps: ServiceRefsToInstances<Dependencies>;
    responses: RouterResults;
  }): void | Promise<void>;
}

export function createRouterRef<
  Dependencies extends Record<string, ServiceRef<unknown, 'plugin' | 'root'>>,
>(options: RouterFactoryOptions<Dependencies>) {
  return createServiceRef<Router>({
    id: `adp.router.${randomUUID()}`,
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
  const routerFactoryKey = randomUUID() as 'routerFactory';
  const routerResultsKey = randomUUID() as 'routerResults';
  return createServiceFactory<Router, Router, any>({
    service,
    deps: {
      ...options.deps,
      [routerFactoryKey]: routerFactoryRef,
      [routerResultsKey]: routerResultsRef,
    },
    async factory({
      [routerFactoryKey]: routerFactory,
      [routerResultsKey]: routerResults,
      ...deps
    }) {
      const router = routerFactory();
      await options.factory({
        router,
        deps: deps as Dependencies,
        responses: routerResults,
      });
      return router;
    },
  });
}
