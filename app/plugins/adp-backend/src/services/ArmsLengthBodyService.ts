import type { Config } from '@backstage/config';
import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../armsLengthBody';
import {
  type IdentityProvider,
  identityProviderRef,
} from '@internal/plugin-credentials-context-backend';
import type {
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  fireAndForgetCatalogRefresherRef,
  type FireAndForgetCatalogRefresher,
} from './fireAndForgetCatalogRefresher';

export interface ArmsLengthBodyServiceOptions {
  armsLengthBodyStore: IArmsLengthBodyStore;
  config: Config;
  identityProvider: IdentityProvider;
  catalogRefresher: FireAndForgetCatalogRefresher;
}

export type IArmsLengthBodyService = {
  [P in keyof ArmsLengthBodyService]: ArmsLengthBodyService[P];
};

export class ArmsLengthBodyService {
  readonly #armsLengthBodyStore: IArmsLengthBodyStore;
  readonly #config: Config;
  readonly #identityProvider: IdentityProvider;
  readonly #catalogRefresher: FireAndForgetCatalogRefresher;

  constructor(options: ArmsLengthBodyServiceOptions) {
    this.#armsLengthBodyStore = options.armsLengthBodyStore;
    this.#config = options.config;
    this.#identityProvider = options.identityProvider;
    this.#catalogRefresher = options.catalogRefresher;
  }

  async #callerRef() {
    const { userEntityRef } = await this.#identityProvider.getCurrentIdentity();
    return userEntityRef;
  }

  async #syncronize() {
    await this.#catalogRefresher.refresh('location:default/arms-length-bodies');
  }

  async create(data: CreateArmsLengthBodyRequest) {
    const owner = this.#config.getString('rbac.programmeAdminGroup');
    const result = await this.#armsLengthBodyStore.add(
      data,
      await this.#callerRef(),
      owner,
    );

    if (result.success) await this.#syncronize();

    return result;
  }

  async update(data: UpdateArmsLengthBodyRequest) {
    const result = await this.#armsLengthBodyStore.update(
      data,
      await this.#callerRef(),
    );
    if (result.success) await this.#syncronize();

    return result;
  }

  async getById(id: string) {
    return await this.#armsLengthBodyStore.get(id);
  }

  async getAll() {
    return await this.#armsLengthBodyStore.getAll();
  }

  async getIdNameMap() {
    const albs = await this.getAll();
    return Object.fromEntries(albs.map(x => [x.id, x.name]));
  }
}

export const armsLengthBodyServiceRef =
  createServiceRef<IArmsLengthBodyService>({
    id: 'adp.arms-length-body.service',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            armsLengthBodyStore: armsLengthBodyStoreRef,
            config: coreServices.rootConfig,
            identityProvider: identityProviderRef,
            catalogRefresher: fireAndForgetCatalogRefresherRef,
          },
          factory(deps) {
            return new ArmsLengthBodyService(deps);
          },
        }),
      );
    },
  });
