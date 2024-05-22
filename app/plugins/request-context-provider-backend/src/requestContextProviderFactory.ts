import {
  type RootHttpRouterService,
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { requestContextProviderRef } from './requestContextProviderRef';
import { RequestContextMiddleware } from './RequestContextMiddleware';
import type { Handler } from 'express';

export const requestContextProviderFactory = createServiceFactory({
  service: requestContextProviderRef,
  deps: {
    router: coreServices.rootHttpRouter,
  },
  factory({ router }) {
    const middleware = new RequestContextMiddleware();
    installAsMiddleware(router, middleware.handler);
    return middleware.provider;
  },
});

/**
 * Backstage doesnt allow multiple handlers to be installed onto the same path on the
 * root handler, so this method tricks it into thinking the first arg is a unique
 * string, which is passed onto express as the first parameter. Express will detect
 * this first arg as a function, and so not be tricked like backstage was.
 *
 * This isnt needed if this service is the only thing installing into the root. Its
 * only being done to prevent conflicts with other plugins/services.
 * @param router The root router to install the middleware in
 * @param handler The actual handler to run
 */
function installAsMiddleware(router: RootHttpRouterService, handler: Handler) {
  const id = `/phantom-middleware-path-${Date.now()}`;
  router.use(
    Object.assign<Handler, Partial<InstanceType<typeof String>>>(
      (...args) => handler(...args),
      {
        match: id.match.bind(id),
        toString: id.toString.bind(id),
        valueOf: id.valueOf.bind(id),
      },
    ) as Handler & string,
    (_req, _res, next) => next(), // Required otherwise backstage would send undefined to express
  );
}
