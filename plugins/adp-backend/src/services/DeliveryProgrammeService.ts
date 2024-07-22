import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  deliveryProgrammeStoreRef,
  type IDeliveryProgrammeStore,
} from '../deliveryProgramme';
import {
  deliveryProgrammeAdminServiceRef,
  type IDeliveryProgrammeAdminService,
} from './DeliveryProgrammeAdminService';
import {
  fireAndForgetCatalogRefresherRef,
  type FireAndForgetCatalogRefresher,
} from './fireAndForgetCatalogRefresher';
import type {
  UpdateDeliveryProgrammeRequest,
  CreateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import {
  identityProviderRef,
  type IdentityProvider,
} from '@internal/plugin-credentials-context-backend';

export interface DeliveryProgrammeServiceOptions {
  store: IDeliveryProgrammeStore;
  admins: IDeliveryProgrammeAdminService;
  catalogRefresher: FireAndForgetCatalogRefresher;
  identityProvider: IdentityProvider;
}

export type IDeliveryProgrammeService = {
  [P in keyof DeliveryProgrammeService]: DeliveryProgrammeService[P];
};

export class DeliveryProgrammeService {
  readonly #store: IDeliveryProgrammeStore;
  readonly #admins: IDeliveryProgrammeAdminService;
  readonly #catalogRefresher: FireAndForgetCatalogRefresher;
  readonly #identityProvider: IdentityProvider;

  constructor(options: DeliveryProgrammeServiceOptions) {
    this.#store = options.store;
    this.#admins = options.admins;
    this.#catalogRefresher = options.catalogRefresher;
    this.#identityProvider = options.identityProvider;
  }

  async #callerRef() {
    const { userEntityRef } = await this.#identityProvider.getCurrentIdentity();
    return userEntityRef;
  }

  async #syncronize() {
    await this.#catalogRefresher.refresh(
      'location:default/delivery-programmes',
    );
  }

  async create(data: CreateDeliveryProgrammeRequest) {
    const caller = await this.#callerRef();
    const result = await this.#store.add(data, caller);
    if (result.success) {
      await this.#admins.add(result.value.id, caller);
      await this.#syncronize();
    }
    return result;
  }

  async edit(data: UpdateDeliveryProgrammeRequest) {
    const currentUser = await this.#callerRef();
    const result = await this.#store.update(data, currentUser);

    if (result.success) await this.#syncronize();

    return result;
  }

  async getAll() {
    return await this.#store.getAll();
  }

  async getById(id: string) {
    const result = await this.#store.get(id);
    result.delivery_programme_admins = await this.#admins.getByProgrammeId(id);
    return result;
  }
}

export const deliveryProgrammeServiceRef =
  createServiceRef<IDeliveryProgrammeService>({
    id: 'adp.delivery-programme-store',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            store: deliveryProgrammeStoreRef,
            admins: deliveryProgrammeAdminServiceRef,
            catalogRefresher: fireAndForgetCatalogRefresherRef,
            identityProvider: identityProviderRef,
          },
          factory(deps) {
            return new DeliveryProgrammeService(deps);
          },
        }),
      );
    },
  });
