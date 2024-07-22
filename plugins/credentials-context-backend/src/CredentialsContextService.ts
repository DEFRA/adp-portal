import { type BackstageCredentials } from '@backstage/backend-plugin-api';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ICredentialsContextService {
  get current(): BackstageCredentials;
  run<T>(credentials: BackstageCredentials, run: () => T): T;
}

export class CredentialsContextService implements ICredentialsContextService {
  readonly #context = new AsyncLocalStorage<BackstageCredentials>();

  get current() {
    const current = this.#context.getStore();
    if (!current) throw new Error('No credentials have been set');
    return current;
  }

  run<T>(credentials: BackstageCredentials, run: () => T) {
    return this.#context.run(credentials, run);
  }
}
