import { type ApiHolder, type ApiRef } from '@backstage/core-plugin-api';

export class BasicApiRegistry implements ApiHolder {
  readonly #apiMap: Map<string, unknown>;

  constructor(apis: Iterable<[ApiRef<unknown>, unknown]>) {
    this.#apiMap = new Map([...apis].map(x => [x[0].id, x[1]]));
  }

  get<T>(api: ApiRef<T>): T | undefined {
    return this.#apiMap.get(api.id) as T | undefined;
  }
}
