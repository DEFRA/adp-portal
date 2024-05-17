import type { RequestHandler, Request } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

export interface CurrentRequestMiddleware<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
  Locals extends Record<string, any> = Record<string, any>,
> extends RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  getCurrentRequest(
    this: void,
  ): Request<P, ResBody, ReqBody, ReqQuery, Locals> | undefined;
}
export function createCurrentRequestMiddleware<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
  Locals extends Record<string, any> = Record<string, any>,
>(): CurrentRequestMiddleware<P, ResBody, ReqBody, ReqQuery, Locals> {
  const currentRequest = new AsyncLocalStorage<
    Request<P, ResBody, ReqBody, ReqQuery, Locals>
  >();
  return Object.assign(
    ((request, _, next) =>
      currentRequest.run(request, next)) satisfies RequestHandler<
      P,
      ResBody,
      ReqBody,
      ReqQuery,
      Locals
    >,
    {
      getCurrentRequest(this: void) {
        return currentRequest.getStore();
      },
    },
  );
}
