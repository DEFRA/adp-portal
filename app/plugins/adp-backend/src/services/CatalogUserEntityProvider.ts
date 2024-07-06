import {
  type AuthService,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { UserEntity } from '@backstage/catalog-model';
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

  async getByUserName(name: string) {
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    // We should use getEntityByRef here.
    const result = await this.#catalog.getEntities(
      {
        filter: [
          {
            kind: 'User',
            'metadata.name': name,
          },
        ],
        fields: [
          'metadata.name',
          'metadata.annotations.graph.microsoft.com/user-id',
          'metadata.annotations.microsoft.com/email',
          'metadata.annotations.graph.microsoft.com/user-principal-name',
          'spec.profile.displayName',
        ],
      },
      { token },
    );

    return result.items[0] as UserEntity | undefined;
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
