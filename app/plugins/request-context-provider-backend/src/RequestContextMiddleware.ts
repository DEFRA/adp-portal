import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContextProvider } from './RequestContextProvider';
import type { RequestContext } from './RequestContext';

export class RequestContextMiddleware {
  readonly #context = new AsyncLocalStorage<RequestContext>();
  public readonly provider: RequestContextProvider = {
    getContext: () => this.#context.getStore(),
  };

  public run<T>(request: RequestContext['request'], next: () => T) {
    return this.#context.run(Object.freeze({ request }), next);
  }
}
