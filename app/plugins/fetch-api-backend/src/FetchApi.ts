import type { Fetch } from './Fetch';
import type { FetchApiMiddleware } from './FetchApiMiddleware';

export class FetchApi {
  readonly fetch: Fetch;

  constructor(options?: {
    root?: Fetch;
    middleware?: Iterable<FetchApiMiddleware>;
  }) {
    const { root = global.fetch, middleware = [] } = options ?? {};
    this.fetch = [...middleware].reduceRight(
      (fetch, factory) => factory(fetch),
      root,
    );
    Object.freeze(this);
  }
}
