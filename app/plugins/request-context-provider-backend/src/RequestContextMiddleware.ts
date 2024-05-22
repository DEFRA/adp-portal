import { AsyncLocalStorage } from 'node:async_hooks';
import type { Handler } from 'express';
import type { RequestContextProvider } from './RequestContextProvider';
import type { RequestContext } from './RequestContext';

export class RequestContextMiddleware {
  readonly #context = new AsyncLocalStorage<RequestContext>();
  public readonly provider: RequestContextProvider = {
    getContext: () => this.#context.getStore(),
  };

  public handler: Handler = (request, _, next) =>
    this.#context.run(Object.freeze({ request }), next);
}
