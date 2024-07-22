import {
  type AuthService,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import { isUserEntity } from '@backstage/catalog-model';
import { catalogApiRef } from '../refs';

export interface CatalogUserEntityProviderOptions {
  catalog: CatalogApi;
  auth: AuthService;
}

export type ICatalogUserEntityProvider = {
  [P in keyof CatalogUserEntityProvider]: CatalogUserEntityProvider[P];
};

export class CatalogUserEntityProvider {
  readonly #catalog: CatalogApi;
  readonly #auth: AuthService;

  constructor(options: CatalogUserEntityProviderOptions) {
    this.#catalog = options.catalog;
    this.#auth = options.auth;
  }

  async #getToken() {
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    return token;
  }

  async getByEntityRef(entityRef: string) {
    const result = await this.#catalog.getEntityByRef(entityRef, {
      token: await this.#getToken(),
    });
    return result && isUserEntity(result) ? result : undefined;
  }
}

export const catalogUserEntityProviderRef =
  createServiceRef<ICatalogUserEntityProvider>({
    id: 'adp.catalog-user-entity-provider',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            catalog: catalogApiRef,
            auth: coreServices.auth,
          },
          factory(deps) {
            return new CatalogUserEntityProvider(deps);
          },
        }),
      );
    },
  });
