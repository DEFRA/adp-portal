import {
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Request, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import type { HandlerResult } from './HandlerResult';
import type { ServiceRefsToInstances } from './ServiceRefsToInstances';
import { routerResultsRef, type RouterResults } from './routerResultsRef';
import type { ParsedQs } from 'qs';

type Endpoint<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, any>,
> = (
  request: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
) => HandlerResult | PromiseLike<HandlerResult>;

interface EndpointOptions<
  Dependencies extends Record<string, ServiceRef<unknown>>,
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends Record<string, any>,
> {
  deps: Dependencies;
  factory(options: {
    deps: ServiceRefsToInstances<Dependencies>;
    responses: RouterResults;
  }):
    | Endpoint<P, ResBody, ReqBody, ReqQuery, Locals>
    | PromiseLike<Endpoint<P, ResBody, ReqBody, ReqQuery, Locals>>;
}

export function createEndpointRef<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
  Dependencies extends Record<string, ServiceRef<unknown>> = Record<
    string,
    ServiceRef<unknown>
  >,
>(
  options: EndpointOptions<Dependencies, P, ResBody, ReqBody, ReqQuery, Locals>,
) {
  return createServiceRef<
    RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>
  >({
    id: `adp.router.endpoint.${randomUUID()}`,
    scope: 'plugin',
    defaultFactory(service) {
      const routerResultsKey = randomUUID() as 'routerResults';
      return Promise.resolve(
        createServiceFactory<
          RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>,
          RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>,
          any
        >({
          service,
          deps: { ...options.deps, [routerResultsKey]: routerResultsRef },
          async factory({ [routerResultsKey]: responses, ...deps }) {
            const handler = await options.factory({
              deps: deps as Dependencies,
              responses,
            });
            return voidify(async (req, res, next) => {
              try {
                const result = await handler(req);
                await result.writeTo(res);
              } catch (err) {
                next(err);
              }
            });
          },
        }),
      );
    },
  });
}

function voidify<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
): (this: This, ...args: Args) => void {
  return function voided(...args) {
    fn.call(this, ...args);
  };
}
