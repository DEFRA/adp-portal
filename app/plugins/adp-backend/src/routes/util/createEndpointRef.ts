import {
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Request, RequestHandler } from 'express';
import type { HandlerResult } from './HandlerResult';
import type { ServiceRefsToInstances } from './ServiceRefsToInstances';
import { routerResultsRef, type RouterResults } from './routerResultsRef';
import type { ParsedQs } from 'qs';
import { groupRefs } from './groupRefs';

type Endpoint<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, unknown>,
> = (
  request: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
) => HandlerResult | PromiseLike<HandlerResult>;

interface EndpointOptions<
  Dependencies extends Record<string, ServiceRef<unknown>>,
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, unknown>,
> {
  name: string;
  deps: Dependencies;
  factory(options: {
    deps: ServiceRefsToInstances<Dependencies>;
    responses: RouterResults;
  }):
    | Endpoint<P, ResBody, ReqBody, ReqQuery, Locals>
    | PromiseLike<Endpoint<P, ResBody, ReqBody, ReqQuery, Locals>>;
}

/**
 * @example
 * export default createEndpointRef({
 *   name: 'getFoo',
 *   deps: {
 *     foo: fooServiceRef
 *   },
 *   factory({ deps, responses }) {
 *     return request => {
 *       return responses.ok().json(deps.foo.getFoo());
 *     }
 *   }
 * })
 * @param options The options to pass to the default endpoint factory
 * @returns a service reference for a request handler
 */
export function createEndpointRef<
  P = {},
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
  Locals extends Record<string, unknown> = Record<string, unknown>,
  Dependencies extends Record<string, ServiceRef<unknown>> = Record<
    string,
    ServiceRef<unknown>
  >,
>(
  options: EndpointOptions<Dependencies, P, ResBody, ReqBody, ReqQuery, Locals>,
): ServiceRef<RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>, 'plugin'> {
  type Handler = RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>;
  return createServiceRef<Handler>({
    id: `adp.router.endpoint.${options.name}`,
    scope: 'plugin',
    defaultFactory(service) {
      const xdeps = groupRefs({
        factory: options.deps,
        extra: {
          responses: routerResultsRef,
        },
      });
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: xdeps.refs,
          async factory(services) {
            const deps = xdeps.read(services);

            return setName(
              toHandler(
                await options.factory({
                  deps: deps.factory,
                  responses: deps.extra.responses,
                }),
              ),
              options.name,
            );
          },
        }),
      );
    },
  });
}

function setName<T extends Function>(fn: T, name: string): T {
  return Object.defineProperty(fn, 'name', { get: () => name });
}

function toHandler<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, unknown>,
>(
  impl: (
    request: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
  ) => HandlerResult | PromiseLike<HandlerResult>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return (req, res, next) => {
    try {
      Promise.resolve(impl(req))
        .then(r => r.writeTo(res))
        .catch(next);
    } catch (err) {
      next(err);
    }
  };
}
